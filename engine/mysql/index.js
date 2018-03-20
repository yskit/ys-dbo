const MYSQL = require('mysql');
const Mysql = require('./mysql');
const debug = require('debug')('MySQL:Pool');

module.exports = class MySQL {
  constructor(name, options = {}) {
    if (typeof name === 'object') {
      options = name;
      name = null;
    }
    this.options = options;
    this.name = name || 'mysql';
    this.isPool = !!this.options.pool;
    this.logger = options.logger || console;
    this.releases = {};
  }

  async createConnection() {
    this.dbo = MYSQL.createConnection(this.options);
    await new Promise((resolve, reject) => {
      this.dbo.connect(err => {
        if (err) {
          this.logger.error(err.stack);
          return reject();
        }
        resolve();
      });
    });
  }

  async connect() {
    debug('connecting ...');
    if (this.isPool) {
      this.dbo = MYSQL.createPool(this.options);
      this.dbo.on('release', conn => {
        const id = conn.threadId;
        if (this.releases[id]) {
          this.releases[id]();
        }
      })
    } else {
      await this.createConnection();
    }
    debug('connected');
  }

  async disconnect() {
    if (!this.dbo) return;
    debug('disconnecting ...');
    await new Promise(resolve => {
      this.dbo.end(err => {
        if (err) {
          this.logger.error(err.stack);
          try{
            this.dbo.destroy();
          } catch(e) {}
        }
        resolve();
      });
    });
    debug('disconnected');
  }

  init(way) {
    way.regist(this.name, new Mysql(this));
  }
}