-- Marmofácil: tabelas na nuvem. Cada conta só enxerga os próprios dados.
-- Cole tudo no Supabase em SQL Editor > New query e clique em Run.

create table if not exists public.orcamentos (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text,
  tel text,
  endereco text,
  status text,
  total numeric not null default 0,
  m2 numeric not null default 0,
  atualizado bigint not null default 0,
  estado jsonb not null default '{}',
  apagado boolean not null default false,
  mod timestamptz not null default now()
);
create index if not exists orcamentos_user_mod on public.orcamentos (user_id, mod);

create table if not exists public.empresa (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dados jsonb not null default '{}',
  atualizado bigint not null default 0
);

-- hora do servidor em cada gravação: é por ela que os aparelhos buscam o que mudou
create or replace function public.marca_mod() returns trigger
language plpgsql set search_path = '' as $$
begin new.mod := now(); return new; end $$;
drop trigger if exists orcamentos_mod on public.orcamentos;
create trigger orcamentos_mod before insert or update on public.orcamentos
  for each row execute function public.marca_mod();

alter table public.orcamentos enable row level security;
alter table public.empresa enable row level security;
drop policy if exists dono on public.orcamentos;
drop policy if exists dono on public.empresa;
create policy dono on public.orcamentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.empresa for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
