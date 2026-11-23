import {parseConversationUrl,providerFromPage} from '../domain/providers.js';
const ATTR='data-chat-maestro-link-v1';
/** Aplique somente a links já visíveis da sidebar; não percorre histórico oculto nem redes. */
export function enhanceVisibleSidebar(doc:Document,click:(href:string,title:string)=>void):void{
  const provider=providerFromPage(doc.location?.href??'');
  if(!provider)return;
  let count=0;
  for(const anchor of doc.querySelectorAll<HTMLAnchorElement>('nav a[href],aside a[href]')){
    if(++count>400)break;
    const ref=parseConversationUrl(anchor.href);
    if(!ref||ref.provider!==provider||anchor.getClientRects().length===0||anchor.closest('[aria-hidden="true"]'))continue;
    const row=anchor.parentElement;
    if(!row||row.matches('a,button'))continue;
    const existing=row.querySelector<HTMLButtonElement>(':scope > button[data-chat-maestro-action]');
    if(existing?.dataset.target===ref.url && anchor.getAttribute(ATTR)===ref.url)continue;
    // React pode reciclar a mesma âncora com outro href; remover controle antigo.
    if(existing)existing.remove();
    anchor.setAttribute(ATTR,ref.url);
    const b=doc.createElement('button');
    b.type='button';b.textContent='M';
    b.title='Adicionar referência ao Chat Maestro (somente local)';
    b.setAttribute('aria-label','Salvar conversa na biblioteca Chat Maestro');
    b.setAttribute('data-chat-maestro-action','');
    b.dataset.target=ref.url;
    b.style.cssText='display:inline-flex;align-items:center;justify-content:center;flex:0 0 23px;width:23px;height:23px;margin-inline:4px;border:1px solid #9b7890;border-radius:7px;background:transparent;color:#971d4d;font:700 11px system-ui;cursor:pointer;';
    b.addEventListener('click',event=>{
      event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
      click(ref.url,(anchor.textContent||anchor.title||'Conversa').trim().slice(0,250));
    });
    row.append(b);
  }
}
