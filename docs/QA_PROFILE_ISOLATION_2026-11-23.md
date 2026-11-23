# QA — Isolamento de perfis locais — Chat Maestro v0.6.0

**Data:** 23/11/2026  
**Branch:** `main`  
**CI com artefato verificado:** [run 45179711232](https://github.com/IAPro-Community/chat-maestro/actions/runs/45179711232) — 95 testes, 0 falhas  
**Binário de prévia:** [download direto](https://github.com/IAPro-Community/chat-maestro/releases/download/preview/chat-maestro-preview.zip)

## Resultado auditável

| Verificação | Resultado |
| --- | --- |
| TypeScript strict + build Manifest V3 | Aprovado |
| IndexedDB simulado com `fake-indexeddb` | Aprovado |
| Mesmo ID de conversa em dois perfis ChatGPT com dados diferentes | Aprovado |
| Banco legado preservado e cópia para perfil vazio | Aprovado |
| Bloqueio de cópia para perfil que já contém dados | Aprovado |
| Backup com provedor incompatível | Bloqueado por regra e teste |
| Backup entre perfis sem consentimento | Bloqueado por regra e teste |
| Comando in-page sem `profileId` | Rejeitado por contrato e teste |
| Comando com perfil de provedor diferente | Rejeitado pelo worker e persistência |
| Fila / importação para outro provedor | Rejeitado por regra |
| ZIP da CI | 39 arquivos, CRC válido, Manifest versão 0.6.0 |
| UI in-page em Chromium com serviço simulado | Passou smoke test de seleção de perfil e reset na navegação |
| Chrome/Edge real com extensão MV3 carregada | **Pendente** — política administrativa bloqueia `--load-extension` neste ambiente |
| Verificação da conta autenticada ChatGPT/Gemini | **Não implementada** — nenhum ID oficial de conta é obtido |
| Arquivo remoto e envio automático | **Não implementados** |

### Detalhes do smoke test

Em Chromium 144, foi executado o bundle IIFE do content script em página genérica com URL do ChatGPT fornecida por *harness* de teste e retorno simulado de `chrome.runtime.sendMessage`. Para inspeção, o Shadow DOM foi aberto **somente no teste**.

- O botão foi renderizado uma vez, sem duplicação.
- Salvar ficou desativado antes de escolher um perfil.
- Após escolha do perfil local `01234567-89ab-4def-8abc-0123456789ab`, o comando `save` incluiu o `profileId` e a URL correta.
- Ao simular navegação para outra conversa, o seletor voltou a vazio e a ação foi bloqueada novamente.

Isso **não comprova** a integração real Chrome runtime ↔ service worker ↔ IndexedDB, nem a compatibilidade com os DOMs atuais de ChatGPT ou Gemini.

### Arquitetura de isolamento

- `src/platform/profiles.ts`: registro validado de perfis locais; seleção explícita; IDs UUID.
- `src/platform/db.ts`: `iapro-optimizer-v1` continua Legado; os novos bancos são `chat-maestro-account-v1-<uuid>`.
- `src/worker.ts`: `profileId` obrigatório, existência/provedor validados, então todas as leituras e gravações in-page usam o banco específico.
- `src/platform/capture.ts`: importação/captura exigem perfil de mesmo provedor.
- `src/platform/queue-store.ts`, `src/platform/composer.ts`: não permitem preparar/armazenar fila de outro provedor no perfil ativo.
- `src/platform/backup.ts`: origem opcional `localScope`, validação de provedor e consentimento extra entre perfis.
- `src/platform/settings.ts`: políticas por perfil; agendamento diário desabilitado nos perfis novos por segurança.
- `copyLegacyToProfile`: cópia não destrutiva, destino vazio, sem atribuição automática de contas.

## Gates em aberto

1. Teste E2E **autenticado** em Chrome/Edge, com duas contas reais de ChatGPT e duas de Gemini, incluindo login/logout, troca de aba, revogação, SPA e reload.
2. Definir mecanismo consentido e verificável para identificar a conta autenticada. Um perfil manual **não é account verification**.
3. Não habilitar sincronização, arquivamento remoto ou fila automática até comprovar destino e resultado por operação.
4. Homologar UI em largura 320–520 px e registrar screenshots reais sem dados privados.

**Estado honesto:** v0.6.0 resolve a **separação de armazenamento local** e impede associações automáticas, mas ainda não resolve a identidade da conta remota nem a homologação funcional dos provedores.

Veja [guia de perfis](PERFIS_LOCAIS.md), [testes manuais](TESTES_MANUAIS.md), [issue #1](https://github.com/IAPro-Community/chat-maestro/issues/1) e [issue #2](https://github.com/IAPro-Community/chat-maestro/issues/2).
