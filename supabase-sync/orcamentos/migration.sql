-- Rodar no SQL Editor do projeto ORÇAMENTOS (qinjlrgvxmplvsotxyth)
-- Adiciona as colunas que faltam em companies para espelhar empresas (estoque).
-- "tipo" ganha DEFAULT 'CLIENTE': preenche as linhas existentes automaticamente
-- (metadata-only em Postgres 11+, não reescreve a tabela) e garante que toda
-- empresa criada por este app já nasce marcada como CLIENTE, sem precisar
-- tocar no código do front-end.

alter table public.companies
  add column if not exists razao_social text,
  add column if not exists telefone text,
  add column if not exists email text,
  add column if not exists endereco text,
  add column if not exists tipo text not null default 'CLIENTE';
