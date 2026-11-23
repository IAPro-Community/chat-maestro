# Changelog

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
