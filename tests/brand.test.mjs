import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

test('conductor brand source is versioned', () => {
  const svg = readFileSync('assets/chat-maestro-icon.svg', 'utf8');
  assert.match(svg, /viewBox="0 0 128 128"/);
  assert.match(svg, /M83 59 108 29/);
  assert.match(svg, /#cf123e/);
  assert.ok(existsSync('assets/chat-maestro-wordmark.svg'));
});

test('PNG browser icons have the expected dimensions', () => {
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  for (const size of [16,32,48,128]) {
    const path = manifest.icons[String(size)];
    const data = readFileSync(path);
    assert.ok(data.subarray(0,8).equals(signature), `Assinatura PNG inválida: ${path}`);
    assert.equal(data.readUInt32BE(16), size, `Largura inválida: ${path}`);
    assert.equal(data.readUInt32BE(20), size, `Altura inválida: ${path}`);
  }
});
