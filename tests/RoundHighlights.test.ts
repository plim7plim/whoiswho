import { describe, expect, it } from "vitest";
import { getRoundHighlights } from "../src/results";
import type { Vote } from "../src/lib";

const profiles = ["Ana", "Bia", "Caio"].map((nickname, i) => ({ id: String(i), nickname, avatar_url: `/${i}.png` }));
const vote = (poll: string, candidate: string, i: number): Vote => ({ poll_id: poll, candidate_id: candidate, voter_id: String(i) });

describe("Destaques da rodada", () => {
  it("conta aparições por enquete, em vez de contar várias vezes os votos da mesma pergunta", () => {
    const votes = [vote("a", "0", 1), vote("a", "0", 2), vote("a", "0", 3), vote("b", "1", 1), vote("c", "1", 2)];
    const result = getRoundHighlights(profiles, votes);
    expect(result.mostAppearances.people.map(p => p.nickname)).toEqual(["Bia"]);
    expect(result.mostAppearances.count).toBe(2);
    expect(result.mostVotes.people.map(p => p.nickname)).toEqual(["Ana"]);
    expect(result.mostVotes.count).toBe(3);
    expect(result.totalVotes).toBe(5);
    expect(result.activePolls).toBe(3);
  });

  it("considera todos os líderes de uma enquete empatada", () => {
    const result = getRoundHighlights(profiles, [vote("a", "0", 1), vote("a", "1", 2)]);
    expect(result.mostLeads.count).toBe(1);
    expect(result.mostLeads.people.map(p => p.nickname)).toEqual(["Ana", "Bia"]);
    expect(result.mostVotes.people).toHaveLength(2);
  });

  it("não inventa destaque antes de haver votos", () => {
    const result = getRoundHighlights(profiles, []);
    expect(result.totalVotes).toBe(0);
    expect(result.activePolls).toBe(0);
    expect(result.mostVotes.people).toEqual([]);
    expect(result.mostAppearances.people).toEqual([]);
    expect(result.mostLeads.people).toEqual([]);
  });

  it("recalcula a liderança geral com novos votos", () => {
    const votes = [vote("a", "0", 1), vote("a", "1", 2), vote("b", "0", 1)];
    expect(getRoundHighlights(profiles, votes).mostLeads.people.map(p => p.nickname)).toEqual(["Ana"]);
    const after = getRoundHighlights(profiles, [...votes, vote("a", "1", 3), vote("b", "1", 2), vote("b", "1", 3)]);
    expect(after.mostLeads.people.map(p => p.nickname)).toEqual(["Bia"]);
    expect(after.mostLeads.count).toBe(2);
  });
});
