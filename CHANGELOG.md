# Changelog

## 0.7.0 — Produtividade contextual e biblioteca (2026-11-23)

- Hierarquia de pastas com validação de ciclos e compatibilidade legada.
- Índice invertido local de títulos/mensagens, com migração e consultas na biblioteca.
- Destaques/notas locais e seleção de texto na página.
- Cadeias de prompts com avanço manual, fila com pausa e retomada.
- Atalho local em links visíveis da barra lateral e prevenção de destino SPA obsoleto.
- Revisão assistida de arquivo, sem mutação remota nem confirmação independente.
- Backup v4 com notas e chains; importação de versões anteriores mantida.
- Identidade autenticada e homologação Chrome/Edge reais ainda pendentes.


## 0.6.0 — Isolamento local e migração explícita (2026-11-23)

- Perfis locais ChatGPT/Gemini com IndexedDB independente para conversas, pastas, prompts e filas.
- Dados antigos preservados no Legado; cópia explícita para perfil vazio, sem excluir o banco original.
- Ações na página exigem perfil compatível e seleção manual por conversa; importação e fila bloqueiam provedores diferentes.
- Backups com metadados de origem, confirmação extra em restauração entre perfis e bloqueio de backups de outro provedor.
- Organização e configurações separadas por perfil; rotina diária desativada em novos perfis até homologação.
- Testes de IndexedDB realista simulado, migração e colisão entre perfis. Identidade autenticada e E2E no navegador permanecem pendentes.


## 0.5.1 — Validação adicional do destino (2026-11-23)

- Revalida a aba ativa e a URL imediatamente antes de salvar, favoritar ou mover após operações assíncronas; também reconfirma a permissão vigente.
- Rejeita alterações se o usuário mudou de conversa, aba ou provedor durante o processamento; testes cobrindo cenários de concorrência.
- Limitação: é um controle best-effort, não uma transação atômica entre navegação do Chrome e IndexedDB. Identificação de conta e E2E autenticado continuam pendentes.


## 0.5.0 — Primeira integração contextual (2026-11-23)

- Adicionado botão Maestro diretamente nas páginas autorizadas de ChatGPT e Gemini: salvar, favoritar e mover conversas para pastas **locais**, abrir gerenciador.
- Registro dinâmico de content scripts Manifest V3 por domínio opt-in, com bundle IIFE e adaptadores independentes de título/URL.
- Worker valida remetente, frame principal, domínio, ID da conversa e permissão antes de executar qualquer ação local.
- Suporte a conversas de projetos/GPTs ChatGPT no formato `/g/.../c/...`.
- Testes de contrato, integração estática do bundle, permissões e CI. **Homologação em conta autenticada ainda pendente**.
- **Conta não identificada**; sem sincronização remota, arquivamento de conta ou envio automático.


## 0.4.1 — Correção do acesso às abas pelo painel (2026-11-23)

- `activeTab` não é mais tratado como permissão confiável em cliques internos do painel lateral.
- Acesso opcional e explícito por provedor, com controles em Biblioteca e Dados.
- Erros distinguem página errada, URL protegida, falta de permissão e ausência de conversa específica.
- Cabeçalho e cartões mais compactos; conexão visível na Biblioteca.
- Testes de contrato de permissões adicionados. Ainda precisa homologar em Chrome/Edge autenticado.


## 0.4.0 — Navegação e fila contextual (2026-11-22)

- Layout compacto com navegação persistente e suporte ao tema escuro do navegador.
- Biblioteca com captura pontual em destaque e operações em lote apenas após seleção.
- Templates acima da fila; formulários de fila, edição e dados avançados recolhidos.
- Fila contextual detecta a conversa aberta, oculta URL avançada e exibe orientação neutra quando não há destino.
- Organização apresenta a prévia antes das configurações; corrigidos listener Ctrl/Cmd+K, ID de busca e exportação duplicados.
- 66 testes de código aprovados localmente; homologação em Chrome real ainda pendente.
- Arquivamento permanece local e envio da fila permanece manual.


## 0.3.4 — Maestro com batuta de regência, sem estrela (2026-11-22)

