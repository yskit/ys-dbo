const debug = require('debug')('Redis:Connection');
const commands = require('redis-commands');

module.exports = class Redis {
  constructor(redis) {
    this.redis = redis;
    this.dbo = redis.dbo;
    this.target = null;
    this.transacted = false;
  }

  async _check(callback) {
    if (this.transacted) {
      return await callback(this.target);
    }
    return await callback(this.dbo);
  }

  _exec(cmd) {
    if (cmd && this.transacted && commands.hasFlag(cmd, 'write')) {
      return this.target[cmd].bind(this.target);
    }
    if (this.dbo[cmd]) {
      return this.dbo[cmd].bind(this.dbo);
    }
  }

  async begin() {
    if (this.transacted) return;
    this.target = this.dbo.multi();
    this.transacted = true;
    debug('redis transaction begined ...');
  }

  async commit() {
    if (!this.transacted) return;
    await this._check(async conn => {
      await new Promise((resolve, reject) => {
        conn.exec((err, result) => {
          this.transacted = false;
          if (err) return reject(err);
          resolve();
        })
      })
    });
    debug('redis transaction committed');
  }

  async rollback() {
    if (!this.transacted) return;
    this.transacted = false;
    debug('redis transaction rollbacked');
  }
}