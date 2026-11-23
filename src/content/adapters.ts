import {providerFromPage,type AIProvider} from '../domain/providers.js';
export interface PageAdapter {
  provider:AIProvider;
  title: (doc:Document)=>string;
}
/** Fallbacks visíveis no DOM. Não ler cookies, armazenamento da página ou rede. */
const chatGPT:PageAdapter={
  provider:'chatgpt',
  title:doc=>getTitle(doc,[
    '[data-testid="conversation-header"] h1',
    'nav a[aria-current="page"]',
    'main h1','main h2'
  ],'ChatGPT')
};
const gemini:PageAdapter={
  provider:'gemini',
  title:doc=>getTitle(doc,[
    'nav a[aria-current="page"]',
    'main h1','main h2',
    '[data-selected="true"] [title]'
  ],'Gemini')
};
export function getTitle(doc:Document,selectors:readonly string[],suffix:string):string{
  for(const selector of selectors){
    const text=doc.querySelector(selector)?.textContent?.trim();
    if(text && text.length<251)return text;
  }
  return (doc.title||'').replace(new RegExp('\\s*[-–|]\\s*'+suffix+'.*$','i'),'').trim().slice(0,250)||'Conversa sem título';
}
export function resolvePageAdapter(url:string):PageAdapter|null{
  const provider=providerFromPage(url);
  return provider==='chatgpt'?chatGPT:provider==='gemini'?gemini:null;
}
