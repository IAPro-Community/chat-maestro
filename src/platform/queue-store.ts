import {newQueueMessage,normalizeQueuedMessage,queueForConversation,reorderConversation,type QueuedMessage} from '../domain/queue.js';
import {openDB} from './db.js';

function requestResult<T>(r:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??Error('Falha ao ler fila'));});}
function done(tx:IDBTransaction):Promise<void>{return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??Error('Transação cancelada'));tx.onerror=()=>reject(tx.error??Error('Falha ao gravar fila'));});}

export async function queued():Promise<QueuedMessage[]>{
  const db=await openDB();const rows=await requestResult<unknown[]>(db.transaction('queue','readonly').objectStore('queue').getAll());
  return rows.map(normalizeQueuedMessage);
}

async function withQueue<T>(change:(rows:QueuedMessage[])=>{next:QueuedMessage[];result:T}):Promise<T>{
  const db=await openDB();const tx=db.transaction('queue','readwrite');const completion=done(tx);const store=tx.objectStore('queue');
  let result!:T;let failure:Error|undefined;
  const req=store.getAll();req.onsuccess=()=>{
    try{
      const old=(req.result as unknown[]).map(normalizeQueuedMessage);
      const outcome=change(old);
      result=outcome.result;
      const before=new Map(old.map(row=>[row.id,JSON.stringify(row)]));
      const after=new Map(outcome.next.map(row=>[row.id,normalizeQueuedMessage(row)]));
      if(after.size!==outcome.next.length)throw Error('IDs de fila duplicados.');
      for(const row of old)if(!after.has(row.id))store.delete(row.id);
      for(const [id,row] of after)if(before.get(id)!==JSON.stringify(row))store.put(row);
    }catch(err){failure=err instanceof Error?err:Error(String(err));tx.abort();}
  };
  try{await completion;}catch(err){throw failure??err;}return result;
}
export function addQueuedMessage(url:string,body:string):Promise<QueuedMessage>{
  return withQueue(rows=>{const entry=newQueueMessage(url,body,rows,crypto.randomUUID());return {next:[...rows,entry],result:entry};});
}
export function updateQueuedMessage(id:string,body:string):Promise<void>{
  return withQueue(rows=>{
    const item=rows.find(x=>x.id===id);if(!item)throw Error('Mensagem não encontrada.');
    const next=rows.map(x=>x.id===id?normalizeQueuedMessage({...x,body,status:'pending'}):x);
    return {next,result:undefined};
  });
}
export function deleteQueuedMessage(id:string):Promise<void>{
  return withQueue(rows=>{if(!rows.some(x=>x.id===id))throw Error('Mensagem não encontrada.');return {next:rows.filter(x=>x.id!==id),result:undefined};});
}
export function moveQueuedMessage(url:string,id:string,direction:'up'|'down'):Promise<void>{
  return withQueue(rows=>{
    const ordered=reorderConversation(rows,url,id,direction);
    const changes=new Map(ordered.map(x=>[x.id,x]));
    return {next:rows.map(x=>changes.get(x.id)??x),result:undefined};
  });
}
export function changeQueueStatus(id:string,expected:'pending'|'prepared',next:'pending'|'prepared'):Promise<void>{
  return withQueue(rows=>{
    const item=rows.find(x=>x.id===id);if(!item || item.status!==expected)throw Error('A mensagem mudou de estado; atualize a fila.');
    // Apenas o primeiro item da conversa pode ser preparado, preservando FIFO.
    const first=queueForConversation(rows,item.conversationUrl)[0];
    if(next==='prepared' && first?.id!==id)throw Error('Confirme a primeira mensagem antes de preparar a próxima.');
    return {next:rows.map(x=>x.id===id?{...x,status:next}:x),result:undefined};
  });
}
