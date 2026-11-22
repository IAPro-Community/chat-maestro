# Chat Maestro

Extensão independente para Chrome Manifest V3 que reúne conversas do **ChatGPT** e **Gemini** numa biblioteca privada, com organização local, fila de mensagens e ferramentas de produtividade. Sem código de outras extensões, backend de cobrança ou telemetria.

**Versão 0.3.1** · TypeScript strict · IndexedDB · zero dependências de runtime · painel lateral único.

## O que funciona

| Funcionalidade | ChatGPT | Gemini |
|---|---|---|
| Salvar a conversa aberta (título e URL) | Sim | Sim |
| Capturar links visíveis na barra lateral, por clique | Sim* | Sim* |
| Buscar, favoritar, arquivar e proteger **localmente** | Sim | Sim |
| Pastas, regras de classificação e organização local diária opt-in | Sim | Sim |
| Selecionar até 100 e arquivar/restaurar/proteger/mover localmente | Sim | Sim |
| Exportar seleção em JSON, Markdown ou TXT | Sim | Sim |
| Biblioteca de prompts com variáveis e editor | Sim | Sim |
| Estruturar prompts localmente, sem API de IA | Sim | Sim |
| Inserir prompt na aba ativa sem enviar | Experimental* | Experimental* |
| Importar mensagens da exportação `conversations.json` | Sim | Não |
| Enfileirar, editar e ordenar mensagens por conversa | Sim | Sim |
| Preparar próxima mensagem no compositor sem enviar | Experimental* | Experimental* |
| Arquivar/apagar/sincronizar conversas diretamente na conta | Não | Não |

\* Recursos dependentes do DOM do site; a interface pode mudar. Quando a barra lateral não expõe links, **Salvar conversa aberta** é a alternativa. O campo de composição pode não ser encontrado em algumas interfaces; **Copiar prompt** continua disponível.

**Atenção:** arquivar na IAPro modifica apenas o IndexedDB da extensão. Nunca arquiva, exclui ou altera a conversa no ChatGPT ou Gemini. Conversas capturadas do DOM recebem **data de atividade desconhecida**, impedindo arquivamento automático baseado em antiguidade. Dados de mensagens do Gemini não são capturados pela extensão.

## Instalar

1. Descompacte o arquivo `chat-maestro-v0.3.1-instalar.zip` numa pasta fixa.
2. Chrome → `chrome://extensions` → **Modo do desenvolvedor** → **Carregar sem compactação**.
3. Selecione a pasta extraída que contém `manifest.json`.
4. Clique no ícone da extensão para abrir o painel lateral.
5. Abra `chatgpt.com` ou `gemini.google.com`, volte ao painel → **Dados** → **Salvar conversa aberta** ou **Capturar barra lateral**.
6. Organize a biblioteca em **Biblioteca**, **Organizar** ou **Prompts**. Tudo permanece local.

**Atualizando da IAPro v0.1:** substitua os arquivos **na mesma pasta** já carregada no Chrome e clique em **Recarregar** em `chrome://extensions` (não adicione como nova pasta/novo ID); `openDB` migra os registros antigos para incluir `provider: chatgpt`. Como alternativa, exporte um backup v1 antes, instale a nova extensão e restaure pela aba Dados. Backups v1 são convertidos para v2. Uma instalação com ID diferente não compartilha os dados da antiga.

## Desenvolvimento

Node.js 22+, `npm install`, `npm test`, `npm run build`, `npm run package`.

```text
src/
  domain/              # entidades; parsers de URLs por provedor; organizador; exportador; prompts
  platform/            # persistência IndexedDB; backup; captura opt-in; injeção opt-in no composer
  ui/screens/          # Biblioteca / Organizar / Prompts / Dados
  worker.ts            # eventos de instalação e rotina local diária (chrome.alarms)
tests/                 # contratos, importação, organização, segurança e migração
scripts/               # build verificável e ZIP sem dependências de runtime
docs/                  # arquitetura, concorrentes e checklist de homologação
```

O build Chrome MV3 não utiliza `host_permissions` nem content scripts persistentes. O código de página só roda após ação explícita do usuário com `activeTab` e `scripting`. Não usa endpoints privados, tokens, cookies, código remoto, eval nem chamadas para desbloquear funcionalidades pagas de terceiros. Não tem vínculo com OpenAI ou Google.

## Fila de mensagens (v0.3)

Na aba **Prompts → Fila de mensagens**, selecione uma conversa aberta do ChatGPT ou Gemini, enfileire até 30 textos, reordene-os e use **Preparar próxima na aba ativa**. A extensão apenas preenche o campo quando ele está vazio, após conferir o destino. **O envio é manual:** depois de enviar, clique em **Confirmar que enviei** para liberar a próxima. Não existe execução automática ou agendamento de prompts nesta versão. O backup v3 preserva a fila; backups v1/v2 continuam aceitos.

Na aba **Organizar**, exporte em JSON as conversas sugeridas antes de aplicar a limpeza local. Dentro do painel, **Ctrl/Cmd+K** abre a busca na Biblioteca.

## Privacidade e confiabilidade

- Dados de conversas são guardados em IndexedDB da extensão e configurações em `chrome.storage.local`, restrito a contextos confiáveis.
- Importações são explícitas, limitado a 50 MB por JSON, e backups contêm texto em claro: cuide do arquivo exportado.
- O importador do ChatGPT processa somente o ramo textual atual; não extrai mídia e outros ramos. O export do Google Takeout não é interpretado como `conversations.json` do ChatGPT.
- A automação diária é desligada por padrão, nunca modifica as contas e somente atua em dados com data de atualização comprovada.
- Seleção em lote exige confirmação para mudanças; exportação não envia informação a serviço externo.
- 61 testes automatizados passaram; **instalação e uso em Chrome autenticado ainda exigem homologação manual**. Não afirmar que os seletores DOM foram validados em produção.

Documentos: [fila](docs/QUEUE_DESIGN.md) · [pesquisa de recursos](docs/PESQUISA_FUNCIONALIDADES.md) · [arquitetura](docs/ARCHITECTURE.md) · [referências e seleção](docs/REFERENCIAS_PREMIUM.md) · [roteiro](docs/ROADMAP.md) · [homologação](docs/TESTES_MANUAIS.md).

## Identidade e compatibilidade

O produto foi renomeado para **Chat Maestro** na versão 0.3.1. Para não perder os dados dos usuários atuais, o banco IndexedDB `iapro-optimizer-v1` e o identificador de backup `iapro-optimizer` permanecem como identificadores internos de migração. Não representam integração ou dependência do código antigo. O nome público do repositório é `IAPro-Community/chat-maestro`.
