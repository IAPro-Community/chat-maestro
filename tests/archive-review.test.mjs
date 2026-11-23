import test from 'node:test';
import assert from 'node:assert/strict';
import {previewArchiveTasks} from '../dist/platform/archive-review.js';
import {parseManualConversation} from '../dist/domain/importer.js';
const chat={...parseManualConversation('https://chatgpt.com/c/abcdefghijk','Antiga'),verifiedAt:true,updatedAt:Date.now()-200*86400000};
const plan={recommendations:[{id:chat.id,action:'archive',title:chat.title,expectedEditedAt:chat.editedAt,expectedFolderId:null,expectedArchived:false,reason:'inatividade',folderId:null}],unknownDates:0,totalCandidates:1,evaluatedAt:Date.now()};
test('revisão assistida preserva link e não altera dados do provedor',()=>{
 assert.equal(previewArchiveTasks(plan,[chat])[0]?.state,'pending');
 assert.equal(previewArchiveTasks(plan,[chat])[0]?.url,chat.url);
 assert.throws(()=>previewArchiveTasks(plan,[{...chat,pinned:true}]),/expirada/);
});
