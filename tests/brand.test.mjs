import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);
const expectedSha256 = Object.freeze({
  'assets/brand/icon-source.png': '6ac9b0881baa7328744a5571c2bb2883d98494b7cb253c16340efe4a41a1d2d6',
  'assets/brand/readme-banner.png': '805b885a6fec41deb4d4c4aead31fe57f33d8e473166a1ca7c2f91152984dbf4',
  'assets/icon16.png': '4707f91fe8152c98b96695a38b80e1cb5df0934bf214dfaa614950fa8318d25a',
  'assets/icon32.png': 'ad9e6304a9bcc14d68768d34865287c00a697208a3e483fd03545898acd95375',
  'assets/icon48.png': '9c5355b3e0ffd6dc8778b1e4bbab499004904038842d6c07ab95bbeddb206f27',
  'assets/icon128.png': '4e97cf18c8346de149640e8a6f06f1a98bef4cc6563174bb933b8b273ce61371'
});
function checkPng(path,width,height) {
  const bytes=readFileSync(path);
  assert.ok(bytes.subarray(0,8).equals(PNG_SIGNATURE),`Assinatura PNG inválida: ${path}`);
  assert.equal(bytes.readUInt32BE(16),width,`Largura inválida: ${path}`);
  assert.equal(bytes.readUInt32BE(20),height,`Altura inválida: ${path}`);
  const actual=createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual,expectedSha256[path],`Identidade divergente: ${path}. Revise a arte e atualize o hash conscientemente.`);
}

test('fonte raster e banner correspondem à marca aprovada',()=>{
  checkPng('assets/brand/icon-source.png',256,256);
  checkPng('assets/brand/readme-banner.png',750,225);
  const app=readFileSync('src/ui/app.ts','utf8');
  const readme=readFileSync('README.md','utf8');
  assert.match(app,/mark\.src='assets\/icon128\.png'/);
  assert.match(readme,/assets\/brand\/readme-banner\.png/);
  assert.doesNotMatch(app,/chat-maestro-icon\.svg/);
});

test('ícones MV3 e action.default_icon usam os arquivos aprovados',()=>{
  const manifest=JSON.parse(readFileSync('manifest.json','utf8'));
  for(const size of [16,32,48,128]){
    const path=`assets/icon${size}.png`;
    assert.equal(manifest.icons[String(size)],path);
    checkPng(path,size,size);
  }
  for(const size of [16,32]){
    assert.equal(manifest.action.default_icon[String(size)],manifest.icons[String(size)]);
  }
  assert.ok(!manifest.host_permissions && !manifest.content_scripts);
});
