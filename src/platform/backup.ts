import type {Backup,Chat,Folder,Prompt,Settings} from '../domain/types.js';
import {validSettings} from '../domain/organizer.js';
import {parseConversationUrl} from '../domain/providers.js';
import {normalizeQueuedMessage,MAX_QUEUE_PER_CHAT,MAX_QUEUE_TOTAL,type QueuedMessage} from '../domain/queue.js';
import {queued} from './queue-store.js';
import {all,replaceAll} from './db.js';
import {loadSettings,saveSettings} from './settings.js';
function record(v:unknown):v is Record<string,unknown>{return v!==null && typeof v==='object'&&!Array.isArray(v);}
export function parseBackup(raw:unknown):Backup{
  if(!record(raw) || raw.kind!=='iapro-optimizer'||![1,2,3].includes(Number(raw.version))||!Array.isArray(raw.chats)||!Array.isArray(raw.folders)||!Array.isArray(raw.prompts)||typeof raw.exportedAt!=='string')throw Error('Arquivo não é um backup IAPro válido.');
  if(raw.chats.length>100_000||raw.folders.length>1000||raw.prompts.length>1000)throw Error('Backup acima dos limites permitidos.');
  const ids=new Set<string>();
  for(const item of raw.chats){
    if(!record(item)||typeof item.id!=='string'||!(typeof item.id==='string' && /^(?:gemini:)?[-\w]{6,128}$/.test(item.id))||ids.has(item.id)||typeof item.title!=='string'||item.title.length>250||typeof item.url!=='string'||!parseConversationUrl(item.url)||parseConversationUrl(item.url)?.id!==item.id|| (Number(raw.version)>=2 && item.provider!==parseConversationUrl(item.url)?.provider)||typeof item.pinned!=='boolean'||typeof item.archived!=='boolean'||typeof item.protected!=='boolean'||typeof item.verifiedAt!=='boolean'||(item.updatedAt!==null&&!Number.isSafeInteger(item.updatedAt))||!Array.isArray(item.messages)||item.messages.length>1500||item.messages.some(m=>!record(m)||!['user','assistant'].includes(String(m.role))||typeof m.text!=='string'||m.text.length>800_000)||typeof item.editedAt!=='number'||!Number.isSafeInteger(item.editedAt)||typeof item.importedAt!=='number'||!['import','sidebar','manual'].includes(String(item.source))||!(item.folderId===null||typeof item.folderId==='string'))throw Error('Backup contém conversa inválida.');
    ids.add(item.id);
  }
  const folders=new Set<string>();
  for(const f of raw.folders){if(!record(f)||typeof f.id!=='string'||folders.has(f.id)||typeof f.name!=='string'||f.name.length>80||!/^#[0-9a-fA-F]{6}$/.test(String(f.color)))throw Error('Pasta inválida no backup.');folders.add(f.id);}
  for(const c of raw.chats){if(c.folderId!==null&&!folders.has(c.folderId as string))throw Error('Backup referencia pasta inexistente.');}
  const prompts=new Set<string>();
  for(const p of raw.prompts){if(!record(p)||typeof p.id!=='string'||prompts.has(p.id)||typeof p.name!=='string'||p.name.length>100||typeof p.content!=='string'||p.content.length>20_000||typeof p.createdAt!=='number')throw Error('Prompt inválido no backup.');prompts.add(p.id);}
  const settings=validSettings(raw.settings);
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
  return {kind:'iapro-optimizer',version:3,exportedAt:raw.exportedAt,chats,folders:raw.folders as Folder[],prompts:raw.prompts as Prompt[],queue,settings};
}
export async function makeBackup():Promise<Backup>{
  const [chats,folders,prompts,queue,settings]=await Promise.all([all<Chat>('chats'),all<Folder>('folders'),all<Prompt>('prompts'),queued(),loadSettings()]);
  return {kind:'iapro-optimizer',version:3,exportedAt:new Date().toISOString(),chats,folders,prompts,queue,settings};
}
export async function restoreBackup(backup:Backup):Promise<void>{
  const b=parseBackup(backup);
  // Após restauração, automações começam SEMPRE desligadas.
  const safe:Settings={...b.settings,autoRun:false};
  await replaceAll(b.chats,b.folders,b.prompts,b.queue);
  await saveSettings(safe);
}
export function downloadJson(filename:string,value:unknown):void{
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
