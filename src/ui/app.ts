import {loadData,type Context} from './context.js';
import {el,notify} from './dom.js';
import {renderLibrary} from './screens/library.js';
import {renderOrganize} from './screens/organize.js';
import {renderPrompts} from './screens/prompts.js';
import {renderData} from './screens/data.js';
type Tab='library'|'organize'|'prompts'|'data';
let tab:Tab='library';let busy=false;
const root=document.getElementById('root') ?? (()=>{throw Error('Elemento raiz ausente');})();
async function refresh():Promise<void>{
  if(busy)return;
  busy=true;
  try{
    const ctx:Context=await loadData(refresh);
    const top=el('header','topbar');
    const brand=el('div','branding');const mark=el('span','brand-mark','i');
    const titles=el('div');titles.append(el('strong','brand-title','Chat Maestro'),el('span','brand-subtitle','Seu espaço, sob controle.'));
    brand.append(mark,titles);top.append(brand);
    const statistics=el('div','statistics');
    statistics.append(metric(ctx.chats.filter(c=>!c.archived).length,'Ativas'),metric(ctx.chats.filter(c=>c.archived).length,'Arquivadas'),metric(ctx.folders.length,'Pastas'));
    const navigation=el('nav','navigation');navigation.setAttribute('aria-label','Seções');
    for(const [id,name] of [['library','Biblioteca'],['organize','Organizar'],['prompts','Prompts'],['data','Dados']] as const){
      const b=el('button',`nav-button ${tab===id?'current':''}`,name);b.type='button';b.setAttribute('aria-current',tab===id?'page':'false');
      b.addEventListener('click',()=>{tab=id;void refresh();});navigation.append(b);
    }
    const main=el('main','main');
    switch(tab){
      case 'library':main.append(renderLibrary(ctx));break;
      case 'organize':main.append(renderOrganize(ctx));break;
      case 'prompts':main.append(renderPrompts(ctx));break;
      case 'data':main.append(renderData(ctx));break;
    }
    const toast=el('div','toast');toast.id='toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    root.replaceChildren(top,statistics,navigation,main,toast);
  }catch(err){
    root.replaceChildren(el('div','fatal',`Não foi possível carregar o Chat Maestro: ${err instanceof Error?err.message:String(err)}`));
    console.error(err);
  }finally{busy=false;}
}
function metric(n:number,label:string):HTMLElement{const item=el('div','metric');item.append(el('strong','',String(n)),el('span','',label));return item;}
document.addEventListener('keydown',event=>{
  // Atalho local, restrito ao painel e sem capturar digitação em formulários.
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
    if(event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)))return;
    event.preventDefault();
    if(tab==='library')document.getElementById('iapro-search')?.focus();
    else{tab='library';void refresh().then(()=>document.getElementById('iapro-search')?.focus());}
  }
});
document.addEventListener('keydown',event=>{
  // Atalho local, restrito ao painel e sem capturar digitação em formulários.
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
    if(event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)))return;
    event.preventDefault();
    if(tab==='library')document.getElementById('iapro-search')?.focus();
    else{tab='library';void refresh().then(()=>document.getElementById('iapro-search')?.focus());}
  }
});
void refresh().catch(err=>notify(String(err),true));
