import {providerFromPage,PROVIDER_LABEL,type AIProvider} from '../domain/providers.js';
/** Side panels não recebem activeTab por cliques internos: autorização explícita por domínio. */
export const SITE_ORIGINS:Readonly<Record<AIProvider,readonly string[]>>={
  chatgpt:['https://chatgpt.com/*','https://chat.openai.com/*'],
  gemini:['https://gemini.google.com/*']
};
export async function hasSiteAccess(provider:AIProvider):Promise<boolean>{
  return chrome.permissions.contains({origins:[...SITE_ORIGINS[provider]]});
}
/** Chamar diretamente no handler de clique para preservar o gesto do usuário. */
export function requestSiteAccess(provider:AIProvider):Promise<boolean>{
  return chrome.permissions.request({origins:[...SITE_ORIGINS[provider]]});
}
export interface ActiveAiTab {id:number;url:string;provider:AIProvider}
export async function getActiveAiTab():Promise<ActiveAiTab>{
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  if(!tab?.id)throw Error('Não foi possível identificar a aba ativa. Selecione uma aba do ChatGPT ou Gemini e tente novamente.');
  if(!tab.url)throw Error('O Chrome não autorizou a leitura da URL desta aba. Em Dados, clique em Conectar ChatGPT ou Conectar Gemini para conceder acesso.');
  const provider=providerFromPage(tab.url);
  if(!provider)throw Error('A aba selecionada não é ChatGPT nem Gemini. Abra o site desejado nesta janela e tente novamente.');
  if(!await hasSiteAccess(provider))throw Error('O Chat Maestro ainda não tem acesso ao '+PROVIDER_LABEL[provider]+'. Em Dados, clique em Conectar '+PROVIDER_LABEL[provider]+'.');
  return {id:tab.id,url:tab.url,provider};
}
export function captureAccessError(error:unknown,provider:AIProvider):Error{
  const message=error instanceof Error?error.message:String(error);
  if(/Cannot access contents|Cannot access a chrome|not allowed|missing host permission|permission/i.test(message)){
    return new Error('Acesso ao '+PROVIDER_LABEL[provider]+' bloqueado pelo Chrome. Confira a permissão do site em chrome://extensions → Chat Maestro → Detalhes → Acesso ao site.');
  }
  return new Error('Não foi possível ler a página do '+PROVIDER_LABEL[provider]+': '+message);
}
