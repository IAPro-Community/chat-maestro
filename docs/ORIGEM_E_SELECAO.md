# Seleção de escopo: por que estes recursos

Fontes analisadas: o pacote `8.5.7_0.zip` enviado para análise, a base própria de reconstrução v0.3, e referências públicas (Superpower ChatGPT, TidyChats, GPT Master, Simple Folder, Bulk Manage). Essas referências demonstram ideias de produto; não são fontes copiadas de implementação.

## Entrou na IAPro v0.1

| Ideia observada | Escolha implementada | Justificativa |
|---|---|---|
| Pastas, filtros, favoritos | Pastas e fixadas | Resolve descoberta e organização; custo de manutenção baixo |
| Arquivamento por antiguidade | Recomendações verificáveis, arquivo local | Problema prioritário, sem depender de APIs privadas |
| Busca completa | Pesquisa local de títulos e mensagens importadas | Privacidade e utilidade imediata |
| Regras inteligentes | Correspondência transparente por título | Mais previsível que classificação opaca por IA |
| Prompts repetidos | Templates preenchíveis e cópia manual | Produtividade sem envio automático de mensagens |
| Exportar/backup | JSON versionado e conversão v0.3 | Portabilidade e continuidade de dados |
| Workflows automáticos | Alarme diário estritamente local, desligado | Reduz trabalho sem risco de operação remota irreversível |

## Evolução em v0.2

A base nova ganhou suporte local a ChatGPT e Gemini, identificadores separados por provedor, captura sob demanda, exportação seletiva em MD/TXT/JSON, operações em lote e editor de prompts com estruturação determinística. Nenhum código antigo foi incorporado. Consulte `REFERENCIAS_PREMIUM.md` para a seleção atualizada.

## Deliberadamente ficou de fora

- Assistente por IA/cloud, resumo, chains automáticas, modelo próprio, controle de cobrança.
- Catálogo de dezenas de ferramentas, árvore de conversa, media gallery e injeção permanente de scripts.
- Recursos que precisam ler cookies/tokens/endpoints não documentados ou alteração de comportamento interno da conta.
- Sincronização entre dispositivos e infraestrutura própria antes de validar demanda.

## Princípios de produto

1. O usuário sempre sabe **se uma ação é local ou se altera a conta**.
2. Arquivamento por data só com timestamp verificado; capturas de sidebar não provam inatividade.
3. Nenhuma ação destrutiva remota silenciosa.
4. Não recriar uma interface completa do ChatGPT: usar painel lateral claro e focado.
5. Regras de classificação são determinísticas e auditáveis.

## Referências públicas

- https://chromewebstore.google.com/detail/superpower-for-chatgpt/amhmeenmapldpjdedekalnfifgnpfnkc
- https://chromewebstore.google.com/detail/tidychats-folders-search/kpbddekbghojigfgmdojcpjgoljjjhak
- https://chromewebstore.google.com/detail/bulk-manage/fbhmpefjbcodcmbldbolpahflceaeced
- https://chromewebstore.google.com/detail/gpt-master-bulk-delete-fo/dnamlnpbckbilkmmnbbildmpfkhbnijo
