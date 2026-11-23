import {DEFAULT_SETTINGS,validSettings} from '../domain/organizer.js';
import type {Settings} from '../domain/types.js';
import {activeScope,LEGACY_SCOPE} from './profiles.js';
const KEY='iapro.settings.v1';
const key=()=>activeScope()===LEGACY_SCOPE?KEY:KEY+'.'+activeScope();
export async function loadSettings():Promise<Settings>{
  try{
    const k=key();const data=await chrome.storage.local.get(k);
    if(data[k]===undefined)return structuredClone(DEFAULT_SETTINGS);
    return validSettings(data[k]);
  }catch{return structuredClone(DEFAULT_SETTINGS);}
}
export async function saveSettings(s:Settings):Promise<void>{
  const validated=validSettings(s);
  if(activeScope()!==LEGACY_SCOPE && validated.autoRun)throw Error('A execução diária em perfis locais permanece desabilitada até a homologação do isolamento de contas.');
  await chrome.storage.local.set({[key()]:validated});
  if(activeScope()===LEGACY_SCOPE)await reconcileAlarm(validated);
}
export const ALARM='iapro.daily.local';
export async function reconcileAlarm(s:Settings):Promise<void>{
  if(s.autoRun){await chrome.alarms.create(ALARM,{periodInMinutes:1440});}
  else await chrome.alarms.clear(ALARM);
}
