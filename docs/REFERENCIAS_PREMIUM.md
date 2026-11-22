# Recursos comumente vendidos como “Pro” — avaliação de produto

Pesquisa em páginas públicas, 22/11/2026. Alegações dos fornecedores **não** substituem testes independentes.

| Recurso do mercado | Exemplos de referência | IAPro 0.2.0 | Decisão |
|---|---|---|---|
| Pastas, arquivamento e tags inteligentes | AI Toolbox, Superpower ChatGPT, Toolbox for Gemini | Pastas, regras por palavras-chave e arquivamento **local** | Manter gratuito e sem backend |
| Busca no histórico | AI Toolbox | Busca nos dados locais importados; Gemini só títulos/links | Melhorar índice e importação com consentimento |
| Gerenciamento em lote | AI Toolbox e Superpower | Lote de até 100, somente na biblioteca local | Não automatizar ações nativas sem adaptador testado |
| Exportação selecionada | AI Toolbox, Toolbox for Gemini | TXT, MD, JSON; mantém somente dados disponíveis | PDF opcional no futuro, não essencial |
| Biblioteca e encadeamento de prompts | Superpower, Toolbox for Gemini | Templates, variáveis, editar, copiar, inserir com clique | Encadeamento automático **não** implementado |
| Otimizador de prompts | Superpower | Estruturação determinística local | Não anunciar como revisão por LLM |
| Galeria de mídia, árvore de mensagens | Superpower, Toolbox for Gemini | Não | Alto custo e fragilidade sem dados completos |
| Sincronização em nuvem | Algumas extensões comerciais | Não | Evitar backend e exfiltração de dados no MVP |
| Operações remotas diretamente nas contas | Alguns produtos anunciam bulk actions | Não | Necessita teste, consentimento e contrato de integração confiável |

Fontes:
- https://chromewebstore.google.com/detail/ai-toolbox-folders-prompt/jlalnhjkfiogoeonamcnngdndjbneina
- https://chromewebstore.google.com/detail/superpower-for-chatgpt/amhmeenmapldpjdedekalnfifgnpfnkc
- https://chromewebstore.google.com/detail/toolbox-for-gemini-folder/cbdpdhfnjbkjphmminnkfbeekodlphlp
- https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
- https://support.google.com/gemini/answer/16920332

## Escopo de compatibilidade

Provedores são identificados por URL canônica e IDs com namespace: `abcdef123` (ChatGPT) e `gemini:abcdef123` (Gemini). Serviços remotos não recebem mensagens. Seletores DOM são substituíveis e devem falhar de forma clara se mudarem. **Não utilizamos código da versão binária de Superpower como base deste projeto.**
