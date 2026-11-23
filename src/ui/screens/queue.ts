import {parseConversationUrl,PROVIDER_LABEL} from '../../domain/providers.js';
import {queueForConversation,nextPending,type QueuedMessage} from '../../domain/queue.js';
import {queued,addQueuedMessage,updateQueuedMessage,deleteQueuedMessage,moveQueuedMessage,changeQueueStatus} from '../../platform/queue-store.js';
import {insertIntoActiveComposer} from '../../platform/composer.js';
import {getActiveAiTab} from '../../platform/site-access.js';
import {el,action,field,empty,notify,confirmAction} from '../dom.js';

/** A fila é contextual: o usuário escolhe a conversa antes de preparar qualquer envio. */
export function renderQueue():HTMLElement{
  const root=el('section','queue-workspace');
  root.append(el('p','hint','Organize mensagens para uma conversa específica. O Chat Maestro apenas prepara o texto; você decide quando enviar.'));
  const status=el('div','context-note');status.setAttribute('role','status');root.append(status);
  const url=el('input');url.type='url';url.placeholder='https://chatgpt.com/c/...';url.setAttribute('aria-label','URL da conversa de destino');
  const picker=el('details','disclosure subtle-disclosure');
  picker.append(el('summary','disclosure-trigger','Usar outra conversa ou colar link'),field('URL da conversa',url));
  const active=action('Detectar conversa aberta',async()=>{
    const tab=await getActiveAiTab();
    const ref=parseConversationUrl(tab.url);
    if(!ref){status.textContent='Abra uma conversa específica no ChatGPT ou Gemini. Você também pode colar a URL manualmente abaixo.';return;}
    url.value=ref.url;editing=null;body.value='';save.textContent='Adicionar mensagem';picker.open=false;await load();
  });picker.append(active);root.append(picker);
  const compose=el('details','disclosure queue-compose');
  compose.append(el('summary','disclosure-trigger','+ Adicionar mensagem à fila'));
  const body=el('textarea');body.rows=3;body.maxLength=20000;body.placeholder='O que você deseja perguntar depois?';
  let editing:string|null=null;
  const save=action('Adicionar mensagem',async()=>{
    if(editing){
      const entry=(await queued()).find(item=>item.id===editing);
      if(!entry || entry.conversationUrl!==parseConversationUrl(url.value)?.url)throw Error('O destino mudou. Selecione a conversa original.');
      await updateQueuedMessage(editing,body.value);editing=null;save.textContent='Adicionar mensagem';
    }else await addQueuedMessage(url.value,body.value);
    body.value='';notify('Mensagem salva na fila.');compose.open=false;await load();
  },'primary');
  compose.append(field('Mensagem',body),save);root.append(compose);
  const summary=el('p','queue-summary');root.append(summary);
  const list=el('div','queue-list');list.setAttribute('aria-live','polite');root.append(list);
  let iteration=0;
  async function load():Promise<void>{
    const seq=++iteration;
    try{
      const items=await queued();if(iteration!==seq)return;
      const ref=parseConversationUrl(url.value);
      list.replaceChildren();
      summary.textContent=ref?'':`${items.length} mensagem(ns) salvas no total`;
      if(!ref){
        status.className='context-note';
        status.textContent='Nenhuma conversa selecionada. Abra uma conversa no ChatGPT ou Gemini para começar, ou informe o link acima.';
        compose.hidden=true;
        list.append(empty('Sua fila aparecerá aqui assim que você selecionar uma conversa.'));
        return;
      }
      status.className='context-note is-selected';
      status.textContent=`Destino: ${PROVIDER_LABEL[ref.provider]} · ${ref.nativeId.slice(0,18)}${ref.nativeId.length>18?'…':''}`;
      compose.hidden=false;
      const ordered=queueForConversation(items,ref.url);
      summary.textContent=`${ordered.length} mensagem(ns) para esta conversa`;
      if(!ordered.length){list.append(empty('Nenhuma mensagem na fila. Adicione a primeira acima.'));return;}
      const next=nextPending(items,ref.url);
      if(next){
        list.append(action('Preparar próxima mensagem',async()=>{
          const latest=parseConversationUrl(url.value);
          if(latest?.url!==ref.url)throw Error('A conversa foi alterada. Selecione o destino novamente.');
          if(!confirmAction(`Preparar a próxima mensagem em ${PROVIDER_LABEL[ref.provider]}? O Chat Maestro NÃO fará o envio.`))return;
          await insertIntoActiveComposer(next.body,ref.url);
          await changeQueueStatus(next.id,'pending','prepared');notify('Mensagem preparada. Envie manualmente e confirme abaixo.');await load();
        },'primary'));
      }
      ordered.forEach((item,index)=>list.append(renderRow(item,index,ordered.length)));
    }catch(err){list.replaceChildren(empty(`Não foi possível consultar a fila: ${err instanceof Error?err.message:String(err)}`));}
  }
  function renderRow(item:QueuedMessage,index:number,total:number):HTMLElement{
    const row=el('article','queue-item');
    row.append(el('strong','queue-position',`${index+1} · ${item.status==='prepared'?'Preparada, aguardando confirmação':'Pendente'}`));
    row.append(el('p','queue-text',item.body));
    const buttons=el('div','buttons queue-item-actions');
    if(item.status==='prepared'){
      buttons.append(action('Confirmar que enviei',async()=>{
        if(!confirmAction('Você enviou manualmente esta mensagem na conversa correta?'))return;
        await deleteQueuedMessage(item.id);notify('Mensagem concluída.');await load();
      },'primary'));
      buttons.append(action('Retornar à fila',async()=>{await changeQueueStatus(item.id,'prepared','pending');await load();}));
    }
    buttons.append(action('Editar',()=>{editing=item.id;body.value=item.body;save.textContent='Salvar edição';compose.open=true;body.focus();}));
    if(index>0)buttons.append(action('Subir',async()=>{await moveQueuedMessage(item.conversationUrl,item.id,'up');await load();}));
    if(index<total-1)buttons.append(action('Descer',async()=>{await moveQueuedMessage(item.conversationUrl,item.id,'down');await load();}));
    buttons.append(action('Remover',async()=>{if(!confirmAction('Remover esta mensagem da fila?'))return;await deleteQueuedMessage(item.id);await load();},'danger'));
    row.append(buttons);return row;
  }
  url.addEventListener('change',()=>{editing=null;body.value='';save.textContent='Adicionar mensagem';void load();});
  void getActiveAiTab().then(tab=>{
    const ref=parseConversationUrl(tab.url);
    if(ref && !url.value){url.value=ref.url;void load();}
  }).catch(()=>{});
  void load();return root;
}
