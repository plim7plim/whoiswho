-- Atualiza apenas o limite; preserva usuários, arquivos e votos existentes.
update storage.buckets
set file_size_limit = 10485760
where id = 'avatars'
returning id, file_size_limit;
