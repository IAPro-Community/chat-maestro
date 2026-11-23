import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('workspace has one keyboard shortcut handler and a persistent navigation shell',()=>{
  const app=read('../src/ui/app.ts');
  const css=read('../src/ui/styles.css');
  assert.equal((app.match(/document\.addEventListener\('keydown'/g)||[]).length,1);
  for(const name of ['Biblioteca','Organizar','Prompts','Dados'])assert.ok(app.includes(name));
  assert.match(css,/\.navigation\{position:sticky/);
  assert.match(css,/\.workspace-header\{position:sticky/);
});
test('templates appear ahead of manual queue and editor is collapsed',()=>{
  const prompts=read('../src/ui/screens/prompts.ts');
  assert.match(prompts,/root\.append\(label,list,editor,queue\)/);
  assert.match(prompts,/el\('details','disclosure queue-disclosure'\)/);
});
test('queue is contextual, never sends automatically and does not require URL upfront',()=>{
  const queue=read('../src/ui/screens/queue.ts');
  assert.match(queue,/const picker=el\('details'/);
  assert.match(queue,/Nenhuma conversa selecionada/);
  assert.match(queue,/O Chat Maestro NÃO fará o envio/);
  assert.doesNotMatch(queue,/\.click\(\)\s*;\s*\/\/\s*auto send/);
});
test('library offers quick capture and hides unused bulk actions',()=>{
  const library=read('../src/ui/screens/library.ts');
  assert.match(library,/Salvar conversa aberta/);
  assert.match(library,/Capturar lista visível/);
  assert.match(library,/bulk\.hidden=selected\.size===0/);
  assert.equal((library.match(/search\.id='iapro-search'/g)||[]).length,1);
});
test('organizer displays preview first and does not duplicate export button',()=>{
  const org=read('../src/ui/screens/organize.ts');
  assert.match(org,/root\.replaceChildren\(\.\.\.intro,preview/);
  assert.equal((org.match(/preview\.append\(action\('Exportar conversas sugeridas \(JSON\)'/g)||[]).length,1);
});
