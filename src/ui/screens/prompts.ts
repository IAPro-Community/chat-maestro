import type {Context} from '../context.js';
import type {Prompt} from '../../domain/types.js';
import {put,remove} from '../../platform/db.js';
import {variables,fillTemplate} from '../../domain/templates.js';
import {structurePrompt} from '../../domain/prompt-coach.js';
import {insertIntoActiveComposer} from '../../platform/composer.js';
import {el,action,field,empty,notify,confirmAction} from '../dom.js';
import {renderQueue} from './queue.js';
function filled(content:string):string|null{
  const values:Record<string,string>={};
  for(const key of variables(content)){
    const value=window.prompt(`Preencha a variável ${key}:`,'');if(value===null)return null;
    values[key]=value;
  }
  return fillTemplate(content,values);
}
export function renderPrompts(ctx:Context):HTMLElement{
  const root=el('section','screen');root.append(el('h2','screen-title','Prompts salvos'));
  root.append(el('p','hint','Reutilize modelos e prepare mensagens para ChatGPT ou Gemini. O envio continua sob seu controle.'));
  const form=el('form','panel');form.append(el('h3','section-heading','Editor de prompt'));
  const title=el('input');title.maxLength=100;title.required=true;title.placeholder='Ex.: Revisar código';
  const content=el('textarea');content.maxLength=20000;content.rows=5;content.required=true;content.placeholder='Escreva o prompt que deseja reutilizar…';
  let editingId:string|null=null;
  form.append(field('Título',title),field('Conteúdo',content));
  form.append(action('Estruturar prompt',()=>{
    content.value=structurePrompt(content.value);
    notify('Estrutura sugerida localmente; revise e personalize antes de salvar.');
  }));
  const submit=el('button','btn primary','Salvar prompt');submit.type='submit';form.append(submit);
  const cancel=action('Cancelar edição',()=>{editingId=null;title.value='';content.value='';submit.textContent='Salvar prompt';});form.append(cancel);
  form.addEventListener('submit',e=>{
    e.preventDefault();void (async()=>{
      if(!editingId&&ctx.prompts.length>=1000)throw Error('Limite de 1000 prompts.');
      const existing=ctx.prompts.find(p=>p.id===editingId);
      const prompt:Prompt={id:editingId??crypto.randomUUID(),name:title.value.trim(),content:content.value.trim(),createdAt:existing?.createdAt??Date.now()};
      if(!prompt.name||!prompt.content)throw Error('Preencha título e conteúdo.');
      await put('prompts',prompt);notify(editingId?'Prompt atualizado.':'Prompt salvo.');await ctx.refresh();
    })().catch(err=>notify(String(err),true));
  });
  const editor=el('details','disclosure');editor.append(el('summary','disclosure-trigger','+ Criar ou editar template'),form);
  const list=el('div','prompt-list');
  if(!ctx.prompts.length)list.append(empty('Nenhum prompt salvo ainda.'));
  for(const p of [...ctx.prompts].sort((a,b)=>b.createdAt-a.createdAt)){
    const entry=el('article','prompt-card');entry.append(el('h3','',p.name));
    const code=el('pre','prompt-preview',p.content.length>250?`${p.content.slice(0,250)}…`:p.content);entry.append(code);
    const actions=el('div','buttons');
    actions.append(action('Copiar',async()=>{const text=filled(p.content);if(text===null)return;
      await navigator.clipboard.writeText(text);notify('Prompt copiado.');},'primary'));
    actions.append(action('Inserir na aba ativa',async()=>{const text=filled(p.content);if(text===null)return;
      await insertIntoActiveComposer(text);notify('Prompt inserido. Revise antes de enviar.');}));
    actions.append(action('Editar',()=>{editor.open=true;editingId=p.id;title.value=p.name;content.value=p.content;submit.textContent='Salvar alterações';title.focus();}));
    actions.append(action('Remover',async()=>{if(!confirmAction(`Remover o prompt "${p.name}"?`))return;await remove('prompts',p.id);await ctx.refresh();},'danger'));
    entry.append(actions);list.append(entry);
  }
  const label=el('h3','section-heading','Meus templates');
  const queue=el('details','disclosure queue-disclosure');
  const queueTitle=el('summary','disclosure-trigger','Fila de mensagens · preparar e revisar');
  queue.append(queueTitle,renderQueue());
  root.append(label,list,editor,queue);return root;
}
