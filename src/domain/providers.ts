/** Contratos estáveis: a UI dos provedores é instável; URLs de conversa são validadas antes de persistir. */
export type AIProvider = 'chatgpt' | 'gemini';
export const PROVIDER_LABEL: Record<AIProvider,string> = {chatgpt:'ChatGPT',gemini:'Gemini'};
const ID = /^[a-zA-Z0-9_-]{6,128}$/;
export interface ConversationRef {provider:AIProvider;nativeId:string;id:string;url:string}
export function parseConversationUrl(input:string):ConversationRef|null {
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const simple=u.pathname.match(/^\/(c|app)\/([a-zA-Z0-9_-]{6,128})\/?$/);
    const project=u.pathname.match(/^\/g\/([a-zA-Z0-9_-]{6,256})\/c\/([a-zA-Z0-9_-]{6,128})\/?$/);
    if ((u.hostname==='chatgpt.com'||u.hostname==='chat.openai.com') && project && ID.test(project[2]!)){
      return {provider:'chatgpt',nativeId:project[2]!,id:project[2]!,url:`https://chatgpt.com/g/${project[1]}/c/${project[2]}`};
    }
    if(simple && simple[2] && ID.test(simple[2]) && (u.hostname==='chatgpt.com'||u.hostname==='chat.openai.com') && simple[1]==='c'){
      return {provider:'chatgpt',nativeId:simple[2],id:simple[2],url:`https://chatgpt.com/c/${simple[2]}`};
    }
    if(simple && simple[2] && ID.test(simple[2]) && u.hostname==='gemini.google.com' && simple[1]==='app'){
      return {provider:'gemini',nativeId:simple[2],id:`gemini:${simple[2]}`,url:`https://gemini.google.com/app/${simple[2]}`};
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
