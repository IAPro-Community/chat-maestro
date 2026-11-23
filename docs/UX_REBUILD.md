# Chat Maestro — revisão de UX e paridade com a referência

## Por que a v0.4 existe

A instalação v0.3.4 mostrou problemas reais: formulário de fila dominando a tela, navegação perdida após scroll, contexto de conversa pouco claro, ferramentas com baixa descoberta e controles avançados simultâneos. As imagens de marketing anteriores foram **geradas**, não capturas da interface real; não usá-las como prova de homologação.

O pacote original 8.5.7 fornecido como referência inclui um *conversation manager* com pastas/favoritos/arquivadas, busca, filtros e comandos de seleção em lote. Esta referência é usada para análise de **experiência**, não para copiar seu código, assinaturas ou integrações proprietárias.

## Entrega v0.4 (revisão de interface)

- Cabeçalho compacto e navegação de quatro módulos fixos durante o scroll.
- Biblioteca como fluxo primário, com captura pontual explícita, busca, filtros, favoritos e comandos em lote exibidos apenas quando há seleção.
- Templates aparecem antes do gerenciamento de fila; formulários ficam recolhidos por padrão.
- Fila vinculada à conversa atual quando reconhecida; URL manual é ajuste avançado, não requisito inicial. Caso o usuário esteja em uma página sem ID de conversa, mostra orientação neutra, sem disparar erro falso.
- Em Organização, a prévia aparece antes das configurações; política, pastas e regras ficam acessíveis em seções recolhidas.
- Importação, backup e remoção ficam em seções recolhidas de Dados.
- Layout compacto para painéis estreitos e tema escuro automático quando o navegador sinaliza preferência escura.
- Correções pontuais: listener Ctrl/Cmd+K duplicado, ID de busca duplicado e botão de exportação de prévia repetido.

## Paridade: onde ainda estamos atrás do original

| Fluxo | v0.4 | Alvo para paridade |
| --- | --- | --- |
| Biblioteca de títulos/links | Local, funcional em nível de código | Captura, sincronização e atualização com identidade de conta bem definida |
| Pastas, filtros, fixadas | Funcional em biblioteca local | Atalhos, pastas aninhadas e navegação por árvore |
| Busca | Busca local em memória limitada | Indexação IndexedDB, pesquisa de conteúdo com paginação |
| Arquivamento | **Apenas biblioteca local** | Fluxo assistido na conta, confirmado por conversa com rollback quando suportado |
| Fila | Persistência e preparação manual | Envio opcional após detecção segura de término e idempotência; precisa de E2E |
| Prompts | Templates e variáveis | Pesquisa, favoritos, categorias e sugestões por contexto |
| Notas/destaques/referências | Ainda não implementados | Salvar resposta individual sem copiar toda a conversa |
| Histórico Gemini | Título/link | Importação/captura validada por formato estável |
| Capturas de tela e testes E2E | **Não homologados** | Capturas reais de Chrome autenticado com dados de teste, logs e evidências |

## Critérios de aceite antes de anunciar 'pronto'

1. Instalar o ZIP em Chrome real, confirmar ícone, painel e quatro módulos (larguras 320, 400 e 520px).
2. Abrir ChatGPT e Gemini autenticados; confirmar seleção da conversa correta e rejeição de destinos inválidos.
3. Testar estados vazios, muitos chats, textos longos, tema claro e escuro, teclado, leitor de tela e ações em lote.
4. Validar backup/restore antes e após atualização com mesmo ID da extensão.
5. Capturar **prints reais**, sem mockup visual gerado, e publicar no README apenas depois da homologação.
6. Não afirmar arquivamento de conta, envio automático ou disponibilidade na Chrome Web Store sem evidência do recurso.

## Limites de escopo

Não reconstruir 30 recursos da referência em uma única etapa. Prioridade: biblioteca confiável → organização por projeto → fila contextual → busca e notas. Cada melhoria deve ter testes de domínio, comportamento visual e proteção de dados.

## Feedback real após a v0.4: problema persistente (v0.4.1)

A captura enviada do painel em Dados revelou falha de identificação de aba mesmo com ChatGPT visível à esquerda. A investigação do código encontrou dependência de activeTab, que não é garantida por gestos internos do side panel. A v0.4.1 troca esse contrato por autorização opcional por provedor, reutilizada por captura, fila e inserção.

A UI também elimina parte do cabeçalho duplicado, compacta o painel e exibe estado de conexão dentro da Biblioteca. Estas mudanças ainda **não** constituem paridade visual nem funcional com a extensão original.

Gate de homologação: autorização negada/aceita/revogada, captura em navegação SPA, abertura/fechamento do painel, dados locais intactos, dois provedores isolados, Chrome/Edge real, sem envio automático nem arquivo remoto.
