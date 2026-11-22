import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,applyToChat,normalizeRuleWords,DEFAULT_SETTINGS,validSettings,DAY} from '../dist/domain/organizer.js';
const NOW=Date.UTC(2026,10,22);
const chat=(id,overrides={})=>({id,title:'Conversa sem assunto',url:`https://chatgpt.com/c/${id}`,source:'import',updatedAt:NOW-250*DAY,verifiedAt:true,importedAt:NOW,folderId:null,pinned:false,protected:false,archived:false,editedAt:0,messages:[],...overrides});
const st=(extra={})=>({...structuredClone(DEFAULT_SETTINGS),keepRecent:0,...extra});
test('configuração conservadora e agendamento desativado',()=>{assert.equal(DEFAULT_SETTINGS.inactivityDays,180);assert.equal(DEFAULT_SETTINGS.autoRun,false);assert.equal(DEFAULT_SETTINGS.protectFiled,true);});
test('arquiva apenas registro com última atividade verificada',()=>{
  const plan=makePlan([chat('aaaaaa'),chat('bbbbbb',{verifiedAt:false}),chat('cccccc',{updatedAt:null})],[],st(),NOW);
  assert.deepEqual(plan.recommendations.map(r=>r.id),['aaaaaa']);assert.equal(plan.unknownDates,2);
});
test('fixados e protegidos nunca entram no plano',()=>{
  assert.equal(makePlan([chat('aaaaaa',{pinned:true}),chat('bbbbbb',{protected:true})],[],st(),NOW).recommendations.length,0);
});
test('pastas existentes têm proteção configurável',()=>{
  const stored=chat('aaaaaa',{folderId:'folder1'});
  assert.equal(makePlan([stored],[],st(),NOW).recommendations.length,0);
  assert.equal(makePlan([stored],[],st({protectFiled:false}),NOW).recommendations.length,1);
});
test('mantém os N mais recentes',()=>{
  const rows=[chat('aaaaaa'),chat('bbbbbb',{updatedAt:NOW-240*DAY}),chat('cccccc',{updatedAt:NOW-230*DAY})];
  assert.deepEqual(makePlan(rows,[],st({keepRecent:2}),NOW).recommendations.map(r=>r.id),['aaaaaa']);
});
test('classifica por regra antes de arquivar',()=>{
  const plan=makePlan([chat('aaaaaa',{title:'Migrar projeto Delphi'})],[{id:'dev',name:'Dev',color:'#000000'}],st({rules:[{id:'r1',keywords:['delphi'],folderId:'dev',enabled:true}]}),NOW);
  assert.deepEqual(plan.recommendations.map(r=>[r.action,r.folderId]),[['file','dev']]);
});
test('regra não casa substring de palavras não relacionadas',()=>{
  const plan=makePlan([chat('aaaaaa',{title:'Diagrama de fluxos',updatedAt:NOW-10*DAY})],[{id:'dev',name:'Dev',color:'#000000'}],st({rules:[{id:'r1',keywords:['ia'],folderId:'dev',enabled:true}]}),NOW);
  assert.equal(plan.recommendations.length,0);
});
test('datas recentes, desconhecidas ou futuras nunca disparam limpeza',()=>{
  const rows=[chat('aaaaaa',{updatedAt:NOW-15*DAY}),chat('bbbbbb',{updatedAt:NOW+DAY}),chat('cccccc',{updatedAt:null})];
  assert.equal(makePlan(rows,[],st(),NOW).recommendations.length,0);
});
test('aplicação rejeita edição após prévia',()=>{
  const c=chat('aaaaaa');const plan=makePlan([c],[],st(),NOW);
  assert.throws(()=>applyToChat({...c,editedAt:5},plan.recommendations[0]),/prévia expirou/);
});
test('aplicação segura mantém outros atributos e faz apenas mudança requerida',()=>{
  const c=chat('aaaaaa');const item=makePlan([c],[],st(),NOW).recommendations[0];
  const next=applyToChat(c,item,NOW);assert.equal(next.archived,true);assert.equal(next.folderId,null);assert.equal(next.id,c.id);
});
test('limite de 100 alterações por lote',()=>{
  const rows=Array.from({length:280},(_,i)=>chat(`id-${String(i).padStart(6,'0')}`));
  const plan=makePlan(rows,[],st(),NOW);assert.equal(plan.recommendations.length,100);assert.equal(plan.totalCandidates,280);
});
test('regra desativada ou pasta inexistente não altera dados',()=>{
  const a=chat('aaaaaa',{title:'Delphi',updatedAt:NOW-2*DAY});
  const rules=[{id:'rule',keywords:['delphi'],folderId:'missing',enabled:true}];
  assert.equal(makePlan([a],[],st({rules}),NOW).recommendations.length,0);
  assert.equal(makePlan([a],[{id:'missing',name:'A',color:'#abcdef'}],st({rules:[{...rules[0],enabled:false}]}),NOW).recommendations.length,0);
});
test('valida regras e impede parâmetros fora de faixa',()=>{
  assert.throws(()=>validSettings({...st(),inactivityDays:1}),/inválidas/);
  assert.throws(()=>validSettings({...st(),rules:[{id:'1',folderId:'2',enabled:true,keywords:[1]}]}),/Regra inválida/);
});
test('palavras-chave são deduplicadas e normalizadas',()=>{
  assert.deepEqual(normalizeRuleWords('Delphi, pascal, DELPHI'),['delphi','pascal']);
  assert.throws(()=>normalizeRuleWords('a'),/palavras-chave/);
});
