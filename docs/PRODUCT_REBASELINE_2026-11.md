# Chat Maestro — Rebaseline de produto e arquitetura

**Data:** 2026-11-23 · **Status:** direção proposta com base em auditoria; não representa implementação nem homologação
**Fontes confrontadas:** arquivo original `8.5.7_0.zip` fornecido para estudo, imagem `conversation-filters-light.png`, histórico de objetivos do projeto, código real da branch `main` em 2026-11-23 e ofertas públicas das extensões concorrentes.

## 1. Problema de produto

O Chat Maestro deriva de uma ideia de **camada de produtividade dentro dos assistentes** e se tornou, indevidamente, uma biblioteca local de links administrada num formulário de side panel. A proposta não é transformar a extensão em um portal separado, mas tornar conversas, organização, busca, prompts e filas úteis **durante o uso do ChatGPT/Gemini**.

A versão 8.5.7 de referência utiliza content scripts e integra os comandos à interface, mantém gerenciador dedicado e uma coleção de utilidades (pastas, busca, autosync, prompts, notas, exportações). **Não copiamos o bundle**: o README que acompanha essa distribuição atribui direitos a Fancy Dino e contém restrições explícitas de reutilização/redistribuição. Referências visuais e comportamentais são usadas apenas para reconstruir ideias de forma independente.

### Diagnóstico verificável da main

- `src/platform/capture.ts`: captura títulos/links da barra lateral e salva apenas link/título da conversa aberta. **Não sincroniza histórico completo**.
- `src/domain/importer.ts`: entende partes textuais da exportação do ChatGPT, segue ramo selecionado, ignora anexos e outros formatos multimodais. Não há importador equivalente para histórico completo do Gemini.
- `src/domain/types.ts`: `Chat` possui `provider`, mas **não possui accountId/workspaceId**. `Folder` não possui `parentId`; `Message` não possui ID estável de mensagem nem suporte a notas/destaques.
- `src/domain/organizer.ts`: classificação por palavras-chave no título; `archived` muda apenas um registro local. Não existe operação nativa confirmada na conta.
- `src/platform/db.ts` + `src/ui/context.ts`: a busca e a tela percorrem coleções carregadas por `getAll()`; não há busca full-text indexada/paginação persistente para volume grande.
- `src/domain/queue.ts`: dois estados `pending` e `prepared`. Falta detector de resposta, pausa/retomada, confirmação de entrega/timeout e reconciliação após reload; **não existe envio automático**.
- `panel.html` e `manager.html` compartilham a UI, mas não substituem a necessidade de ações contextuais incorporadas aos sites.
- Testes Node e CI provam contratos e builds, **não comprovam** os fluxos reais em sessões autenticadas de ChatGPT e Gemini.

## 2. Referências externas e seleção de valor

Fontes públicas de referência, **alegações dos produtos; não houve auditoria independente de seus códigos**:

