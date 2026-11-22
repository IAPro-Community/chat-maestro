import {DEFAULT_SETTINGS,validSettings} from '../domain/organizer.js';
import type {Settings} from '../domain/types.js';
const KEY='iapro.settings.v1';
export async function loadSettings():Promise<Settings>{
  try{
    const data=await chrome.storage.local.get(KEY);
    if(data[KEY]===undefined)return structuredClone(DEFAULT_SETTINGS);
    return validSettings(data[KEY]);
  }catch{return structuredClone(DEFAULT_SETTINGS);}
}
export async function saveSettings(s:Settings):Promise<void>{
  const validated=validSettings(s);
  await chrome.storage.local.set({[KEY]:validated});
  await reconcileAlarm(validated);
}
export const ALARM='iapro.daily.local';
export async function reconcileAlarm(s:Settings):Promise<void>{
  if(s.autoRun){await chrome.alarms.create(ALARM,{periodInMinutes:1440});}
  else await chrome.alarms.clear(ALARM);
}
