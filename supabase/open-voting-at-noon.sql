-- Atualiza somente a abertura. Não zera votos novamente.
begin;
alter policy "Voting opens at 18h Brasilia" on public.votes
rename to "Voting opens at scheduled time";
alter policy "Voting opens at scheduled time" on public.votes
with check(now() >= timestamptz '2026-10-29 12:00:00-03');
commit;
