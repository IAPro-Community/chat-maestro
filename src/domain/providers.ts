/** Contratos estáveis: a UI dos provedores é instável; URLs de conversa são validadas antes de persistir. */
export type AIProvider = 'chatgpt' | 'gemini';
export const PROVIDER_LABEL: Record<AIProvider,string> = {chatgpt:'ChatGPT',gemini:'Gemini'};
const ID = /^[a-zA-Z0-9_-]{6,128}$/;
export interface ConversationRef {provider:AIProvider;nativeId:string;id:string;url:string}
export function parseConversationUrl(input:string):ConversationRef|null {
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const match = u.pathname.match(/^\/(c|app)\/([a-zA-Z0-9_-]{6,128})\/?$/);
    if (!match || !match[2] || !ID.test(match[2])) return null;
    if ((u.hostname === 'chatgpt.com' || u.hostname === 'chat.openai.com') && match[1]==='c') {
      return {provider:'chatgpt',nativeId:match[2],id:match[2],url:`https://chatgpt.com/c/${match[2]}`};
    }
    if (u.hostname === 'gemini.google.com' && match[1]==='app') {
      return {provider:'gemini',nativeId:match[2],id:`gemini:${match[2]}`,url:`https://gemini.google.com/app/${match[2]}`};
    }
  } catch { /* entrada externa */ }
  return null;
}
export function providerFromPage(url:string):AIProvider|null {
  try {
    const u=new URL(url);
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    if(u.hostname==='chatgpt.com'||u.hostname==='chat.openai.com')return 'chatgpt';
    if(u.hostname==='gemini.google.com')return 'gemini';
  }catch { /* ignorar */ }
  return null;
}
