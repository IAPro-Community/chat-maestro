import {build} from 'esbuild';
await build({
  entryPoints:['src/content/inpage.ts'],
  outfile:'dist/content/inpage.js',
  platform:'browser',
  format:'iife',
  bundle:true,
  target:['chrome116'],
  legalComments:'none',
  logLevel:'warning'
});
console.log('Content script compilado como IIFE MV3');
