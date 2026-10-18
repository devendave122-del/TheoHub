-- Run this in Supabase SQL Editor after creating a project.
create table if not exists public.saved_work (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  content text not null,
  kind text not null default 'note' check (kind in ('sermon','question','study','note')),
  created_at timestamptz not null default now()
);
alter table public.saved_work enable row level security;
drop policy if exists "Users can read their own saved work" on public.saved_work;
create policy "Users can read their own saved work" on public.saved_work for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can add their own saved work" on public.saved_work;
create policy "Users can add their own saved work" on public.saved_work for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own saved work" on public.saved_work;
create policy "Users can delete their own saved work" on public.saved_work for delete to authenticated using (auth.uid() = user_id);
