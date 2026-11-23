# Regras de engenharia — Chat Maestro

Extensão independente de Chrome para ChatGPT e Gemini. Mantenha produto leve e sem dependências de runtime sem necessidade demonstrada.

- TypeScript strict, módulos pequenos, regras de domínio puras e tests Node.
- Não copiar bundles, código ou mecanismo de assinatura de extensões comerciais; apenas reproduzir conceitos de utilidade com implementação própria.
- Nunca usar endpoints privados de ChatGPT/Gemini, tokens/cookies da página, código remoto, `eval`, keylogging, captura persistente, telemetria ou exclusão silenciosa.
- Nunca confundir **arquivamento local** com arquivamento da conta. Não inventar datas para links capturados do DOM.
- Introduzir outro provedor somente com parser de URL seguro, ID com namespace e teste de migração/colisão.
- Fazer migração de schema/backup sem perder dados; manter banco `iapro-optimizer-v1` até migração documentada.
- Domínio não deve importar APIs Chrome; UI não deve lidar diretamente com tokens ou serviços externos.
- Interface de captura deve falhar de forma explícita quando o DOM mudar; testar nos dois provedores em sessões reais antes de afirmar compatibilidade.
- `npm test && npm run package` antes de release. CI não substitui homologação do navegador.

## Fila (v0.3)
- Não enviar prompts automaticamente; o envio precisa de homologação E2E independente em ChatGPT e Gemini.
- Toda operação sobre a página deve validar URL canônica, ID da conversa e provedor antes e dentro do script de execução.
- Não sobrescrever rascunhos nem marcar itens como enviados sem confirmação explícita.
- Manter compatibilidade dos backups v1/v2 e versionar mudanças de schema com migrações testadas.

## Identidade visual (v0.3.4)
- Fonte oficial: `assets/brand/icon-source.png`, com mão segurando batuta sem estrela; banner em `assets/brand/readme-banner.png`. Não reconstruir a partir do SVG antigo ou reaplicar brilho mágico.
- Após mexer na marca, regenerar PNGs com `scripts/generate-icons.py`, validar os quatro tamanhos, e revisar ícone e painel no navegador.
- Não aumentar permissões ou dependências de runtime por alterações visuais.

## Contrato de UX a partir de v0.4.0
- Manter quatro módulos no painel estreito e navegação persistente durante scroll.
- Biblioteca é entrada principal; ações em lote só após seleção, com confirmação.
- Exibir templates antes da fila e formulários avançados somente sob demanda.
- Não exigir URL quando a conversa puder ser detectada; ausência de contexto exige orientação, não erro alarmista.
- Imagens geradas não são evidência de homologação; capturas oficiais devem vir de Chrome real.
- Consulte docs/UX_REBUILD.md para as lacunas, prioridades e critérios de aceite.

## Contrato de acesso do painel lateral (v0.4.1)

- Não depender de activeTab para ações iniciadas dentro do side panel; use site-access.ts como ponto único para resolver a aba e verificar permissões.
- chrome.permissions.request deve ser chamado no mesmo gesto de usuário que aciona o botão, sem await antes da solicitação.
- Não ampliar as origens opcionais ou acrescentar permissions tabs sem ADR, revisão de privacidade e testes.
- Permissão por domínio não significa autorização para sincronização silenciosa; captura e inserção continuam sob gesto do usuário.
- Mensagens de erro devem diferenciar ausência de autorização, URL oculta, provedor diferente, conversa inicial e seletor DOM alterado.

## Duas superfícies, uma aplicação
- `panel.html` e `manager.html` carregam `ui/app.js`; nunca bifurcar domínio, IndexedDB ou lógica de ações para a tela cheia.
- A árvore de pastas e o grid são uma apresentação responsiva apenas na biblioteca ampliada. Não expor tags, anexos ou notas como filtros sem fonte de dados e testes.

## Direção de produto — rebaseline novembro/2026
- Leia `docs/PRODUCT_REBASELINE_2026-11.md` antes de acrescentar features ou refazer interface.
- **Primeiro fluxo in-page real**, com adaptadores e identidade de conta; depois biblioteca/indexação, arquivo na conta e fila. Side panel e manager são superfícies auxiliares compartilhadas, não produtos diferentes.
- Documentar capabilities por provedor e não anunciar suporte onde só há parser de URL ou dados simulados.
- Não usar `getAll()` como fonte da verdade de busca em escala; não misturar contas dentro do mesmo provider ID.
- O fluxo de limpeza deve distinguir arquivos local e remoto; fila automática somente após teste E2E de estado/entrega e opt-in.

## Regras da integração contextual v0.5.0

- Novo content script precisa ser IIFE empacotado (esbuild apenas build), com source TS modular e script MV3 registrado por permissão opcional.
- Toda mensagem enviada pelo content script deve ser revalidada no worker (domínio, aba, frame, ID, permissão). O host DOM é não confiável.
- Nunca ler cookies/tokens, invocar endpoints privados, gravar histórico sem clique ou tratar captura de título como sincronização de mensagens.
- Sem `accountScope` comprovado, proibir ações remotas, automação de limpeza/arquivo e envio de fila. A integração v0.5 é **experimental**.
- Documentação e claims devem seguir `docs/INPAGE_MVP.md`. O gate E2E exige navegador com sessões autenticadas e prints reais.

## Perfis locais — v0.6.0

- Um IndexedDB por perfil local UUID e provedor; banco `iapro-optimizer-v1` é Legado, nunca autoatribuído/apagado.
- Content scripts exigem `profileId` explícito, validado no worker junto com domínio, aba, conversa e permissão. Reset da seleção na troca de conversa.
- Perfil local não prova identidade autenticada. Não inferir conta por texto visível, email, título, cookie ou token.
- Todas as mutações, filas, importações e backups devem usar o perfil correto; restaurações entre perfis exigem consentimento específico.
- Rotina diária em novos perfis fica desabilitada até homologação. Arquivamento na conta e envio automático permanecem proibidos.
- Consulte `docs/PERFIS_LOCAIS.md` e `tests/profile-isolation.test.mjs`.

## Gates 0.7.0
- Notas são dados locais ancorados por índice de importação ou texto selecionado, não por ID remoto confirmado.
- Índice contém até 1200 termos únicos por conversa local; não afirmar histórico integral.
- Ações in-page usam apenas URLs reconhecidas e dados do perfil local explicitamente escolhido.
- Revisão de arquivamento é confirmação manual do usuário, não verificação independente.
- Proibir auto-send e mutações remotas enquanto identidade e E2E estiverem pendentes.
