-- Rodar no SQL Editor do projeto ESTOQUE (lspugeacsywfmfkkkrhu)
-- Adiciona a única coluna que falta em empresas para espelhar companies (orçamentos).
-- "responsavel" não tem equivalente em empresas hoje.

alter table public.empresas
  add column if not exists responsavel text;
