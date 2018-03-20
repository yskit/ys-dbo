const debug = require('debug')('Mutify');
const Way = require('./way');

module.exports = class Mutify {
  constructor(options = []) {
    this.options = options;
  }

  async until(next, options = {}) {
    const way = new Way();
    debug('a new process way is created.');
    for (let i = 0, j = this.options.length; i < j; i++) {
      if (typeof this.options[i].init === 'function') {
        await this.options[i].init(way, options);
      }
    }

    if (options.context) {
      Object.defineProperty(options.context, options.name || 'dbo', {
        get() { return way; }
      });
    }
    
    try {
      debug('process running ...');
      await next(way);
      await way.commit();
      debug('process commited ...');
    } catch (e) {
      debug('process rollbacking ...');
      await way.rollback();
      if (typeof options.error === 'function') {
        const err = await options.error(e);
        if (typeof err === 'function') {
          await err(options.context);
        }
      }
      debug('process rollbacked ...');
    } finally {
      debug('process ending ...');
      await way.end();
      debug('process ended ...');
    }
  }

  async connect() {
    debug('connecting ...');
    for (let i = 0, j = this.options.length; i < j; i++) {
      if (typeof this.options[i].connect === 'function') {
        await this.options[i].connect();
      }
    }
  }

  async disconnect() {
    debug('disconnect ...');
    for (let i = 0, j = this.options.length; i < j; i++) {
      if (typeof this.options[i].disconnect === 'function') {
        await this.options[i].disconnect();
      }
    }
  }

  way(options = {}) {
    return async (ctx, next) => {
      debug('user in request ...');
      await this.until(next, Object.assign({ context: ctx }, options));
    }
  }
}