import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {advanceChain,resetChain,chain,bookmark} from '../dist/domain/knowledge.js';
import {replaceAll,all,put} from '../dist/platform/db.js';
import {newQueueMessage} from '../dist/domain/queue.js';
import {saveBookmark,bookmarksForChat} from '../dist/platform/bookmarks.js';
import {createChain,moveChain} from '../dist/platform/chains.js';
import {parseManualConversation} from '../dist/domain/importer.js';
test('sequência manual só avança quando não pausada',()=>{
 const now=Date.now();const item=chain({id:'abcdefgh',name:'Revisar',steps:['Planejar','Revisar'],cursor:0,paused:false,createdAt:now,updatedAt:now});
 assert.equal(advanceChain(item).cursor,1);
 assert.throws(()=>advanceChain({...item,paused:true}),/Retome/);
 assert.equal(resetChain({...item,cursor:2}).cursor,0);
});
test('notas e sequências preservadas em armazenamento local',async()=>{
 const chat=parseManualConversation('https://chatgpt.com/c/abcdefgh12345','Plano');
 await replaceAll([chat],[],[]);
 const mark=await saveBookmark(chat.id,'Trecho selecionado','Importante',0);
 assert.equal((await bookmarksForChat(chat.id))[0]?.quote,'Trecho selecionado');
 const sequence=await createChain('Passos',['Planejar','Executar']);
 assert.equal((await moveChain(sequence.id,'advance')).cursor,1);
 assert.equal((await all('chains')).length,1);
 assert.equal((await all('bookmarks')).length,1);
 assert.throws(()=>bookmark({...mark,note:'x'.repeat(4001)}),/inválido/);
});


test('backup v4 preserva notas e chains com validação de versão',async()=>{
 globalThis.chrome={storage:{local:{get:async()=>({}),set:async()=>{}}},alarms:{clear:async()=>true,create:async()=>{}}};
 const {makeBackup,parseBackup}=await import('../dist/platform/backup.js');
 const chat=parseManualConversation('https://chatgpt.com/c/aaabbbcccdddeee','Conhecimento');
 await replaceAll([chat],[],[]);
 await saveBookmark(chat.id,'Evidência','Usar depois',0);
 await createChain('Etapas finais',['Estudar','Executar']);
 await put('queue',newQueueMessage(chat.url,'Continuar estudo',[],'queue-1234567'));
 const backup=await makeBackup();
 assert.equal(backup.version,4);
 assert.equal(backup.bookmarks.length,1);
 assert.equal(backup.chains.length,1);
 assert.equal(parseBackup(backup).bookmarks.length,1);
 assert.equal(backup.queue.length,1);
 assert.equal(parseBackup(backup).queue.length,1);
 assert.throws(()=>parseBackup({...backup,bookmarks:[{...backup.bookmarks[0],chatId:'missing'}]}),/sem conversa/);
});
