import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const manifest=JSON.parse(readFileSync('dist/manifest.json','utf8'));
if(manifest.manifest_version!==3)throw Error('Não é MV3');
if(manifest.content_scripts||manifest.host_permissions||manifest.externally_connectable||manifest.web_accessible_resources)throw Error('Permissões ou scripts ampliados sem revisão');
if(manifest.permissions.some(p=>!['sidePanel','storage','alarms','scripting'].includes(p)))throw Error('Permissão fora da política');
const allowlist=['https://chatgpt.com/*','https://chat.openai.com/*','https://gemini.google.com/*'];
if(!Array.isArray(manifest.optional_host_permissions)||JSON.stringify([...manifest.optional_host_permissions].sort())!==JSON.stringify(allowlist.sort()))throw Error('Origens opt-in fora da allowlist');
for(const file of ['panel.html','manager.html','worker.js','ui/app.js','ui/styles.css',...Object.values(manifest.icons),...Object.values(manifest.action?.default_icon ?? {})])if(!existsSync(join('dist',file)))throw Error(`Arquivo ausente: ${file}`);
function walk(root){for(const name of readdirSync(root)){const p=join(root,name);if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.js')){const text=readFileSync(p,'utf8');if(/\beval\s*\(|new\s+Function\s*\(/.test(text))throw Error(`Código dinâmico proibido: ${p}`);}}}
walk('dist');console.log('Verificação MV3 e artefatos: OK');
