import {parseConversationUrl,PROVIDER_LABEL} from '../../domain/providers.js';
import {queueForConversation, nextPending, type QueuedMessage} from '../../domain/queue.js';
import {queued,addQueuedMessage,updateQueuedMessage,deleteQueuedMessage,moveQueuedMessage,changeQueueStatus} from '../../platform/queue-store.js';
import {insertIntoActiveComposer} from '../../platform/composer.js';
import {el,action,field,empty,notify,confirmAction} from '../dom.js';

/** Apresentação da fila fica junto dos prompts para evitar uma quinta aba permanente. */
export function renderQueue():HTMLElement{
  const root=el('section','panel queue-panel');root.append(el('h3','section-heading','Fila de mensagens'));
  root.append(el('p','hint','Prepare mensagens por conversa, altere a ordem e insira a próxima no ChatGPT ou Gemini. O envio é sempre manual nesta versão.'));
  const url=el('input');url.type='url';url.placeholder='URL da conversa ChatGPT ou Gemini';url.setAttribute('aria-label','Conversa de destino');
  const body=el('textarea');body.rows=3;body.maxLength=20000;body.placeholder='Mensagem a enfileirar (até 20.000 caracteres)';
  const save=action('Adicionar à fila',async()=>{
    if(editing){const entry=(await queued()).find(item=>item.id===editing);
      if(!entry || entry.conversationUrl!==parseConversationUrl(url.value)?.url)throw Error('Conversa alterada durante a edição. Selecione a conversa original.');
      await updateQueuedMessage(editing,body.value);editing=null;save.textContent='Adicionar à fila';}
    else await addQueuedMessage(url.value,body.value);
    body.value='';notify('Fila atualizada.');await load();
  },'primary');
  let editing:string|null=null;
  const active=action('Usar conversa aberta',async()=>{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const ref=tab?.url?parseConversationUrl(tab.url):null;
    if(!ref)throw Error('Abra uma conversa específica no ChatGPT ou Gemini antes de selecionar.');
    url.value=ref.url;editing=null;body.value='';save.textContent='Adicionar à fila';await load();
  });
  const list=el('div','queue-list');list.setAttribute('aria-live','polite');
  const summary=el('p','hint');
  const target=field('Destino exato da fila',url);root.append(target,active,field('Mensagem',body),save,summary,list);
  let iteration=0;
  async function load():Promise<void>{
    const seq=++iteration;
    try{
      const items=await queued();if(iteration!==seq)return;
      const ref=parseConversationUrl(url.value);
      summary.textContent=`${items.length} mensagem(ns) em todas as conversas${ref?` · ${PROVIDER_LABEL[ref.provider]}`:''}.`;
      list.replaceChildren();
      if(!ref){list.append(empty('Selecione uma conversa específica para visualizar e preparar sua fila.'));return;}
      const ordered=queueForConversation(items,ref.url);
      if(!ordered.length){list.append(empty('Nenhuma mensagem pendente para esta conversa.'));return;}
      const next=nextPending(items,ref.url);
      if(next)list.append(action('Preparar próxima na aba ativa',async()=>{
        // Confirmação explícita e destino validado novamente antes de qualquer escrita na página.
        if(parseConversationUrl(url.value)?.id!==ref.id || parseConversationUrl(url.value)?.provider!==ref.provider)throw Error('O destino mudou. Atualize a fila antes de preparar.');
        if(!confirmAction(`Preparar a próxima mensagem em ${PROVIDER_LABEL[ref.provider]} (${ref.nativeId})? A IAPro NÃO enviará o texto.`))return;
        await insertIntoActiveComposer(next.body,ref.url);
        await changeQueueStatus(next.id,'pending','prepared');notify('Mensagem preparada. Envie manualmente na conversa.');await load();
      },'primary'));
      ordered.forEach((item,index)=>list.append(renderRow(item,index,ordered.length)));
    }catch(err){list.replaceChildren(empty(`Erro na fila: ${err instanceof Error?err.message:String(err)}`));}
  }
  function renderRow(item:QueuedMessage,index:number,total:number):HTMLElement{
    const row=el('article','queue-item');row.append(el('strong','',`${index+1}. ${item.status==='prepared'?'Preparada — aguardando confirmação':'Pendente'}`));
    row.append(el('p','queue-text',item.body));
    const buttons=el('div','buttons');
    if(item.status==='prepared'){
      buttons.append(action('Confirmar que enviei',async()=>{
        if(!confirmAction('Confirma que você enviou esta mensagem na conversa correta?'))return;
        await deleteQueuedMessage(item.id);notify('Mensagem concluída.');await load();
      },'primary'));
      buttons.append(action('Retornar à fila',async()=>{await changeQueueStatus(item.id,'prepared','pending');await load();}));
    }
    buttons.append(action('Editar',()=>{editing=item.id;body.value=item.body;save.textContent='Salvar edição';body.focus();}));
    if(index>0)buttons.append(action('Subir',async()=>{await moveQueuedMessage(item.conversationUrl,item.id,'up');await load();}));
    if(index<total-1)buttons.append(action('Descer',async()=>{await moveQueuedMessage(item.conversationUrl,item.id,'down');await load();}));
    buttons.append(action('Remover',async()=>{if(!confirmAction('Remover esta mensagem da fila?'))return;await deleteQueuedMessage(item.id);await load();},'danger'));
    row.append(buttons);return row;
  }
  url.addEventListener('change',()=>{editing=null;body.value='';save.textContent='Adicionar à fila';void load();});
  // O painel pode ser aberto fora de um chat: a URL permanece editável e explícita.
  void chrome.tabs.query({active:true,currentWindow:true}).then(tabs=>{
    const ref=tabs[0]?.url?parseConversationUrl(tabs[0].url):null;
    if(ref && !url.value){url.value=ref.url;void load();}
  }).catch(()=>{});
  void load();return root;
}