| Referência | Padrão de experiência observado/anunciado | Decisão Chat Maestro |
|---|---|---|
| [Superpower ChatGPT](https://spchatgpt.com/features/) | Conversation manager, autosync, pastas, bulk actions, prompt chains, queue, notes, highlights, export | Referência de amplitude e experiência na página, **sem copiar código ou assinatura** |
| [TidyChats](https://chromewebstore.google.com/detail/kpbddekbghojigfgmdojcpjgoljjjhak) | Pastas no sidebar nativo, full-text, smart tags, notas, referências e bulk | Priorizar integração contextual e biblioteca unificada |
| [AI Toolbox](https://chromewebstore.google.com/detail/jlalnhjkfiogoeonamcnngdndjbneina) | Busca multiprovedor, pastas hierárquicas, tags, prompts, exportação | Reaproveitar conceitos, não criar backend remoto |
| [Toolbox for Gemini](https://chromewebstore.google.com/detail/cbdpdhfnjbkjphmminnkfbeekodlphlp) | Gemini com pastas, export, pinned messages, prompts e bulk | Gemini precisa de adaptador de primeira classe |
| [Threadlane](https://chromewebstore.google.com/detail/fgajmfkookghcacddnmhfkamefndgfei) | Fila no compositor, pause/resume, edit/reorder, auto-send condicionado ao término | Aprender com UX e invariantes; sem enviar antes de teste E2E |
| [ChatFolders](https://chromewebstore.google.com/detail/gicpkcpdgancalpgccdpjnndaojchonb) | Pastas e tags diretamente na barra lateral com ações rápidas | Ação cotidiana no local em que o usuário está |

## 3. Posição de produto

> **Chat Maestro: organize, reencontre e continue seu trabalho em ChatGPT e Gemini sem perder o contexto.**

**Objetivo primário:** o usuário instala, autoriza um provedor, continua usando seu chat normalmente e encontra ações de organização, recuperação e fila ali mesmo. O gerenciador em aba serve para operações intensivas, não como fluxo obrigatório.

**Três superfícies, uma aplicação e um banco:**

1. **In-page (principal):** controles discretos junto à barra de conversas e compositor do ChatGPT/Gemini; favoritar, mover, etiqueta, busca/contexto, fila; opt-in e desligável por módulo/provedor.
2. **Side panel (atalhos):** contexto da conversa atual, busca rápida, notas/pins, próximos prompts e ações compactas; não expor formulários longos como tela inicial.
3. **Manager (gestão em escala):** árvore de pastas, filtros, seleção em lote, prévia de limpeza, históricos e exportação. Não criar dados ou lógica exclusivos dessa superfície.

Ações são exibidas por **capability**: um recurso que não funciona de fato no Gemini aparece como indisponível com motivo, e não como uma cópia visual do ChatGPT.

## 4. Escopo priorizado para recuperar o produto sem oversized

| Prioridade | Fluxo | Definição de pronto |
|---|---|---|
| **P0** | Integração em página e identidade de conta | O Chat Maestro identifica provedor, conta/perfil e conversa; ações não atingem outra conta. Adaptadores desacoplados e fixtures reais; permissões claras |
| **P0** | Biblioteca com histórico efetivo | Importação oficial ChatGPT + captura consentida de conversas visualizadas; dados com origem/atualização verificáveis; busca confiável com paginação; Gemini com capacidade explicitamente declarada |
| **P0** | Pastas, tags, favoritos no site | Ações rápidas junto a conversas, árvore com subpastas no manager, filtros, mover em lote e estados consistentes após reload |
| **P0** | Limpeza e arquivamento | Regras de antiguidade e classificação com prévia, proteção e confirmação; arquivamento **remoto** apenas se adaptador conseguir confirmar o estado final por item; fallback local rotulado claramente |
| **P1** | Fila contextual de mensagens | Criar/editar/reordenar enquanto responde; pause/resume; após E2E, enviar opcionalmente só quando resposta terminada e destino correto; estados idempotentes e recovery |
| **P1** | Produtividade de mensagens | Pins, notas, tags, prompt history e templates com variáveis a partir do chat; salvar/copiar/reutilizar com um gesto |
| **P1** | Exportação útil | Markdown, TXT, JSON, ZIP por seleção/pasta; preservação dos conteúdos efetivamente capturados e aviso quando há somente links |
| **P2** | Prompt chains e referências | Etapas condicionadas a estado; referências entre chats e atalhos. Sem execução silenciosa ou manipulação oculta de serviços |
| **P2** | Conveniências | Outline/minimap para conversas longas, contador, configurações de tema e atalhos, somente quando P0/P1 estiverem sólidos |

**Não incluir agora:** galeria de imagens, newsletter, analytics, nuvem obrigatória, marketplace de prompts, dez provedores extras, modelos locais pesados, editor visual de automações ou frontend/serviço duplicado.

## 5. Arquitetura proposta (evolutiva, sem reescrita descartável)

```text
src/
  domain/
    conversations/ folders/ tags/ notes/ prompts/ queue/ cleanup/
  application/
    use-cases/ policies/ ports/ capabilities/
  infrastructure/
    database/ migrations/ search/ backup/ events/
  providers/
    chatgpt/
      identity.ts  reader.ts  composer.ts  native-actions.ts  fixtures/
    gemini/
      identity.ts  reader.ts  composer.ts  native-actions.ts  fixtures/
  surfaces/
    content/           # ações e indicadores dentro dos sites
    sidepanel/         # foco/contexto e atalhos
    manager/           # árvore/filtros/lotes
  background/
    worker.ts          # eventos MV3 e timers, sem estado em memória como fonte da verdade
```

- **Modelo independente de provedor:** chave composta `provider+accountScope+conversationId`; mensagem com ID estável e timestamps com fonte/confiabilidade; pastas com `parentId`; etiquetas e notas relacionáveis. Migração in-place e backup de segurança antes de alterar storage.
- **Capacidades explícitas:** `canCaptureTitle`, `canCaptureMessages`, `canArchiveAccount`, `canQueueSend`, etc.; recursos apenas quando há integração validada. Nunca equiparar `archivedLocal` a `archivedAccount`.
- **Integração web:** content script isolado, controle por feature flags, `MutationObserver` com debounce, identificação robusta de SPA, componentes injetados leves e limpáveis; não sobrescrever React do provedor nem usar endpoints privados/cookies/tokens.
- **Eventos e segurança:** mensagens validadas, operações com IDs/correlation IDs, timeout, reconciliação, audit trail local, confirmação para mutações remotas. Permissions opcionais apenas para domínios habilitados e consentimento granular.
- **Persistência/indexação:** IndexedDB com `byAccount`, `byProvider`, `byDate`, `byFolder`, `byStatus`; índice incremental de texto por token/termo ou mecanismo equivalente; paginação. Não usar `getAll()` como base de busca em escala.
- **Interfaces:** preferência por TS e CSS leve; adotar WXT/bundler se os múltiplos entrypoints e builds exigirem. Nenhum framework por obrigação, tampouco proibir tecnologia quando reduzir manutenção.
- **Qualidade:** snapshots/fixtures reais por provedor e versão visual, testes de DOM/adaptador, E2E com navegador dedicado, canary de compatibilidade, logs de diagnóstico sem conteúdo sensível, CI e release só com gates satisfeitos.

A extensão original é **referência de comportamento**, não código aproveitável no novo projeto sem licenciamento apropriado.

## 6. Sequência de execução e gates

### Fase A — inventário/rebaseline (antes de novas features)
- Checklist por funcionalidade: origem da necessidade, concorrente, código presente, runtime confirmado, limitações e UX pretendida.
- Validar versões Chrome/Edge, permissão, fluxo de conexão, instalação e atualização com backup.
- Congelar adições cosméticas e claims de marketing até homologação.
- **Aceite:** mapa de capabilities e baseline real documentados, com provas dos fluxos básicos.

### Fase B — integração real com os provedores
- Separar `ChatGPTAdapter` e `GeminiAdapter` com detecção de conta, conversa, composição e alterações do DOM.
- Content script persistente **somente após opt-in do domínio**, sem leitura contínua desnecessária.
- Adicionar ações discretas de favoritar/mover/abrir manager e indicador de estado junto ao site.
- **Aceite:** abrir/trocar/renomear conversa, mudar de conta e atualizar SPA sem perda de destino; comportamento reproduzido nos dois provedores.

### Fase C — base de dados e busca que funcionam
- Migração compatível de dados v0.4.x; backup/rollback documentados.
- Histórico importado + observação consentida, com marcação de cobertura e provenance.
- Pastas hierárquicas, etiquetas, notas e busca indexada.
- **Aceite:** testes de 10k/50k conversas sintéticas; UI sem travamento, busca paginada, dados não misturados por conta.

### Fase D — limpeza e arquivo real
- Prévia de regras por idade/atividade/tema, exceções, protegidas, projetos e conversas recentes.
- Testar método de arquivamento permitido e observável por provedor; execução por lote com checkpoint, rate-limit, pausa e resultado individual.
- Se confirmação não for possível, **não habilitar arquivamento na conta**; oferecer fluxo assistido manual.
- **Aceite:** evidência de sucesso e falha/recuperação em Chrome autenticado, sem exclusões irreversíveis inadvertidas.

### Fase E — fila e produtividade
- Fila dentro do compositor, estado aguardando/gerando/pronto/preparado/enviado/falha, controles de pausa e reordenação.
- Envio automático **opt-in**, sem rascunho, anexo ou geração em andamento; timeout, dedup, proteção contra troca de destino; sem supor sucesso só porque clicou.
- Notas/pins por mensagem, prompts e chains.
- **Aceite:** E2E ChatGPT/Gemini com respostas longas, falhas de rede, reload, troca de abas e mudança de conta.

### Fase F — produto e distribuição
- Onboarding por provedor, acessibilidade, telas claras/escuro, idioma, documentação, diagnósticos, screenshots **reais** do navegador.
- Releases com versão e changelog; separação entre experimental, parcialmente suportado e homologado.
- **Aceite:** nenhum claim de marketing sem evidência vinculada a teste/funcionalidade real.

## 7. Não regressão obrigatória

- Preservar IndexedDB `iapro-optimizer-v1` até migração auditada; backup/restore compatível v1/v2/v3.
- Proteger chats fixados, protegidos e sem timestamp comprovado; nunca inferir idade pela data da captura.
- Nunca enviar automaticamente sem opt-in explícito; nunca excluir/arquivar remotamente sem confirmação de alvo e resultado.
- Não incorporar código do bundle de terceiros. Analisar somente documentação/ideias de funcionalidade e criar implementação autoral.
- Não chamar `compilou`, `testes Node passaram` ou `CI verde` de `homologado no ChatGPT/Gemini`.
- Uma única fonte da verdade para estado, permissões, dados e capabilities nas três superfícies.

## 8. Decisão de continuidade

**Não jogar fora o Chat Maestro atual nem fazer mais uma reescrita visual isolada.** Preservar a distribuição atual como baseline e refatorar incrementalmente por capability, com feature flags. O próximo PR/commit funcional deve ser **B: integração em página + prova de identidade de conta**, não um novo tema, formulário ou módulo genérico.

Links internos: [Roadmap anterior](ROADMAP.md), [UX rebuild](UX_REBUILD.md), [matriz premium inicial](REFERENCIAS_PREMIUM.md), [testes manuais](TESTES_MANUAIS.md).
