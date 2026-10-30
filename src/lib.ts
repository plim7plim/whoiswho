import { createClient } from "@supabase/supabase-js";
export const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      )
    : null;
export type Profile = { id: string; nickname: string; avatar_url: string };
export type Poll = {
  id: string;
  question: string;
  author_id: string | null;
  created_at: string;
};
export type Vote = { poll_id: string; voter_id: string; candidate_id: string };
export const votingOpensAt = Date.parse("2026-10-29T12:00:00-03:00");
export const starterPolls: Poll[] = [
  "Quem diria ‘tô chegando’ sem nem ter saído de casa?",
  "Quem ficaria rico e continuaria pedindo a senha do streaming?",
  "Quem faria amizade com o ladrão durante um assalto?",
  "Quem seria eliminado de um reality por não parar de falar?",
  "Quem gastaria o salário inteiro em uma ideia que teve às 3 da manhã?",
  "Quem toparia uma viagem sem saber o destino e esqueceria a mala?",
].map((question, index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  question,
  author_id: null,
  created_at: `2026-10-29T12:00:${String(6 - index).padStart(2, "0")}Z`,
}));
export function withStarterPolls(polls: Poll[]): Poll[] {
  return [...polls, ...starterPolls.filter(starter => !polls.some(poll => poll.id === starter.id))];
}
export function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
