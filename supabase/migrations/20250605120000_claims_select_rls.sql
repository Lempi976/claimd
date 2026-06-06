-- Allow the anon client (member board) to read claims for display + Realtime.
-- Run in Supabase SQL Editor if not using CLI migrations.

alter table public.claims enable row level security;

drop policy if exists "anon can read claims" on public.claims;
create policy "anon can read claims"
  on public.claims
  for select
  to anon
  using (true);

-- Include full old row on DELETE so Realtime unclaim events sync.
alter table public.claims replica identity full;
