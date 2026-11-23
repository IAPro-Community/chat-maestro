import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurrentInlineTab} from '../dist/platform/inline-guard.js';

const a='https://chatgpt.com/c/aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const b='https://chatgpt.com/c/cccccccc-1111-2222-3333-dddddddddddd';

test('o mesmo destino ativo permite operação local', async()=>{
  globalThis.chrome={tabs:{get:async tabId=>({id:tabId,active:true,url:a})}};
  assert.equal(await isCurrentInlineTab(a,7,a),true);
});
test('recusa trocar de conversa após o recebimento', async()=>{
  globalThis.chrome={tabs:{get:async tabId=>({id:tabId,active:true,url:b})}};
  assert.equal(await isCurrentInlineTab(a,7,a),false);
});
test('recusa troca de aba mesmo com URL de conversa idêntica', async()=>{
  globalThis.chrome={tabs:{get:async tabId=>({id:tabId,active:false,url:a})}};
  assert.equal(await isCurrentInlineTab(a,7,a),false);
});
test('recusa permissões/abas perdidas sem falhar aberto', async()=>{
  globalThis.chrome={tabs:{get:async()=>{throw Error('Tab not found')}}};
  assert.equal(await isCurrentInlineTab(a,7,a),false);
});
test('recusa mudança para outro provedor', async()=>{
  globalThis.chrome={tabs:{get:async tabId=>({id:tabId,active:true,url:'https://gemini.google.com/app/123456789'})}};
  assert.equal(await isCurrentInlineTab(a,7,a),false);
});
