import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeQueuedMessage,newQueueMessage,queueForConversation,reorderConversation,nextPending,MAX_QUEUE_TOTAL} from '../dist/domain/queue.js';
import {parseBackup} from '../dist/platform/backup.js';
import {DEFAULT_SETTINGS} from '../dist/domain/organizer.js';
const gpt='https://chatgpt.com/c/abcdef1234';
const gem='https://gemini.google.com/app/abcdef1234';
const add=(url,text,existing=[],id='11111111-aaaa',now=1234)=>newQueueMessage(url,text,existing,id,now);
const base=(queue=[])=>({kind:'iapro-optimizer',version:3,exportedAt:'2026-11-22',chats:[],folders:[],prompts:[],settings:structuredClone(DEFAULT_SETTINGS),queue});
test('fila identifica ChatGPT e Gemini mesmo com mesmo ID nativo',()=>{
  const one=add(gpt,'Olá');const two=add(gem,'Gemini',[one],'22222222-bbbb');
  assert.equal(queueForConversation([one,two],gpt).length,1);
  assert.equal(queueForConversation([one,two],gem).length,1);
  assert.notEqual(one.conversationId,two.conversationId);
});
test('deduplica URL por conversa ignorando query string de rastreamento',()=>{
  const msg=add(`${gpt}?foo=bar`,'Teste');
  assert.equal(msg.conversationUrl,gpt);
  assert.equal(queueForConversation([msg],gpt).length,1);
});
test('FIFO com reordenação sem mexer no texto',()=>{
  const a=add(gpt,'Primeiro');const b=add(gpt,'Segundo',[a],'22222222-bbbb',1235);
  assert.equal(nextPending([b,a],gpt)?.body,'Primeiro');
  const reordered=reorderConversation([a,b],gpt,b.id,'up');
  assert.equal(nextPending(reordered,gpt)?.body,'Segundo');
  assert.equal(reordered.find(m=>m.id===b.id).body,'Segundo');
});
test('não avança quando primeira mensagem já está preparada',()=>{
  const a=add(gpt,'Primeiro');const b=add(gpt,'Segundo',[a],'22222222-bbbb',1235);
  assert.equal(nextPending([{...a,status:'prepared'},b],gpt),undefined);
});
test('rejeita host forjado e URLs sem conversa',()=>{
  assert.throws(()=>add('https://chatgpt.com.evil.test/c/abcdef1234','Prompt'),/URL/);
  assert.throws(()=>add('https://gemini.google.com/','Prompt'),/URL/);
});
test('rejeita mensagens vazias e acima de 20k',()=>{
  assert.throws(()=>add(gpt,'   '),/Mensagem/);
  assert.throws(()=>add(gpt,'x'.repeat(20001)),/20.000/);
});
test('impede fila gigantesca ou mais de 30 por conversa',()=>{
  const rows=Array.from({length:30},(_,i)=>({...add(gpt,'test',[],'entry-'+String(i).padStart(8,'0')),position:i}));
  assert.throws(()=>add(gpt,'Mais',rows),/30/);
  const huge=Array.from({length:MAX_QUEUE_TOTAL},(_,i)=>({...add(gpt,'test'),id:'id-'+String(i).padStart(8,'0')}));
  assert.throws(()=>add(gem,'Mais',huge),/300/);
});
test('rejeita troca de destino de mensagem enfileirada',()=>{
  const msg=add(gpt,'Teste');
  assert.throws(()=>normalizeQueuedMessage({...msg,conversationUrl:gem}),/destino/);
  assert.throws(()=>normalizeQueuedMessage({...msg,provider:'gemini'}),/destino/);
});
test('backup v3 preserva mensagens e restauração v1/v2 não inventa filas',()=>{
  const b=parseBackup(base([add(gem,'Nota de contexto')]));
  assert.equal(b.version,3);assert.equal(b.queue[0].provider,'gemini');
  const legacy=base();delete legacy.queue;
  legacy.version=2;assert.deepEqual(parseBackup(legacy).queue,[]);
  legacy.version=1;assert.deepEqual(parseBackup(legacy).queue,[]);
});
test('backup v3 recusa fila alterada e IDs repetidos',()=>{
  const row=add(gpt,'Primeira');
  assert.throws(()=>parseBackup(base([{...row,conversationUrl:gem}])),/destino/);
  assert.throws(()=>parseBackup(base([row,row])),/duplicadas/);
  const invalid=base();delete invalid.queue;
  assert.throws(()=>parseBackup(invalid),/sem fila/);
});
test('não permite reordenação em conversa diferente',()=>{
  assert.throws(()=>reorderConversation([add(gpt,'Mensagem')],gem,'11111111-aaaa','up'),/não pertence/);
});
