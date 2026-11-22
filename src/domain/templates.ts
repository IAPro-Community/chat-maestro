/** Templates locais. Nenhuma interpolação executa código ou envia dados para serviços externos. */
export function variables(template:string):string[]{
  return [...new Set([...template.matchAll(/\{\{([\p{L}\p{N}_ -]{1,50})\}\}/gu)].map(match=>match[1]!.trim()))].slice(0,30);
}
export function fillTemplate(template:string,values:Record<string,string>):string{
  return template.replace(/\{\{([\p{L}\p{N}_ -]{1,50})\}\}/gu,(whole,key:string)=>
    Object.hasOwn(values,key.trim())?values[key.trim()]!:whole);
}
