import type {Backup,Chat,Folder,Prompt,Settings} from '../domain/types.js';
import {validSettings} from '../domain/organizer.js';
import {parseConversationUrl} from '../domain/providers.js';
import {folderTree} from '../domain/folders.js';
import {normalizeQueuedMessage,MAX_QUEUE_PER_CHAT,MAX_QUEUE_TOTAL,type QueuedMessage} from '../domain/queue.js';
import {queued} from './queue-store.js';
import {all,replaceAll} from './db.js';
import {loadSettings,saveSettings} from './settings.js';
import {activeScope,LEGACY_SCOPE,requireSelectedProfile,validProfileId} from './profiles.js';
import {bookmark,chain,type Bookmark,type PromptChain} from '../domain/knowledge.js';
function record(v:unknown):v is Record<string,unknown>{return v!==null && typeof v==='object'&&!Array.isArray(v);}
export function parseBackup(raw:unknown):Backup{
  if(!record(raw) || raw.kind!=='iapro-optimizer'||![1,2,3,4].includes(Number(raw.version))||!Array.isArray(raw.chats)||!Array.isArray(raw.folders)||!Array.isArray(raw.prompts)||typeof raw.exportedAt!=='string')throw Error('Arquivo não é um backup IAPro válido.');
  if(raw.chats.length>100_000||raw.folders.length>1000||raw.prompts.length>1000)throw Error('Backup acima dos limites permitidos.');
  const ids=new Set<string>();
  for(const item of raw.chats){
    if(!record(item)||typeof item.id!=='string'||!(typeof item.id==='string' && /^(?:gemini:)?[-\w]{6,128}$/.test(item.id))||ids.has(item.id)||typeof item.title!=='string'||item.title.length>250||typeof item.url!=='string'||!parseConversationUrl(item.url)||parseConversationUrl(item.url)?.id!==item.id|| (Number(raw.version)>=2 && item.provider!==parseConversationUrl(item.url)?.provider)||typeof item.pinned!=='boolean'||typeof item.archived!=='boolean'||typeof item.protected!=='boolean'||typeof item.verifiedAt!=='boolean'||(item.updatedAt!==null&&!Number.isSafeInteger(item.updatedAt))||!Array.isArray(item.messages)||item.messages.length>1500||item.messages.some(m=>!record(m)||!['user','assistant'].includes(String(m.role))||typeof m.text!=='string'||m.text.length>800_000)||typeof item.editedAt!=='number'||!Number.isSafeInteger(item.editedAt)||typeof item.importedAt!=='number'||!['import','sidebar','manual'].includes(String(item.source))||!(item.folderId===null||typeof item.folderId==='string'))throw Error('Backup contém conversa inválida.');
    ids.add(item.id);
  }
  const folders=new Set<string>();
  for(const f of raw.folders){if(!record(f)||typeof f.id!=='string'||folders.has(f.id)||typeof f.name!=='string'||f.name.length>80||!/^#[0-9a-fA-F]{6}$/.test(String(f.color)))throw Error('Pasta inválida no backup.');folders.add(f.id);}
  folderTree(raw.folders as Folder[]);
  for(const c of raw.chats){if(c.folderId!==null&&!folders.has(c.folderId as string))throw Error('Backup referencia pasta inexistente.');}
  const prompts=new Set<string>();
  for(const p of raw.prompts){if(!record(p)||typeof p.id!=='string'||prompts.has(p.id)||typeof p.name!=='string'||p.name.length>100||typeof p.content!=='string'||p.content.length>20_000||typeof p.createdAt!=='number')throw Error('Prompt inválido no backup.');prompts.add(p.id);}
  const notesRaw=Number(raw.version)>=4?raw.bookmarks:[];
  const chainsRaw=Number(raw.version)>=4?raw.chains:[];
  if(!Array.isArray(notesRaw)||!Array.isArray(chainsRaw)||notesRaw.length>10000||chainsRaw.length>200)throw Error('Notas ou sequências inválidas no backup.');
  const bookmarks=(notesRaw as Bookmark[]).map(bookmark);
  const chains=(chainsRaw as PromptChain[]).map(chain);
  if(bookmarks.some(b=>!(raw.chats as Chat[]).some(c=>c.id===b.chatId&&c.provider===b.provider)))throw Error('Nota sem conversa correspondente.');
  if(new Set(bookmarks.map(b=>b.id)).size!==bookmarks.length||new Set(chains.map(c=>c.id)).size!==chains.length)throw Error('Notas ou sequências duplicadas.');
  const settings=validSettings(raw.settings);
  let localScope:Backup['localScope'];
  if(raw.localScope!==undefined){
    const meta=raw.localScope;
    if(!record(meta)||typeof meta.id!=='string'||typeof meta.label!=='string'||meta.label.length>64||
      !(meta.id===LEGACY_SCOPE?meta.provider===null:validProfileId(meta.id)&&(meta.provider==='chatgpt'||meta.provider==='gemini')))throw Error('Origem do backup inválida.');
    localScope={id:meta.id,provider:meta.provider as 'chatgpt'|'gemini'|null,label:meta.label};
  }
  if(settings.rules.some(r=>!folders.has(r.folderId)))throw Error('Regras referenciam pastas ausentes.');
  // Backups v1/v2 continuam importáveis. A fila só existe em backups v3.
  const chats=(raw.chats as Chat[]).map(c=>({...c,provider:parseConversationUrl(c.url)!.provider}));
  if(Number(raw.version)===3 && !Array.isArray(raw.queue))throw Error('Backup v3 sem fila de mensagens.');
  const queueRaw=Number(raw.version)===3?raw.queue as unknown[]:[];
  if(queueRaw.length>MAX_QUEUE_TOTAL)throw Error('Fila excede o limite de 300 mensagens.');
  const queue:QueuedMessage[]=queueRaw.map(normalizeQueuedMessage);
  const distinct=new Set(queue.map(m=>m.id));
  if(distinct.size!==queue.length)throw Error('Backup contém mensagens duplicadas na fila.');
  const countByChat=new Map<string,number>();
  for(const item of queue){const count=(countByChat.get(item.conversationId)??0)+1;if(count>MAX_QUEUE_PER_CHAT)throw Error('Backup excede o limite de mensagens por conversa.');countByChat.set(item.conversationId,count);}
  return {kind:'iapro-optimizer',version:4,exportedAt:raw.exportedAt,...(localScope?{localScope}:{}),chats,folders:raw.folders as Folder[],prompts:raw.prompts as Prompt[],queue,bookmarks,chains,settings};
}
export async function makeBackup():Promise<Backup>{
  const [chats,folders,prompts,queue,bookmarks,chains,settings]=await Promise.all([all<Chat>('chats'),all<Folder>('folders'),all<Prompt>('prompts'),queued(),all<Bookmark>('bookmarks'),all<PromptChain>('chains'),loadSettings()]);
  const scope=activeScope();
  const profile=scope===LEGACY_SCOPE?null:await requireSelectedProfile();
  return {kind:'iapro-optimizer',version:4,exportedAt:new Date().toISOString(),
    localScope:profile?{id:profile.id,provider:profile.provider,label:profile.label}:{id:LEGACY_SCOPE,provider:null,label:'Legado'},
    chats,folders,prompts,queue,bookmarks,chains,settings};
}
export async function restoreBackup(backup:Backup,confirmDifferentScope=false):Promise<void>{
  const b=parseBackup(backup);
  if(activeScope()!==LEGACY_SCOPE){
    const profile=await requireSelectedProfile();
    if(b.chats.some(c=>c.provider!==profile.provider)||b.queue.some(q=>q.provider!==profile.provider))throw Error('Backup contém conversas de outro provedor. Restaure primeiro em Legado e use a cópia seletiva para o perfil desejado.');
  }
  if(!confirmDifferentScope && b.localScope?.id!==activeScope())throw Error('Backup de outro perfil (ou origem desconhecida). Confirme explicitamente a importação entre perfis antes de restaurar.');
  // Após restauração, automações começam SEMPRE desligadas.
  const safe:Settings={...b.settings,autoRun:false};
  await replaceAll(b.chats,b.folders,b.prompts,b.queue,activeScope(),b.bookmarks??[],b.chains??[]);
  await saveSettings(safe);
}
export function downloadJson(filename:string,value:unknown):void{
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
