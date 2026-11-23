import type {Chat, Folder, Prompt, UndoRecord, Recommendation, Plan} from '../domain/types.js';
import type {QueuedMessage} from '../domain/queue.js';
import {applyToChat, MAX_BATCH} from '../domain/organizer.js';
import {mergeChat} from '../domain/importer.js';
import {parseConversationUrl} from '../domain/providers.js';
import {activeScope,dbNameForScope} from './profiles.js';
type StoreName = 'chats' | 'folders' | 'prompts' | 'meta' | 'queue';
const opening=new Map<string,Promise<IDBDatabase>>();
export function openDB(scopeId:string=activeScope()):Promise<IDBDatabase>{
  const dbName=dbNameForScope(scopeId);
  const existing=opening.get(dbName);
  if(existing)return existing;
  const task=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open(dbName,3);
    request.onupgradeneeded=(ev)=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('chats')){const s=db.createObjectStore('chats',{keyPath:'id'});s.createIndex('byUpdate','updatedAt');}
      if(!db.objectStoreNames.contains('folders')) db.createObjectStore('folders',{keyPath:'id'});
      if(!db.objectStoreNames.contains('prompts')) db.createObjectStore('prompts',{keyPath:'id'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'id'});
      if(!db.objectStoreNames.contains('queue')){const q=db.createObjectStore('queue',{keyPath:'id'});q.createIndex('byConversation','conversationId');}
      if(ev.oldVersion>0 && ev.oldVersion<2){
        const cursorRequest=request.transaction!.objectStore('chats').openCursor();
        cursorRequest.onsuccess=()=>{
          const cursor=cursorRequest.result;
          if(!cursor)return;
          const chat=cursor.value as Chat;
          if(!chat.provider){
            const ref=parseConversationUrl(chat.url);
            cursor.update({...chat,provider:ref?.provider??'chatgpt'});
          }
          cursor.continue();
        };
      }
    };
    request.onerror=()=>reject(request.error ?? Error('Erro abrindo IndexedDB'));
    request.onsuccess=()=>{
      const db=request.result;
      db.onversionchange=()=>{db.close();opening.delete(dbName);};
      resolve(db);
    };
  }).catch(err=>{opening.delete(dbName);throw err;});
  opening.set(dbName,task);
  return task;
}
function requestValue<T>(req:IDBRequest<T>):Promise<T>{
  return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error ?? Error('Falha no IndexedDB'));});
}
function txDone(tx:IDBTransaction):Promise<void>{
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error ?? Error('Transação cancelada'));tx.onerror=()=>reject(tx.error ?? Error('Erro na transação'));});
}
export async function all<T>(name:StoreName,scopeId:string=activeScope()):Promise<T[]>{
  const db=await openDB(scopeId);return requestValue<T[]>(db.transaction(name,'readonly').objectStore(name).getAll());
}
export async function one<T>(name:StoreName,id:string,scopeId:string=activeScope()):Promise<T|undefined>{
  const db=await openDB(scopeId);return requestValue<T|undefined>(db.transaction(name,'readonly').objectStore(name).get(id));
}
export async function put<T extends {id:string}>(name:StoreName,item:T):Promise<void>{
  const db=await openDB();const tx=db.transaction(name,'readwrite');const done=txDone(tx);tx.objectStore(name).put(item);await done;
}
export async function remove(name:StoreName,id:string):Promise<void>{
  const db=await openDB();const tx=db.transaction(name,'readwrite');const done=txDone(tx);tx.objectStore(name).delete(id);await done;
}
export async function importChats(rows:Chat[],onProgress?:(n:number)=>void,scopeId:string=activeScope()):Promise<number>{
  if(rows.length>100_000)throw Error('Importação muito grande.');
  let count=0;
  // Lotes pequenos evitam transações longas. Organização existente tem precedência.
  const db=await openDB(scopeId);
  for(let start=0;start<rows.length;start+=100){
    const batch=rows.slice(start,start+100);
    const tx=db.transaction('chats','readwrite');const done=txDone(tx);
    const store=tx.objectStore('chats');
    for(const incoming of batch){
      const req=store.get(incoming.id);
      req.onsuccess=()=>{store.put(mergeChat(req.result as Chat|undefined,incoming));};
    }
    await done;
    count+=batch.length;onProgress?.(count);
  }
  return count;
}
export async function modifyChat(id:string,patch:Partial<Pick<Chat,'pinned'|'archived'|'protected'|'folderId'>>,scopeId:string=activeScope()):Promise<void>{
  const db=await openDB(scopeId);const tx=db.transaction('chats','readwrite');const done=txDone(tx);const store=tx.objectStore('chats');
  const req=store.get(id);
  req.onsuccess=()=>{
    const chat=req.result as Chat|undefined;
    if(!chat){tx.abort();return;}
    store.put({...chat,...patch,editedAt:Math.max(Date.now(),chat.editedAt+1)});
  };
  await done;
}
/** Operações locais em lote com limite e transação atômica; não chama APIs dos provedores. */
export async function modifyChats(ids:string[],patch:Partial<Pick<Chat,'archived'|'protected'|'folderId'>>):Promise<number>{
  if(ids.length<1 || ids.length>100 || new Set(ids).size!==ids.length)throw Error('Selecione de 1 a 100 conversas diferentes por lote.');
  const db=await openDB();const tx=db.transaction('chats','readwrite');const done=txDone(tx);const store=tx.objectStore('chats');
  let count=0;
  for(const id of ids){
    const req=store.get(id);
    req.onsuccess=()=>{
      const row=req.result as Chat|undefined;
      if(!row){tx.abort();return;}
      store.put({...row,...patch,editedAt:Math.max(Date.now(),row.editedAt+1)});count++;
    };
  }
  await done;
  return count;
}
export async function deleteFolder(id:string):Promise<void>{
  const db=await openDB();const tx=db.transaction(['folders','chats'],'readwrite');const done=txDone(tx);
  const folderStore=tx.objectStore('folders');const chatStore=tx.objectStore('chats');
  folderStore.delete(id);
  const cursorReq=chatStore.openCursor();
  cursorReq.onsuccess=()=>{
    const cursor=cursorReq.result;if(!cursor)return;
    const chat=cursor.value as Chat;
    if(chat.folderId===id)cursor.update({...chat,folderId:null,editedAt:Date.now()});
    cursor.continue();
  };
  await done;
}
interface UndoBatch{id:'last';at:number;entries:UndoRecord[]}
export async function applyPlan(plan:Plan):Promise<number>{
  const recs=plan.recommendations.slice(0,MAX_BATCH);
  if(recs.length===0)return 0;
  if(new Set(recs.map(r=>r.id)).size!==recs.length)throw Error('Plano duplicado.');
  const db=await openDB();const tx=db.transaction(['chats','meta'],'readwrite');const done=txDone(tx);
  const chatStore=tx.objectStore('chats');const meta=tx.objectStore('meta');const now=Date.now();
  const entries:UndoRecord[]=[];
  // Leituras e escritas ocorrem dentro da MESMA transação atômica.
  for(const action of recs){
    const req=chatStore.get(action.id);
    req.onsuccess=()=>{
      const row=req.result as Chat|undefined;
      try{
        if(!row)throw Error('Conversa removida.');
        const edited=applyToChat(row,action,now);
        chatStore.put(edited);
        entries.push({id:row.id,before:{archived:row.archived,folderId:row.folderId},afterEditedAt:now});
      }catch{tx.abort();}
    };
  }
  // O marcador só será escrito após todas as leituras terem enfileirado as alterações.
  const check=chatStore.get(recs[0]!.id);
  check.onsuccess=()=>{meta.put({id:'last',at:now,entries} satisfies UndoBatch);};
  await done;
  return entries.length;
}
export async function undoLast():Promise<number>{
  const db=await openDB();const tx=db.transaction(['chats','meta'],'readwrite');const done=txDone(tx);
  const chats=tx.objectStore('chats');const meta=tx.objectStore('meta');let total=0;
  const req=meta.get('last');
  req.onsuccess=()=>{
    const batch=req.result as UndoBatch|undefined;
    if(!batch || batch.entries.length===0){tx.abort();return;}
    for(const entry of batch.entries){
      const read=chats.get(entry.id);
      read.onsuccess=()=>{
        const chat=read.result as Chat|undefined;
        if(!chat || chat.editedAt!==entry.afterEditedAt){tx.abort();return;}
        chats.put({...chat,...entry.before,editedAt:Date.now()});total++;
      };
    }
    // Executado depois das leituras; atomicidade garantida mesmo com abort.
    const guard=chats.get(batch.entries[0]!.id);
    guard.onsuccess=()=>meta.delete('last');
  };
  await done;
  return total;
}
export async function replaceAll(chats:Chat[],folders:Folder[],prompts:Prompt[],queue:QueuedMessage[]=[],scopeId:string=activeScope()):Promise<void>{
  const db=await openDB(scopeId);const tx=db.transaction(['chats','folders','prompts','meta','queue'],'readwrite');const done=txDone(tx);
  const cs=tx.objectStore('chats'),fs=tx.objectStore('folders'),ps=tx.objectStore('prompts');
  cs.clear();fs.clear();ps.clear();tx.objectStore('meta').clear();tx.objectStore('queue').clear();
  for(const c of chats)cs.put(c);
  for(const f of folders)fs.put(f);
  for(const p of prompts)ps.put(p);
  for(const item of queue)tx.objectStore('queue').put(item);
  await done;
}
export async function clearAll():Promise<void>{await replaceAll([],[],[]);}
export async function counts():Promise<{total:number,archived:number,pinned:number}>{
  const chats=await all<Chat>('chats');return {total:chats.length,archived:chats.filter(c=>c.archived).length,pinned:chats.filter(c=>c.pinned).length};
}
export function planItemIds(plan:Plan):string[]{return plan.recommendations.map((r:Recommendation)=>r.id);}

