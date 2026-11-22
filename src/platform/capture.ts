import {parseSidebar,parseManualConversation, type SidebarItem} from '../domain/importer.js';
import {parseConversationUrl,providerFromPage,PROVIDER_LABEL} from '../domain/providers.js';
import {importChats} from './db.js';

/** Usa activeTab: nenhuma permissão permanente para ler os sites ou suas mensagens. */
async function activeTab():Promise<{id:number;url:string}> {
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id || !tab.url || !providerFromPage(tab.url))throw Error('Abra ChatGPT ou Gemini na aba ativa.');
  return {id:tab.id,url:tab.url};
}
export async function captureCurrentSidebar():Promise<{count:number;provider:string}> {
  const tab=await activeTab();
  const provider=providerFromPage(tab.url)!;
  const result=await chrome.scripting.executeScript<SidebarItem[]>({
    target:{tabId:tab.id},
    func:()=>{
      const rows:SidebarItem[]=[];
      const seen=new Set<string>();
      for(const link of document.querySelectorAll<HTMLAnchorElement>('nav a[href], aside a[href], a[href*="/app/"], a[href*="/c/"]')){
        try{
          const url=new URL(link.href,location.href);
          const gpt=(url.hostname==='chatgpt.com'||url.hostname==='chat.openai.com')&&url.pathname.startsWith('/c/');
          const gemini=url.hostname==='gemini.google.com'&&url.pathname.startsWith('/app/');
          const id=url.pathname.match(/^\/(?:app|c)\/([a-zA-Z0-9_-]{6,128})\/?$/)?.[1];
          if(!id || (!gpt&&!gemini) || seen.has(`${url.hostname}:${id}`))continue;
          const title=(link.getAttribute('aria-label')||link.textContent||'').trim().slice(0,250);
          if(!title)continue;
          seen.add(`${url.hostname}:${id}`);rows.push({id,title,url:url.origin+url.pathname});
        }catch { /* links não relevantes */ }
      }
      return rows.slice(0,2000);
    }
  });
  const rows=result[0]?.result??[];
  const validated=parseSidebar(rows).filter(r=>r.provider===provider);
  if(!validated.length)throw Error('Nenhuma conversa com link reconhecido. A estrutura da barra lateral pode ter mudado. Use “Salvar conversa aberta”.');
  await importChats(validated);
  return {count:validated.length,provider:PROVIDER_LABEL[provider]};
}
export async function captureOpenConversation():Promise<string>{
  const tab=await activeTab();
  const ref=parseConversationUrl(tab.url);
  if(!ref)throw Error('Abra uma conversa específica (não a página inicial) do ChatGPT ou Gemini.');
  const result=await chrome.scripting.executeScript<string>({
    target:{tabId:tab.id},
    func:()=>{
      const heading=document.querySelector<HTMLElement>('main h1, main h2, [aria-current="page"]');
      const raw=(heading?.textContent||document.title||'').trim();
      return raw.replace(/\s*[-|–]\s*(ChatGPT|Gemini).*$/i,'').slice(0,250);
    }
  });
  await importChats([parseManualConversation(ref.url,result[0]?.result||`${PROVIDER_LABEL[ref.provider]} · ${ref.nativeId}`)]);
  return PROVIDER_LABEL[ref.provider];
}
