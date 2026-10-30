-- Execute no SQL Editor de um projeto Supabase novo.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check(char_length(trim(nickname)) between 2 and 24),
 avatar_url text not null check(char_length(avatar_url) between 1 and 2048)
);
create unique index profiles_nickname_unique on public.profiles(lower(nickname));
create table public.polls (
 id uuid primary key default gen_random_uuid(),
 question text not null check(char_length(trim(question)) between 12 and 180),
 author_id uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.votes (
 poll_id uuid not null references public.polls(id) on delete cascade,
 voter_id uuid not null references public.profiles(id),
 candidate_id uuid not null references public.profiles(id),
 primary key(poll_id,voter_id),
 check(voter_id <> candidate_id)
);
create index votes_candidate on public.votes(poll_id,candidate_id);
alter table public.profiles enable row level security;
alter table public.polls enable row level security;
alter table public.votes enable row level security;
grant usage on schema public to anon,authenticated;
grant select on public.profiles,public.polls,public.votes to anon,authenticated;
grant insert,update on public.profiles to authenticated;
grant insert on public.polls,public.votes to authenticated;
create policy "Read profiles" on public.profiles for select to anon,authenticated using(true);
create policy "Create own profile" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "Edit own profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "Read polls" on public.polls for select to anon,authenticated using(true);
create policy "Create own polls" on public.polls for insert to authenticated with check(author_id=auth.uid());
create policy "Read votes" on public.votes for select to anon,authenticated using(true);
create policy "Cast own vote" on public.votes for insert to authenticated with check(voter_id=auth.uid() and candidate_id<>auth.uid());
create policy "Voting opens at scheduled time" on public.votes as restrictive for insert to authenticated
with check(now() >= timestamptz '2026-10-29 12:00:00-03');
-- Sem UPDATE/DELETE para votos: não é possível trocar ou apagar um voto.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,10485760,array['image/jpeg','image/png','image/webp']);
create policy "Upload own avatar" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Read avatars" on storage.objects for select to anon,authenticated using(bucket_id='avatars');
alter publication supabase_realtime add table public.profiles,public.polls,public.votes;
