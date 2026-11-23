import type {PromptChain} from '../domain/knowledge.js';
import {chain,advanceChain,resetChain} from '../domain/knowledge.js';
import {all,one,put,remove} from './db.js';
export async function listChains():Promise<PromptChain[]>{return all<PromptChain>('chains');}
export async function createChain(name:string,steps:string[]):Promise<PromptChain>{
  if((await listChains()).length>=200)throw Error('Limite de 200 sequências.');
  const now=Date.now();
  const item=chain({id:crypto.randomUUID(),name:name.trim(),steps:steps.map(x=>x.trim()),cursor:0,paused:false,createdAt:now,updatedAt:now});
  await put('chains',item);return item;
}
export async function moveChain(id:string,action:'advance'|'reset'|'pause'|'resume'):Promise<PromptChain>{
  const existing=await one<PromptChain>('chains',id);if(!existing)throw Error('Sequência não encontrada.');
  const next=action==='advance'?advanceChain(existing):action==='reset'?resetChain(existing):chain({...existing,paused:action==='pause',updatedAt:Date.now()});
  await put('chains',next);return next;
}
export async function deleteChain(id:string):Promise<void>{await remove('chains',id);}
