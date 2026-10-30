import { Users } from "lucide-react";
import type { Profile } from "./lib";

export function Participants({ profiles, viewerId }: { profiles: Profile[]; viewerId?: string }) {
  const participants = [...profiles].sort((a, b) => a.nickname.localeCompare(b.nickname, "pt-BR"));
  return <section className="participants" aria-labelledby="participants-title">
    <div className="participants-heading"><h2 id="participants-title"><Users size={17}/> Quem tá na roda</h2><span>{participants.length} {participants.length === 1 ? "participante" : "participantes"}</span></div>
    {participants.length ? <ul className="participants-grid">{participants.map(profile => <li key={profile.id} className={profile.id === viewerId ? "participant-self" : ""}>
      <img src={profile.avatar_url} alt="" loading="lazy"/>
      <span>{profile.nickname}</span>{profile.id === viewerId && <small>você</small>}
    </li>)}</ul> : <p className="participants-empty">A roda tá te esperando. Entre e chame seus amigos!</p>}
  </section>;
}
