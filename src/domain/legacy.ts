import type {Backup,Chat,Folder,Prompt,Settings,Rule,Message} from './types.js';
import {DEFAULT_SETTINGS,normalizeRuleWords} from './organizer.js';
import {timestamp} from './importer.js';
interface Obj { [key:string]:unknown }
function obj(v:unknown):Obj|null{return v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Obj:null;}
/** Adaptador de importação ÚNICA da antiga Conversation Workspace v3. Não carregado no runtime diário. */
export function convertLegacyBackup(input:unknown,now=Date.now()):{backup:Backup;warnings:string[]}{
  const root=obj(input);
  if(!root||root.format!=='conversation-workspace-backup'||root.schemaVersion!==3||!Array.isArray(root.folders)||!Array.isArray(root.conversations)||!Array.isArray(root.prompts))throw Error('Não é um backup válido da Conversation Workspace v3.');
  if(root.conversations.length>20_000||root.folders.length>1000||root.prompts.length>3000)throw Error('Backup antigo excede limites de migração.');
  const warnings:string[]=[];
  const folders:Folder[]=root.folders.map(row=>obj(row)).filter((row):row is Obj=>!!row)
    .filter(row=>typeof row.id==='string'&&typeof row.name==='string'&&typeof row.color==='string'&&/^#[a-fA-F0-9]{6}$/.test(row.color))
    .map(row=>({id:row.id as string,name:(row.name as string).slice(0,80),color:row.color as string}));
  const folderIds=new Set(folders.map(f=>f.id));
  const ids=new Set<string>();
  const chats:Chat[]=[];
  for(const raw of root.conversations){
    const item=obj(raw);
    if(!item||typeof item.id!=='string'||!/^[\w-]{6,128}$/.test(item.id)||ids.has(item.id)) {warnings.push('Conversa com ID inválido ou duplicado ignorada.');continue;}
    ids.add(item.id);
    const title=typeof item.title==='string'?item.title.slice(0,250):'Sem título';
    const messages:Message[]=Array.isArray(item.messages)?item.messages.slice(0,1500).map(obj)
      .filter((m):m is Obj=>!!m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string')
      .map(m=>({role:m.role as 'user'|'assistant',text:(m.content as string).slice(0,800_000)})):[];
    const t=timestamp(item.updatedAt,now);
    const folderId=typeof item.folderId==='string'&&folderIds.has(item.folderId)?item.folderId:null;
    chats.push({id:item.id,provider:'chatgpt',title,url:`https://chatgpt.com/c/${item.id}`,source:'import',updatedAt:t,verifiedAt:item.dateVerified===true&&t!==null,
      importedAt:now,folderId,pinned:item.pinned===true,archived:item.archived===true,protected:false,messages,editedAt:0});
  }
  const prompts:Prompt[]=[];
  for(const raw of root.prompts){
    const p=obj(raw);
    if(!p||typeof p.id!=='string'||typeof p.title!=='string'||typeof p.content!=='string')continue;
    prompts.push({id:p.id,name:p.title.slice(0,100),content:p.content.slice(0,20_000),createdAt:timestamp(p.updatedAt,now)??now});
  }
  if(Array.isArray(root.chains)){
    for(const [i,raw] of root.chains.entries()){
      const c=obj(raw);if(!c||typeof c.title!=='string'||!Array.isArray(c.steps))continue;
      const steps=c.steps.filter((s):s is string=>typeof s==='string');
      const content=steps.map((s,n)=>`Etapa ${n+1}:\n${s}`).join('\n\n').slice(0,20_000);
      if(!content)continue;
      prompts.push({id:`chain-${typeof c.id==='string'?c.id:i}`,name:`Sequência legada: ${c.title}`.slice(0,100),content,createdAt:now});
    }
    if(root.chains.length)warnings.push('Sequências antigas migradas como templates de texto; execução por etapas não foi preservada.');
  }
  const old=obj(root.organizerSettings);
  const settings:Settings={...structuredClone(DEFAULT_SETTINGS)};
  if(old){
    if(Number.isInteger(old.archiveAfterDays)&&Number(old.archiveAfterDays)>=30&&Number(old.archiveAfterDays)<=3650)settings.inactivityDays=Number(old.archiveAfterDays);
    if(Number.isInteger(old.keepRecent)&&Number(old.keepRecent)>=0&&Number(old.keepRecent)<=1000)settings.keepRecent=Number(old.keepRecent);
    settings.protectFiled=old.protectFiled!==false;
    if(Array.isArray(old.folderRules)){
      const rules:Rule[]=[];
      for(const rawRule of old.folderRules){
        const r=obj(rawRule);if(!r||typeof r.id!=='string'||typeof r.folderId!=='string'||!folderIds.has(r.folderId)||!Array.isArray(r.keywords))continue;
        try{
          const keys=normalizeRuleWords(r.keywords.join(','));
          rules.push({id:r.id,folderId:r.folderId,keywords:keys,enabled:r.enabled!==false});
        }catch{warnings.push(`Regra antiga inválida ignorada: ${r.id}`);}
      }
      settings.rules=rules.slice(0,100);
    }
  }
  warnings.push('Rotina diária desativada por segurança após migração.');
  return {backup:{kind:'iapro-optimizer',version:3,queue:[],exportedAt:new Date(now).toISOString(),chats,folders,prompts:prompts.slice(0,1000),settings},warnings};
}
