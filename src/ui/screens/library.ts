import type {Chat,Folder} from '../../domain/types.js';
import {modifyChat,modifyChats,remove} from '../../platform/db.js';
import {PROVIDER_LABEL,type AIProvider} from '../../domain/providers.js';
import {serializeChats,type ExportFormat} from '../../domain/exporter.js';
import {el,action,empty,formatDate,safeOpen,confirmAction,notify,downloadText} from '../dom.js';
import type {Context} from '../context.js';
type Filter='active'|'all'|'pinned'|'archived';
let filter:Filter='active';let query='';let folderFilter='all';let providerFilter:'all'|AIProvider='all';
const normalize=(t:string)=>t.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
function options(sel:HTMLSelectElement,folders:Folder[],selected:string|null){
  sel.append(new Option('Sem pasta',''));
  for(const f of folders)sel.append(new Option(f.name,f.id));
  sel.value=selected??'';
}
function card(chat:Chat,ctx:Context,selected:Set<string>,onSelection:()=>void):HTMLElement{
  const item=el('article','chat-card');
  const head=el('div','chat-head');
  const check=el('input');check.type='checkbox';check.className='select-chat';check.checked=selected.has(chat.id);
  check.setAttribute('aria-label',`Selecionar ${chat.title}`);
  check.addEventListener('change',()=>{if(check.checked)selected.add(chat.id);else selected.delete(chat.id);onSelection();});
  head.append(check);
  const text=el('div','chat-title-wrap');
  const title=el('h3','chat-title',chat.title);title.title=chat.title;
  const caption=el('div','chat-caption',`${PROVIDER_LABEL[chat.provider??'chatgpt']} · ${chat.verifiedAt?'Atualizada':'Registrada'}: ${formatDate(chat.updatedAt ?? chat.importedAt)} · ${chat.messages.length?'Histórico importado':'Somente link'}`);
  text.append(title,caption);head.append(text);
  if(chat.pinned)head.append(el('span','pill accent','Fixada'));
  if(chat.protected)head.append(el('span','pill','Protegida'));
  item.append(head);
  const actions=el('div','chat-actions');
  actions.append(action('Abrir',()=>safeOpen(chat.url),'primary'));
  actions.append(action(chat.pinned?'Desafixar':'Fixar',async()=>{await modifyChat(chat.id,{pinned:!chat.pinned});await ctx.refresh();}));
  actions.append(action(chat.archived?'Restaurar':'Arquivar localmente',async()=>{await modifyChat(chat.id,{archived:!chat.archived});await ctx.refresh();}));
  actions.append(action(chat.protected?'Desproteger':'Proteger',async()=>{await modifyChat(chat.id,{protected:!chat.protected});await ctx.refresh();}));
  const selector=el('select','folder-select');selector.setAttribute('aria-label',`Pasta de ${chat.title}`);options(selector,ctx.folders,chat.folderId);
  selector.addEventListener('change',()=>{void modifyChat(chat.id,{folderId:selector.value||null}).then(ctx.refresh).catch(err=>notify(String(err),true));});
  actions.append(selector);item.append(actions);
  if(chat.messages.length){
    const details=el('details','messages');const summary=el('summary','',`Ler ${chat.messages.length} mensagens importadas`);details.append(summary);
    const container=el('div','message-list');
    for(const m of chat.messages.slice(0,80)){
      const block=el('section','message');block.append(el('strong','',m.role==='user'?'Você':'Assistente'));
      const p=el('p','message-body',m.text.slice(0,3000));block.append(p);container.append(block);
    }
    if(chat.messages.length>80)container.append(el('p','hint','Prévia limitada a 80 mensagens. O backup preserva todas as importadas.'));
    details.append(container);item.append(details);
  }
  const foot=el('div','card-footer');
  foot.append(action('Remover da biblioteca',async()=>{
    if(!confirmAction('Remover este registro apenas da IAPro? A conversa na sua conta não será excluída.'))return;
    await remove('chats',chat.id);await ctx.refresh();
  },'danger'));
  item.append(foot);return item;
}
export function renderLibrary(ctx:Context):HTMLElement{
  const root=el('section','screen');root.append(el('h2','screen-title','Sua biblioteca'));
  root.append(el('p','hint','ChatGPT e Gemini no mesmo lugar. Arquivar e mover são operações locais: não alteram as contas.'));
  const toolbar=el('div','toolbar');const search=el('input','search');search.type='search';search.placeholder='Buscar título ou mensagens…';search.id='iapro-search';search.id='iapro-search';search.value=query;search.setAttribute('aria-label','Buscar conversas');
  toolbar.append(search);
  const folder=el('select','filter-select');folder.setAttribute('aria-label','Filtrar pasta');folder.append(new Option('Todas as pastas','all'),new Option('Sem pasta','none'));
  for(const f of ctx.folders)folder.append(new Option(f.name,f.id));folder.value=folderFilter;toolbar.append(folder);
  const provider=el('select','filter-select');provider.setAttribute('aria-label','Filtrar plataforma');provider.append(new Option('ChatGPT + Gemini','all'),new Option('ChatGPT','chatgpt'),new Option('Gemini','gemini'));provider.value=providerFilter;
  const filters=el('div','filter-tabs');const result=el('div','chat-list');
  const selected=new Set<string>();
  let visibleRows:Chat[]=[];
  const bulk=el('div','panel bulk-panel');const selectedCount=el('p','hint');
  const bulkActions=el('div','buttons');bulk.append(selectedCount,bulkActions);
  const getSelected=():Chat[]=>ctx.chats.filter(c=>selected.has(c.id));
  const updateSelection=()=>{selectedCount.textContent=`${selected.size} selecionada(s) · limite de 100 por lote`;for(const b of bulkActions.querySelectorAll('button'))b.disabled=selected.size===0 || selected.size>100;};
  async function applyBulk(patch:Parameters<typeof modifyChats>[1],label:string):Promise<void>{
    const ids=[...selected];if(!ids.length)throw Error('Selecione conversas.');
    if(!confirmAction(`${label} ${ids.length} conversa(s) somente na biblioteca IAPro?`))return;
    const count=await modifyChats(ids,patch);notify(`${count} conversa(s) atualizada(s) localmente.`);await ctx.refresh();
  }
  bulkActions.append(action('Arquivar',()=>applyBulk({archived:true},'Arquivar')),
    action('Restaurar',()=>applyBulk({archived:false},'Restaurar')),
    action('Proteger',()=>applyBulk({protected:true},'Proteger')));
  const move=el('select','folder-select');move.setAttribute('aria-label','Pasta de destino em lote');options(move,ctx.folders,null);
  bulkActions.append(move,action('Mover',()=>applyBulk({folderId:move.value||null},'Mover')));
  for(const [format,label,extension] of [['markdown','Exportar MD','md'],['text','TXT','txt'],['json','JSON','json']] as const){
    bulkActions.append(action(label,()=>{
      const value=serializeChats(getSelected(),format as ExportFormat);
      downloadText(`iapro-conversas-${new Date().toISOString().slice(0,10)}.${extension}`,value,extension==='json'?'application/json':'text/plain;charset=utf-8');
      notify('Exportação preparada.');
    }));
  }
  const renderList=()=>{
    const q=normalize(query);
    const rows=ctx.chats.filter(c=>{
      if(filter==='active'&&c.archived)return false;
      if(filter==='pinned'&&!c.pinned)return false;
      if(filter==='archived'&&!c.archived)return false;
      if(providerFilter!=='all'&&(c.provider??'chatgpt')!==providerFilter)return false;
      if(folderFilter==='none'&&c.folderId!==null)return false;
      if(folderFilter!=='all'&&folderFilter!=='none'&&c.folderId!==folderFilter)return false;
      return !q||normalize(c.title).includes(q)||c.messages.some(m=>normalize(m.text).includes(q));
    }).sort((a,b)=>(b.updatedAt??b.importedAt)-(a.updatedAt??a.importedAt));
    visibleRows=rows.slice(0,100);
    result.replaceChildren();
    if(!rows.length)result.append(empty('Nenhuma conversa encontrada. Importe seu histórico ou capture a lista na aba Dados.'));
    else for(const c of visibleRows)result.append(card(c,ctx,selected,updateSelection));
    if(rows.length>100)result.append(el('p','hint',`Exibindo 100 de ${rows.length} resultados. Refine a busca.`));
  };
  for(const [id,name] of [['active','Ativas'],['pinned','Fixadas'],['archived','Arquivadas'],['all','Todas']] as const){
    const b=action(name,()=>{filter=id;selected.clear();updateSelection();for(const item of filters.querySelectorAll('button'))item.classList.toggle('selected',item===b);renderList();});
    b.classList.toggle('selected',filter===id);filters.append(b);
  }
  search.addEventListener('input',()=>{query=search.value;selected.clear();renderList();updateSelection();});
  folder.addEventListener('change',()=>{folderFilter=folder.value;selected.clear();renderList();updateSelection();});
  provider.addEventListener('change',()=>{providerFilter=provider.value as 'all'|AIProvider;selected.clear();renderList();updateSelection();});
  const pickVisible=action('Selecionar visíveis',()=>{
    for(const c of visibleRows){if(selected.size>=100)break;selected.add(c.id);}
    renderList();updateSelection();
  });
  // Seleção é limpa ao mudar filtros; operações em lote nunca agem sobre itens ocultos.
  const clear=action('Limpar seleção',()=>{selected.clear();renderList();updateSelection();});
  root.append(toolbar,provider,filters,pickVisible,clear,bulk,result);updateSelection();renderList();return root;
}
