# Perfis locais e migração do Legado — Chat Maestro 0.6.0

## O que foi resolvido

A versão anterior usava um único banco para todos os registros. Agora cada perfil local utiliza um **IndexedDB próprio**: ChatGPT Pessoal e ChatGPT Trabalho podem armazenar o mesmo ID de conversa com favoritos, pastas, prompts e filas independentes.

**Limitação:** um perfil local não é uma identidade autenticada. Você precisa escolher o perfil correto; a extensão não consegue provar se houve troca de conta no ChatGPT/Gemini. Por segurança, sincronização automática, arquivamento remoto e envio automático de filas continuam desativados.

## Criar e usar

1. Em **Dados → Perfis locais**, crie um perfil para ChatGPT ou Gemini, com um nome como Pessoal ou Trabalho.
2. Selecione o perfil; Biblioteca, Dados, Prompts e Organização usam esse banco. Painel e gerenciador podem ter seleções diferentes: confira o nome antes de editar.
3. Conecte o domínio do provedor e abra uma conversa.
4. No botão Maestro inserido na página, **selecione novamente o perfil** antes de salvar, favoritar ou mover. A seleção reinicia quando você muda de conversa.
5. Para usar a fila em outro provedor, primeiro selecione um perfil daquele provedor no painel.

## Copiar dados da versão anterior

O IndexedDB `iapro-optimizer-v1` não é alterado automaticamente. Ele continua disponível como **Legado**.

1. Faça um backup completo do Legado.
2. Crie e selecione um perfil de destino **vazio**.
3. Clique em **Copiar dados legados para este perfil** e confirme.
4. São copiadas somente as conversas/fila do provedor escolhido, além de pastas, prompts e regras existentes; execução diária fica desligada.
5. Compare os resultados e mantenha o backup. O Legado não é apagado.
6. Se dados antigos já misturavam contas de um mesmo provedor, a ferramenta não consegue separá-los automaticamente: revise-os antes de usar.

A cópia falha quando o destino já possui dados, evitando sobrescrita acidental.

## Backup e restauração

Backup JSON v3 continua compatível com versões antigas. Novos backups incluem metadados opcionais `localScope` (origem do perfil). Cada exportação corresponde apenas ao perfil ativo. Para múltiplos perfis, faça cópias separadas.

Restaurações de origem diferente ou desconhecida exigem confirmação adicional; backups que contenham conversas de outro provedor são bloqueados em perfis específicos.

**Backups não têm criptografia.** Guarde-os em local seguro.

## Gates abertos

- Prova da conta autenticada (não apenas rótulo manual).
- Homologação em Chrome/Edge com duas contas do mesmo provedor, permissões e navegação SPA.
- Nenhum arquivo remoto, sincronização ou envio automático até haver identificação confiável e confirmação da operação.

Documentos: [QA](QA_2026-11-23.md), [Roadmap](ROADMAP.md), [Testes manuais](TESTES_MANUAIS.md).
