import { Gavel, Radio, Eye, Check } from "lucide-react";
import type { Profile, Vote } from "./lib";
import { getPollResults } from "./results";

type Props = { profiles: Profile[]; votes: Vote[]; viewerId?: string };

export function PollResults({ profiles, votes, viewerId }: Props) {
  const result = getPollResults(profiles, votes);
  const myVote = votes.find(vote => vote.voter_id === viewerId);
  const myCount = result.entries.find(profile => profile.id === viewerId)?.count ?? 0;
  const tied = result.leaders.length > 1;
  const leader = result.leaders[0];
  const names = result.leaders.slice(0, 2).map(profile => profile.nickname).join(" e ");
  const extraLeaders = result.leaders.length - 2;

  return <section className="poll-results" aria-label="Resultados desta enquete">
    <div className="verdict-heading"><span><Gavel size={14}/> O VEREDITO DA RODA</span><span className="partial-label"><Radio size={12}/> PARCIAL</span></div>
    {!leader ? <div className="verdict-empty"><span className="empty-jury" aria-hidden="true"><Eye size={24}/></span><div><strong>O júri ainda está em silêncio.</strong><p>Assim que sair o primeiro voto, começa o exposed.</p></div><span className="empty-score">0 <small>votos</small></span></div> : <>
      <div className={`verdict-spotlight ${tied ? "is-tied" : ""}`}>
        <div className="leader-photos" aria-hidden="true">{result.leaders.slice(0, 2).map(profile => <img key={profile.id} src={profile.avatar_url} alt=""/>)}<span className="leader-pin">{tied ? "=" : "1"}</span></div>
        <div className="leader-copy"><span className="leader-kicker">{tied ? "EMPATE NA RODA" : "NA MIRA DO GRUPO"}</span><h4>{names}{extraLeaders > 0 && <small> + {extraLeaders}</small>}</h4><p>{result.verdict}</p></div>
        {!tied && <div className="leader-share"><strong>{leader.percentage}<small>%</small></strong><span>dos votos</span></div>}
      </div>
      <div className="podium-heading"><span>QUEM MAIS ENTROU NA RESENHA</span><span>{result.total} {result.total === 1 ? "voto" : "votos"}</span></div>
      <ol className="resenha-ranking" aria-label="Top 3 mais votados">{result.top.map(profile => <li key={profile.id} className={profile.place === 1 ? "rank-leading" : ""}>
        <span className="rank-position" aria-label={`${profile.place}º lugar`}>{String(profile.place).padStart(2, "0")}</span>
        <img src={profile.avatar_url} alt=""/>
        <div className="rank-detail"><div className="rank-label"><strong>{profile.nickname}{profile.id === viewerId && <small> você</small>}</strong><span>{profile.count} {profile.count === 1 ? "voto" : "votos"}</span></div><div className="rank-track" role="meter" aria-label={`Porcentagem dos votos em ${profile.nickname}`} aria-valuenow={profile.percentage} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${profile.percentage}%` }}/></div></div>
        <strong className="rank-percentage">{profile.percentage}<small>%</small></strong>
        {myVote?.candidate_id === profile.id && <span className="your-pick" title="Seu voto confirmado" aria-label="Seu voto confirmado"><Check size={12}/></span>}
      </li>)}</ol>
      {result.otherVotes > 0 && <p className="other-votes">Outros amigos receberam {result.otherVotes} {result.otherVotes === 1 ? "voto" : "votos"}.</p>}
      <div className="verdict-footer"><span>{viewerId ? myCount > 0 ? <><Eye size={13}/> Seu nome apareceu {myCount} {myCount === 1 ? "vez" : "vezes"}. 👀</> : <><Eye size={13}/> Você segue fora do radar.</> : "O placar pode virar a qualquer momento."}</span><span>Sem levar pro pessoal.</span></div>
    </>}
  </section>;
}
