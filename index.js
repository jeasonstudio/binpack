// import rollup from 'rollup/dist/rollup.browser';
const {
  rollup,
  VERSION: rollupVersion,
} = require('rollup/dist/rollup.browser');

const path = require('path-browserify');

import { fetchListener } from './src/listener';

const foo = {
  modules: [
    {
      name: 'main.js',
      code:
        "/* NAMED EXPORTS\n   There are many ways to export bindings\n   from an ES2015 module */\nexport var foo = 1;\n\nexport function bar () {\n\treturn foo; // try changing this to `foo++`\n}\n\nfunction baz () {\n\treturn bar();\n}\n\nexport { baz };\nexport * from './qux';",
      isEntry: true,
    },
    { name: 'qux.js', code: "export var qux = 'QUX';", isEntry: false },
  ],
  options: { format: 'es', name: 'myBundle', amd: { id: '' }, globals: {} },
  example: '04',
};

// addEventListener('fetch', event => {
//   const myPromise = handleRequest(event.request);
//   event.waitUntil(myPromise);
//   event.respondWith(myPromise);
// });
addEventListener('fetch', fetchListener);

console.log(rollupVersion);

const moduleById = {};

foo.modules.forEach(m => {
  moduleById[m.name] = m;
});

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const bundle = await rollup({
    input: foo.modules.filter(m => m.isEntry).map(m => m.name),
    plugins: [
      {
        resolveId(importee, importer) {
          if (!importer) return importee;
          if (importee[0] !== '.') return false;

          let resolved = path
            .join(path.dirname(importer), importee)
            .replace(/^\.\//, '');

          if (resolved in moduleById) return resolved;

          resolved += '.js';
          if (resolved in moduleById) return resolved;

          throw new Error(`Could not resolve '${importee}' from '${importer}'`);
        },
        load: function(id) {
          return moduleById[id].code;
        },
      },
    ],
  });
  const result = await bundle.generate(foo.options);
  console.log(result.output);
  result.output.forEach(o => console.log(o.code));

  // https://registry.npmjs.org/is-nan/-/is-nan-1.3.0.tgz
  const myReq = new Request(
    'https://registry.npmjs.org/is-nan/-/is-nan-1.3.0.tgz',
    { method: 'GET' },
  );
  const myFetch = await fetch(myReq);
  console.log(myFetch, myFetch.pipe);
  return new Response(JSON.stringify(result.output), {
    headers: { 'content-type': 'application/json' },
  });
}
