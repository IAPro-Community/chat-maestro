import {parseConversationUrl} from '../domain/providers.js';
import {getActiveAiTab,captureAccessError} from './site-access.js';
/** Somente insere no editor com clique explícito; nunca envia mensagens nem usa endpoints privados. */
export async function insertIntoActiveComposer(text:string,targetConversationUrl?:string):Promise<void>{
  if(!text.trim()||text.length>20000)throw Error('Prompt vazio ou muito extenso.');
  const tab=await getActiveAiTab();
  const expected=targetConversationUrl?parseConversationUrl(targetConversationUrl):null;
  if(targetConversationUrl && !expected)throw Error('Destino da fila inválido.');
  if(expected){const active=parseConversationUrl(tab.url);if(!active || active.id!==expected.id || active.provider!==expected.provider)throw Error('A aba ativa não é a conversa de destino. Abra a conversa correta antes de preparar a fila.');}
  const outcome=await chrome.scripting.executeScript<boolean>({target:{tabId:tab.id},args:[text,expected?.url??null],func:(content:string,expectedUrl:string|null)=>{
    const requireEmpty=expectedUrl!==null;
    if(expectedUrl){
      const actual=new URL(window.location.href),expected=new URL(expectedUrl);
      // Condição repetida DENTRO da aba, impedindo troca de chat entre validação e execução.
      const sameProvider=(actual.hostname===expected.hostname || (['chatgpt.com','chat.openai.com'].includes(actual.hostname)&&expected.hostname==='chatgpt.com'));
      if(actual.protocol!=='https:' || !sameProvider || actual.pathname.replace(/\/$/,'')!==expected.pathname)return false;
    }
    const selectors=[
      '[data-testid="prompt-textarea"][contenteditable="true"]',
      '#prompt-textarea[contenteditable="true"]',
      'main [contenteditable="true"][role="textbox"]',
      'main .ProseMirror[contenteditable="true"]',
      'main textarea',
      '[contenteditable="true"][aria-label*="prompt" i]',
      '[contenteditable="true"][aria-label*="mensagem" i]'
    ];
    for(const selector of selectors){
      const element=document.querySelector<HTMLElement>(selector);
      if(!element||element.getAttribute('aria-disabled')==='true')continue;
      if(requireEmpty && ((element instanceof HTMLTextAreaElement?element.value:element.textContent)||'').trim())return false;
      element.focus();
      if(element instanceof HTMLTextAreaElement){
        const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
        if(!setter)continue;
        setter.call(element,element.value?`${element.value}\n${content}`:content);
        element.dispatchEvent(new Event('input',{bubbles:true}));
        return element.value.includes(content);
      }
      // Inserção no DOM usando mecanismo de edição do browser, respeitando listeners dos frameworks.
      if(element.isContentEditable){
        const ok=document.execCommand('insertText',false,content);
        if(ok && element.textContent?.includes(content))return true;
      }
    }
    return false;
  }}).catch(error=>{throw captureAccessError(error,tab.provider);});
  if(outcome[0]?.result!==true)throw Error('Não foi possível preparar a mensagem. Confirme a conversa, espere a caixa ficar disponível e remova qualquer rascunho existente antes de tentar novamente.');
}
