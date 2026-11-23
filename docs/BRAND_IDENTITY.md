# Identidade visual — Chat Maestro

## Origem e fidelidade

O ícone oficial do **Chat Maestro** é uma versão otimizada **diretamente da arte conceitual aprovada**: balão/maestro, gravata-borboleta, batuta branca, movimento curvo em vermelho-bordô e estrela. Não é um SVG redesenhado por aproximação.

A fonte versionada é `assets/brand/icon-source.png` (256 × 256 px). Os PNGs em `assets/icon16.png`, `icon32.png`, `icon48.png` e `icon128.png` são artefatos prontos para instalação. O ícone de 16 px é uma redução deliberada: detalhes finos podem se fundir, porém a silhueta e o contraste permanecem.

## Arquivos e integrações

| Arquivo | Uso |
| --- | --- |
| `assets/brand/icon-source.png` | Fonte raster canônica para evolução dos ícones |
| `assets/icon16.png` | Barra de ferramentas / ação Chrome |
| `assets/icon32.png` | Interface / ação Chrome e favicon do painel |
| `assets/icon48.png` | Gerenciador de extensões |
| `assets/icon128.png` | Manifest V3, painel lateral e README |

O `manifest.json` declara tanto `icons` quanto `action.default_icon`. O painel carrega `icon128.png`. O script `scripts/assets.mjs` distribui apenas os arquivos necessários no `dist/`.

## Regenerar

O projeto não depende de bibliotecas gráficas no runtime. Para regenerar os PNGs somente se a fonte for alterada:

```bash
python -m pip install "Pillow>=11,<13"
python scripts/generate-icons.py
npm run package
```

O SVG anterior foi retirado intencionalmente porque divergia da identidade aprovada. Não o reutilize, mesmo que pareça mais conveniente trabalhar com vetor.

## Critérios de aceitação

- Verificar tamanhos e integridade PNG automaticamente (`tests/brand.test.mjs`).
- Usar imagens locais empacotadas e não links de terceiros.
- Sem permissões adicionais, código remoto ou recursos de marca externos.
- Revisar visualmente os ícones em 16/32/48/128 px em Chrome real, em temas claro e escuro.
- Imagens ilustrativas não devem ser descritas como capturas reais da extensão.
- A marca não é associada oficialmente a OpenAI ou Google.

> A fonte original em alta resolução da arte conceitual permanece no histórico de criação; o arquivo versionado de 256 px é a referência operacional do projeto.