/** Cópia não destrutiva dos registros legados. Exige banco de destino vazio. */
export async function copyLegacyToProfile(scopeId:string,provider:'chatgpt'|'gemini'):Promise<{chats:number;folders:number;prompts:number;queue:number}>{
  if(scopeId==='legacy')throw Error('Escolha um perfil de destino.');
  const [existingChats,existingFolders,existingPrompts,existingQueue]=await Promise.all([
    all<Chat>('chats',scopeId),all<Folder>('folders',scopeId),all<Prompt>('prompts',scopeId),all<QueuedMessage>('queue',scopeId)
  ]);
  if(existingChats.length||existingFolders.length||existingPrompts.length||existingQueue.length)throw Error('O perfil de destino já possui dados. Faça backup e escolha outro perfil para evitar sobrescrever.');
  const [chats,folders,prompts,queue]=await Promise.all([
    all<Chat>('chats','legacy'),all<Folder>('folders','legacy'),all<Prompt>('prompts','legacy'),all<QueuedMessage>('queue','legacy')
  ]);
  const included=chats.filter(c=>c.provider===provider);
  const selectedQueue=queue.filter(q=>q.provider===provider);
  await replaceAll(included,folders,prompts,selectedQueue,scopeId);
  return {chats:included.length,folders:folders.length,prompts:prompts.length,queue:selectedQueue.length};
}
