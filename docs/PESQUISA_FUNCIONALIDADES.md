# Pesquisa de recursos úteis — novembro de 2026

## Referências consultadas (descrições públicas da Chrome Web Store e sites oficiais)
- ChatGPT & Gemini Message Queue: fila editável de prompts: https://chromewebstore.google.com/detail/chatgpt-gemini-message-qu/bdeaocefmnkeinfiknfeahpghemjjgjo
- TidyChats: pastas, busca completa, favoritos, comandos e prompt chaining: https://chromewebstore.google.com/detail/tidychats-folders-search/kpbddekbghojigfgmdojcpjgoljjjhak
- GPT Master: exportação em massa, pastas aninhadas, timestamps: https://chromewebstore.google.com/detail/chatgpt-bulk-delete-chat/dnamlnpbckbilkmmnbbildmpfkhbnijo
- Bulk Manage: arquivamento sequencial com verificação de sucesso: https://chromewebstore.google.com/detail/bulk-manage/fbhmpefjbcodcmbldbolpahflceaeced
- Superpower ChatGPT: fila, autoarquivamento e prompts: https://spchatgpt.com/features/message-queue/
- OpenAI (referência oficial do significado de arquivar): https://help.openai.com/pt-br/articles/8809935-deleting-and-archiving-chats-in-chatgpt

Essas são **alegações dos respectivos fornecedores**, não uma auditoria dos seus produtos. Recursos da IAPro devem ser implementados de forma independente e testados.

## Seleção por utilidade / manutenção
| Prioridade | Recurso | Situação Chat Maestro v0.3.0 | Por quê |
|---|---|---|---|
| P0 | Fila FIFO por conversa | Feito; envio manual | Rascunhos não se perdem enquanto IA gera |
| P0 | Arquivamento local com prévia | Feito | Limpeza auditável sem alterar contas |
| P0 | Exportação prévia da limpeza | Feito | Backup pontual antes de organizar |
| P0 | Busca rápida (Ctrl/Cmd+K no painel) | Feito | Menos navegação cotidiana |
| P1 | Envio automático opt-in com confirmação | Não feito | Depende de homologação por provedor e conta |
| P1 | Arquivamento nativo seletivo verificado | Não feito | Automação de interface frágil sem fixtures reais |
| P1 | Conta/workspace explícitos | Não feito | Evita misturar histórico de logins |
| P1 | Buscar 100 mil históricos com índice paginado | Não feito | Evita getAll/memória excessiva |
| P2 | Favoritos por resposta | Não feito | Depende de dados textuais de mensagem confiáveis |
| P2 | Contexto entre conversas | Não feito | Exige UX de citação e prevenção de vazamento |
| P3 | Galeria, analytics, IA remota, extensões de muitas plataformas | Não priorizado | Complexidade/permissões acima do valor atual |

## Regra de produto
Quatro áreas permanentes: Biblioteca, Organizar, Prompts (inclui Fila), Dados. Sem submenu extra para recursos pequenos.
