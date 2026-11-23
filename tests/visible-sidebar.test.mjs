import test from 'node:test';
import assert from 'node:assert/strict';
import {validateVisibleLink,parseInlineRequest,INLINE_MESSAGE} from '../dist/domain/inpage-contract.js';
const origin='https://chatgpt.com/c/abcdefghij';
const another='https://chatgpt.com/c/klmnopqrst';
test('ações locais em links da barra lateral exigem mesmo domínio e provedor',()=>{
 assert.equal(validateVisibleLink(origin,origin,another)?.url,another);
 assert.equal(validateVisibleLink(origin,origin,'https://gemini.google.com/app/abcdefghi'),null);
 assert.equal(validateVisibleLink(origin,origin,'https://chatgpt.com.evil.test/c/abcdefghij'),null);
 assert.equal(validateVisibleLink(origin,origin,'https://chatgpt.com/'),null);
});
test('salvar referência exige perfil explícito e valida contrato',()=>{
 assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'saveVisible',href:another}),null);
 assert.equal(parseInlineRequest({type:INLINE_MESSAGE,action:'saveVisible',href:another,profileId:'01234567-89ab-4def-8abc-0123456789ab'})?.action,'saveVisible');
});
