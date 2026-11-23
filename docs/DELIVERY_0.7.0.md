# Chat Maestro 0.7.0 — status e critérios

**Status:** implementação em código, sem homologação Chrome/Edge autenticada (responsabilidade separada do mantenedor). Não marcar a issue #1 como concluída.

| Funcionalidade | Implementação | Limitação |
| --- | --- | --- |
| Segregação por perfil | Sim | Não identifica a conta autenticada |
| Pastas aninhadas | Sim | Integração visual com sidebar ainda experimental |
| Busca indexada | Sim, dados locais | Carregamento de filtros e contadores ainda usa memória; 10k/50k não validado |
| Notas e destaques | Sim, locais | Sem ID de mensagem remota confirmado |
| Prompt chains | Sim, manual | Sem envio automático |
| Fila com pausa/retomada | Sim | Envio manual |
| Salvar links visíveis do sidebar | Sim, por clique | DOM real de cada provedor não homologado |
| Arquivar na conta | Revisão assistida | Usuário usa menu nativo; extensão não confirma remotamente |
| Auto-send | Não habilitado | Exige conta/destino/verificação de término e E2E |
| Outline e links entre conversas | Não | P2 |

O conteúdo do histórico remoto não é capturado silenciosamente. O índice pesquisa apenas títulos e mensagens efetivamente presentes no IndexedDB. O backup inclui notas/sequências e mantém compatibilidade com v1/v2/v3. Perfis são locais e manuais: **não há comprovação de login**.

**Critérios do usuário para fechamento:** [testes manuais](TESTES_MANUAIS.md), [issue #1](https://github.com/IAPro-Community/chat-maestro/issues/1), [issue #2](https://github.com/IAPro-Community/chat-maestro/issues/2).

Referências: [Chrome Content Scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts), [Storage](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies), [Permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions), [Prompt Stacker](https://github.com/thegreatLUCY/prompt-stacker), [GPT Conversation Toolkit](https://github.com/bujue3709/GPT-Conversation-Toolkit).
