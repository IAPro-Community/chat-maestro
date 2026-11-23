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

## Identidade visual (v0.3.3)
- Fonte oficial: `assets/brand/icon-source.png`, derivada da arte aprovada. Não reconstruir a partir do SVG antigo.
- Após mexer na marca, regenerar PNGs com `scripts/generate-icons.py`, validar os quatro tamanhos, e revisar ícone e painel no navegador.
- Não aumentar permissões ou dependências de runtime por alterações visuais.
