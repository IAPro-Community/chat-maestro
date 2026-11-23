# Instalar o Chat Maestro no Google Chrome

> **Versão de desenvolvimento: 0.4.1.** O Chat Maestro ainda não está publicado na Chrome Web Store. A instalação é feita pelo modo de desenvolvedor, e a compatibilidade visual com sessões autenticadas de ChatGPT e Gemini ainda precisa de homologação.

## Opção recomendada: instalar sem programar

**Você não precisa instalar Node.js, Git, npm nem executar comandos para usar a extensão.**

### 1. Baixe o ZIP instalável

**[⬇ Baixar Chat Maestro para Chrome (.zip) — prévia de desenvolvimento](https://github.com/IAPro-Community/chat-maestro/releases/download/preview/chat-maestro-preview.zip)**

O link leva diretamente ao arquivo `chat-maestro-preview.zip` publicado em [GitHub Releases](https://github.com/IAPro-Community/chat-maestro/releases/tag/preview). Não é preciso abrir o GitHub Actions, escolher uma execução ou fazer login no GitHub.

1. Baixe o arquivo `.zip`.
2. **Extraia o ZIP uma única vez** para uma pasta fixa, por exemplo `Documentos/Chat-Maestro` no Windows.
3. A pasta extraída deve conter diretamente `manifest.json`, `panel.html`, `worker.js` e os demais arquivos.
4. Não remova nem renomeie essa pasta após carregar a extensão no Chrome.

> **Importante:** o Chrome não instala um arquivo ZIP diretamente. Use **Carregar sem compactação** na pasta extraída. O botão **Code → Download ZIP** do GitHub baixa o código-fonte, que exige compilação, e não deve ser usado como instalador.

O download direto aponta para a **prévia mais recente publicada** a partir de um build aprovado da branch `main`. É uma distribuição de teste, ainda não homologada para produção. Se preferir compilar manualmente, há instruções no fim deste guia.

### 2. Ative o modo desenvolvedor

No Chrome, acesse:

```text
chrome://extensions
```

Ative **Modo do desenvolvedor** no canto superior direito.

### 3. Carregue a pasta extraída

1. Clique em **Carregar sem compactação** (Load unpacked).
2. Selecione a **pasta que contém diretamente o arquivo `manifest.json`**.
3. Confirme que o cartão da extensão mostra **Chat Maestro** e a versão esperada.

Estrutura esperada da pasta selecionada:

```text
Chat-Maestro/
├── manifest.json
├── panel.html
├── worker.js
├── assets/
├── domain/
├── platform/
└── ui/
```

### 4. Abra o painel

Clique no ícone **Extensões** (quebra-cabeça) no canto superior direito do Chrome, fixe o **Chat Maestro** e clique no ícone da extensão.

O Chrome abrirá o painel lateral do Chat Maestro. Se não abrir, consulte a seção *Solução de problemas*.

### 5. Faça o primeiro teste

1. Abra uma conversa em `https://chatgpt.com` ou `https://gemini.google.com`.
2. No painel do Chat Maestro, em **Biblioteca** clique em **ChatGPT · conectar** ou **Gemini · conectar** e aceite a autorização de acesso solicitada pelo Chrome; também existem controles em **Dados**. Depois clique em **Salvar conversa aberta**.
3. Confira a nova entrada em **Biblioteca**.
4. Teste favoritos, pastas e pesquisa antes de ativar regras de organização.
5. Na aba **Prompts**, você pode preparar mensagens em fila, mas o **envio é manual**.

**Atenção:** o arquivamento automático existente altera somente a biblioteca **local** da extensão. Ele **não arquiva ou apaga conversas na sua conta** ChatGPT/Gemini.

## Atualização sem perder dados

1. Abra a extensão e crie um **backup** na área **Dados**. Guarde o arquivo em local seguro: ele pode conter texto das suas conversas.
2. Abra `chrome://extensions` e observe qual pasta foi carregada. **Não remova a extensão**.
3. Extraia o novo ZIP instalável e **substitua os arquivos na mesma pasta da instalação anterior** (preservando o caminho).
4. No cartão do Chat Maestro, clique em **Recarregar** (ícone circular).
5. Confirme a nova versão e que Biblioteca, pastas, prompts e fila permanecem disponíveis.

> Se instalar como uma extensão diferente (por exemplo, escolhendo outra pasta), o Chrome pode gerar outro ID e o IndexedDB anterior **não será compartilhado**. Nesse caso, importe o backup pela área **Dados**. Nunca exclua uma instalação com dados importantes antes de confirmar a restauração.

## Solução de problemas

| Sintoma | Verificação / solução |
| --- | --- |
| **Carregar sem compactação** não encontra uma extensão | Selecione a pasta **interna** que contém `manifest.json`, não o ZIP e não a pasta acima dela. |
| **Manifest file is missing or unreadable** | O pacote não foi extraído corretamente ou a pasta selecionada está incorreta. |
| **O ícone não aparece no topo** | Abra o menu **Extensões** do Chrome e fixe o Chat Maestro. |
| **O painel não abre** | Confira se a extensão está ativada em `chrome://extensions`, clique em **Recarregar**, reabra a aba e tente o ícone novamente. |
| **Mensagem de falta de acesso mesmo com ChatGPT aberto** | Use **Conectar ChatGPT** na Biblioteca ou Dados. Sem autorização, o Chrome pode ocultar a URL da aba para extensões de painel lateral. |
| **A conversa não é detectada** | Confirme o endereço da conversa; tente **Salvar conversa aberta**. Captura de links e inserção dependem do DOM de cada provedor e ainda não estão homologadas. |
| **Não consigo enviar a fila automaticamente** | É comportamento esperado: **preparação e confirmação são manuais** nesta versão. |
| **A limpeza não removeu chats do ChatGPT/Gemini** | É comportamento esperado: o arquivo é apenas da biblioteca local. |
| **Dados desapareceram após reinstalação** | Verifique se a nova pasta criou outro ID de extensão. Reimporte o backup, se disponível. |
| **Chrome mostra erros no service worker** | Em `chrome://extensions` → **Detalhes/Erros**, copie a mensagem e [abra uma issue](https://github.com/IAPro-Community/chat-maestro/issues) com Chrome, versão e passos (sem conversas ou dados pessoais). |

## Para desenvolvedores: construir a partir do fonte

Requer **Node.js 22+**:

```bash
git clone https://github.com/IAPro-Community/chat-maestro.git
cd chat-maestro
npm install
npm run package
```

O comando executa o build e os testes e gera `release/chat-maestro-v<versao>-instalar.zip`. Para desenvolvimento, também é possível carregar diretamente a pasta `dist/`.

## Segurança e limitações atuais

- Extensão Manifest V3, com permissões `sidePanel`, `storage`, `alarms` e `scripting`. Permissões opcionais são solicitadas por provedor, somente para `chatgpt.com`, `chat.openai.com` e `gemini.google.com`; o usuário pode revogá-las nas configurações do Chrome.
- Dados de biblioteca e fila ficam no navegador; **backups exportados não são criptografados**.
- O acesso às páginas é pontual, por ação do usuário; não há captura permanente dos sites.
- A extensão **não** usa APIs privadas nem desbloqueia assinaturas de terceiros.
- Testes de código/CI não substituem homologação prática em Chrome com contas reais.
- Produto independente e **não afiliado à OpenAI ou ao Google**.

Veja o [README](../README.md), o [roadmap](ROADMAP.md) e o [checklist de homologação](TESTES_MANUAIS.md).
