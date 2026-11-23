import type {AIProvider} from '../domain/providers.js';

export interface LocalProfile {id:string;provider:AIProvider;label:string;createdAt:number}
export const LEGACY_SCOPE='legacy';
const PROFILES_KEY='chat-maestro.local-profiles.v1';
const SELECTION_KEY='chat-maestro.selected-profile.v1';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
let currentScope:string=LEGACY_SCOPE;
export function validProfileId(value:string):boolean{return ID.test(value);}
export function activeScope():string{return currentScope;}
export function dbNameForScope(scope:string):string{
  if(scope===LEGACY_SCOPE)return 'iapro-optimizer-v1';
  if(!validProfileId(scope))throw Error('Perfil local inválido.');
  return 'chat-maestro-account-v1-'+scope;
}
function isProfile(v:unknown):v is LocalProfile{
  if(!v||typeof v!=='object'||Array.isArray(v))return false;
  const x=v as Record<string,unknown>;
  return typeof x.id==='string'&&validProfileId(x.id)&&
    (x.provider==='chatgpt'||x.provider==='gemini')&&
    typeof x.label==='string'&&x.label.trim().length>=1&&x.label.length<=64&&
    typeof x.createdAt==='number'&&Number.isSafeInteger(x.createdAt)&&x.createdAt>0;
}
export async function listProfiles():Promise<LocalProfile[]>{
  const result=await chrome.storage.local.get(PROFILES_KEY);
  const raw=result[PROFILES_KEY];
  if(raw===undefined)return [];
  if(!Array.isArray(raw)||raw.length>40||raw.some(x=>!isProfile(x)))throw Error('Registro de perfis locais inválido. Faça backup antes de alterar.');
  const ids=new Set(raw.map((x:LocalProfile)=>x.id));
  if(ids.size!==raw.length)throw Error('Registro de perfis locais duplicado.');
  return raw as LocalProfile[];
}
export async function findProfile(id:string):Promise<LocalProfile|undefined>{
  if(!validProfileId(id))return undefined;
  return (await listProfiles()).find(p=>p.id===id);
}
export async function requireProfile(id:string,provider?:AIProvider):Promise<LocalProfile>{
  const p=await findProfile(id);
  if(!p || (provider && p.provider!==provider))throw Error('Perfil local inexistente ou incompatível com o provedor. Selecione o perfil correto em Dados.');
  return p;
}
export async function createProfile(provider:AIProvider,label:string):Promise<LocalProfile>{
  if(provider!=='chatgpt'&&provider!=='gemini')throw Error('Provedor inválido.');
  const name=label.trim();
  if(!name||name.length>64)throw Error('Informe um nome de perfil com até 64 caracteres.');
  const items=await listProfiles();
  if(items.length>=40)throw Error('Limite de 40 perfis locais atingido.');
  if(items.some(x=>x.provider===provider && x.label.toLowerCase()===name.toLowerCase()))throw Error('Este perfil local já existe.');
  const p:LocalProfile={id:crypto.randomUUID(),provider,label:name,createdAt:Date.now()};
  if(!validProfileId(p.id))throw Error('Identificador de perfil inválido.');
  await chrome.storage.local.set({[PROFILES_KEY]:[...items,p]});
  return p;
}
/** A seleção é por janela/contexto JS. O ID persistido é somente uma preferência de abertura. */
export async function selectProfile(id:string):Promise<void>{
  if(id!==LEGACY_SCOPE)await requireProfile(id);
  currentScope=id;
  await chrome.storage.local.set({[SELECTION_KEY]:id});
}
export async function initializeProfile():Promise<void>{
  const item=await chrome.storage.local.get(SELECTION_KEY);
  const saved=item[SELECTION_KEY];
  currentScope=typeof saved==='string'&&saved!==LEGACY_SCOPE&&await findProfile(saved)?saved:LEGACY_SCOPE;
}
export async function requireSelectedProfile(provider?:AIProvider):Promise<LocalProfile>{
  if(currentScope===LEGACY_SCOPE)throw Error('Crie e selecione um perfil local em Dados antes de salvar novas conversas. Os dados antigos continuam no espaço Legado.');
  return requireProfile(currentScope,provider);
}
