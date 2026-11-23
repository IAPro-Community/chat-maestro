import type {Chat} from './types.js';
export interface SearchPosting {id:string;chatId:string;term:string}
const MAX_TERMS=1200;
export function words(value:string):string[]{
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
    .match(/[\p{L}\p{N}]{2,60}/gu)??[];
}
export function indexTerms(chat:Chat):string[]{
  const unique=new Set<string>();
  for(const word of words(chat.title))if(unique.size<MAX_TERMS)unique.add(word);
  for(const item of chat.messages){
    if(unique.size>=MAX_TERMS)break;
    for(const word of words(item.text)){
      unique.add(word);
      if(unique.size>=MAX_TERMS)break;
    }
  }
  return [...unique];
}
export function queryTerms(query:string):string[]{
  return [...new Set(words(query))].slice(0,8);
}
export function intersectPostings(groups:readonly string[][]):string[]{
  if(!groups.length)return [];
  const [base,...rest]=[...groups].sort((a,b)=>a.length-b.length);
  const lookup=rest.map(group=>new Set(group));
  return (base??[]).filter(id=>lookup.every(s=>s.has(id)));
}
export function posting(chatId:string,term:string):SearchPosting{
  return {id:term+'\u0000'+chatId,chatId,term};
}
