import type { Profile, Vote } from "./lib";

export function getRoundHighlights(profiles: Profile[], votes: Vote[]) {
  const byPoll = new Map<string, Map<string, number>>();
  const stats = new Map(profiles.map(profile => [profile.id, { ...profile, receivedVotes: 0, appearances: 0, leadings: 0 }]));
  for (const vote of votes) {
    const profile = stats.get(vote.candidate_id);
    if (!profile) continue;
    profile.receivedVotes += 1;
    const counts = byPoll.get(vote.poll_id) ?? new Map<string, number>();
    if (!counts.has(profile.id)) profile.appearances += 1;
    counts.set(profile.id, (counts.get(profile.id) ?? 0) + 1);
    byPoll.set(vote.poll_id, counts);
  }
  for (const counts of byPoll.values()) {
    const highest = Math.max(...counts.values());
    for (const [id, count] of counts) if (count === highest) stats.get(id)!.leadings += 1;
  }
  const people = [...stats.values()];
  const winners = (metric: "receivedVotes" | "appearances" | "leadings") => {
    const highest = Math.max(0, ...people.map(person => person[metric]));
    return { count: highest, people: highest ? people.filter(person => person[metric] === highest).sort((a, b) => a.nickname.localeCompare(b.nickname, "pt-BR")) : [] };
  };
  return { mostVotes: winners("receivedVotes"), mostAppearances: winners("appearances"), mostLeads: winners("leadings"), totalVotes: people.reduce((sum, person) => sum + person.receivedVotes, 0), activePolls: byPoll.size };
}

export function getPollResults(profiles: Profile[], votes: Vote[]) {
  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote.candidate_id, (counts.get(vote.candidate_id) ?? 0) + 1);
  const total = votes.length;
  const ranked = profiles
    .map(profile => ({ ...profile, count: counts.get(profile.id) ?? 0 }))
    .filter(profile => profile.count > 0)
    .sort((a, b) => b.count - a.count || a.nickname.localeCompare(b.nickname, "pt-BR"));
  const entries = ranked.map(profile => ({
    ...profile,
    place: ranked.findIndex(other => other.count === profile.count) + 1,
    percentage: total ? Math.round(profile.count / total * 100) : 0,
  }));
  const leaders = entries.filter(profile => profile.count === entries[0]?.count);
  const top = entries.slice(0, 3);
  let verdict = "Por enquanto, a fama tem nome.";
  if (leaders.length > 1) verdict = "O grupo ainda não chegou a um acordo.";
  else if (total === 1) verdict = "Começou o exposed.";
  else if (entries[0]?.percentage >= 60 && total >= 3) verdict = "O grupo apontou. E apontou com vontade.";
  else if (entries[1] && entries[0].count - entries[1].count <= 1) verdict = "Um voto muda essa história.";
  return { total, entries, leaders, top, verdict, otherVotes: total - top.reduce((sum, profile) => sum + profile.count, 0) };
}
