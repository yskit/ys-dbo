# ys-dbo-mysql

[ys-dbo](https://www.npmjs.com/package/ys-dbo)的插件之redis数据处理。

# Install

```shell
npm i ys-dbo-reids --save
```

# Usage

```javascript
const DBO = require('ys-dbo');
const mysql = require('ys-dbo-redis');
const dbo = new DBO([
  new DBO_REDIS({
    host     : '',
    password : '',
    port     : 6379,
    keepAlive: 0
  })
])
```

> 注意：我们用way表示线程对像，之后类同

## Code

```javascript
await way.redis.begin();
await way.redis.hmset('a', { a: 1});
await way.redis.set('b', 'test'); // data: array or json
await way.redis.get('b');
await way.redis.hgetall('a');
await way.redis.commit();
await way.redis.rollback();
```