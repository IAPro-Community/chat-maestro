# Identidade visual — Chat Maestro

## Conceito aprovado

A marca do Chat Maestro utiliza **um personagem em forma de balão de conversa atuando como maestro**: rosto minimalista com dois olhos, gravata-borboleta e **mão segurando uma batuta de regência**. O movimento do chapéu/arco em vermelho expressa organização e direção.

A batuta tem **ponta simples, sem estrela**. Uma estrela, faísca ou brilho na ponta faz a batuta parecer uma varinha mágica e não deve ser reintroduzida. Não há robô tridimensional, efeito neon ou ícones de circuitos.

A identidade é raster baseada em uma arte gerada e tratada para uso na extensão. **Não há vetor nativo correspondente aprovado**. Não afirmar que esses PNGs são SVG ou arte integralmente vetorial.

## Fonte e derivados

| Caminho | Função |
| --- | --- |
| `assets/brand/icon-source.png` | Mascote transparente canônico, 256 × 256 px |
| `assets/brand/readme-banner.png` | Logotipo com assinatura horizontal para o GitHub, 750 × 225 px |
| `assets/icon16.png` | Ícone da barra do navegador |
| `assets/icon32.png` | Ícone de ação e favicon do painel |
| `assets/icon48.png` | Gerenciador de extensões |
| `assets/icon128.png` | Ícone de instalação e identidade no painel |

Os ícones seguem fundo grafite `#130C1C`, branco e vermelho-bordô como destaque. O PNG de 16 px privilegia o reconhecimento geral do contorno; os detalhes da mão não precisam ser perfeitamente legíveis nessa escala.

O `manifest.json` usa os caminhos acima em `icons` e `action.default_icon`. O `src/ui/app.ts` usa `assets/icon128.png` no cabeçalho; o `panel.html` usa `assets/icon32.png` como favicon. O `scripts/assets.mjs` leva apenas os ícones necessários ao pacote MV3. O banner do README e a fonte transparente não entram no ZIP distribuído.

## Regeneração dos ícones

A fonte do mascote é versionada. Use o gerador somente quando alterar os ícones — ele não é parte do build de produção e não adiciona dependências ao runtime:

```bash
python -m pip install "Pillow>=11,<13"
python scripts/generate-icons.py
npm run package
```

O gerador compõe um fundo grafite com cantos arredondados, aplica o enquadramento e exporta 16, 32, 48 e 128 px. **Ao mudar a fonte ou o gerador, atualize os hashes em `tests/brand.test.mjs` conscientemente**, após revisão visual. Não substitua imagens com uma reconstrução vetorial aproximada.

## Validação e restrições

- Conferir dimensões e hashes dos PNGs com `npm test`, e gerar o ZIP com `npm run package`.
- Verificar a barra de ferramentas, gerenciador, favicon e painel lateral em Chrome real, com temas claro e escuro.
- Não aumentar permissões do Manifest V3, nem incorporar links externos de imagens ou código remoto.
- Não tratar ilustrações de marca como screenshots da extensão em funcionamento.
- Não afirmar publicação na Chrome Web Store sem homologação e envio reais.
- A marca não representa afiliação oficial à OpenAI ou ao Google.

**Limitação:** a fonte operacional é um PNG de 256 px, não um arquivo vetorial escalável. Para aplicações impressas ou formatos muito maiores, será necessário preparar um vetor revisado especificamente a partir desta identidade.
