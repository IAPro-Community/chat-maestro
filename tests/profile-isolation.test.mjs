import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {dbNameForScope,LEGACY_SCOPE,createProfile,listProfiles,selectProfile,activeScope,requireSelectedProfile} from '../dist/platform/profiles.js';
import {importChats,all,copyLegacyToProfile,modifyChat,one} from '../dist/platform/db.js';
import {parseManualConversation} from '../dist/domain/importer.js';
import {makeBackup,restoreBackup} from '../dist/platform/backup.js';

const memory={};
globalThis.chrome={
  storage:{local:{
    get:async keys=>{
      if(typeof keys==='string')return {[keys]:memory[keys]};
      return Object.fromEntries((keys??Object.keys(memory)).map(k=>[k,memory[k]]));
    },
    set:async values=>Object.assign(memory,values)
  }},
  alarms:{clear:async()=>true,create:async()=>{}}
};
const url='https://chatgpt.com/c/aabbccdd-1111-2222-3333-eeff44556677';
test('perfis isolam conversas de mesmo ID e mantêm banco legado',async()=>{
  const personal=await createProfile('chatgpt','Pessoal');
  const work=await createProfile('chatgpt','Trabalho');
  const gemini=await createProfile('gemini','Google');
  assert.notEqual(dbNameForScope(personal.id),dbNameForScope(work.id));
  assert.equal(dbNameForScope(LEGACY_SCOPE),'iapro-optimizer-v1');
  assert.equal((await listProfiles()).length,3);
  await selectProfile(personal.id);
  await importChats([parseManualConversation(url,'Conversa Pessoal')]);
  await selectProfile(work.id);
  assert.equal((await all('chats')).length,0);
  await importChats([parseManualConversation(url,'Conversa Trabalho')]);
  assert.equal((await one('chats',parseManualConversation(url,'X').id)).title,'Conversa Trabalho');
  await selectProfile(personal.id);
  assert.equal((await one('chats',parseManualConversation(url,'X').id)).title,'Conversa Pessoal');
  await modifyChat(parseManualConversation(url,'X').id,{pinned:true});
  await selectProfile(work.id);
  assert.equal((await one('chats',parseManualConversation(url,'X').id)).pinned,false);
  await assert.rejects(requireSelectedProfile('gemini'),/incompatível/);
  await selectProfile(gemini.id);
  assert.equal((await all('chats')).length,0);
  assert.equal(activeScope(),gemini.id);
});
test('cópia do legado não exclui origem nem sobrescreve perfil existente',async()=>{
  const chat=parseManualConversation('https://chatgpt.com/c/abcd1234567890','Antiga');
  await importChats([chat],undefined,'legacy');
  const destination=await createProfile('chatgpt','Histórico');
  const migrated=await copyLegacyToProfile(destination.id,'chatgpt');
  assert.equal(migrated.chats,1);
  assert.equal((await all('chats','legacy')).length,1);
  assert.equal((await all('chats',destination.id)).length,1);
  await assert.rejects(copyLegacyToProfile(destination.id,'chatgpt'),/já possui dados/);
});
test('restauração em perfil bloqueia backup misturado de provedores',async()=>{
  const chat=await createProfile('chatgpt','Restaurar');
  await selectProfile(chat.id);
  const old=await makeBackup();
  const foreign={...old,chats:[parseManualConversation('https://gemini.google.com/app/abcde1234567','Fora')]};
  await assert.rejects(restoreBackup(foreign),/outro provedor/);
  assert.equal((await all('chats')).length,0);
});
test('nunca atribui automaticamente dados antigos a um perfil',async()=>{
  await selectProfile(LEGACY_SCOPE);
  assert.equal(activeScope(),LEGACY_SCOPE);
  assert.equal((await all('chats')).length,1);
  await assert.rejects(requireSelectedProfile(),/Crie e selecione/);
});

test('backup de outro perfil requer confirmação explícita da transferência',async()=>{
  const from=await createProfile('chatgpt','Origem do backup');
  const to=await createProfile('chatgpt','Destino do backup');
  await selectProfile(from.id);
  await importChats([parseManualConversation(url,'Original')]);
  const backup=await makeBackup();
  assert.equal(backup.localScope.id,from.id);
  await selectProfile(to.id);
  await assert.rejects(restoreBackup(backup),/Confirme explicitamente/);
  assert.equal((await all('chats')).length,0);
  await restoreBackup(backup,true);
  assert.equal((await all('chats')).length,1);
});

test('importações não misturam provedores no mesmo banco',async()=>{
  const p=await createProfile('chatgpt','Teste de importação segura');
  await selectProfile(p.id);
  const foreign=parseManualConversation('https://gemini.google.com/app/abcdefghi','Outro provedor');
  await assert.rejects(importChats([foreign]),/outro provedor/);
  assert.equal((await all('chats')).length,0);
});

test('migração Legado copia notas apenas de conversas do provedor de destino',async()=>{
 const source={...parseManualConversation('https://chatgpt.com/c/xyzabcdef012345','Legado com nota')};
 await importChats([source],undefined,'legacy');
 const old=await all('bookmarks','legacy');
 const mark={id:'bmark-123456789',chatId:source.id,provider:'chatgpt',quote:'Trecho',note:'Anotação',createdAt:Date.now()};
 await put('bookmarks',mark,'legacy');
 const p=await createProfile('chatgpt','Migrar anotações');
 await copyLegacyToProfile(p.id,'chatgpt');
 const copied=await all('bookmarks',p.id);
 assert.ok(copied.some(x=>x.id===mark.id));
 assert.equal((await all('bookmarks','legacy')).length,old.length+1);
});
