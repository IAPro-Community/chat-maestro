import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {indexTerms,queryTerms,intersectPostings} from '../dist/domain/search.js';
import {importChats,searchIndexed,remove,replaceAll} from '../dist/platform/db.js';
import {parseManualConversation} from '../dist/domain/importer.js';
const mk=(id,title,content)=>({...parseManualConversation('https://chatgpt.com/c/'+id,title),messages:[{role:'user',text:content}],editedAt:Date.now()});
test('tokenização ignora acentos e cruza termos em AND',()=>{
  const row=mk('abcdefghijkl','Integração Delphi','Código e automação');
  assert.ok(indexTerms(row).includes('integracao'));
  assert.deepEqual(queryTerms('Integração código'),['integracao','codigo']);
  assert.deepEqual(intersectPostings([['x','y'],['y']]),['y']);
});
test('indexar novos chats, consultar, substituir e remover sem resultados fantasma',async()=>{
  const a=mk('abcdefghijkl','Relatório Delphi','Banco de dados');
  const b=mk('mnopqrstuvwx','Relatório Gemini','Interface');
  await replaceAll([],[],[]);
  await importChats([a,b]);
  assert.equal((await searchIndexed('relatorio')).total,2);
  assert.equal((await searchIndexed('relatorio delphi')).results[0]?.id,a.id);
  assert.equal((await searchIndexed('relatorio inexistente')).total,0);
  await importChats([mk('abcdefghijkl','Futuro Projeto','Busca diferente')]);
  assert.equal((await searchIndexed('delphi')).total,0);
  assert.equal((await searchIndexed('projeto')).total,1);
  await remove('chats',a.id);
  assert.equal((await searchIndexed('projeto')).total,0);
});
