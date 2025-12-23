create table if not exists public.video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, video_id)
);

alter table public.video_bookmarks enable row level security;

create policy "Users can read their own bookmarks"
on public.video_bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can create their own bookmarks"
on public.video_bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
on public.video_bookmarks
for delete
using (auth.uid() = user_id);
