import {INLINE_MESSAGE,type InlineAction,type InlineResult} from '../domain/inpage-contract.js';
import {parseConversationUrl} from '../domain/providers.js';
import {resolvePageAdapter} from './adapters.js';
import {enhanceVisibleSidebar} from './sidebar.js';

const ROOT_ID='chat-maestro-inline-v1';
const adapter=resolvePageAdapter(location.href);
if(adapter && !document.getElementById(ROOT_ID)){
  const host=document.createElement('div');host.id=ROOT_ID;
  const shadow=host.attachShadow({mode:'closed'});
  const style=document.createElement('style');
  style.textContent=`
:host{all:initial;font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:block;position:fixed;right:14px;bottom:96px;z-index:2147483000;color-scheme:light dark}
*{box-sizing:border-box}
button{font:inherit;cursor:pointer}
.launch{display:flex;align-items:center;justify-content:center;gap:5px;background:#80183d;color:#fff;border:1px solid #d18aa4;border-radius:22px;padding:9px 12px;font-size:12px;font-weight:750;box-shadow:0 4px 16px #16101655}
.launch:hover{background:#a32352}
.panel{display:none;position:absolute;right:0;bottom:47px;min-width:228px;max-width:min(295px,calc(100vw - 30px));background:#fff;color:#232027;border:1px solid #e5dfe5;box-shadow:0 12px 40px #1117;border-radius:13px;overflow:hidden}
.panel.open{display:block}
.top{padding:12px;border-bottom:1px solid #e8e2e7;display:flex;justify-content:space-between;align-items:center}
.top strong{font-size:13px}.close{border:0;background:transparent;color:#666;font-size:16px}
.status{padding:9px 12px;font-size:11px;line-height:1.4;color:#645b64;word-wrap:break-word}
.actions{display:grid;gap:7px;padding:0 12px 12px}
.actions button{font-size:12px;text-align:left;color:#30222e;border:1px solid #e8dfe6;border-radius:8px;background:#faf8fa;padding:9px}
.actions button:hover{background:#faeaf0;border-color:#d8bccb}
.actions button:disabled{opacity:.5;cursor:not-allowed}
.actions select{width:100%;color:inherit;background:#faf8fa;border:1px solid #e8dfe6;border-radius:8px;padding:9px;font-size:12px}
.actions label{font-size:11px;color:#6c555d}.actions select:disabled{opacity:.5}
.notice{padding:9px 12px;font-size:10px;line-height:1.4;border-top:1px solid #ece7ec;color:#71646e}
@media(prefers-color-scheme:dark){.panel{background:#221d22;border-color:#59414b;color:#fff}.top{border-color:#493743}.status,.notice{color:#d5c5cf}.actions button{background:#332931;color:#fceef5;border-color:#5a4551}.actions button:hover{background:#483241}.actions select{background:#332931;border-color:#5a4551}.close{color:#ddd}}
@media(max-width:450px){:host{right:8px;bottom:84px}.launch{padding:7px 10px}}
`;
const launcher=document.createElement('button');launcher.className='launch';launcher.textContent='Maestro';launcher.title='Abrir ações rápidas do Chat Maestro';launcher.setAttribute('aria-expanded','false');
const panel=document.createElement('section');panel.className='panel';panel.setAttribute('aria-label','Ações do Chat Maestro');
const top=document.createElement('div');top.className='top';
const label=document.createElement('strong');label.textContent='Chat Maestro';
const close=document.createElement('button');close.className='close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar ações');
top.append(label,close);
const status=document.createElement('div');status.className='status';status.setAttribute('role','status');
const actions=document.createElement('div');actions.className='actions';
const scopeLabel=document.createElement('label');scopeLabel.textContent='Perfil local desta conversa';
const profilePicker=document.createElement('select');profilePicker.setAttribute('aria-label','Selecionar perfil local para esta conversa');
profilePicker.append(new Option('Escolha o perfil em Dados…',''));
actions.append(scopeLabel,profilePicker);
const save=document.createElement('button');save.textContent='Salvar esta conversa';
const favorite=document.createElement('button');favorite.textContent='☆ Favoritar localmente';
const folder=document.createElement('select');folder.setAttribute('aria-label','Mover conversa para pasta local');
folder.append(new Option('Pasta local: nenhuma',''));
const mark=document.createElement('button');mark.textContent='Salvar trecho selecionado / nota';
const manager=document.createElement('button');manager.textContent='Abrir biblioteca';
actions.append(save,favorite,folder,mark,manager);
const notice=document.createElement('div');notice.className='notice';notice.textContent='Escolha explicitamente um perfil local. Isso não comprova qual conta está autenticada no site. Sem arquivo remoto nem envio automático.';
panel.append(top,status,actions,notice);
shadow.append(style,launcher,panel);document.documentElement.append(host);
let lastHref='';
let selectedQuote='';
let sequence=0;
const context=()=>parseConversationUrl(location.href);
const describe=()=>{
 const ref=context();const enabled=!!ref && !!profilePicker.value;save.disabled=!enabled;favorite.disabled=!enabled;folder.disabled=!enabled;mark.disabled=!enabled;
 return ref?('Conversa detectada no '+(ref.provider==='chatgpt'?'ChatGPT':'Gemini')+'.'):('Abra uma conversa específica para salvar ou favoritar.');
};
async function send(action:InlineAction,folderId?:string|null,quote='',note=''):Promise<InlineResult>{
 const title=adapter?.title(document)||document.title.slice(0,250);
 return chrome.runtime.sendMessage<InlineResult>({type:INLINE_MESSAGE,action,href:location.href,title,...(action==='move'?{folderId:folderId??null}:{}),...(action==='bookmark'?{quote,note}:{}),...(!['profiles','manager'].includes(action)?{profileId:profilePicker.value}:{})});
}
async function refreshProfiles():Promise<void>{
 const result=await send('profiles');
 if(!result.ok){status.textContent=result.error||'Não foi possível listar perfis.';return;}
 const selected=profilePicker.value;
 profilePicker.replaceChildren(new Option('Selecione um perfil local…',''));
 for(const profile of result.profiles??[])profilePicker.append(new Option(profile.label,profile.id));
 if([...profilePicker.options].some(x=>x.value===selected))profilePicker.value=selected;
 describe();
 if(!profilePicker.value){
   status.textContent=(result.profiles?.length??0)?'Selecione o perfil local para continuar.':'Crie um perfil deste provedor em Dados → Perfis locais.';
 }
}
async function update():Promise<void>{
 const generation=++sequence;
 status.textContent=describe();
 if(!context())return;
 try{
   if(!profilePicker.value){await refreshProfiles();return;}
   const response=await send('status');if(generation!==sequence)return;
   if(response.ok){
     favorite.textContent=response.pinned?'★ Desfavoritar localmente':'☆ Favoritar localmente';
     folder.replaceChildren(new Option('Pasta local: nenhuma',''));
     for(const f of response.folders??[])folder.append(new Option(f.name,f.id));
     folder.value=response.folderId??'';
     status.textContent='Perfil selecionado · '+(response.saved?'conversa salva localmente':'conversa ainda não salva');
   }else status.textContent=response.error||'Não foi possível consultar a biblioteca.';
 }catch{if(generation===sequence)status.textContent='Conexão com a extensão indisponível. Recarregue a página.';}
}
async function run(action:InlineAction,folderId?:string|null,quote='',note=''):Promise<void>{
 status.textContent='Executando…';
 try{
 const response=await send(action,folderId,quote,note);
 if(!response.ok){status.textContent=response.error||'Operação não concluída.';return;}
 if(action==='manager'){panel.classList.remove('open');return;}
 await update();status.textContent=action==='save'?'Conversa salva localmente.':action==='favorite'?'Favorito local atualizado.':action==='move'?'Pasta local atualizada.':action==='bookmark'?'Trecho ou nota salvo no perfil local.':'Pronto';
 }catch(e){status.textContent=e instanceof Error?e.message:'Falha ao comunicar com a extensão.';}
}
launcher.addEventListener('click',()=>{selectedQuote=window.getSelection()?.toString().trim().slice(0,3000)??'';const open=!panel.classList.contains('open');panel.classList.toggle('open',open);launcher.setAttribute('aria-expanded',String(open));if(open)void update();});
close.addEventListener('click',()=>{panel.classList.remove('open');launcher.setAttribute('aria-expanded','false');});
save.addEventListener('click',()=>{void run('save');});
favorite.addEventListener('click',()=>{void run('favorite');});
profilePicker.addEventListener('change',()=>{void update();});
folder.addEventListener('change',()=>{void run('move',folder.value||null);});
mark.addEventListener('click',()=>{
 const text=window.prompt('Anotação para o trecho selecionado (opcional):','');
 if(text===null)return;
 if(!selectedQuote&&!text.trim()){status.textContent='Selecione um trecho da conversa ou escreva uma nota.';return;}
 void run('bookmark',undefined,selectedQuote,text.slice(0,4000));
});
manager.addEventListener('click',()=>{void run('manager');});
function sync(){
 if(!host.isConnected)document.documentElement.append(host);
 enhanceVisibleSidebar(document,(href,title)=>{
   if(!profilePicker.value){
     panel.classList.add('open');launcher.setAttribute('aria-expanded','true');
     status.textContent='Selecione o perfil local no Maestro antes de salvar uma conversa da barra lateral.';
     void refreshProfiles();return;
   }
   if(!window.confirm('Salvar esta referência em '+(profilePicker.selectedOptions[0]?.textContent??'perfil selecionado')+'?\n'+title))return;
   void chrome.runtime.sendMessage<InlineResult>({type:INLINE_MESSAGE,action:'saveVisible',href,title,profileId:profilePicker.value})
     .then(response=>{status.textContent=response.ok?'Conversa adicionada localmente.':response.error??'Falha ao salvar referência.';})
     .catch(()=>{status.textContent='Não foi possível salvar a referência.';});
 });
 if(lastHref!==location.href){lastHref=location.href;profilePicker.value='';folder.replaceChildren(new Option('Pasta local: nenhuma',''));void update();}
}
let timer:number|undefined;
const observer=new MutationObserver(()=>{
 if(timer!==undefined)return;
 timer=window.setTimeout(()=>{timer=undefined;sync();},220);
});
observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
lastHref=location.href;sync();void refreshProfiles();
}
