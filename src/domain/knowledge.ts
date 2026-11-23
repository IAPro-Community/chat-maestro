import type {AIProvider} from './providers.js';
export interface Bookmark {
  id:string;chatId:string;provider:AIProvider;quote:string;note:string;
  messageIndex?:number;createdAt:number;
}
export interface PromptChain {
  id:string;name:string;steps:string[];cursor:number;paused:boolean;createdAt:number;updatedAt:number;
}
export function bookmark(input:Bookmark):Bookmark{
  if(!/^[a-zA-Z0-9-]{8,80}$/.test(input.id)||!input.chatId||!['chatgpt','gemini'].includes(input.provider)||
    typeof input.quote!=='string'||input.quote.length>3000||
    typeof input.note!=='string'||input.note.length>4000||
    (!input.quote.trim()&&!input.note.trim())||!Number.isSafeInteger(input.createdAt)||input.createdAt<1||
    (input.messageIndex!==undefined&&(!Number.isSafeInteger(input.messageIndex)||input.messageIndex<0||input.messageIndex>1500)))
    throw Error('Nota ou destaque inválido.');
  return input;
}
export function chain(input:PromptChain):PromptChain{
  if(!/^[a-zA-Z0-9-]{8,80}$/.test(input.id)||!input.name.trim()||input.name.length>100||
    !Array.isArray(input.steps)||input.steps.length<1||input.steps.length>30||
    input.steps.some(x=>typeof x!=='string'||!x.trim()||x.length>20000)||
    !Number.isSafeInteger(input.cursor)||input.cursor<0||input.cursor>input.steps.length||
    typeof input.paused!=='boolean'||!Number.isSafeInteger(input.createdAt)||!Number.isSafeInteger(input.updatedAt))
    throw Error('Sequência de prompts inválida.');
  return input;
}
export function advanceChain(value:PromptChain):PromptChain{
  chain(value);
  if(value.paused)throw Error('Retome a sequência antes de avançar.');
  if(value.cursor===value.steps.length)throw Error('Sequência concluída.');
  return {...value,cursor:value.cursor+1,updatedAt:Math.max(Date.now(),value.updatedAt+1)};
}
export function resetChain(value:PromptChain):PromptChain{
  return chain({...value,cursor:0,paused:false,updatedAt:Math.max(Date.now(),value.updatedAt+1)});
}
