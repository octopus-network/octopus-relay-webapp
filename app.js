const Koa = require('koa');
const Router = require('koa-router');

const koaBody = require('koa-body');
const KoaLogger = require("koa-logger");
const static = require('koa-static');

const { Storage } = require('@google-cloud/storage');

const fs = require('fs');
const path = require('path');
const { context } = require('./webpack.config');

const PORT = process.env.PORT || 80;
const STORAGE_BUCKETNAME = process.env.STORAGE_BUCKETNAME || 'dl-testnet';

const logger = new KoaLogger();

const app = new Koa();
const router = new Router();
const storage = new Storage();

router.post('/upload/chainspec/:id/(raw)?', async (ctx, next) => {

  const { id } = ctx.params;
  const { file } = ctx.request.files;
  
  const isRaw = ctx.path.split('/').pop() == 'raw';
  const destFileName = `${id}/chain-spec${isRaw ? '-raw' : ''}.json`;

  console.log(`--> Uploading file ${file.name}(${file.size} bytes) to google cloud.`);

  const result = await storage.bucket(STORAGE_BUCKETNAME).upload(file.path, {
    destination: destFileName,
  });
  
  ctx.body = {
    success: true,
    link: result[0].metadata.mediaLink
  }
});


app
  .use(koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 3 * 1024 * 1024
    }
  }))
  .use(static('dist'))
  .use(logger)
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT);
console.log('Server listen on port:', PORT);