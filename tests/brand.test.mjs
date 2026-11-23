import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function pngSignature(path) {
  const bytes = readFileSync(path);
  assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `Assinatura PNG inválida: ${path}`);
  return bytes;
}
function png(path, expectedSize) {
  const bytes = readFileSync(path);
  assert.ok(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `Assinatura PNG inválida: ${path}`);
  assert.equal(bytes.readUInt32BE(16), expectedSize, `Largura inválida: ${path}`);
  assert.equal(bytes.readUInt32BE(20), expectedSize, `Altura inválida: ${path}`);
  assert.ok(bytes.length > 350, `Imagem incompleta: ${path}`);
  return bytes;
}
test('a identidade usa o raster aprovado, não o antigo SVG redesenhado', () => {
  const source = png('assets/brand/icon-source.png', 256);
  assert.ok(createHash('sha256').update(source).digest('hex').length === 64);
  const app = readFileSync('src/ui/app.ts', 'utf8');
  const readme = readFileSync('README.md', 'utf8');
  assert.match(app, /mark\.src='assets\/icon128\.png'/);
  assert.match(readme, /assets\/brand\/readme-banner\.png/);
  pngSignature('assets/brand/readme-banner.png');
  assert.doesNotMatch(app, /chat-maestro-icon\.svg/);
});
test('os tamanhos do manifesto e do botão usam os arquivos reais', () => {
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  for (const size of [16,32,48,128]) {
    assert.equal(manifest.icons[String(size)], `assets/icon${size}.png`);
    png(manifest.icons[String(size)], size);
  }
  for (const size of [16,32]) {
    assert.equal(manifest.action.default_icon[String(size)], manifest.icons[String(size)]);
  }
});
