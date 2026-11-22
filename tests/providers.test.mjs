import test from 'node:test';
import assert from 'node:assert/strict';
import {parseConversationUrl,providerFromPage,PROVIDER_LABEL} from '../dist/domain/providers.js';
import {parseSidebar,parseManualConversation,mergeChat} from '../dist/domain/importer.js';
const CHATGPT='https://chatgpt.com/c/12345678-aaaa';
const GEMINI='https://gemini.google.com/app/12345678-aaaa';
test('dois provedores com o mesmo ID nativo não colidem',()=>{
  const gpt=parseConversationUrl(CHATGPT),gem=parseConversationUrl(GEMINI);
  assert.equal(gpt.id,'12345678-aaaa');assert.equal(gem.id,'gemini:12345678-aaaa');
  assert.notEqual(gpt.id,gem.id);assert.equal(gpt.provider,'chatgpt');assert.equal(gem.provider,'gemini');
});
test('URLs legadas ChatGPT são canonizadas e Gemini aceita query sem persistir tracking',()=>{
  assert.equal(parseConversationUrl('https://chat.openai.com/c/abcdef123?x=1').url,'https://chatgpt.com/c/abcdef123');
  assert.equal(parseConversationUrl('https://gemini.google.com/app/abcdef123?utm_source=x').url,'https://gemini.google.com/app/abcdef123');
});
test('não permite hosts forjados, links públicos ou URL arbitrária',()=>{
  for(const value of [
    'https://gemini.google.com.evil.com/app/abcdef123','https://chatgpt.com.evil.com/c/abcdef123',
    'https://gemini.google.com/gem/abcdef123','https://gemini.google.com/app',
    'https://chatgpt.com/share/abcdef123','javascript:alert(1)',
    'http://gemini.google.com/app/abcdef123','https://gemini.google.com:444/app/abcdef123',
    'https://foo@gemini.google.com/app/abcdef123',
    'https://gemini.google.com/app/../../admin'
  ]) assert.equal(parseConversationUrl(value),null,value);
});
test('páginas de provedores são reconhecidas sem extrair credenciais ou links de terceiros',()=>{
  assert.equal(providerFromPage('https://chatgpt.com/'),'chatgpt');
  assert.equal(providerFromPage('https://gemini.google.com/app'),'gemini');
  assert.equal(providerFromPage('https://gemini.google.com.evil.com/app'),null);
  assert.equal(PROVIDER_LABEL.gemini,'Gemini');
});
test('captura mista valida cada ID e deduplica somente dentro do provedor',()=>{
  const items=parseSidebar([
    {id:'abcdef123',url:'https://chatgpt.com/c/abcdef123',title:'GPT'},
    {id:'abcdef123',url:'https://gemini.google.com/app/abcdef123',title:'Gemini'},
    {id:'abcdef123',url:'https://gemini.google.com/app/abcdef123',title:'Duplicada'},
    {id:'errado123',url:'https://gemini.google.com/app/abcdef123',title:'Inconsistente'},
  ]);
  assert.equal(items.length,2);assert.deepEqual(items.map(i=>i.id),['abcdef123','gemini:abcdef123']);
  assert.ok(items.every(x=>x.verifiedAt===false && x.updatedAt===null));
});
test('Salvar conversa aberta no Gemini não cria atividade verificada',()=>{
  const item=parseManualConversation(GEMINI,'Migrar API');
  assert.equal(item.source,'manual');assert.equal(item.provider,'gemini');
  assert.equal(item.verifiedAt,false);assert.equal(item.updatedAt,null);
  assert.equal(item.id,'gemini:12345678-aaaa');
});
test('merge mantém os dados locais de uma conversa Gemini',()=>{
  const original=parseManualConversation(GEMINI,'Teste');
  const existing={...original,pinned:true,folderId:'folder',protected:true};
  const incoming={...original,title:'Novo título'};
  const merged=mergeChat(existing,incoming);
  assert.equal(merged.title,'Novo título');assert.equal(merged.pinned,true);
  assert.equal(merged.folderId,'folder');assert.equal(merged.protected,true);
});
