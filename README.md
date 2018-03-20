# ys-dbo

[YS](https://github.com/yskit/ys-mutify) 架构之请求线程的引擎管理类，用于完善处理请求自定义逻辑，支持自定义回滚机制。

# Install

```shell
npm i ys-dbo --save
```

# Usage

```javascript
const DBO = require('ys-dbo');
const dbo = new DBO([
  // plugins ...
])
```

目前插件支持以下2个：

- **ys-dbo-mysql** [MySQL](https://github.com/yskit/ys-dbo/tree/master/engine/mysql)的操作引擎
- **ys-dbo-redis** [Redis](https://github.com/yskit/ys-dbo/tree/master/engine/redis)的操作引擎

其他插件用户可以根据DBO提供的生命周期自行开发。

## dbo.until(next, options)

用于处理一个线程的逻辑

- **next** `function` 逻辑处理函数
- **options** `json` 参数配置
  - **context** `object` dbo将会在这个对象上添加一个命名空间对象
  - **name** `string` 命名空间名称
  - **error** `function` 错误处理函数 `error(err, ctx) {}`
    - **err** `error` 错误
    - **ctx** 同上的`context`

```javascript
const target = {};
dbo.until(async way => {
  console.log(way.id);
  target.a = 1;
  throw new Error('err');
}, {
  context: target,
  name: 'ys',
  error(err, ctx) {
    console.log(err);
    console.log(ctx.a);
  }
})
```

## Use in koa2 middleware

```javascript
app.use(dbo.way({
  error(err, ctx) {
    ctx.status = err.code || 500;
    ctx.body = err.stack;
  }
}));
```

## Use events

```javascript
app.use(dbo.way({
  error(err, ctx) {
    ctx.status = err.code || 500;
    ctx.body = err.stack;
  }
}));

app.use(async (ctx, next) => {
  ctx.dbo.on('beforeCommit', asyncNoop('beforeCommit'));
  ctx.dbo.on('afterCommit', asyncNoop('afterCommit'));
  ctx.dbo.on('beforeRollback', asyncNoop('beforeRollback'));
  ctx.dbo.on('afterRollback', asyncNoop('afterRollback'));
  ctx.dbo.on('beforeEnd', asyncNoop('beforeEnd'));
  ctx.dbo.on('afterEnd', asyncNoop('afterEnd'));
  await next();
});

function asyncNoop(value) {
  return async () => {
    await new Promise(resolve => {
      setTimeout(() => {
        console.log(value);
        resolve();
      }, 3000);
    })
  }
}
```

# License

It is [MIT licensed](https://opensource.org/licenses/MIT).