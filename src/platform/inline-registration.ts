import {SITE_ORIGINS,hasSiteAccess} from './site-access.js';
import type {AIProvider} from '../domain/providers.js';
const IDS:Readonly<Record<AIProvider,string>>={chatgpt:'chat-maestro-chatgpt-v1',gemini:'chat-maestro-gemini-v1'};
export async function reconcileInlineScripts():Promise<void>{
  const active=new Set((await chrome.scripting.getRegisteredContentScripts()).map(s=>s.id));
  for(const provider of ['chatgpt','gemini'] as const){
    const id=IDS[provider],granted=await hasSiteAccess(provider);
    if(!granted && active.has(id))await chrome.scripting.unregisterContentScripts({ids:[id]});
    if(granted && !active.has(id)){
      await chrome.scripting.registerContentScripts([{id,matches:[...SITE_ORIGINS[provider]],js:['content/inpage.js'],runAt:'document_idle',allFrames:false,persistAcrossSessions:true}]);
    }
  }
}