- Identidade refinada: mão efetivamente segurando a batuta; removido o brilho em forma de estrela que confundia o maestro com um personagem mágico.
- Atualizadas as imagens do manifesto Chrome (16/32/48/128 px), o cabeçalho do painel e o banner do README a partir da mesma fonte gráfica.
- Fonte transparente versionada em 256 px, paleta mais consistente e gerador de ícones atualizado com composição de fundo para tamanhos pequenos.
- Teste de dimensões e hashes dos arquivos garante que todos os pontos de uso permaneçam sincronizados.
- Sem ampliação de permissões ou mudanças no banco, na captura ou no envio de mensagens.
- Homologação visual/funcional em navegador autenticado e publicação na Chrome Web Store continuam pendentes.

## 0.3.3 — Marca fiel ao conceito aprovado (2026-11-22)

- Substituídos os ícones vetoriais interpretativos por PNGs derivados diretamente da arte aprovada do Chat Maestro.
- Fonte raster 256 px versionada, gerador simplificado e verificação de identidade para os quatro tamanhos MV3.
- Cabeçalho do painel, favicon, banner real do README e ícone explícito da ação do Chrome apontam para a mesma família visual.
- CI passa a validar também o empacotamento ZIP da extensão; removido um listener de teclado duplicado.
- Permissões, ID da extensão, IndexedDB e comportamento de chats/filas preservados.
- Publicação na Web Store e homologação visual no Chrome real ainda pendentes.

## 0.3.2 — Novo ícone da extensão (2026-11-22)

- Ícones Chrome 16/32/48/128 px regenerados a partir da identidade vetorial oficial com maestro e batuta.
- O README usa `assets/chat-maestro-icon.svg`, e os PNGs Chrome reproduzem a mesma identidade.
- Nenhuma mudança no comportamento, permissões ou esquema dos dados.
- Imagens conceituais produzidas anteriormente não são screenshots reais e não foram adicionadas ao README como evidência de execução.

## Identidade visual — base da versão 0.3.2

- Novo símbolo do maestro com batuta e movimento de regência, reconstruído em SVG.
- Atualizados ícones MV3 16/32/48/128 px, cabeçalho do painel e cores de destaque.
- Incluídos fonte vetorial, gerador reproduzível, documentação e testes dos ícones.
- Sem mudança de permissões, armazenamento ou captura.


## 0.3.1 — Identidade Chat Maestro (2026-11-22)

- Identidade pública de extensão, pacote, documentação e interface unificada como Chat Maestro.
- Mantidos identificadores internos de banco e backup para preservar migração e compatibilidade com IAPro Optimizer v0.3.0.
- Nenhuma alteração na semântica de arquivamento local ou fila de mensagens.

## 0.3.0 — Fila segura e organização assistida (2026-11-22)
- Fila de mensagens editável, reordenável e persistente no IndexedDB, separada por conversa ChatGPT/Gemini.
- Preparação da próxima mensagem no compositor por ação explícita, sem envio automático; validação de destino e bloqueio se já houver rascunho.
- Backup IAPro v3 inclui fila; migração de v1/v2 preservada. Limpeza total/restore limpam filas antigas atomicamente.
- Exportação de candidatos à limpeza, antes de aplicar regras. Atalho Ctrl/Cmd+K no painel.
- 61 testes automatizados (50 existentes + 11 novos). Permissões MV3 inalteradas.
- Limitação: arquivamento remoto e envio automático continuam indisponíveis; integração visual precisa de Chrome real.



## 0.2.0 — ChatGPT + Gemini

- Identificação e URLs canônicas independentes para ChatGPT e Gemini; IDs Gemini recebem namespace.
- Captura pontual de títulos/URLs da barra lateral e da conversa aberta em ambas plataformas.
- Filtro por provedor, seleção em lote até 100 registros, arquivar/restaurar/proteger/mover na biblioteca local.
- Exportação local de seleção em Markdown, TXT e JSON.
- Editor de prompts, estruturação determinística local e inserção opcional sem envio automático.
- IndexedDB v1→v2 com migração in-place e backup v1→v2 sem perder favoritos/pastas.
- 50 testes automatizados (incluindo URLs, colisão de IDs, backup e exportações).
- Sem host_permissions, content scripts permanentes ou dependências de runtime.
- Conhecido: Gemini por links/títulos, não mensagens ou histórico completo; seletores DOM aguardam homologação em Chrome real.

## 0.1.0 — Fundação

- Biblioteca IndexedDB, organização por regras e antiguidade confiável, prompts, backup e importação ChatGPT.
