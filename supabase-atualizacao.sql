-- Marmofácil: atualização 1 (pode rodar mais de uma vez sem problema)
-- Cole tudo no Supabase em SQL Editor > New query e clique em Run.

-- 1) Gravação exata: uma versão mais antiga de um orçamento nunca sobrescreve uma mais nova
create or replace function public.marca_mod() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.atualizado < old.atualizado then return null; end if;
  new.mod := now(); return new;
end $$;

-- 2) Atualização na hora entre os aparelhos (tempo real)
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orcamentos') then
    alter publication supabase_realtime add table public.orcamentos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'empresa') then
    alter publication supabase_realtime add table public.empresa;
  end if;
end $$;
