import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseInlineRequest,validateInlineContext,INLINE_MESSAGE} from '../dist/domain/inpage-contract.js';
import {reconcileInlineScripts} from '../dist/platform/inline-registration.js';

const gpt='https://chatgpt.com/c/abcde1234567';
const gemini='https://gemini.google.com/app/abcdef987654';
test('mensagens in-page exigem tipo, operação e texto limitado',()=>{
  assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'favorite',href:gpt})?.action,'favorite');
  assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'delete',href:gpt}),null);
  assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'move',href:gpt,folderId:'folder-123'})?.folderId,'folder-123');
  assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'move',href:gpt,folderId:'../evil'}),null);
  assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'save',href:gpt,title:'x'.repeat(251)}),null);
  assert.equal(parseInlineRequest({type:'third-party',action:'save',href:gpt}),null);
});
test('destino é verificado simultaneamente contra URL do conteúdo e aba',()=>{
  assert.equal(validateInlineContext(gpt,gpt,gpt)?.conversation?.provider,'chatgpt');
  assert.equal(validateInlineContext(gpt,gemini,gpt),null);
  assert.equal(validateInlineContext(gpt,gpt,'https://chatgpt.com/c/outro123456'),null);
  assert.equal(validateInlineContext('http://chatgpt.com/c/abcde1234567',gpt,gpt),null);
});
test('página inicial pode apenas abrir o gerenciador',()=>{
  const home='https://gemini.google.com/';
  const ctx=validateInlineContext(home,home,home);
  assert.equal(ctx?.provider,'gemini');
  assert.equal(ctx?.conversation,null);
  assert.equal(validateInlineContext(home,home,gemini),null);
});
test('registro dinâmico somente para provedores autorizados',async()=>{
  const registered=[];
  globalThis.chrome={
    permissions:{contains:async ({origins})=>origins.includes('https://gemini.google.com/*')},
    scripting:{
      getRegisteredContentScripts:async()=>registered.map(v=>({...v})),
      registerContentScripts:async items=>registered.push(...items),
      unregisterContentScripts:async ({ids})=>{for(let i=registered.length-1;i>=0;i--)if(ids.includes(registered[i].id))registered.splice(i,1)}
    }
  };
  await reconcileInlineScripts();
  assert.equal(registered.length,1);
  assert.equal(registered[0].id,'chat-maestro-gemini-v1');
  assert.deepEqual(registered[0].js,['content/inpage.js']);
  assert.equal(registered[0].allFrames,false);
  await reconcileInlineScripts();assert.equal(registered.length,1);
});
test('permissões opcionais e nenhuma injeção estática',()=>{
  const manifest=JSON.parse(readFileSync('manifest.json','utf8'));
  assert.ok(!manifest.host_permissions && !manifest.content_scripts);
  assert.ok(manifest.optional_host_permissions.includes('https://chatgpt.com/*'));
  const src=readFileSync('src/worker.ts','utf8');
  assert.match(src,/sender\.frameId!==0/);
  assert.match(src,/validateInlineContext/);
  assert.match(src,/hasSiteAccess\(ctx\.provider\)/);
  const content=readFileSync('src/content/inpage.ts','utf8');
  assert.doesNotMatch(content,/\.click\(\)|fetch\(|XMLHttpRequest|\.submit\(/);
});

test('script contextual é bundle clássico sem imports ESM',()=>{
 const code=readFileSync('dist/content/inpage.js','utf8');
 assert.doesNotMatch(code,/(^|\n)\s*(import|export)\s/m);
 assert.match(code,/chat-maestro-inline-v1/);
});
