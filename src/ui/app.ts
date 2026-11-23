import {loadData,type Context} from './context.js';
import {el,notify} from './dom.js';
import {renderLibrary} from './screens/library.js';
import {renderOrganize} from './screens/organize.js';
import {renderPrompts} from './screens/prompts.js';
import {renderData} from './screens/data.js';

type Tab='library'|'organize'|'prompts'|'data';
const TABS:readonly {id:Tab;label:string;icon:string}[]=[
  {id:'library',label:'Biblioteca',icon:'▤'},
  {id:'organize',label:'Organizar',icon:'▧'},
  {id:'prompts',label:'Prompts',icon:'✎'},
  {id:'data',label:'Dados',icon:'◫'}
];
let tab:Tab='library';let busy=false;let pending=false;
const root=document.getElementById('root') ?? (()=>{throw Error('Elemento raiz ausente');})();

async function refresh():Promise<void>{
  if(busy){pending=true;return;}
  busy=true;
  try{
    const ctx:Context=await loadData(refresh);
    const shell=el('div','workspace-shell');
    const top=el('header','workspace-header');
    const brand=el('div','branding');
    const mark=el('img','brand-logo');mark.src='assets/icon128.png';mark.width=32;mark.height=32;mark.alt='';
    const titles=el('div','brand-copy');titles.append(el('strong','brand-title','Chat Maestro'),el('span','brand-subtitle','Organize suas conversas com IA'));
    brand.append(mark,titles);top.append(brand);
    const navigation=el('nav','navigation');navigation.setAttribute('aria-label','Navegação principal');
    for(const {id,label,icon} of TABS){
      const button=el('button',`nav-button${tab===id?' current':''}`);button.type='button';
      button.append(el('span','nav-icon',icon),el('span','nav-text',label));
      button.setAttribute('aria-current',tab===id?'page':'false');
      button.setAttribute('aria-label',label);
      button.addEventListener('click',()=>{if(tab===id)return;tab=id;void refresh();});
      navigation.append(button);
    }
    const main=el('main','main');main.id='main-content';
    switch(tab){
      case 'library':main.append(renderLibrary(ctx));break;
      case 'organize':main.append(renderOrganize(ctx));break;
      case 'prompts':main.append(renderPrompts(ctx));break;
      case 'data':main.append(renderData(ctx));break;
    }
    const toast=el('div','toast');toast.id='toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    shell.append(top,navigation,main,toast);root.replaceChildren(shell);
  }catch(err){
    root.replaceChildren(el('div','fatal',`Falha ao abrir o Chat Maestro: ${err instanceof Error?err.message:String(err)}`));
    console.error(err);
  }finally{
    busy=false;
    if(pending){pending=false;void refresh();}
  }
}

document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
    if(event.target instanceof HTMLElement && (event.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)))return;
    event.preventDefault();
    if(tab==='library')document.getElementById('iapro-search')?.focus();
    else{tab='library';void refresh().then(()=>document.getElementById('iapro-search')?.focus());}
  }
});
void refresh().catch(err=>notify(String(err),true));
