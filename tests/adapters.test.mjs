import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePageAdapter,getTitle} from '../dist/content/adapters.js';
test('adaptadores distintos por provedor e domínio estrito',()=>{
 assert.equal(resolvePageAdapter('https://chatgpt.com/c/abcdefgh')?.provider,'chatgpt');
 assert.equal(resolvePageAdapter('https://gemini.google.com/app/abcdefgh')?.provider,'gemini');
 assert.equal(resolvePageAdapter('https://chatgpt.com.evil.test/c/abcdefgh'),null);
});
test('título é extraído como texto e tem fallback estável',()=>{
 const doc={querySelector:s=>s==='main h1'?{textContent:'Planejamento de software'}:null,title:'ChatGPT — ChatGPT'};
 assert.equal(getTitle(doc,['main h1'],'ChatGPT'),'Planejamento de software');
 assert.equal(getTitle({querySelector:()=>null,title:'Estudos - Gemini'},['main h1'],'Gemini'),'Estudos');
});
