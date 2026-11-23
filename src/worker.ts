import {parseConversationUrl} from './domain/providers.js';
import {parseInlineRequest,validateInlineContext,type InlineResult} from './domain/inpage-contract.js';
import {parseManualConversation} from './domain/importer.js';
import {one,modifyChat,importChats} from './platform/db.js';
import {hasSiteAccess} from './platform/site-access.js';
import {reconcileInlineScripts} from './platform/inline-registration.js';
import {loadSettings,reconcileAlarm,ALARM} from './platform/settings.js';
import {all,applyPlan} from './platform/db.js';

import {makePlan} from './domain/organizer.js';
import type {Chat,Folder} from './domain/types.js';
const initialize=async():Promise<void>=>{
  await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true});
  await reconcileAlarm(await loadSettings());
  await reconcileInlineScripts();
};
chrome.runtime.onInstalled.addListener(()=>{void initialize().catch(console.error);});
chrome.runtime.onStartup.addListener(()=>{void initialize().catch(console.error);});
chrome.alarms.onAlarm.addListener(alarm=>{
  if(alarm.name!==ALARM)return;
  void (async()=>{
    const settings=await loadSettings();if(!settings.autoRun)return;
    const [chats,folders]=await Promise.all([all<Chat>('chats'),all<Folder>('folders')]);
    const plan=makePlan(chats,folders,settings);
    if(plan.recommendations.length)await applyPlan(plan);
    // Não há operação contra a conta ChatGPT: arquivo somente da biblioteca local.
  })().catch(e=>console.warn('IAPro: organização automática não aplicada:',e));
});

chrome.permissions.onAdded.addListener(()=>{void reconcileInlineScripts().catch(console.warn);});
chrome.permissions.onRemoved.addListener(()=>{void reconcileInlineScripts().catch(console.warn);});
chrome.runtime.onMessage.addListener((raw,sender,reply)=>{
  const request=parseInlineRequest(raw);
  if(!request)return false;
  void (async():Promise<InlineResult>=>{
    if(sender.frameId!==0||!sender.tab?.id||!sender.url||!sender.tab.url)return {ok:false,accountVerified:false,error:'Origem de mensagem inválida.'};
    const ctx=validateInlineContext(sender.url,sender.tab.url,request.href);
    if(!ctx)return {ok:false,accountVerified:false,error:'A aba ou conversa mudou. Atualize e tente novamente.'};
    if(!await hasSiteAccess(ctx.provider))return {ok:false,accountVerified:false,error:'Permissão revogada. Reative o provedor na Biblioteca.'};
    const ref=ctx.conversation;
    if(request.action==='manager'){
      await chrome.tabs.create({url:chrome.runtime.getURL('manager.html'),active:true});
      return {ok:true,accountVerified:false,provider:ctx.provider};
    }
    if(!ref)return {ok:false,accountVerified:false,error:'Abra uma conversa identificável para usar esta ação.'};
    const existing=await one<Chat>('chats',ref.id);
    if(request.action==='status')return {ok:true,accountVerified:false,provider:ref.provider,conversation:ref.id,saved:!!existing,pinned:!!existing?.pinned};
    if(request.action==='save' || request.action==='favorite'){
      if(!existing)await importChats([parseManualConversation(ref.url,request.title?.trim()||'Conversa sem título')]);
      if(request.action==='favorite')await modifyChat(ref.id,{pinned:!existing?.pinned});
      const chat=await one<Chat>('chats',ref.id);
      return {ok:true,accountVerified:false,provider:ref.provider,conversation:ref.id,saved:!!chat,pinned:!!chat?.pinned};
    }
    return {ok:false,accountVerified:false,error:'Comando desconhecido'};
  })().then(reply).catch(error=>reply({ok:false,accountVerified:false,error:error instanceof Error?error.message:'Falha interna da extensão'}));
  return true;
});
