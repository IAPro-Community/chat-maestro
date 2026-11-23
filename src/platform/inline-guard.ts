import {validateInlineContext} from '../domain/inpage-contract.js';

/**
 * The original MessageSender.tab may be stale after asynchronous work.
 * Re-read the live tab and refuse changes when the user switched tabs
 * or navigated to a different conversation while a request was pending.
 * This is a best-effort guard, not a transaction across Chrome and IndexedDB.
 */
export async function isCurrentInlineTab(senderUrl:string,tabId:number,requestedUrl:string):Promise<boolean>{
  try{
    const live=await chrome.tabs.get(tabId);
    return live.active===true && !!live.url && validateInlineContext(senderUrl,live.url,requestedUrl)!==null;
  }catch{
    return false;
  }
}
