import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExport,mergeChat,parseSidebar,timestamp} from '../dist/domain/importer.js';
const now=Date.UTC(2026,10,22);
const raw={id:'abcdef123',title:'Teste de recuperação',update_time:Math.round(now/1000)-1000,mapping:{one:{parent:null,message:{author:{role:'user'},content:{parts:['Olá']}}},two:{parent:'one',message:{author:{role:'assistant'},content:{parts:['Resposta']}}}},current_node:'two'};
test('converte datas em segundos e milissegundos com confiança',()=>{assert.equal(timestamp(1600000000,now),1600000000000);assert.equal(timestamp(1600000000000,now),1600000000000);assert.equal(timestamp(null,now),null);assert.equal(timestamp((now+9*86400000)/1000,now),null);});
test('importa apenas o ramo atual e mensagens textuais',()=>{
  const {items,skipped}=parseExport([raw],now);assert.equal(skipped,0);assert.equal(items.length,1);
  assert.deepEqual(items[0].messages.map(m=>m.text),['Olá','Resposta']);assert.equal(items[0].verifiedAt,true);
});
test('histórico com data inválida não é elegível a arquivamento',()=>{
  const {items}=parseExport([{...raw,update_time:null,create_time:now/1000}],now);
  assert.equal(items[0].verifiedAt,false);assert.equal(items[0].updatedAt,now);
});
test('entrada inválida e IDs duplicados são ignorados',()=>{
  const result=parseExport([null,{id:'x',title:'A'},raw,raw],now);assert.equal(result.items.length,1);assert.equal(result.skipped,3);
});
test('merge preserva organização local e atualiza histórico',()=>{
  const input=parseExport([raw],now).items[0];const existing={...input,folderId:'folder',pinned:true,archived:true,protected:true,messages:[]};
  const next=mergeChat(existing,input);assert.equal(next.folderId,'folder');assert.equal(next.pinned,true);assert.equal(next.archived,true);assert.equal(next.messages.length,2);
});
test('captura de sidebar nunca inventa datas verificadas',()=>{
  const rows=parseSidebar([{id:'abcdef123',title:'Uma conversa',url:'https://chatgpt.com/c/abcdef123'}],now);
  assert.equal(rows.length,1);assert.equal(rows[0].updatedAt,null);assert.equal(rows[0].verifiedAt,false);assert.equal(rows[0].messages.length,0);
});
test('rejeita URLs externas e protocolos inseguros',()=>{
  assert.equal(parseSidebar([{id:'abcdef123',title:'mal',url:'javascript:alert(1)'},{id:'abcdef123',title:'outro',url:'https://evil.com/c/abcdef123'}],now).length,0);
});
test('rejeita JSON que não é exportação de conversas',()=>{assert.throws(()=>parseExport({foo:42}),/conversations.json/);});
