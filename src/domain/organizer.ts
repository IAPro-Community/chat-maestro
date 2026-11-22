import type {Chat, Folder, Plan, Recommendation, Settings} from './types.js';
export const DAY = 86_400_000;
export const MAX_BATCH = 100;
export const DEFAULT_SETTINGS: Settings = {
  schema: 1, autoRun: false, inactivityDays: 180, keepRecent: 20, protectFiled: true, rules: []
};
export function validSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Preferências inválidas');
  const s = value as Partial<Settings>;
  if (s.schema !== 1 || typeof s.autoRun !== 'boolean' || !Number.isInteger(s.inactivityDays) ||
      (s.inactivityDays ?? 0) < 30 || (s.inactivityDays ?? 0) > 3650 || !Number.isInteger(s.keepRecent) ||
      (s.keepRecent ?? -1) < 0 || (s.keepRecent ?? 10001) > 1000 || typeof s.protectFiled !== 'boolean' || !Array.isArray(s.rules) || s.rules.length > 100) throw Error('Preferências inválidas');
  for (const r of s.rules) {
    if (!r || typeof r.id !== 'string' || typeof r.folderId !== 'string' || typeof r.enabled !== 'boolean' || !Array.isArray(r.keywords) || r.keywords.length < 1 || r.keywords.length > 20 || r.keywords.some(k => typeof k !== 'string' || k.length < 2 || k.length > 60)) throw Error('Regra inválida');
  }
  return s as Settings;
}
function matchKeyword(title: string, keyword: string): boolean {
  const escaped = keyword.normalize('NFKC').trim().toLocaleLowerCase('pt-BR').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  const text = title.normalize('NFKC').toLocaleLowerCase('pt-BR');
  // Limite de palavra, evita detectar "ia" dentro de "diagrama".
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'u').test(text);
}
export function makePlan(chats: Chat[], folders: Folder[], settings: Settings, now = Date.now()): Plan {
  validSettings(settings);
  const sorted = [...chats].sort((a,b) => (b.updatedAt ?? b.importedAt) - (a.updatedAt ?? a.importedAt) || a.id.localeCompare(b.id));
  const recent = new Set(sorted.slice(0, settings.keepRecent).map(c => c.id));
  const folderIds = new Set(folders.map(f => f.id));
  const result: Recommendation[] = [];
  let unknownDates = 0;
  for (const chat of sorted) {
    if (chat.archived || chat.pinned || chat.protected) continue;
    if (!chat.verifiedAt || chat.updatedAt === null) unknownDates++;
    const rule = chat.folderId === null ? settings.rules.find(r => r.enabled && folderIds.has(r.folderId) && r.keywords.some(k => matchKeyword(chat.title,k))) : undefined;
    if (rule) {
      result.push({id: chat.id, title: chat.title, action:'file', reason:`Regra de título: ${rule.keywords.join(', ')}`, folderId:rule.folderId, expectedEditedAt:chat.editedAt, expectedFolderId:chat.folderId, expectedArchived:chat.archived});
      continue;
    }
    if (recent.has(chat.id) || (settings.protectFiled && chat.folderId !== null) || !chat.verifiedAt || !chat.updatedAt || chat.updatedAt > now - settings.inactivityDays * DAY || chat.updatedAt > now) continue;
    result.push({id: chat.id, title: chat.title, action:'archive', reason:`Sem atividade há pelo menos ${settings.inactivityDays} dias`, folderId:null, expectedEditedAt:chat.editedAt, expectedFolderId:chat.folderId, expectedArchived:chat.archived});
  }
  return {recommendations: result.slice(0,MAX_BATCH), totalCandidates:result.length, unknownDates,evaluatedAt:now};
}
export function applyToChat(chat: Chat, action: Recommendation, editedAt = Date.now()): Chat {
  if (chat.id !== action.id || chat.editedAt !== action.expectedEditedAt || chat.folderId !== action.expectedFolderId || chat.archived !== action.expectedArchived || chat.pinned || chat.protected) throw Error('A prévia expirou. Atualize antes de aplicar.');
  return {...chat, archived:action.action === 'archive' ? true : chat.archived, folderId:action.action === 'file' ? action.folderId : chat.folderId, editedAt};
}
export function normalizeRuleWords(raw: string): string[] {
  const words = [...new Set(raw.split(',').map(w=>w.normalize('NFKC').trim().toLocaleLowerCase('pt-BR')).filter(Boolean))];
  if (words.length < 1 || words.length > 20 || words.some(w=>w.length < 2 || w.length > 60)) throw Error('Use de 1 a 20 palavras-chave com 2 a 60 caracteres.');
  return words;
}
