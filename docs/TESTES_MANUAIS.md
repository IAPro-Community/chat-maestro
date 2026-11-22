# Homologação manual v0.2.0

Marque cada caso antes da publicação. **Os testes automatizados não substituem estes cenários.**

- [ ] Nova instalação: abrir painel, navegar por 4 seções e fechar/reabrir sem console errors.
- [ ] Atualização da v0.1 no mesmo ID: manter pastas, conversas, flags, prompts e rotina opt-in configurada.
- [ ] Restaurar backup v1: converter para v2, manter IDs e dados, desativar automação por segurança.
- [ ] ChatGPT: salvar conversa aberta, capturar links visíveis e abrir a conversa salva.
- [ ] Gemini: salvar conversa em `/app/:id`, capturar links visíveis se existirem e abrir a conversa salva.
- [ ] Gemini com barra lateral renderizada sem âncoras: erro claro e funcionalidade manual disponível.
- [ ] Conversas ChatGPT e Gemini com mesmo ID nativo: dois registros independentes.
- [ ] Filtrar ChatGPT / Gemini / Todos e pesquisar títulos com acentos.
- [ ] Selecionar visíveis, arquivar, restaurar, proteger, mover e exportar em JSON, TXT e Markdown; verificar que não alterou a conta.
- [ ] Trocar filtros com seleção ativa: seleção limpa e nenhuma conversa oculta recebe operação em lote.
- [ ] Criar/editar/copiar prompts com variáveis; usar estruturar prompt sem conexão; clicar inserir em cada provedor, sem enviar.
- [ ] Testar a função inserir com editor não encontrado: erro claro e sem alteração da página.
- [ ] Fazer backup v2, restaurar, garantir ausência de IDs duplicados e preservar regra/flags.
- [ ] Confirmar que capturas via DOM **não** ganham datas verificadas nem são arquivadas automaticamente por antiguidade.
- [ ] Verificar permissões: sem host_permissions e sem content_scripts persistentes; apenas activeTab por gesto do usuário.
- [ ] Simular grande quantidade de conversas e registrar problemas de desempenho para P1.

## Fila v0.3.0
- [ ] Enfileirar 2 mensagens em uma conversa ChatGPT, mover posição, editar uma e reiniciar extensão: os dados persistem.
- [ ] Repetir em Gemini; mesma ID nativa de ChatGPT não mistura filas.
- [ ] Abrir outra conversa antes de Preparar: a extensão deve recusar sem inserir texto.
- [ ] Preencher um rascunho na caixa antes de Preparar: a extensão deve recusar sem alterar o rascunho.
- [ ] Preparar a primeira e tentar a segunda sem confirmar a primeira: deve bloquear FIFO.
- [ ] Restaurar backup v3: fila preservada; restaurar backup v2: fila vazia.
- [ ] Recarregar página após preparar: mensagem permanece marcada como preparada.
- [ ] Limpeza de dados locais remove a fila; nenhuma ação ocorre na conta do provedor.
- [ ] Revisar prévia da limpeza e exportar seleção antes de aplicar.
