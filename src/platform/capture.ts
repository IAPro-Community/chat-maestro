import {parseSidebar,parseManualConversation, type SidebarItem} from '../domain/importer.js';
import {parseConversationUrl,PROVIDER_LABEL} from '../domain/providers.js';
import {getActiveAiTab,captureAccessError} from './site-access.js';
import {importChats} from './db.js';
import {requireSelectedProfile} from './profiles.js';
import {isCurrentInlineTab} from './inline-guard.js';

export async function captureCurrentSidebar():Promise<{count:number;provider:string}> {
  const tab=await getActiveAiTab();
  const provider=tab.provider;
  await requireSelectedProfile(provider);
  const result=await chrome.scripting.executeScript<SidebarItem[]>({
    target:{tabId:tab.id},
    func:()=>{
      const rows:SidebarItem[]=[];
      const seen=new Set<string>();
      for(const link of document.querySelectorAll<HTMLAnchorElement>('nav a[href], aside a[href], a[href*="/app/"], a[href*="/c/"]')){
        try{
          const url=new URL(link.href,location.href);
          const gpt=(url.hostname==='chatgpt.com'||url.hostname==='chat.openai.com')&&(url.pathname.startsWith('/c/')||/^\/g\/[a-zA-Z0-9_-]{6,256}\/c\//.test(url.pathname));
          const gemini=url.hostname==='gemini.google.com'&&url.pathname.startsWith('/app/');
          const id=(url.pathname.match(/^\/(?:app|c)\/([a-zA-Z0-9_-]{6,128})\/?$/)||url.pathname.match(/^\/g\/[a-zA-Z0-9_-]{6,256}\/c\/([a-zA-Z0-9_-]{6,128})\/?$/))?.[1];
          if(!id || (!gpt&&!gemini) || seen.has(`${url.hostname}:${id}`))continue;
          const title=(link.getAttribute('aria-label')||link.textContent||'').trim().slice(0,250);
          if(!title)continue;
          seen.add(`${url.hostname}:${id}`);rows.push({id,title,url:url.origin+url.pathname});
        }catch { /* links não relevantes */ }
      }
      return rows.slice(0,2000);
    }
  }).catch(error=>{throw captureAccessError(error,provider);});
  const rows=result[0]?.result??[];
  const validated=parseSidebar(rows).filter(r=>r.provider===provider);
  if(!validated.length)throw Error('Nenhuma conversa com link reconhecido. A estrutura da barra lateral pode ter mudado. Use “Salvar conversa aberta”.');
  if(!await isCurrentInlineTab(tab.url,tab.id,tab.url))throw Error('A aba mudou durante a captura. Tente novamente.');
  await requireSelectedProfile(provider);
  await importChats(validated);
  return {count:validated.length,provider:PROVIDER_LABEL[provider]};
}
export async function captureOpenConversation():Promise<string>{
  const tab=await getActiveAiTab();
  const ref=parseConversationUrl(tab.url);
  await requireSelectedProfile(tab.provider);
  if(!ref)throw Error('O site está aberto, mas esta não é uma conversa identificável. Abra uma conversa específica pelo histórico do ChatGPT ou Gemini antes de salvá-la.');
  const result=await chrome.scripting.executeScript<string>({
    target:{tabId:tab.id},
    func:()=>{
      const heading=document.querySelector<HTMLElement>('main h1, main h2, [aria-current="page"]');
      const raw=(heading?.textContent||document.title||'').trim();
      return raw.replace(/\s*[-|–]\s*(ChatGPT|Gemini).*$/i,'').slice(0,250);
    }
  }).catch(error=>{throw captureAccessError(error,ref.provider);});
  if(!await isCurrentInlineTab(tab.url,tab.id,tab.url))throw Error('A aba mudou durante a captura. Tente novamente.');
  await requireSelectedProfile(ref.provider);
  await importChats([parseManualConversation(ref.url,result[0]?.result||`${PROVIDER_LABEL[ref.provider]} · ${ref.nativeId}`)]);
  return PROVIDER_LABEL[ref.provider];
}
