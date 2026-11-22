# Roadmap ordenado — pequeno e sustentável

## P0: homologar 0.3.0 antes de anunciar compatibilidade definitiva

- Instalar/atualizar a v0.1 sem perder IndexedDB, prompts, pastas e regras.
- Em sessão real de ChatGPT e Gemini, salvar conversa aberta e capturar sidebar quando houver links válidos.
- Compor prompt, conferir o campo correto e **garantir que não envie** automaticamente.
- Verificar textos longos, unicode, entradas maliciosas e exportação de 100 conversas.
- Executar os cenários em docs/TESTES_MANUAIS.md.

## P1: fila e integração confiável

- Homologar manualmente a inserção da fila em ChatGPT e Gemini, com rascunho, troca de chat, resposta em curso e reinício de aba.
- Depois criar executor automático **opt-in** por provedor com detecção de término e idempotência. Não habilitar sem evidências E2E.
- Implementar isolamento explícito por conta/workspace antes de automatizar ações nas contas.

## P1: performance e integração confiável

- Índice incremental de títulos/mensagens e paginação em IndexedDB; evitar leitura de tudo na UI.
- Adaptadores de DOM com diagnósticos e fixtures por provedor; smoke tests automatizados em Chrome dedicado.
- Importação Gemini a partir de um formato **estável e confirmado**. Não assumir que Google Takeout tem conversas completas no mesmo formato do ChatGPT.
- Proteção por conta/perfil no mesmo navegador; impedir misturar duas contas distintas de um mesmo provedor.

## P2: diferencial de organização

- Sugestão local de categorias com aprovação humana; detecção de títulos semelhantes; revisão mensal de conversas antigas.
- Arquivamento assistido **na conta** apenas quando a integração for verificável e cada ação for confirmada/reversível; caso contrário, não implementar.
- Favoritos por mensagem e exportação PDF somente se a captura segura de conteúdo estiver resolvida.
- Atalhos de teclado e acessibilidade aprimorados, sem prejudicar a navegação nativa dos provedores.

## Fora do MVP

Sincronização com servidores terceiros, desbloqueio de licenças alheias, scraping oculto, automações de exclusão remota, execução silenciosa de prompts e galeria pública de imagens. Evitar adicionar um framework visual só para montar quatro telas.
