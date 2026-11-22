import {loadSettings,reconcileAlarm,ALARM} from './platform/settings.js';
import {all,applyPlan} from './platform/db.js';
import {makePlan} from './domain/organizer.js';
import type {Chat,Folder} from './domain/types.js';
const initialize=async():Promise<void>=>{
  await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true});
  await reconcileAlarm(await loadSettings());
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
