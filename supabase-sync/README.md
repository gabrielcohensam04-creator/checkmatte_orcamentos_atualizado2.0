# Sincronização Empresas ↔ Estoque

Sincronização em tempo real e bidirecional entre `companies` (projeto orçamentos,
`qinjlrgvxmplvsotxyth`) e `empresas` (projeto estoque, `lspugeacsywfmfkkkrhu`) — dois
projetos Supabase separados. Casamento dos registros por CNPJ normalizado (só dígitos).

Nada aqui é aplicado automaticamente: as chaves disponíveis (`service_role`) só dão acesso
a operações de tabela via REST, não a DDL nem a deploy de Edge Functions. Siga os passos na
ordem abaixo, colando cada arquivo no dashboard do projeto indicado.

## Passo 1 — SQL (SQL Editor de cada projeto)

- `orcamentos/migration.sql` → projeto orçamentos.
- `estoque/migration.sql` → projeto estoque.

## Passo 2 — Edge Functions (painel "Edge Functions" de cada projeto)

- `orcamentos/functions/sync-to-estoque/index.ts` → criar function `sync-to-estoque` no
  projeto **orçamentos**. Secrets: `ESTOQUE_URL`, `ESTOQUE_SERVICE_ROLE_KEY`.
- `estoque/functions/sync-to-orcamentos/index.ts` → criar function `sync-to-orcamentos` no
  projeto **estoque**. Secrets: `ORCAMENTOS_URL`, `ORCAMENTOS_SERVICE_ROLE_KEY`.

## Passo 3 — Database Webhooks (Database → Webhooks de cada projeto)

- Orçamentos: tabela `companies`, eventos Insert + Update, tipo "Supabase Edge Functions",
  aponta pra `sync-to-estoque`.
- Estoque: tabela `empresas`, eventos Insert + Update, tipo "Supabase Edge Functions",
  aponta pra `sync-to-orcamentos`.

## Passo 4 — Backfill único das linhas existentes

Depois que os 3 passos acima estiverem ativos nos dois projetos, avise — o backfill das
linhas que já existem hoje (5 em `companies`, 10 em `empresas`) é executado direto via API,
reaproveitando a mesma lógica de match/diff das functions (idempotente: pode rodar de novo
sem duplicar).

## Passo 5 — Rotacionar as chaves

As `service_role` keys dos dois projetos passaram por esta conversa — depois que a
sincronização estiver confirmada funcionando, regenere as duas em cada dashboard
(Settings → API → Regenerate) e atualize os 2 secrets de Edge Function correspondentes
com os novos valores.

## O que fica de fora (deliberado)

- Delete não sincroniza — apagar de um lado nunca apaga do outro.
- Duplicatas suspeitas já existentes (ex. "IURD" ≈ "Igreja Universal do Reino de Deus") não
  são fundidas automaticamente.
- CNPJ ambíguo (duas empresas com o mesmo CNPJ normalizado) nunca decide sozinho qual
  atualizar — insere uma linha nova e avisa via `console.warn` nos logs da function.
