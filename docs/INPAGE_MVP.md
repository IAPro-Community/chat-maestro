# Integração contextual v0.5.0 — primeiro incremento P0-B

**Status:** implementação e CI validadas em nível de código; Chrome/Edge com contas autenticadas **não homologados**.

## Contraste com a referência

A extensão 8.5.7 fornecida como referência executava recursos junto à página, com menus contextuais, gerenciador e prompts. O Chat Maestro tinha ficado restrito a um painel de links. Esta etapa devolve **ações diretamente dentro dos sites**, mantendo a implementação autoral e modular.

O produto de referência possui código e termos de distribuição próprios. Não copiamos arquivos binários, código minificado nem regras de licença/assinatura dele.

## Como funciona

- A pessoa autoriza somente ChatGPT ou Gemini em **Biblioteca → Conectar**.
- `chrome.permissions.onAdded/onRemoved` reconcilia scripts registrados em `chrome.scripting.registerContentScripts`; o script somente é registrado em domínios permitidos.
- O `src/content/inpage.ts` monta o controle Maestro em Shadow DOM, acompanha mudanças de URL via MutationObserver com debounce e mantém a interface pequena.
- Ações: **salvar**, **favoritar localmente**, **mover para uma pasta local existente** e **abrir biblioteca**. Nenhuma modificação remota no provedor.
- O script envia o contrato `chat-maestro:inline:v1` ao service worker; não acessa IndexedDB diretamente, não lê tokens/cookies ou mensagens.
- O worker valida remetente da extensão, frame principal, URL de origem, URL da aba, destino canônico, provedor e permissão vigente. Caso mude de chat durante a ação, rejeita.
- `src/content/adapters.ts` separa título visível do ChatGPT e do Gemini. Reconhece URLs padrão e projeto/GPT do ChatGPT; outros formatos falham sem inventar IDs.
- Conteúdo é empacotado por esbuild como IIFE porque `chrome.scripting.registerContentScripts` não usa ESM nativo para esses arquivos. esbuild é apenas dependência de **build**, não runtime.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/domain/inpage-contract.ts` | Protocolo e verificação do contexto |
| `src/platform/inline-registration.ts` | Registro/desregistro conforme permissões |
| `src/platform/site-access.ts` | Autorização e ativação da aba já aberta |
| `src/content/inpage.ts` | Interface de ações e observação de navegação |
| `src/content/adapters.ts` | Heurísticas visíveis e específicas por provedor |
| `src/worker.ts` | Validação de mensagens e escrita local |
| `scripts/bundle-content.mjs` | Bundle IIFE separado do worker ESM |
| `tests/inpage.test.mjs` e `tests/adapters.test.mjs` | Contratos e regressão |

## Matriz de capacidades

| Capacidade | ChatGPT | Gemini |
|---|---|---|
| Detectar URLs válidas / destino | Por parser | Por parser |
| Botão contextual | Implementado, E2E pendente | Implementado, E2E pendente |
| Salvar título/link na biblioteca | Sob clique; E2E pendente | Sob clique; E2E pendente |
| Favoritar e mover para pasta local | Sob clique; E2E pendente | Sob clique; E2E pendente |
| Múltiplas contas no mesmo perfil | **Não isoladas** | **Não isoladas** |
| Conteúdo completo, anexos, histórico remoto | Não suportado | Não suportado |
| Arquivar ou apagar na conta | Não suportado | Não suportado |
| Enviar filas automaticamente | Não suportado | Não suportado |

### Segurança / privacidade

O content script passa a ser **persistente após consentimento por domínio**, mas não faz captura contínua de conversas ou armazenamento da página; observa apenas navegação para preservar o botão contextual. O worker volta a conferir a autorização antes de cada comando.

O estado `accountVerified:false` é intencional. **Não** usamos rótulos de usuário ou emails do DOM como prova de conta. Sem isolamento `provider + accountScope + conversationId`, não habilitar ações remotas, nem declarar suporte seguro a múltiplas contas.

## Gates para a próxima fase

- [ ] Teste E2E real no Chrome e Edge, em contas de teste separadas, com permissão concedida/negada/revogada.
- [ ] Navegação SPA e URLs de projeto, sem duplicação de botão.
- [ ] Modelar accountScope com migração de IndexedDB/backup sem perder dados.
- [ ] Ações de pasta integradas à sidebar do assistente (sem sobrepor o compositor) após verificar seletores reais.
- [ ] Captura visual verdadeira da extensão funcionando, não imagem gerada.
- [ ] Homologar comportamento de conteúdo/DOM específico do Gemini antes de anunciar suporte pleno.

## Referências verificadas

- https://developer.chrome.com/docs/extensions/reference/api/scripting
- https://developer.chrome.com/docs/extensions/reference/api/permissions
- https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- https://playwright.dev/docs/chrome-extensions
- https://github.com/nbslabs/tracely
- https://github.com/jayakeshav/Gemini-Folder-Extenstion
- https://github.com/benedyktdryl/gpt-organizer
