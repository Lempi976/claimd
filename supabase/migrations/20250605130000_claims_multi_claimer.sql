-- Multiple people can claim the same task (one row per person).
-- Drop any old single-claimer constraint on task_id alone.
alter table public.claims drop constraint if exists claims_task_id_key;
drop index if exists claims_task_id_key;
drop index if exists claims_task_id_unique;

-- Same person cannot claim twice on one task; different people can.
create unique index if not exists claims_task_id_claimer_name_key
  on public.claims (task_id, claimer_name);
