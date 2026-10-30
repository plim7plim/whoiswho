-- Perguntas iniciais oficiais, sem usuários ou votos fictícios.
begin;
alter table public.polls alter column author_id drop not null;
insert into public.polls (id, question, author_id, created_at) values
('10000000-0000-4000-8000-000000000001', 'Quem diria ‘tô chegando’ sem nem ter saído de casa?', null, '2026-10-29T12:00:06Z'),
('10000000-0000-4000-8000-000000000002', 'Quem ficaria rico e continuaria pedindo a senha do streaming?', null, '2026-10-29T12:00:05Z'),
('10000000-0000-4000-8000-000000000003', 'Quem faria amizade com o ladrão durante um assalto?', null, '2026-10-29T12:00:04Z'),
('10000000-0000-4000-8000-000000000004', 'Quem seria eliminado de um reality por não parar de falar?', null, '2026-10-29T12:00:03Z'),
('10000000-0000-4000-8000-000000000005', 'Quem gastaria o salário inteiro em uma ideia que teve às 3 da manhã?', null, '2026-10-29T12:00:02Z'),
('10000000-0000-4000-8000-000000000006', 'Quem toparia uma viagem sem saber o destino e esqueceria a mala?', null, '2026-10-29T12:00:01Z')
on conflict (id) do nothing;
commit;
