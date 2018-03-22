const debug = require('debug')('Redis:Connection');
const commands = require('redis-commands');

module.exports = class Redis {
  constructor(redis) {
    this.redis = redis;
    this.dbo = redis.dbo;
    this.transacted = false;
    this.stacks = [];
  }

  _exec(cmd) {
    if (cmd && this.transacted && commands.hasFlag(cmd, 'write')) {
      if (typeof this.dbo[cmd] === 'function') {
        return async (...args) => {
          this.stacks.push({
            cmd,
            args
          });
        }
      } else {
        throw new Error('unKnow command: ' + cmd);
      }
    }
    if (this.dbo[cmd]) {
      return this.dbo[cmd].bind(this.dbo);
    }
  }

  async begin() {
    if (this.transacted) return;
    this.transacted = true;
    debug('redis transaction begined ...');
  }

  async commit() {
    if (!this.transacted) return;
    const stacks = this.stacks.map(stack => new Promise((resolve, reject) => {
      stack.args.push((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      this.dbo[stack.cmd].apply(this.dbo, stack.args);
    }));
    await Promise.all(stacks);
    debug('redis transaction committed');
  }

  async rollback() {
    if (!this.transacted) return;
    this.transacted = false;
    debug('redis transaction rollbacked');
  }

  async end() {}
}