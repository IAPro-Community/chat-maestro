# Identidade visual — Chat Maestro

A metáfora visual é um **maestro que conduz conversas**. O balão simboliza os chats, a gravata representa a regência e a batuta remete a organizar as interações entre assistentes de IA.

O símbolo não é uma marca oficial de ChatGPT, Gemini, OpenAI ou Google.

## Arquivos oficiais

| Caminho | Uso |
| --- | --- |
| `assets/chat-maestro-icon.svg` | SVG-fonte, ícone do cabeçalho |
| `assets/chat-maestro-wordmark.svg` | Assinatura horizontal em material e documentação |
| `assets/icon16.png` | Barra de ferramentas |
| `assets/icon32.png` | Interface de extensões |
| `assets/icon48.png` | Gerenciador de extensões |
| `assets/icon128.png` | Distribuição Chrome MV3 |

A arte vetorial é uma **reconstrução técnica fiel ao conceito aprovado**, não um arquivo-fonte extraído da arte de apresentação. Edite o SVG e regenere os PNGs, em vez de editar cada resolução separadamente.

## Paleta

- Grafite profundo: `#13101C`
- Bordô: `#CF123E`
- Branco: `#FFFFFF`
- Texto bordô da assinatura: `#C9143F`

## Atualização dos ícones

A geração de PNG é opcional e ocorre fora do build principal: a extensão não depende de biblioteca gráfica de runtime.

```bash
python -m pip install "CairoSVG>=2.8,<3" "Pillow>=11,<13"
python scripts/generate-icons.py
npm test
npm run package
```

O gerador usa o SVG-fonte e grava todos os tamanhos do manifesto. O teste `tests/brand.test.mjs` confere presença, assinatura PNG e dimensões. Inspecione o resultado em Chrome real antes da publicação.

## Regras de aplicação

- Preservar a batuta e o movimento de regência; não transformar a marca num mascote genérico de IA.
- Não reduzir a imagem de apresentação inteira para servir de ícone.
- Não usar bitmap para substituir o texto da UI.
- Não adicionar efeitos que reduzam contraste em 16 px.
- Não ampliar permissões MV3 por motivos de identidade visual.
