import type {Chat, Message} from './types.js';
import {parseConversationUrl} from './providers.js';
interface Raw { [key:string]:unknown }
const obj = (v:unknown): Raw | null => v!==null && typeof v==='object' && !Array.isArray(v) ? v as Raw : null;
export function timestamp(raw:unknown, now=Date.now()): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null;
  const ms = raw < 100_000_000_000 ? Math.round(raw*1000):Math.round(raw);
  return ms >= Date.UTC(2015,0,1) && ms <= now + 86_400_000 && Number.isSafeInteger(ms) ? ms : null;
}
function branch(record: Raw): Message[] {
  const mapping = obj(record.mapping);
  const cursor = record.current_node;
  if (!mapping || typeof cursor!=='string') return [];
  const seen = new Set<string>();
  const selected:Raw[] = [];
  let id: string | null = cursor;
  while (id && !seen.has(id) && selected.length < 2000) {
    seen.add(id);
    const node: Raw | null = obj(mapping[id]); if (!node) break;
    selected.push(node);
    id = typeof node.parent === 'string' ? node.parent : null;
  }
  const messages:Message[]=[];
  let chars=0;
  for (const node of selected.reverse()) {
    const msg = obj(node.message); const author = obj(msg?.author);
    if (!msg || (author?.role!=='user'&&author?.role!=='assistant')) continue;
    const content = obj(msg.content);
    const parts = content && Array.isArray(content.parts) ? content.parts.filter((p):p is string=>typeof p==='string') : [];
    const text = (typeof content?.text==='string'?content.text:parts.join('\n')).trim();
    if (!text || chars+text.length > 800_000 || messages.length >= 1500) break;
    chars += text.length;
    messages.push({role:author.role as 'user'|'assistant',text});
  }
  return messages;
}
export function parseExport(value:unknown, now=Date.now()): {items:Chat[]; skipped:number} {
  if (!Array.isArray(value)) throw Error('Selecione o arquivo conversations.json da exportação do ChatGPT.');
  if (value.length > 100_000) throw Error('Exportação excede o limite de 100 mil conversas.');
  const items:Chat[]=[];
  let skipped=0;
  const ids=new Set<string>();
  for (const raw of value) {
    const entry=obj(raw);
    if (!entry || typeof entry.id!=='string' || !/^[\w-]{6,128}$/.test(entry.id) || ids.has(entry.id)) {skipped++;continue;}
    ids.add(entry.id);
    const time=timestamp(entry.update_time,now);
    const created=timestamp(entry.create_time,now);
    const updatedAt=time ?? created;
    const title=typeof entry.title==='string' ? entry.title.trim().slice(0,250) : '';
    items.push({id:entry.id,provider:'chatgpt',title:title||'Sem título',url:`https://chatgpt.com/c/${entry.id}`,source:'import',updatedAt,verifiedAt:time!==null,importedAt:now,folderId:null,pinned:false,archived:false,protected:false,messages:branch(entry),editedAt:0});
  }
  return {items,skipped};
}
export function mergeChat(existing:Chat|undefined, incoming:Chat):Chat {
  if (!existing) return incoming;
  // Organização local é de propriedade do usuário; nunca a sobrescreva no reimport.
  return {...existing,provider:incoming.provider,title:incoming.title || existing.title,source:incoming.source==='import'?'import':existing.source,
    updatedAt: incoming.verifiedAt ? incoming.updatedAt : existing.updatedAt,
    verifiedAt: incoming.verifiedAt || existing.verifiedAt,
    messages: incoming.messages.length ? incoming.messages : existing.messages};
}
export interface SidebarItem {id:string;title:string;url:string}
export function parseSidebar(items:SidebarItem[],now=Date.now()):Chat[]{
  const output:Chat[]=[];
  const seen=new Set<string>();
  for(const row of items){
    const ref=parseConversationUrl(row.url);
    if(!ref || row.id!==ref.nativeId || seen.has(ref.id))continue;
    seen.add(ref.id);
    output.push({id:ref.id,provider:ref.provider,title:row.title.trim().slice(0,250)||'Sem título',url:ref.url,source:'sidebar',
      updatedAt:null,verifiedAt:false,importedAt:now,folderId:null,pinned:false,archived:false,protected:false,messages:[],editedAt:0});
  }
  return output;
}
export function parseManualConversation(url:string,title:string,now=Date.now()):Chat {
  const ref=parseConversationUrl(url);
  if(!ref)throw Error('Abra uma conversa específica no ChatGPT ou no Gemini.');
  return {id:ref.id,provider:ref.provider,title:title.trim().slice(0,250)||'Sem título',url:ref.url,source:'manual',
    updatedAt:null,verifiedAt:false,importedAt:now,folderId:null,pinned:false,archived:false,protected:false,messages:[],editedAt:0};
}
