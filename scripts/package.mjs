/** Criador de ZIP sem dependências de runtime. Requer Node 22+. */
import {crc32} from 'node:zlib';
import {readdirSync,readFileSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
function walk(root){return readdirSync(root).flatMap(name=>{const p=join(root,name);return statSync(p).isDirectory()?walk(p):[p];});}
const files=walk('dist');
const locals=[];const central=[];let offset=0;
for(const file of files){
  const name=Buffer.from(relative('dist',file).replaceAll('\\','/'),'utf8');
  const data=readFileSync(file),crc=crc32(data)>>>0;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);local.writeUInt16LE(0,8);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
  locals.push(local,name,data);
  const cd=Buffer.alloc(46);cd.writeUInt32LE(0x02014b50,0);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt16LE(0x0800,8);cd.writeUInt16LE(0,10);
  cd.writeUInt32LE(crc,16);cd.writeUInt32LE(data.length,20);cd.writeUInt32LE(data.length,24);cd.writeUInt16LE(name.length,28);cd.writeUInt32LE(offset,42);
  central.push(cd,name);offset+=local.length+name.length+data.length;
}
const cd=Buffer.concat(central);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
const pkg=JSON.parse(readFileSync('package.json','utf8'));
mkdirSync('release',{recursive:true});
const filename=`release/chat-maestro-v${pkg.version}-instalar.zip`;
writeFileSync(filename,Buffer.concat([...locals,cd,end]));
console.log(`Pacote gerado: ${filename} (${files.length} arquivos)`);
