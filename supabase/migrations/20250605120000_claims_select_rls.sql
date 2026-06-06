-- Allow the anon client (member board) to read claims for display + Realtime.
-- Run in Supabase SQL Editor if not using CLI migrations.

alter table public.claims enable row level security;

drop policy if exists "anon can read claims" on public.claims;
drop policy if exists "public can read claims" on public.claims;
create policy "public can read claims"
  on public.claims
  for select
  to public
  using (true);

create unique index if not exists claims_task_id_claimer_name_key
  on public.claims (task_id, claimer_name);

-- Include full old row on DELETE so Realtime unclaim events sync.
alter table public.claims replica identity full;
