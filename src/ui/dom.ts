import {parseConversationUrl} from '../domain/providers.js';
export function el<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text?:string):HTMLElementTagNameMap[K]{
  const item=document.createElement(tag);if(className)item.className=className;if(text!==undefined)item.textContent=text;return item;
}
export function action(label:string,handler:()=>void|Promise<void>,variant:'primary'|'quiet'|'danger'='quiet'):HTMLButtonElement{
  const b=el('button',`btn ${variant}`,label);b.type='button';b.addEventListener('click',()=>{void Promise.resolve().then(handler).catch(err=>notify(err instanceof Error?err.message:String(err),true));});return b;
}
export function notify(message:string,error=false):void{
  const toast=document.getElementById('toast');if(!toast)return;
  toast.textContent=message;toast.className=`toast ${error?'is-error':'is-ok'}`;
  window.setTimeout(()=>{if(toast.textContent===message)toast.className='toast';},5500);
}
export function field(label:string,input:HTMLElement):HTMLElement{
  const wrapper=el('label','field');const name=el('span','field-label',label);wrapper.append(name,input);return wrapper;
}
export function empty(message:string):HTMLElement{return el('p','empty',message);}
export function buttonRow(...buttons:HTMLElement[]):HTMLElement{const row=el('div','buttons');row.append(...buttons);return row;}
export function formatDate(time:number|null):string{if(!time)return 'Data desconhecida';return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(time));}
export function safeOpen(url:string):void{
  const ref=parseConversationUrl(url);
  if(!ref)throw Error('URL de conversa inválida.');
  void chrome.tabs.create({url:ref.url,active:true});
}
export function downloadText(filename:string,text:string,type='text/plain;charset=utf-8'):void{
  const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function confirmAction(message:string):boolean{return window.confirm(message);}
