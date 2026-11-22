import type {Chat} from './types.js';
import {PROVIDER_LABEL} from './providers.js';
export type ExportFormat = 'markdown' | 'text' | 'json';
function safeTitle(s:string):string {return s.replace(/[\r\n\t]+/g,' ').trim();}
export function serializeChats(chats:Chat[],format:ExportFormat):string {
  if(!chats.length)throw Error('Selecione ao menos uma conversa para exportar.');
  if(chats.length>100)throw Error('Limite de 100 conversas por exportação.');
  if(format==='json')return JSON.stringify(chats.map(c=>({provider:c.provider,title:c.title,url:c.url,updatedAt:c.updatedAt,messages:c.messages})),null,2);
  const md=format==='markdown';
  return chats.map(c=>{
    const title=safeTitle(c.title);
    const header=md?`# ${title}\n\n**Plataforma:** ${PROVIDER_LABEL[c.provider]}\n\n**Link:** ${c.url}`
      :`${title}\nPlataforma: ${PROVIDER_LABEL[c.provider]}\nLink: ${c.url}`;
    const messages=c.messages.length?c.messages.map(m=>{
      const role=m.role==='user'?'Usuário':'Assistente';
      return md?`## ${role}\n\n${m.text}`:`${role}:\n${m.text}`;
    }).join('\n\n'):'Conteúdo não importado. Somente o título e o link foram armazenados.';
    return `${header}\n\n${messages}`;
  }).join(md?'\n\n---\n\n':'\n\n================================\n\n');
}
