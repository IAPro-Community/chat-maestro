import {copyFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
mkdirSync('dist/ui',{recursive:true});mkdirSync('dist/assets',{recursive:true});
copyFileSync('panel.html','dist/panel.html');copyFileSync('src/ui/styles.css','dist/ui/styles.css');
for(const n of [16,32,48,128])copyFileSync(`assets/icon${n}.png`,`dist/assets/icon${n}.png`);
const manifest=JSON.parse(readFileSync('manifest.json','utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));manifest.version=pkg.version;
writeFileSync('dist/manifest.json',JSON.stringify(manifest,null,2));
