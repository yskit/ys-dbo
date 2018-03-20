const REDIS = require('ioredis');
const redis = require('./redis');
const debug = require('debug')('Redis:Pool');

module.exports = class Redis {
  constructor(name, options = {}) {
    if (typeof name !== 'string') {
      options = name;
      name = null;
    }
    this.options = options;
    this.name = name || 'redis';
    this.isCluster = Array.isArray(options);
    this.logger = options.logger || console;
  }

  async connect() {
    debug('connecting ...');
    if (this.isCluster) {
      this.dbo = new REDIS.Cluster(this.options);
    } else {
      this.dbo = new REDIS(this.options);
    }
    debug('connected');
  }

  async disconnect() {
    if (!this.dbo) return;
    debug('disconnecting ...');
    if (this.isCluster) {
      await this.dbo.quit();
    } else {
      await this.dbo.disconnect();
    }
    debug('disconnected');
  }

  init(way) {
    way.regist(this.name, ObjectProxy(new redis(this)));
  }
}

function ObjectProxy(object) {
  return new Proxy(object, {
    get(obj, key) {
      if (key in obj) {
        return Reflect.get(obj, key);
      } else {
        return obj._exec(key);
      }
    }
  })
}