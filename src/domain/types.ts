import type {AIProvider} from './providers.js';
import type {QueuedMessage} from './queue.js';
export type ChatSource = 'import' | 'sidebar' | 'manual';
export interface Message { role: 'user' | 'assistant'; text: string }
export interface Chat {
  id: string;
  provider: AIProvider;
  title: string;
  url: string;
  source: ChatSource;
  updatedAt: number | null;
  verifiedAt: boolean;
  importedAt: number;
  folderId: string | null;
  pinned: boolean;
  archived: boolean;
  protected: boolean;
  messages: Message[];
  editedAt: number;
}
export interface Folder { id: string; name: string; color: string }
export interface Prompt { id: string; name: string; content: string; createdAt: number }
export interface Rule { id: string; keywords: string[]; folderId: string; enabled: boolean }
export interface Settings {
  schema: 1;
  autoRun: boolean;
  inactivityDays: number;
  keepRecent: number;
  protectFiled: boolean;
  rules: Rule[];
}
export interface Recommendation {
  id: string;
  title: string;
  action: 'archive' | 'file';
  reason: string;
  folderId: string | null;
  expectedEditedAt: number;
  expectedFolderId: string | null;
  expectedArchived: boolean;
}
export interface Plan {
  recommendations: Recommendation[];
  unknownDates: number;
  totalCandidates: number;
  evaluatedAt: number;
}
export interface UndoRecord { id: string; before: {archived: boolean; folderId: string | null}; afterEditedAt: number }
export interface Backup { kind: 'iapro-optimizer'; version: 3; exportedAt: string; localScope?: {id:string;provider:AIProvider|null;label:string}; chats: Chat[]; folders: Folder[]; prompts: Prompt[]; queue: QueuedMessage[]; settings: Settings }
