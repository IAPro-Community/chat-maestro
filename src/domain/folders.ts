import type {Folder} from './types.js';
export interface FolderNode {folder:Folder;depth:number;path:string}
export function folderTree(folders:Folder[]):FolderNode[]{
  const byId=new Map<string,Folder>();
  for(const f of folders){
    if(!f.id||byId.has(f.id)||!f.name.trim()||f.name.length>80)throw Error('Pasta inválida ou duplicada.');
    byId.set(f.id,f);
  }
  const children=new Map<string,Folder[]>();
  for(const folder of folders){
    const parent=folder.parentId??null;
    if(parent!==null&&!byId.has(parent))throw Error('Subpasta com pasta-pai inexistente.');
    const key=parent??'';
    if(!children.has(key))children.set(key,[]);
    children.get(key)!.push(folder);
  }
  for(const items of children.values())items.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const result:FolderNode[]=[];
  const stack=new Set<string>();
  function visit(folder:Folder,depth:number,prefix:string):void{
    if(stack.has(folder.id))throw Error('Ciclo entre pastas.');
    if(depth>12)throw Error('Hierarquia excede 12 níveis.');
    stack.add(folder.id);
    const path=prefix?prefix+' / '+folder.name:folder.name;
    result.push({folder,depth,path});
    for(const child of children.get(folder.id)??[])visit(child,depth+1,path);
    stack.delete(folder.id);
  }
  for(const root of children.get('')??[])visit(root,0,'');
  if(result.length!==folders.length)throw Error('Pasta cíclica ou desconectada.');
  return result;
}
export function folderDescendants(folders:Folder[],parentId:string):Set<string>{
  const descendants=new Set<string>();
  for(const row of folderTree(folders)){
    if(row.folder.id===parentId)continue;
    let parent=row.folder.parentId??null;
    while(parent){
      if(parent===parentId){descendants.add(row.folder.id);break;}
      parent=folders.find(f=>f.id===parent)?.parentId??null;
    }
  }
  return descendants;
}
