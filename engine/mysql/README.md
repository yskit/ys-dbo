# ys-dbo-mysql

[ys-dbo](https://www.npmjs.com/package/ys-dbo)的插件之mysql数据处理。

# Install

```shell
npm i ys-dbo-mysql --save
```

# Usage

```javascript
const DBO = require('ys-dbo');
const mysql = require('ys-dbo-mysql');
const dbo = new DBO([
  new mysql('mysql', {
    // mysql 配置参数
    pool: true | false, // 是否使用pool
    logger: console
  });
])
```

> 注意：我们用way表示线程对像，之后类同

## Code

```javascript
await way.mysql.get();
await way.mysql.begin();
await way.mysql.exec('select * from a where a=?', 1);
await way.mysql.insert(table, data); // data: array or json
await way.mysql.update(table, data, where, wheres);
await way.mysql.delete(table, where, wheres);
await way.mysql.commit();
await way.mysql.rollback();
await way.mysql.release();
```