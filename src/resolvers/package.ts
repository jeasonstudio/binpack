// import gunzip from 'gunzip-maybe';
// import tar from 'tar-stream';
import { UntarFileStream } from 'src/utils/untar';
import { Resolver } from './IResolver';

// @ts-ignore
// import untar from 'js-untar/build/dev/untar-worker.js';

export const packageServe: Resolver = async ctx => {
  // let { readable, writable } = new TransformStream();
  let response = await fetch(
    'https://registry.npmjs.org/dawn/-/dawn-1.8.3.tgz',
  );
  response.body
    ?.getReader()
    .read()
    .then(({ done, value }) => {
      console.log('read:', done, value);
    });
  const tarFileSystem = new UntarFileStream(await response.arrayBuffer());
  while (tarFileSystem.hasNext()) {
    var file = tarFileSystem.next();
    console.log(111, file);
  }
  console.log(response.headers.entries());
  // const blob = await response.blob();
  console.log(response.headers.get('content-type'));
  // const ss = response.body?.pipeThrough(gunzip() as any);
  // gunzip().pipe(writable as any);
  // ss?.pipeTo(tar.extract() as any).on('error');
  // console.log(await (await response.blob()).stream());
  ctx.res.body = 'Hello world';
};
