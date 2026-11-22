# Fila de mensagens — design e restrições

## Contrato de segurança (v0.3.0)
- Fila persistida em IndexedDB, por URL **canônica** + provedor + ID de conversa; não pelo título.
- Fila FIFO, 30 mensagens por conversa / 300 no banco, 20 mil caracteres por item.
- Edição, reordenação, remoção e estado `pending`/`prepared`.
- O botão **Preparar próxima** valida a aba ativa *antes e dentro* do content script injetado sob demanda.
- Não inserir se houver rascunho no campo. Não seguir se o contexto da conversa mudou.
- Nunca clicar em **Enviar**: o usuário envia e confirma no painel para retirar da fila.
- Se a página for recarregada depois da preparação, a fila permanece `prepared` até confirmação/reversão explícita.
- Os prompts enfileirados fazem parte de um backup JSON v3 (pode conter informação sensível); backups v1/v2 importam com fila vazia.
- Nenhuma API não documentada, token de sessão, interceptação de cookies ou script residente.

## Não prometer
- **Não há envio automático após resposta:** requer detecção de término, integridade de eventos, vínculo de conta e validação E2E real por provedor. Não criar polling cego, envio por timeout ou auto-click em DOM desconhecido.
- **Não há envio com navegador fechado**: Manifest V3 não executa scripts em uma página inexistente.
- **Não afirmar que houve envio**: apenas o usuário pode confirmar a operação no estágio atual.

## Evolução recomendada (opt-in, após homologação)
1. Criar adaptador de estado da resposta por plataforma (`idle`, `generating`, `blocked`, `unknown`), com fixtures e logs técnicos.
2. Adicionar vínculo explícito de conta/workspace e detecção de troca de sessão.
3. Idempotência por item (`prepared` → `sending` → `confirmed`), recuperação após falhas, e bloqueio de reenvio ambíguo.
4. Permitir iniciar/pausar em aba específica; interromper ao navegar, aparecer um anexo, trocar de conta ou expirar a sessão.
5. Envio apenas com opt-in e confirmação de operação no DOM real, sem APIs internas.
