// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PollResults } from "../src/PollResults";
import { getPollResults } from "../src/results";
import type { Vote } from "../src/lib";

const profiles = ["Ana", "Bia", "Caio", "Dani"].map((nickname, i) => ({ id: String(i), nickname, avatar_url: `/${i}.png` }));
const vote = (candidate: string, i: number): Vote => ({ poll_id: "poll", voter_id: `voter-${i}`, candidate_id: candidate });
afterEach(cleanup);

describe("Resultados da enquete", () => {
  it("mostra um estado inicial sem inventar vencedor ou porcentagem", () => {
    render(<PollResults profiles={profiles} votes={[]} />);
    expect(screen.getByText("O júri ainda está em silêncio.")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Top 3 mais votados" })).toBeNull();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("calcula o Top 3 sobre todos os votos, incluindo quem está fora do pódio", () => {
    const results = getPollResults(profiles, ["0", "0", "0", "0", "1", "1", "2", "3"].map(vote));
    expect(results.total).toBe(8);
    expect(results.top.map(p => p.percentage)).toEqual([50, 25, 13]);
    expect(results.otherVotes).toBe(1);
    expect(results.leaders.map(p => p.nickname)).toEqual(["Ana"]);
  });

  it("reconhece empate e usa a mesma posição sem escolher vencedor arbitrário", () => {
    const votes = ["0", "0", "1", "1", "2"].map(vote);
    const results = getPollResults(profiles, votes);
    expect(results.top.map(p => p.place)).toEqual([1, 1, 3]);
    render(<PollResults profiles={profiles} votes={votes} />);
    expect(screen.getByText("EMPATE NA RODA")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ana e Bia" })).toBeTruthy();
  });

  it("acompanha mudança de liderança quando novos votos chegam", () => {
    const { rerender } = render(<PollResults profiles={profiles} votes={[vote("0", 1)]} />);
    expect(screen.getByRole("heading", { name: "Ana" })).toBeTruthy();
    rerender(<PollResults profiles={profiles} votes={[vote("0", 1), vote("1", 2), vote("1", 3)]} />);
    expect(screen.getByRole("heading", { name: "Bia" })).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Porcentagem dos votos em Bia" }).getAttribute("aria-valuenow")).toBe("67");
  });

  it("distingue votos recebidos do voto confirmado pelo usuário", () => {
    render(<PollResults profiles={profiles} viewerId="0" votes={[
      { poll_id: "poll", voter_id: "0", candidate_id: "1" }, vote("0", 1), vote("0", 2),
    ]} />);
    expect(screen.getByText(/Seu nome apareceu 2 vezes/)).toBeTruthy();
    expect(screen.getByLabelText("Seu voto confirmado")).toBeTruthy();
  });
});
