import type {Chat,Plan} from '../domain/types.js';
import {parseConversationUrl} from '../domain/providers.js';
import {one,put,modifyChat} from './db.js';
export interface ArchiveReviewTask {
  id:string;chatId:string;url:string;title:string;expectedEditedAt:number;
  state:'pending'|'opened'|'reported'|'skipped';
}
export interface ArchiveReview {id:'archive-review-v1';createdAt:number;tasks:ArchiveReviewTask[]}
export function previewArchiveTasks(plan:Plan,chats:Chat[]):ArchiveReviewTask[]{
  const byId=new Map(chats.map(c=>[c.id,c]));
  return plan.recommendations.filter(r=>r.action==='archive').slice(0,100).map(r=>{
    const chat=byId.get(r.id);
    if(!chat||chat.pinned||chat.protected||chat.archived||!chat.verifiedAt||!chat.updatedAt||
       chat.editedAt!==r.expectedEditedAt||!parseConversationUrl(chat.url))throw Error('Prévia de arquivamento expirada. Recalcule.');
    return {id:crypto.randomUUID(),chatId:chat.id,url:chat.url,title:chat.title,
      expectedEditedAt:chat.editedAt,state:'pending' as const};
  });
}
export async function loadArchiveReview():Promise<ArchiveReview|undefined>{
  return one<ArchiveReview>('meta','archive-review-v1');
}
export async function startArchiveReview(plan:Plan,chats:Chat[]):Promise<ArchiveReview>{
  const tasks=previewArchiveTasks(plan,chats);
  if(!tasks.length)throw Error('Nenhuma conversa antiga elegível.');
  const review:ArchiveReview={id:'archive-review-v1',createdAt:Date.now(),tasks};
  await put('meta',review);return review;
}
export async function reviewAction(taskId:string,action:'open'|'reported'|'skip'):Promise<void>{
  const review=await loadArchiveReview();
  const task=review?.tasks.find(x=>x.id===taskId);
  if(!review||!task)throw Error('Revisão não encontrada.');
  const chat=await one<Chat>('chats',task.chatId);
  if(!chat||chat.editedAt!==task.expectedEditedAt||chat.pinned||chat.protected)throw Error('Conversa alterada ou protegida. Refaça a prévia.');
  if(action==='open'){
    if(!parseConversationUrl(task.url))throw Error('URL não reconhecida.');
    await chrome.tabs.create({url:task.url,active:true});
  }
  if(action==='reported'){
    if(task.state!=='opened')throw Error('Abra a conversa e arquive pelo menu nativo antes de registrar.');
    await modifyChat(task.chatId,{archived:true});
  }
  const state=action==='open'?'opened':action==='reported'?'reported':'skipped';
  await put('meta',{...review,tasks:review.tasks.map(x=>x.id===taskId?{...x,state}:x)});
}
