import test from 'node:test';
import assert from 'node:assert/strict';
import {newQueueMessage,normalizeQueuedMessage,nextPending} from '../dist/domain/queue.js';
const url='https://chatgpt.com/c/abcdefgh1234567';
test('fila pausada não permite preparar próxima mensagem e mantém destino',()=>{
  const first=newQueueMessage(url,'Primeira',[],'uuid-abcdefgh');
  const paused=normalizeQueuedMessage({...first,status:'paused'});
  assert.equal(nextPending([paused],url),undefined);
  assert.equal(paused.conversationId,first.conversationId);
  assert.equal(nextPending([{...paused,status:'pending'}],url)?.id,first.id);
});
