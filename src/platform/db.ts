import type {Chat, Folder, Prompt, UndoRecord, Recommendation, Plan} from '../domain/types.js';
import type {QueuedMessage} from '../domain/queue.js';
import {applyToChat, MAX_BATCH, validSettings} from '../domain/organizer.js';
import {mergeChat} from '../domain/importer.js';
import {parseConversationUrl} from '../domain/providers.js';
import {folderTree,folderDescendants} from '../domain/folders.js';
import {indexTerms,queryTerms,intersectPostings,posting,type SearchPosting} from '../domain/search.js';
import {bookmark,chain} from '../domain/knowledge.js';
import type {Bookmark,PromptChain} from '../domain/knowledge.js';
import {activeScope,dbNameForScope,LEGACY_SCOPE,requireProfile} from './profiles.js';
type StoreName = 'chats' | 'folders' | 'prompts' | 'meta' | 'queue' | 'search' | 'bookmarks' | 'chains';
const opening=new Map<string,Promise<IDBDatabase>>();
export function openDB(scopeId:string=activeScope()):Promise<IDBDatabase>{
  const dbName=dbNameForScope(scopeId);
  const existing=opening.get(dbName);
  if(existing)return existing;
  const task=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open(dbName,5);
    request.onupgradeneeded=(ev)=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('chats')){const s=db.createObjectStore('chats',{keyPath:'id'});s.createIndex('byUpdate','updatedAt');}
      if(!db.objectStoreNames.contains('folders')) db.createObjectStore('folders',{keyPath:'id'});
      if(!db.objectStoreNames.contains('prompts')) db.createObjectStore('prompts',{keyPath:'id'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'id'});
      if(!db.objectStoreNames.contains('queue')){const q=db.createObjectStore('queue',{keyPath:'id'});q.createIndex('byConversation','conversationId');}
      if(!db.objectStoreNames.contains('bookmarks')){
        const notes=db.createObjectStore('bookmarks',{keyPath:'id'});
        notes.createIndex('byChat','chatId');
      }
      if(!db.objectStoreNames.contains('chains'))db.createObjectStore('chains',{keyPath:'id'});
      if(!db.objectStoreNames.contains('search')){
        const search=db.createObjectStore('search',{keyPath:'id'});
        search.createIndex('byTerm','term');
        search.createIndex('byChat','chatId');
        const scan=request.transaction!.objectStore('chats').openCursor();
        scan.onsuccess=()=>{
          const row=scan.result;
          if(!row)return;
          for(const term of indexTerms(row.value as Chat))search.put(posting(String(row.key),term));
          row.continue();
        };
      }
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
  if(name==='bookmarks'){
    const b=bookmark(item as unknown as Bookmark);
    const saved=await one<Chat>('chats',b.chatId);
    if(!saved||saved.provider!==b.provider)throw Error('Nota não pertence à conversa do perfil atual.');
  }
  if(name==='chains')chain(item as unknown as PromptChain);
  if(name==='chats'&&activeScope()!==LEGACY_SCOPE){
    const p=await requireProfile(activeScope());
    if((item as unknown as Chat).provider!==p.provider)throw Error('Conversa pertence a outro provedor; selecione o perfil correto.');
  }
  const db=await openDB();const tx=db.transaction(name,'readwrite');const done=txDone(tx);tx.objectStore(name).put(item);await done;
}
export async function remove(name:StoreName,id:string):Promise<void>{
  const db=await openDB();
  const stores:StoreName[]=name==='chats'?['chats','search']:[name];
  const tx=db.transaction(stores,'readwrite');const done=txDone(tx);
  tx.objectStore(name).delete(id);
  if(name==='chats')dropIndex(tx,id);
  await done;
}
/** Indexa somente títulos e conteúdo efetivamente armazenado: nunca baixa histórico oculto. */
function indexOne(tx:IDBTransaction,chat:Chat):void{
  const store=tx.objectStore('search');
  const cursor=store.index('byChat').openCursor(IDBKeyRange.only(chat.id));
  cursor.onsuccess=()=>{
    const row=cursor.result;
    if(row){row.delete();row.continue();return;}
    for(const term of indexTerms(chat))store.put(posting(chat.id,term));
  };
}
function dropIndex(tx:IDBTransaction,chatId:string):void{
  const cursor=tx.objectStore('search').index('byChat').openCursor(IDBKeyRange.only(chatId));
  cursor.onsuccess=()=>{const row=cursor.result;if(row){row.delete();row.continue();}};
}
/** Busca por termos em índice persistente; resultados limitados e pagináveis por offset. */
export async function searchIndexed(query:string,offset=0,limit=100,scopeId:string=activeScope()):Promise<{results:Chat[];total:number}>{
  const terms=queryTerms(query);
  if(!terms.length)return {results:[],total:0};
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>200)throw Error('Paginação inválida.');
  const db=await openDB(scopeId);
  const tx=db.transaction('search','readonly');
  const store=tx.objectStore('search').index('byTerm');
  const grouped=await Promise.all(terms.map(async term=>(await requestValue<SearchPosting[]>(store.getAll(term))).map(p=>p.chatId)));
  const ids=intersectPostings(grouped);
  const chatStore=db.transaction('chats','readonly').objectStore('chats');
  const results=(await Promise.all(ids.map(id=>requestValue<Chat|undefined>(chatStore.get(id))))).filter((x):x is Chat=>!!x);
  results.sort((a,b)=>(b.updatedAt??b.importedAt)-(a.updatedAt??a.importedAt)||a.id.localeCompare(b.id));
  return {total:results.length,results:results.slice(offset,offset+limit)};
}
export async function importChats(rows:Chat[],onProgress?:(n:number)=>void,scopeId:string=activeScope()):Promise<number>{
  if(rows.length>100_000)throw Error('Importação muito grande.');
  if(scopeId!==LEGACY_SCOPE){
    const p=await requireProfile(scopeId);
    if(rows.some(row=>row.provider!==p.provider))throw Error('Importação contém outro provedor; selecione o perfil local correto.');
  }
  let count=0;
  // Lotes pequenos evitam transações longas. Organização existente tem precedência.
  const db=await openDB(scopeId);
  for(let start=0;start<rows.length;start+=100){
    const batch=rows.slice(start,start+100);
    const tx=db.transaction(['chats','search'],'readwrite');const done=txDone(tx);
    const store=tx.objectStore('chats');
    for(const incoming of batch){
      const req=store.get(incoming.id);
      req.onsuccess=()=>{
        const merged=mergeChat(req.result as Chat|undefined,incoming);
        store.put(merged);indexOne(tx,merged);
      };
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
/** Nova pasta validada em transação única. Pastas anteriores sem parentId são raízes. */
export async function createFolder(folder:Folder):Promise<void>{
  const db=await openDB();
  const tx=db.transaction('folders','readwrite');const done=txDone(tx);const store=tx.objectStore('folders');
  let issue:Error|undefined;
  const r=store.getAll();
  r.onsuccess=()=>{
    try{
      const others=r.result as Folder[];
      if(others.some(f=>f.id===folder.id))throw Error('Pasta já existe.');
      if(others.length>=1000)throw Error('Limite de 1000 pastas.');
      folderTree([...others,folder]);
      store.add(folder);
    }catch(e){issue=e instanceof Error?e:Error(String(e));tx.abort();}
  };
  try{await done;}catch(e){throw issue??e;}
}
export async function deleteFolder(id:string):Promise<void>{
  const folders=await all<Folder>('folders');
  if(folderDescendants(folders,id).size)throw Error('Remova ou mova as subpastas antes de excluir esta pasta.');
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
export async function replaceAll(chats:Chat[],folders:Folder[],prompts:Prompt[],queue:QueuedMessage[]=[],scopeId:string=activeScope(),bookmarks:Bookmark[]=[],chains:PromptChain[]=[]):Promise<void>{
  folderTree(folders);
  for(const b of bookmarks){bookmark(b);if(!chats.some(c=>c.id===b.chatId&&c.provider===b.provider))throw Error('Destaque referencia conversa ausente.');}
  for(const c of chains)chain(c);
  if(scopeId!==LEGACY_SCOPE){
    const p=await requireProfile(scopeId);
    if(chats.some(c=>c.provider!==p.provider)||queue.some(q=>q.provider!==p.provider))throw Error('Não é permitido misturar provedores no perfil local.');
  }
  const db=await openDB(scopeId);const tx=db.transaction(['chats','folders','prompts','meta','queue','search','bookmarks','chains'],'readwrite');const done=txDone(tx);
  const cs=tx.objectStore('chats'),fs=tx.objectStore('folders'),ps=tx.objectStore('prompts');
  cs.clear();fs.clear();ps.clear();tx.objectStore('meta').clear();tx.objectStore('queue').clear();tx.objectStore('search').clear();tx.objectStore('bookmarks').clear();tx.objectStore('chains').clear();
  const si=tx.objectStore('search');
  for(const c of chats){cs.put(c);for(const term of indexTerms(c))si.put(posting(c.id,term));}
  for(const f of folders)fs.put(f);
  for(const p of prompts)ps.put(p);
  for(const item of queue)tx.objectStore('queue').put(item);
  for(const item of bookmarks)tx.objectStore('bookmarks').put(item);
  for(const item of chains)tx.objectStore('chains').put(item);
  await done;
}
export async function clearAll():Promise<void>{await replaceAll([],[],[]);}
export async function counts():Promise<{total:number,archived:number,pinned:number}>{
  const chats=await all<Chat>('chats');return {total:chats.length,archived:chats.filter(c=>c.archived).length,pinned:chats.filter(c=>c.pinned).length};
}
export function planItemIds(plan:Plan):string[]{return plan.recommendations.map((r:Recommendation)=>r.id);}

/** Cópia não destrutiva dos registros legados. Exige banco de destino vazio. */
export async function copyLegacyToProfile(scopeId:string,provider:'chatgpt'|'gemini'):Promise<{chats:number;folders:number;prompts:number;queue:number}>{
  if(scopeId===LEGACY_SCOPE)throw Error('Escolha um perfil de destino.');
  await requireProfile(scopeId,provider);
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
  // Copia regras que referenciam as pastas migradas; desliga execução diária.
  const legacySettings=(await chrome.storage.local.get('iapro.settings.v1'))['iapro.settings.v1'];
  if(legacySettings!==undefined){
    const safe={...validSettings(legacySettings),autoRun:false};
    await chrome.storage.local.set({['iapro.settings.v1.'+scopeId]:safe});
  }
  return {chats:included.length,folders:folders.length,prompts:prompts.length,queue:selectedQueue.length};
}
