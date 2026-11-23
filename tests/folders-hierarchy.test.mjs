import test from 'node:test';
import assert from 'node:assert/strict';
import {folderTree,folderDescendants} from '../dist/domain/folders.js';
const mk=(id,parentId=null)=>({id,name:id,color:'#112233',parentId});
test('hierarquia funciona com pastas legadas sem parentId',()=>{
 const rows=[{id:'a',name:'A',color:'#112233'},mk('b','a'),mk('c','b')];
 assert.deepEqual(folderTree(rows).map(x=>[x.folder.id,x.depth]),[['a',0],['b',1],['c',2]]);
 assert.deepEqual([...folderDescendants(rows,'a')].sort(),['b','c']);
});
test('valida árvore e rejeita referências quebradas e ciclos',()=>{
 assert.throws(()=>folderTree([mk('a','b'),mk('b','a')]),/cíclica/);
 assert.throws(()=>folderTree([mk('a','missing')]),/inexistente/);
 assert.throws(()=>folderTree([mk('a'),mk('a')]),/duplicada/);
});
