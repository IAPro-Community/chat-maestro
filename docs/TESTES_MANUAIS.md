# Homologação manual v0.6.0

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
- [ ] Verificar permissões: sem host_permissions e sem content_scripts persistentes; permissões opcionais exclusivamente nos domínios ChatGPT/Gemini, sem host_permissions obrigatórias.
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

## P0 — Permissões e captura após v0.4.1

- [ ] Antes de conectar: estando no ChatGPT, tentar Salvar conversa aberta e confirmar que a mensagem explica como conceder acesso, sem dizer incorretamente que o usuário está no site errado.
- [ ] Na Biblioteca, clicar ChatGPT · conectar e aceitar a solicitação do Chrome; conferir chip conectado. Repetir separadamente com Gemini.
- [ ] Testar captura no ChatGPT após navegar entre duas conversas sem reabrir o painel; confirmar títulos/URLs corretos e sem duplicação.
- [ ] Abrir o painel antes de navegar para Gemini, navegar para uma conversa e capturar depois. A autorização deve persistir durante a sessão.
- [ ] Negar permissão do Gemini, confirmar que ChatGPT e biblioteca local continuam funcionando.
- [ ] Revogar permissão nas configurações do Chrome e confirmar erro explícito e não destrutivo.
- [ ] Abrir página inicial sem ID de conversa e confirmar que não salva um ID inventado.
- [ ] Testar o editor de prompts e fila com rascunho presente; nenhuma mensagem deve ser enviada automaticamente.
- [ ] Conferir interface em 320, 400 e 520 px, nos temas claro e escuro; screenshots somente do navegador real.

## P0 — Biblioteca ampliada

- [ ] Na Biblioteca lateral, clicar Abrir gerenciador em tela cheia. Confirmar nova aba `manager.html` sem mudar de banco, conversa ou extensão.
- [ ] A 320px, a Biblioteca continua em lista; na janela larga mostra coleções/pastas à esquerda e cartões ao centro.
- [ ] Selecionar Ativas, Todas, Favoritas, Arquivadas e pasta existente; conferir filtros, contador e busca.
- [ ] Testar tema claro/escuro, teclado, rolagem, 100 resultados e operações em lote sem perda de dados.

## P0 — integração contextual (v0.5.0)

- [ ] Autorizar somente ChatGPT; confirmar botão Maestro na página aberta e ausência no Gemini sem permissão.
- [ ] Em ChatGPT `/c/:id` e `/g/:gpt/c/:id`, verificar salvar, favoritar e mover para pasta local, sem alterar a conta.
- [ ] Em Gemini `/app/:id`, repetir ações e confirmar isolamento por provedor.
- [ ] Navegar entre conversas pela sidebar SPA; o botão não duplica e ações não modificam o ID anterior.
- [ ] Revogar permissão e atualizar a página; o botão não deve reaparecer e ações anteriores não podem gravar no banco.
- [ ] Página inicial sem conversa: permitir abrir Biblioteca, mas bloquear salvar/favoritar/mover.
- [ ] Verificar foco, contraste, abertura/fechamento e ausência de conflito com compositor nas larguras 320/400/520px.
- [ ] Confirmar mensagem de **identidade da conta não verificada**; não habilitar comandos remotos ou sincronização automática.
- [ ] Registrar screenshots reais, navegador/versão, provedor, contexto, logs e resultado antes de marcar homologado.

## P0 — Concorrência e regressão v0.5.1

- [ ] Enquanto salvar/favoritar/mover estiver aguardando resposta, alternar para outra conversa: o destino antigo não deve receber alteração atrasada.
- [ ] Enquanto a operação estiver aguardando, alternar para outra aba: o worker deve recusar a gravação local.
- [ ] Revogar permissão após clicar e antes de executar: verificar falha fechada e ausência de gravação.
- [ ] Em qualquer erro, confirmar se a operação foi concluída localmente antes de repetir; evitar operações duplicadas.

## P0 — Perfis locais e isolamento v0.6.0

- [ ] Atualizar na mesma pasta e verificar que o Legado continua acessível sem perder dados.
- [ ] Criar dois perfis ChatGPT e um Gemini; salvar o mesmo ID em dois perfis, com títulos/favoritos distintos.
- [ ] Confirmar ausência de gravação in-page quando não há perfil selecionado; troca de conversa deve limpar a seleção.
- [ ] Captura, importação e fila devem rejeitar provedor diferente do perfil ativo.
- [ ] Copiar Legado para perfil vazio com preservação da origem; repetir cópia no mesmo destino deve falhar sem sobrescrever.
- [ ] Backup de outro perfil: exigir segunda confirmação; backup com outro provedor: bloquear.
- [ ] Abrir painéis/manager com diferentes perfis e validar ausência de interferência entre bancos.
- [ ] Confirmar em Chrome e Edge reais, duas contas autenticadas, navegação SPA, permissões e ausência de mutações remotas.
