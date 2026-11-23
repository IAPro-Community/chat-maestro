import type {Chat,Folder,Prompt,Settings} from '../domain/types.js';
import type {Bookmark} from '../domain/knowledge.js';
import {all} from '../platform/db.js';
import {loadSettings} from '../platform/settings.js';
export interface Context {chats:Chat[];folders:Folder[];prompts:Prompt[];bookmarks:Bookmark[];settings:Settings;refresh:()=>Promise<void>}
export async function loadData(refresh:()=>Promise<void>):Promise<Context>{
  const [chats,folders,prompts,bookmarks,settings]=await Promise.all([all<Chat>('chats'),all<Folder>('folders'),all<Prompt>('prompts'),all<Bookmark>('bookmarks'),loadSettings()]);
  return {chats,folders,prompts,bookmarks,settings,refresh};
}
