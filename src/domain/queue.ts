import {parseConversationUrl} from './providers.js';

/** A fila pertence a UMA conversa, não só ao provedor. Nunca deduzir o destino pelo título. */
export interface QueuedMessage {
  id: string;
  conversationId: string;
  provider: 'chatgpt' | 'gemini';
  conversationUrl: string;
  body: string;
  createdAt: number;
  position: number;
  status: 'pending' | 'prepared';
}
export const MAX_QUEUE_PER_CHAT = 30;
export const MAX_QUEUE_TOTAL = 300;
export const MAX_MESSAGE_LENGTH = 20_000;

export function normalizeQueuedMessage(value:unknown):QueuedMessage{
  if(!value || typeof value !== 'object')throw Error('Mensagem da fila inválida.');
  const input=value as Record<string,unknown>;
  const ref=typeof input.conversationUrl==='string'?parseConversationUrl(input.conversationUrl):null;
  if(!ref || input.conversationId!==ref.id || input.provider!==ref.provider)throw Error('O destino da mensagem não corresponde à conversa.');
  if(typeof input.id!=='string' || !/^[a-zA-Z0-9-]{8,80}$/.test(input.id))throw Error('Identificador de mensagem inválido.');
  if(typeof input.body!=='string' || !input.body.trim() || input.body.length>MAX_MESSAGE_LENGTH)throw Error('Mensagem vazia ou extensa demais.');
  if(!Number.isSafeInteger(input.createdAt) || Number(input.createdAt)<1 || !Number.isSafeInteger(input.position) || Number(input.position)<0)throw Error('Ordenação ou data inválida.');
  if(input.status!=='pending' && input.status!=='prepared')throw Error('Estado de fila inválido.');
  return {id:input.id,conversationId:ref.id,provider:ref.provider,conversationUrl:ref.url,body:input.body.trim(),createdAt:Number(input.createdAt),position:Number(input.position),status:input.status};
}
export function queueForConversation(items:QueuedMessage[],url:string):QueuedMessage[]{
  const ref=parseConversationUrl(url);
  if(!ref)throw Error('Abra uma conversa válida do ChatGPT ou Gemini.');
  return items.filter(m=>m.conversationId===ref.id && m.provider===ref.provider)
    .sort((a,b)=>a.position-b.position || a.createdAt-b.createdAt || a.id.localeCompare(b.id));
}
export function newQueueMessage(url:string,body:string,others:QueuedMessage[],id:string,now=Date.now()):QueuedMessage{
  const ref=parseConversationUrl(url);
  if(!ref)throw Error('Informe a URL de uma conversa válida.');
  if(!body.trim() || body.length>MAX_MESSAGE_LENGTH)throw Error('Mensagem vazia ou com mais de 20.000 caracteres.');
  if(others.length>=MAX_QUEUE_TOTAL)throw Error('Limite total de 300 mensagens atingido.');
  const same=queueForConversation(others,ref.url);
  if(same.length>=MAX_QUEUE_PER_CHAT)throw Error('Limite de 30 mensagens por conversa atingido.');
  return normalizeQueuedMessage({id,conversationId:ref.id,provider:ref.provider,conversationUrl:ref.url,body,createdAt:now,position:Math.max(-1,...same.map(m=>m.position))+1,status:'pending'});
}
export function reorderConversation(items:QueuedMessage[],url:string,id:string,direction:'up'|'down'):QueuedMessage[]{
  const ordered=queueForConversation(items,url);
  const at=ordered.findIndex(m=>m.id===id);
  if(at<0)throw Error('Mensagem não pertence à conversa selecionada.');
  const target=at+(direction==='up'?-1:1);
  if(target<0 || target>=ordered.length)return ordered;
  const [first,second]=[ordered[at]!,ordered[target]!];
  return ordered.map(m=>m.id===first.id?{...m,position:second.position}:m.id===second.id?{...m,position:first.position}:m);
}
export function nextPending(items:QueuedMessage[],url:string):QueuedMessage|undefined{
  // Não pular mensagens já preparadas: o usuário deve confirmar o envio antes de avançar.
  const first=queueForConversation(items,url)[0];
  return first?.status==='pending'?first:undefined;
}
