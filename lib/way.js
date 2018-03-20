const debug = require('debug')('Mutify:Way');
const { EventEmitter } = require('async-events-listener');

let id = 0;

module.exports = class Way extends EventEmitter {
  constructor() {
    super();
    this.stacks = [];
    try{
      this.id = id++;
    } catch(e) {
      this.id = id = 0;
    }
  }

  async each(callback) {
    for (let i = 0, j = this.stacks.length; i < j; i++) {
      await callback(this.stacks[i], i);
    }
  }

  async call(method) {
    await this.each(async name => {
      const obj = this[name];
      if (obj && typeof obj[method] === 'function') {
        await obj[method]();
      }
    });
  }

  regist(name, object) {
    if (this.stacks.indexOf(name) === -1) {
      this.stacks.push(name);
    }
    this[name] = object;
    debug('regist plugin name of ' + name);
  }

  async commit() {
    await this.emit('beforeCommit');
    await this.call('commit');
    await this.emit('afterCommit');
  }

  async rollback() {
    await this.emit('beforeRollback');
    await this.call('rollback');
    await this.emit('afterRollback');
  }

  async end() {
    await this.emit('beforeEnd');
    await this.call('end');
    await this.emit('afterEnd');
  }
}