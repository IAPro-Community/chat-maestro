import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getActiveAiTab,hasSiteAccess,requestSiteAccess,SITE_ORIGINS} from '../dist/platform/site-access.js';
test('manifest restringe acesso opt-in a ChatGPT e Gemini',()=>{
  const m=JSON.parse(readFileSync('manifest.json','utf8'));
  assert.equal(m.host_permissions,undefined);
  assert.deepEqual([...m.optional_host_permissions].sort(),[...SITE_ORIGINS.chatgpt,...SITE_ORIGINS.gemini].sort());
  assert.equal(m.permissions.includes('activeTab'),false);
});
test('sem URL retorna explicação de permissão, não acusa site errado',async()=>{
  globalThis.chrome={tabs:{query:async()=>[{id:7}]},permissions:{contains:async()=>false}};
  await assert.rejects(getActiveAiTab(),/não autorizou a leitura da URL/i);
});
test('sem permissão para ChatGPT pede conexão explícita',async()=>{
  globalThis.chrome={tabs:{query:async()=>[{id:7,url:'https://chatgpt.com/c/abcdefghi'}]},permissions:{contains:async()=>false}};
  await assert.rejects(getActiveAiTab(),/Conectar ChatGPT/);
});
test('aba ChatGPT autorizada é reconhecida na janela em foco',async()=>{
  globalThis.chrome={tabs:{query:async criteria=>{assert.equal(criteria.lastFocusedWindow,true);return[{id:8,url:'https://chatgpt.com/c/abcdefghi'}]}},permissions:{contains:async()=>true}};
  assert.deepEqual(await getActiveAiTab(),{id:8,url:'https://chatgpt.com/c/abcdefghi',provider:'chatgpt'});
});
test('Gemini solicita apenas sua origem',async()=>{
  const requests=[];
  globalThis.chrome={permissions:{contains:async x=>{requests.push(x.origins);return true},request:x=>{requests.push(x.origins);return Promise.resolve(true)}}};
  assert.equal(await hasSiteAccess('gemini'),true);
  assert.equal(await requestSiteAccess('gemini'),true);
  assert.deepEqual(requests,[['https://gemini.google.com/*'],['https://gemini.google.com/*']]);
});
test('ação executa handler sincronicamente para preservar gesto do usuário',()=>{
  const src=readFileSync('src/ui/dom.ts','utf8');
  assert.match(src,/Promise\.resolve\(handler\(\)\)/);
  assert.doesNotMatch(src,/Promise\.resolve\(\)\.then\(handler\)/);
});
