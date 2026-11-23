import type {Bookmark} from '../domain/knowledge.js';
import {bookmark} from '../domain/knowledge.js';
import type {Chat} from '../domain/types.js';
import {all,one,put,remove} from './db.js';
export async function bookmarksForChat(chatId:string):Promise<Bookmark[]>{
  return (await all<Bookmark>('bookmarks')).filter(x=>x.chatId===chatId).sort((a,b)=>b.createdAt-a.createdAt);
}
export async function saveBookmark(chatId:string,quote:string,note:string,messageIndex?:number):Promise<Bookmark>{
  const chat=await one<Chat>('chats',chatId);
  if(!chat)throw Error('Salve a conversa antes de criar um destaque.');
  const createdAt=Date.now();
  const item=bookmark({id:crypto.randomUUID(),chatId,provider:chat.provider,quote:quote.slice(0,3000),note:note.slice(0,4000),
    createdAt,...(messageIndex!==undefined?{messageIndex}:{})});
  if((await all<Bookmark>('bookmarks')).length>=10000)throw Error('Limite local de 10 mil destaques.');
  await put('bookmarks',item);
  return item;
}
export async function removeBookmark(id:string):Promise<void>{await remove('bookmarks',id);}
