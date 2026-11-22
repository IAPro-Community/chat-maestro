# Arquitetura — Chat Maestro 0.2.0

**Chrome-first, Manifest V3 e monólito modular.** Nenhum framework visual ou backend é exigido para este escopo. A UI não conhece detalhes da implementação do IndexedDB além dos casos de uso que importa.

- `src/domain/providers.ts`: normalização das URLs, validação e identidade dos provedores; `gemini:<nativeId>` evita colisão com IDs ChatGPT existentes.
- `src/domain/importer.ts`: importação do export oficial ChatGPT, links de sidebar e links de conversa aberta. Nunca inventa timestamps comprovados.
- `src/domain/organizer.ts`: políticas determinísticas, limite de lote, proteção de fixadas, pastas, recentes e datas desconhecidas; API pura.
- `src/domain/exporter.ts`: exportação JSON, Markdown e TXT sem I/O, para teste isolado.
- `src/domain/prompt-coach.ts`: estruturação determinística de prompts. Não diz ser LLM.
- `src/platform/db.ts`: IndexedDB com transações e migração v1→v2 in-place. Preserva o nome do banco para não perder dados.
- `src/platform/capture.ts`: captura pontual pela API `chrome.scripting` usando `activeTab`; leitura de links e títulos, não cookies, armazenamento da página ou mensagens.
- `src/platform/composer.ts`: inserção **manual** no campo da aba ativa, isolada da lógica de envio. Se não encontrar editor, falha sem transmitir.
- `src/platform/backup.ts`: backup v2 com provedor explícito, leitura de v1 e validação de URLs e referências.
- `src/ui/screens/`: quatro seções, sem duplicação entre provedores.
- `src/worker.ts`: rotina de organização local opcional via alarms. Worker não é servidor e não deve manter estado global para execução duradoura.

## Fronteiras de confiança

1. `chatgpt.com` e `gemini.google.com` são **páginas não confiáveis**. O código injetado somente lê links/títulos ou insere texto após ação do usuário.
2. URLs entram no domínio via `parseConversationUrl`, permitindo apenas HTTPS, host exato, rotas `/c/:id` e `/app/:id`, sem query/string de rastreio persistida.
3. Nenhuma API privada ou endpoint não documentado é usada. Arquivamento real na conta não está implementado.
4. Backups são **dados externos**, validados antes de substituir o banco; configurações de automação retornam desligadas após restauração.
5. Erros de DOM precisam ser informativos e **não** provocar ações destrutivas. Regressões no Gemini não podem afetar bibliotecas ChatGPT.

## Restrições conhecidas

A pesquisa de conteúdo ainda carrega metadados e mensagens na memória para a busca; precisa índice/paginação para bibliotecas enormes. A captura de Gemini depende de links no DOM e não é uma integração oficial. O editor de ambas plataformas pode mudar sem aviso. Não há separação por conta quando múltiplos perfis dos mesmos provedores são usados dentro do mesmo perfil Chrome — antes da automação remota, essa distinção é obrigatória.
