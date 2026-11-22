import type {Chat,Folder,Prompt,Settings} from '../domain/types.js';
import {all} from '../platform/db.js';
import {loadSettings} from '../platform/settings.js';
export interface Context {chats:Chat[];folders:Folder[];prompts:Prompt[];settings:Settings;refresh:()=>Promise<void>}
export async function loadData(refresh:()=>Promise<void>):Promise<Context>{
  const [chats,folders,prompts,settings]=await Promise.all([all<Chat>('chats'),all<Folder>('folders'),all<Prompt>('prompts'),loadSettings()]);
  return {chats,folders,prompts,settings,refresh};
}
