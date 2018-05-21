const debug = require('debug')('Mutify');
const Way = require('./way');

module.exports = class Mutify {
  constructor(options = []) {
    this.options = options;
  }

  async until(next, options = {}) {
    const way = new Way(options.maxListeners || 10);
    debug('a new process way is created.');
    for (let i = 0, j = this.options.length; i < j; i++) {
      if (typeof this.options[i].init === 'function') {
        await this.options[i].init(way, options);
      }
    }

    if (options.context) {
      Object.defineProperty(options.context, options.name || 'dbo', {
        get() {
          return way;
        }
      });
    }
    
    // define a result.
    let result;
    
    try {
      debug('process running ...');
      result = await next(way);
      await way.commit();
      debug('process commited ...');
    } catch (e) {
      debug('process rollbacking ...');
      await way.rollback();
      await renderError(options, e);
      debug('process rollbacked ...');
    } finally {
      debug('process ending ...');
      await way.end();
      debug('process ended ...');
    }
    
    // return result value
    return result;
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
      await this.until(next, Object.assign({
        context: ctx
      }, options)).catch(e => renderError(options, e));
    }
  }
}

async function renderError(options, e) {
  if (typeof options.error === 'function') {
    const err = await options.error(e);
    if (typeof err === 'function') {
      await err(options.context);
    }
  }
}