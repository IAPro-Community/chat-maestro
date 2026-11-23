import {parseConversationUrl,providerFromPage,type ConversationRef,type AIProvider} from './providers.js';
export const INLINE_MESSAGE = 'chat-maestro:inline:v1';
export type InlineAction = 'status'|'save'|'favorite'|'manager';
export interface InlineRequest {type:typeof INLINE_MESSAGE;action:InlineAction;href:string;title?:string}
export interface InlineResult {ok:boolean;provider?:AIProvider;conversation?:string;accountVerified:false;saved?:boolean;pinned?:boolean;error?:string}
export function parseInlineRequest(value:unknown):InlineRequest|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const x=value as Record<string,unknown>;
  if(x.type!==INLINE_MESSAGE || !['status','save','favorite','manager'].includes(String(x.action))||typeof x.href!=='string'||x.href.length>2048)return null;
  if(x.title!==undefined && (typeof x.title!=='string'||x.title.length>250))return null;
  return {type:INLINE_MESSAGE,action:x.action as InlineAction,href:x.href,title:typeof x.title==='string'?x.title:undefined};
}
export function validateInlineContext(senderUrl:string,tabUrl:string,href:string):{provider:AIProvider;conversation:ConversationRef|null}|null{
  const senderProvider=providerFromPage(senderUrl),tabProvider=providerFromPage(tabUrl),hrefProvider=providerFromPage(href);
  if(!senderProvider || senderProvider!==tabProvider || hrefProvider!==senderProvider)return null;
  try{
    const a=new URL(senderUrl),b=new URL(tabUrl),c=new URL(href);
    // No permission to act across domains or cross-conversation after SPA navigation.
    if(a.origin!==b.origin || b.origin!==c.origin)return null;
    const active=parseConversationUrl(tabUrl),requested=parseConversationUrl(href);
    if(active?.id!==requested?.id || active?.provider!==requested?.provider)return null;
    if(!active && (a.pathname!==b.pathname || b.pathname!==c.pathname))return null;
    return {provider:senderProvider,conversation:active};
  }catch{return null;}
}
