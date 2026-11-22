import test from 'node:test';
import assert from 'node:assert/strict';
import {convertLegacyBackup} from '../dist/domain/legacy.js';
import {parseBackup} from '../dist/platform/backup.js';
const now=Date.UTC(2026,10,22);
const data=()=>({format:'conversation-workspace-backup',schemaVersion:3,revision:1,
  folders:[{id:'f1',name:'Dev',color:'#123456'}],conversations:[{id:'some-uuid-100',title:'Delphi',folderId:'f1',updatedAt:now-300*86400000,dateVerified:true,pinned:true,archived:false,messages:[{role:'user',content:'Olá'}]}],
  prompts:[{id:'p1',title:'Revisão',content:'Revise o código',favorite:true,updatedAt:now}],chains:[{id:'c1',title:'Etapas',steps:['Planeje','Execute']}],
  organizerSettings:{archiveAfterDays:200,keepRecent:10,enabled:true,folderRules:[{id:'r1',folderId:'f1',keywords:['delphi'],enabled:true}]}});
test('migra biblioteca v0.3 preservando dados e sem rotina ativa',()=>{
  const {backup,warnings}=convertLegacyBackup(data(),now);const checked=parseBackup(backup);
  assert.equal(checked.chats[0].pinned,true);assert.equal(checked.chats[0].folderId,'f1');assert.equal(checked.chats[0].messages[0].text,'Olá');
  assert.equal(checked.settings.inactivityDays,200);assert.equal(checked.settings.autoRun,false);assert.equal(checked.settings.rules.length,1);
  assert.equal(checked.prompts.length,2);assert.ok(warnings.some(w=>w.includes('Sequências')));
});
test('não interpreta exportações arbitrárias como backups antigos',()=>{assert.throws(()=>convertLegacyBackup({format:'not-a-backup',schemaVersion:3}),/Não é um backup/);});
test('data não verificada continua protegida no projeto novo',()=>{
  const raw=data();raw.conversations[0].dateVerified=false;
  const {backup}=convertLegacyBackup(raw,now);assert.equal(backup.chats[0].verifiedAt,false);
});
