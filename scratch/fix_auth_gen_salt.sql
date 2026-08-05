-- Rodar no SQL Editor do projeto ORÇAMENTOS (qinjlrgvxmplvsotxyth).
-- Corrige: "function auth.gen_salt(unknown) does not exist", que quebra
-- criar_usuario_com_senha_padrao (tela Usuários > Novo Usuário).
--
-- Não altera a RPC existente nem nenhuma tabela do schema auth — só cria uma
-- função fininha auth.gen_salt(text) que chama a pgcrypto real (gen_salt),
-- onde quer que ela esteja instalada (public ou extensions, resolvido pelo
-- search_path da sessão). Isso é seguro de rodar mesmo sem ver a RPC original,
-- porque só preenche a peça que falta, sem tocar em nada que já existe.

create extension if not exists pgcrypto;

create or replace function auth.gen_salt(text) returns text
  language sql
  as $$ select gen_salt($1); $$;
