const debug = require('debug')('MySQL:Connection');

module.exports = class MySQL {
  constructor(mysql) {
    this.mysql = mysql;
    this.dbo = mysql.dbo;
    this.target = null;
    this.isPool = mysql.isPool;
    this.transacted = false;
  }

  async get() {
    if (this.target) return;
    debug('getting mysql connection ...');
    this.target = !this.isPool 
      ? this.dbo 
      : await new Promise((resolve, reject) => {
          this.dbo.getConnection((err, connection) => {
            if (err) return reject(err);
            resolve(connection);
          });
        });
    debug('getted mysql connection');
  }

  async release() {
    if (this.target && this.isPool) {
      debug('releasing mysql connection ...');
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('release mysql connection timeout.')), 3000);
        const id = this.target.threadId;
        this.mysql.releases[id] = () => {
          clearTimeout(timer);
          this.target = null;
          resolve();
        };
        this.target.release();
      });
      debug('released mysql connection ...');
    } else {
      debug('it is not used to release mysql connection, because this connection is not a pool connection.');
    }
  }

  async _check(callback) {
    if (!this.target) {
      await this.get();
    }
    if (callback) {
      return await callback(this.target);
    }
  }

  async exec(sql, ...args) {
    return this._check(async conn => {
      return new Promise((resolve, reject) => {
        debug('mysql exec:', sql, args);
        conn.query(sql, args, (err, rows) => {
          if (err) return reject(err);
          debug('mysql exec result:', rows);
          resolve(rows);
        });
      });
    });
  }

  async insert(table, data) {
    if (!Array.isArray(data)) data = [data];
    const result = await Promise.all(data.map(value => this.exec(`INSERT INTO ${table} SET ?`, value)));
    if (result.length === 1) return result[0];
    return result;
  }

  async update(table, value, where, ...wheres) {
    let fields = [], values = [];
    for ( let key in value ){
      fields.push('`' + key + '`=?');
      values.push(value[key]);
    }
    let sql = `UPDATE ${table} SET ${fields.join(',')}`;
    if ( where ){
      sql += ' WHERE ' + where;
      values = values.concat(wheres);
    }
    return (await this.exec(sql, ...values)).changedRows;
  }

  async ['delete'](table, where, ...wheres){
    let sql = `DELETE FROM ${table}`, values = [];
    if ( where ){
        sql += ' WHERE ' + where;
        values = values.concat(wheres);
    }
    return (await this.exec(sql, ...values)).affectedRows;
  }

  async begin() {
    if (this.transacted) return;
    await this._check(async conn => {
      await new Promise((resolve, reject) => {
        conn.beginTransaction(err => {
          if (err) return reject(err);
          this.transacted = true;
          resolve();
        })
      });
    });
    debug('mysql transaction begined ...');
  }

  async commit() {
    if (!this.transacted) return;
    if (this.target) {
      await new Promise((resolve, reject) => {
        this.target.commit(err => {
          if (err) return reject(err);
          this.transacted = false;
          resolve();
        })
      });
    }
    debug('mysql transaction committed');
  }

  async rollback() {
    if (!this.transacted) return;
    if (this.target) {
      await new Promise((resolve, reject) => {
        this.target.rollback(err => {
          if (err) return reject(err);
          this.transacted = false;
          resolve();
        })
      });
    }
    debug('mysql transaction rollbacked');
  }

  async end() {
    if (this.target) {
      await this.release();
    }
    debug('mysql transaction ended');
  }
}