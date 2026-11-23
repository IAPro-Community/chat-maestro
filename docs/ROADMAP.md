# Chat Maestro — roadmap por valor e evidência

**Última revisão: 2026-11-23**. Este documento substitui a priorização inicial centrada em biblioteca local. A arquitetura, fontes e decisões detalhadas estão em [Rebaseline de produto](PRODUCT_REBASELINE_2026-11.md). Trabalho centralizado na [issue #2](https://github.com/IAPro-Community/chat-maestro/issues/2), com homologação na [issue #1](https://github.com/IAPro-Community/chat-maestro/issues/1).

## Problema a corrigir antes de mais interfaces

O usuário não precisa de outro portal de links de conversas. O Chat Maestro deve complementar ChatGPT e Gemini enquanto se trabalha neles. Há três superfícies que compartilham o mesmo domínio e armazenamento:

- **No site:** ações pequenas e contextuais na barra lateral/compositor — fluxo principal.
- **Side panel:** contexto, busca rápida, fila e prompts — sem formulários longos.
- **Manager em aba:** árvore de pastas, busca avançada, seleção, limpeza e exportação — gestão em escala.

## Próximas fases (bloqueios sequenciais)

### P0-A: baseline verificável e proteção de dados
- [ ] Inventariar capabilities e limitações por provedor/conta com exemplos reais.
- [ ] Garantir instalação, permissões, backup e atualização segura de v0.4.x.
- [ ] Definir fixtures e fluxos E2E em Chrome/Edge para ChatGPT/Gemini.
**Saída:** teste real de abrir, identificar provedor, detectar troca de conversa, reconectar e preservar dados, sem claims indevidos.

### P0-B: integração contextual por provedor (em andamento na v0.5.0)
- [x] Registro dinâmico e permissões opcionais por provedor; contrato de mensagens seguro entre site e worker.
- [x] Primeiro botão in-page para salvar, favoritar, mover para pasta local e abrir biblioteca.
- [x] Adaptadores de títulos e suporte por parser a URLs de projetos ChatGPT.
- [ ] Provar injeção, estilos e navegação SPA em Chrome/Edge real com contas autenticadas.
- [ ] Adaptadores independentes ChatGPT/Gemini para identidade, estado de conversa, observação da navegação SPA, leitura consentida e compositor.
- [ ] Controle in-page mínimo para favoritar/mover/abrir biblioteca, ativável separadamente por site e módulo.
- [ ] Fila/manual e captura utilizam um único resolvedor de contexto com falhas explicativas.
**Saída:** prova E2E com duas contas isoladas, troca de aba, reload, atualização de título e autorização revogada.

### P0-C: biblioteca e organização úteis
- [ ] Modelo de dados por provider + accountScope + conversationId, migração sem perda.
- [ ] Pastas/subpastas, tags e favoritos acessíveis na página e no manager.
- [ ] Indexação/paginação para títulos e mensagens efetivamente disponíveis, com origem/timestamps explícitos.
**Saída:** desempenho testado com 10k/50k dados sintéticos e atualização correta após uso real do site.

### P0-D: limpeza/arquivamento com significado real
- [ ] Regras configuráveis e auditáveis para classificação, revisão de antiguidade e proteção de importantes.
- [ ] Prévia e confirmação em lote, log de sucesso/falha por item; nunca inferir data de última atividade por data de captura.
- [ ] Arquivamento da **conta** somente se for seguro, observável e homologado por provedor; senão oferecer fluxo assistido e distinguir arquivo local.
**Saída:** no Chrome real, verificar resultado por conversa e não operar na conta errada.

### P1: fila, notas e prompts
- [ ] Fila junto ao compositor com edição, pause/resume, reconciliação após reload.
- [ ] Envio automático estritamente opt-in após detector de resposta e testes de não duplicação; nunca enviar sobre rascunho/anexo ou conta errada.
- [ ] Notas/pins por mensagem, biblioteca de prompts, variáveis, atalhos e histórico, sem UI duplicada.
**Saída:** testes E2E de resposta em andamento, falha de rede, navegação e reinicialização.

### P2: diferenciais, somente após P0/P1
- [ ] Chains e referências entre conversas com contexto explícito.
- [ ] Outline/minimap de conversas longas, exportação em lote robusta e conveniências úteis.
- [ ] Screenshots reais, onboarding, acessibilidade e documentação de produto.

## Não objetivos imediatos

Não acrescentar galerias, newsletters, marketplaces, analytics, sincronização obrigatória em nuvem ou mais provedores antes de terminar o fluxo real para ChatGPT/Gemini. Não copiar código, bundles ou mecanismo de assinatura da extensão de referência.

## Gates

- **Build CI verde não é homologação.** Evidência real de navegador e fixtures específicas por provedor para o status de compatibilidade.
- Dados locais e backups v1/v2/v3 permanecem migráveis.
- Sem ações destrutivas/remote-send sem consentimento, identificação exata da conta e confirmação do resultado.
- Nenhum elemento visual ou README pode anunciar recurso inexistente.

## Incremento entregue em v0.6.0 — isolamento local (não é autenticação)

- [x] Bancos IndexedDB separados por perfil e provedor; conservação integral do Legado.
- [x] Seleção manual obrigatória na página, com reset ao mudar de conversa.
- [x] Importação, captura, fila e backup separados por perfil; cópia legada não destrutiva.
- [x] Testes de colisão de ID, restauração entre perfis e exclusão de provedor incorreto.
- [ ] **P0 aberto:** identificar/verificar com segurança a conta autenticada; perfil local não comprova isso.
- [ ] **P0 aberto:** testar fluxo E2E com Chrome/Edge autenticado e duas contas no mesmo navegador.
