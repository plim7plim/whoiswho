import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { Profile } from "./lib";

type Props = {
  profiles: Profile[];
  viewerId?: string;
  votedCandidateId?: string;
  votingOpen: boolean;
  busy: boolean;
  onJoin: () => void;
  onConfirm: (candidate: Profile) => Promise<boolean>;
};

export function VotingChoices({ profiles, viewerId, votedCandidateId, votingOpen, busy, onJoin, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const inFlight = useRef(false);
  const selected = profiles.find(profile => profile.id === selectedId && profile.id !== viewerId);

  useEffect(() => { setSelectedId(null); }, [viewerId, votedCandidateId]);

  async function confirm() {
    if (!selected || !viewerId || !votingOpen || votedCandidateId || busy || inFlight.current) return;
    inFlight.current = true;
    setConfirming(true);
    try {
      if (await onConfirm(selected)) setSelectedId(null);
    } finally {
      inFlight.current = false;
      setConfirming(false);
    }
  }

  return <>
    <div className="candidates" role="group" aria-label="Escolha um amigo para votar">
      {!profiles.length && <p className="no-votes">Entre na roda para aparecer aqui. Cada novo amigo já pode receber votos.</p>}
      {profiles.map(candidate => {
        const voted = votedCandidateId === candidate.id;
        const pending = !votedCandidateId && selectedId === candidate.id;
        return <button type="button" key={candidate.id}
          className={`candidate ${voted ? "chosen" : pending ? "selected" : ""}`}
          aria-label={`Selecionar ${candidate.nickname}${candidate.id === viewerId ? " (você)" : ""}`}
          aria-pressed={voted || pending}
          disabled={!votingOpen || busy || confirming || !!votedCandidateId || candidate.id === viewerId}
          title={!votingOpen ? "Votação abre hoje às 12h (Brasília)" : candidate.id === viewerId ? "Não vale votar em você" : votedCandidateId ? "Você já votou" : `Selecionar ${candidate.nickname}`}
          onClick={() => { if (!viewerId) { onJoin(); return; } setSelectedId(candidate.id); }}>
          <div><img src={candidate.avatar_url} alt=""/>{(voted || pending) && <b><Check size={12}/></b>}</div>
          <span>{candidate.nickname}{candidate.id === viewerId ? " (você)" : ""}</span>
        </button>;
      })}
    </div>
    {selected && !votedCandidateId && votingOpen && <div className="vote-confirmation">
      <div aria-live="polite"><span>Seu voto: <strong>{selected.nickname}</strong></span><small>Confira antes de confirmar. Depois, não dá para trocar.</small></div>
      <div className="vote-confirmation-actions">
        <button type="button" className="cancel-vote" disabled={busy || confirming} onClick={() => setSelectedId(null)}>Cancelar</button>
        <button type="button" className="primary" aria-label={`Confirmar voto em ${selected.nickname}`} disabled={busy || confirming} onClick={() => void confirm()}>{confirming ? "Registrando…" : "Confirmar voto"}<Check size={16}/></button>
      </div>
    </div>}
  </>;
}
