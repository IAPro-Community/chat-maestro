import test from 'node:test';
import assert from 'node:assert/strict';
import {structurePrompt} from '../dist/domain/prompt-coach.js';
import {serializeChats} from '../dist/domain/exporter.js';
import {parseManualConversation} from '../dist/domain/importer.js';
import {parseBackup} from '../dist/platform/backup.js';
import {DEFAULT_SETTINGS} from '../dist/domain/organizer.js';
function chat(provider,id,title){
  const url=provider==='gemini'?`https://gemini.google.com/app/${id}`:`https://chatgpt.com/c/${id}`;
  return {...parseManualConversation(url,title),messages:[{role:'user',text:'Olá'},{role:'assistant',text:'Resposta'}]};
}
const chats=[chat('chatgpt','abcdef123','API'),chat('gemini','abcdef123','Design')];
test('estrutura prompt sem depender de IA remota ou alterar intenção original',()=>{
  const result=structurePrompt('Revise meus testes');
  assert.ok(result.includes('Revise meus testes'));
  for(const part of ['Objetivo:','Contexto:','Restrições:','Formato de entrega:','Critério de qualidade:'])assert.ok(result.includes(part));
});
test('rejeita prompt sem sentido ou muito grande',()=>{
  assert.throws(()=>structurePrompt('a'),/4 a 12/);
  assert.throws(()=>structurePrompt('x'.repeat(12001)),/4 a 12/);
});
test('exporta conversa de provedores distintos com mensagens',()=>{
  const md=serializeChats(chats,'markdown');
  assert.ok(md.includes('ChatGPT'));assert.ok(md.includes('Gemini'));
  assert.ok(md.includes('## Usuário'));assert.ok(md.includes('## Assistente'));
  assert.ok(md.includes('https://gemini.google.com/app/abcdef123'));
  const txt=serializeChats(chats,'text');assert.ok(txt.includes('Plataforma: Gemini'));
  const json=JSON.parse(serializeChats(chats,'json'));
  assert.deepEqual(json.map(x=>x.provider),['chatgpt','gemini']);
});
test('exportador recusa seleção vazia ou maior que 100',()=>{
  assert.throws(()=>serializeChats([],'markdown'),/Selecione/);
  assert.throws(()=>serializeChats(Array(101).fill(chats[0]),'json'),/100/);
});
function backup(version,rows){return {kind:'iapro-optimizer',version,exportedAt:'2026-11-22',chats:rows,folders:[],prompts:[],settings:structuredClone(DEFAULT_SETTINGS)};}
test('backup v2 suporta ChatGPT e Gemini sem colisão de ID',()=>{
  const b=parseBackup(backup(2,chats));
  assert.equal(b.version,4);assert.equal(b.chats.length,2);
  assert.deepEqual(b.chats.map(c=>c.provider),['chatgpt','gemini']);
});
test('backup v1 é migrado sem perder marcações',()=>{
  const old={...chats[0],pinned:true};delete old.provider;
  const b=parseBackup(backup(1,[old]));
  assert.equal(b.version,4);assert.equal(b.chats[0].provider,'chatgpt');assert.equal(b.chats[0].pinned,true);
});
test('backup não aceita provedor mentiroso ou URL trocada',()=>{
  const fake={...chats[1],provider:'chatgpt'};
  assert.throws(()=>parseBackup(backup(2,[fake])),/conversa inválida/);
  const fake2={...chats[1],url:'https://gemini.google.com/app/anotherabc'};
  assert.throws(()=>parseBackup(backup(2,[fake2])),/conversa inválida/);
});
test('backup de Gemini não inventa data de inatividade',()=>{
  const b=parseBackup(backup(2,[chats[1]]));assert.equal(b.chats[0].verifiedAt,false);
});
