// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VotingChoices } from "../src/VotingChoices";

const profiles = [
  { id: "me", nickname: "Eu", avatar_url: "/me.png" },
  { id: "a", nickname: "Amigo A", avatar_url: "/a.png" },
  { id: "b", nickname: "Amigo B", avatar_url: "/b.png" },
];
afterEach(cleanup);

function setup(overrides = {}) {
  const onConfirm = vi.fn(async () => true);
  const onJoin = vi.fn();
  render(<VotingChoices profiles={profiles} viewerId="me" votingOpen busy={false} onConfirm={onConfirm} onJoin={onJoin} {...overrides} />);
  return { onConfirm, onJoin };
}

describe("Confirmação do voto", () => {
  it("seleciona e troca a escolha sem registrar voto; confirma somente a última escolha", async () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo A" }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo B" }));
    expect(screen.getByRole("button", { name: "Selecionar Amigo B" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Selecionar Amigo A" }).getAttribute("aria-pressed")).toBe("false");
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar voto em Amigo B" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledExactlyOnceWith(profiles[2]));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Confirmar voto/ })).toBeNull());
  });

  it("cancela sem enviar voto", () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo A" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: /Confirmar voto/ })).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("não permite confirmar duas vezes enquanto registra", async () => {
    let finish!: (success: boolean) => void;
    const onConfirm = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    setup({ onConfirm });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo A" }));
    const button = screen.getByRole("button", { name: "Confirmar voto em Amigo A" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute("disabled")).toBe(true);
    await act(async () => finish(true));
  });

  it("preserva a escolha quando o envio falha para permitir tentar novamente", async () => {
    const onConfirm = vi.fn(async () => false);
    setup({ onConfirm });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo A" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar voto em Amigo A" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirmar voto em Amigo A" }).hasAttribute("disabled")).toBe(false));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("bloqueia voto em si mesmo e antes do horário de abertura", () => {
    const { onConfirm } = setup({ votingOpen: false });
    expect(screen.getByRole("button", { name: "Selecionar Eu (você)" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo A" }));
    expect(screen.queryByRole("button", { name: /Confirmar voto/ })).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("mantém votos já registrados bloqueados", () => {
    const { onConfirm } = setup({ votedCandidateId: "a" });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Amigo B" }));
    expect(screen.getByRole("button", { name: "Selecionar Amigo A" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: /Confirmar voto/ })).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
