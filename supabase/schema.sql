-- RunCount initial schema bootstrap.
--
-- This file is a faithful re-creation of the original production schema
-- (extracted from db_cluster-23-08-2025@07-33-43.backup.gz, the last cluster
-- backup before the project was paused), with three deliberate additions
-- noted inline below.
--
-- Idempotent: safe to re-run on an existing project. Designed to be pasted
-- into the Supabase Dashboard SQL Editor on a freshly-created project.
--
-- Schema surface area:
--   * One table: public.games
--   * RLS so each user only sees their own games
--   * Realtime publication membership (which production was MISSING — see
--     the "Realtime" section)
--   * Auth is fully managed by Supabase (no custom profiles table; profile
--     fields live in auth.users.user_metadata)
--
-- Deliberate divergence from the Aug 2025 production schema:
--   1. Adds three camelCase columns ("startTime", "endTime", "turnStartTime")
--      which the current client code references in the upsert payload but
--      which post-date the backup.
--   2. Adds public.games to the supabase_realtime publication. The History
--      screen's realtime subscription was silently a no-op in production
--      because games was never published. This bootstrap fixes that.
--   3. Adds ON DELETE CASCADE on the owner_id FK so deleting an auth user
--      doesn't leave orphan games (production used the default NO ACTION,
--      which would block account deletion entirely).
--   4. Adds an (owner_id, date desc) partial index. Production had none.

-- ---------------------------------------------------------------------------
-- Extensions (gen_random_uuid lives in the extensions schema on Supabase,
-- which is preinstalled — this is a defensive no-op on hosted Supabase).
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Table: public.games
-- ---------------------------------------------------------------------------
--
-- Column naming note: the wire format mixes snake_case (winner_id, owner_id)
-- with camelCase ("startTime", "endTime", "turnStartTime") because the
-- client upserts a JS object directly. Camel-cased identifiers must be
-- double-quoted in SQL — do NOT rename without changing the client.

create table if not exists public.games (
    id              uuid default gen_random_uuid() not null,
    date            timestamptz default now() not null,
    players         jsonb,
    actions         jsonb,
    completed       boolean,
    winner_id       integer,
    owner_id        uuid,
    deleted         boolean default false,
    "startTime"     timestamptz,
    "endTime"       timestamptz,
    "turnStartTime" timestamptz
);

alter table public.games owner to postgres;

-- Add the camelCase time columns conditionally in case this is being run
-- against a pre-existing table created from the older production schema.
alter table public.games add column if not exists "startTime"     timestamptz;
alter table public.games add column if not exists "endTime"       timestamptz;
alter table public.games add column if not exists "turnStartTime" timestamptz;

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

-- PRIMARY KEY on id. `if not exists` syntax isn't available for ADD CONSTRAINT,
-- so guard it with a DO block.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_pkey' and conrelid = 'public.games'::regclass
  ) then
    alter table only public.games add constraint games_pkey primary key (id);
  end if;
end$$;

-- FK to auth.users. Production used the default ON DELETE NO ACTION, which
-- means deleting a user with games would fail. CASCADE is friendlier.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_owner_id_fkey' and conrelid = 'public.games'::regclass
  ) then
    alter table only public.games
      add constraint games_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Accelerates the History query:
--   SELECT * FROM games WHERE owner_id = ? AND deleted = false ORDER BY date DESC
create index if not exists games_owner_date_idx
    on public.games (owner_id, date desc)
    where deleted = false;

-- ---------------------------------------------------------------------------
-- Privileges (Supabase defaults — explicit for parity with production dump)
-- ---------------------------------------------------------------------------

grant all on table public.games to anon;
grant all on table public.games to authenticated;
grant all on table public.games to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security (policy names match the production dump)
-- ---------------------------------------------------------------------------

alter table public.games enable row level security;

drop policy if exists "Users can read their own records" on public.games;
create policy "Users can read their own records"
    on public.games for select
    to authenticated
    using ((auth.uid() = owner_id));

drop policy if exists "Users can insert their own records" on public.games;
create policy "Users can insert their own records"
    on public.games for insert
    to authenticated
    with check ((auth.uid() = owner_id));

drop policy if exists "Users can update their own records" on public.games;
create policy "Users can update their own records"
    on public.games for update
    to authenticated
    using ((auth.uid() = owner_id));

drop policy if exists "Users can delete their own records" on public.games;
create policy "Users can delete their own records"
    on public.games for delete
    to authenticated
    using ((auth.uid() = owner_id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
--
-- KNOWN PROD ISSUE: the original production project never added public.games
-- to the supabase_realtime publication, which means the History screen's
-- postgres_changes subscription (src/components/GameHistory/hooks/useGameHistory.ts)
-- was silently a no-op. We add it here so the new project has working
-- realtime from day one.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
end$$;
