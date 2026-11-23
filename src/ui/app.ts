import {loadData,type Context} from './context.js';
import {el,notify} from './dom.js';
import {renderLibrary} from './screens/library.js';
import {renderOrganize} from './screens/organize.js';
import {renderPrompts} from './screens/prompts.js';
import {renderData} from './screens/data.js';
import {initializeProfile} from '../platform/profiles.js';

type Tab='library'|'organize'|'prompts'|'data';
if(window.location.pathname.endsWith('/manager.html'))document.documentElement.classList.add('manager-view');
const TABS:readonly {id:Tab;label:string}[]=[
  {id:'library',label:'Biblioteca'},
  {id:'organize',label:'Organizar'},
  {id:'prompts',label:'Prompts'},
  {id:'data',label:'Dados'}
];
const ICONS:Record<Tab,readonly string[]>={
  library:['M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z','M4 19.5A2.5 2.5 0 0 1 6.5 17H20'],
  organize:['M2 7a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z'],
  prompts:['M12 20h9','M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z'],
  data:['M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0','M3 5v14a9 3 0 0 0 18 0V5','M3 12a9 3 0 0 0 18 0']
};
function iconFor(id:Tab):SVGSVGElement{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:'19',height:'19',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);
  for(const d of ICONS[id]){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);}
  return svg;
}
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
    for(const {id,label} of TABS){
      const button=el('button',`nav-button${tab===id?' current':''}`);button.type='button';
      const symbol=el('span','nav-icon');symbol.append(iconFor(id));button.append(symbol,el('span','nav-text',label));
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
void initializeProfile().then(()=>refresh()).catch(err=>{console.error(err);notify(String(err),true);});
