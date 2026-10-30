import { useCallback, useState } from "react";
import { Camera, ChevronDown, Flame, Eye, Crown } from "lucide-react";
import type { Profile, Vote } from "./lib";
import { getRoundHighlights } from "./results";
import { PrintDialog } from "./PrintDialog";

export function RoundHighlights({ profiles, votes }: { profiles: Profile[]; votes: Vote[] }) {
  const [printing, setPrinting] = useState(false);
  const closePrint = useCallback(() => setPrinting(false), []);
  const result = getRoundHighlights(profiles, votes);
  const awards = [
    { title: "Figurinha carimbada", subtitle: "QUEM MAIS APARECEU", icon: Eye, data: result.mostAppearances, unit: "enquete", plural: "enquetes", explanation: "Recebeu pelo menos um voto em mais enquetes." },
    { title: "Alvo favorito", subtitle: "QUEM MAIS RECEBEU VOTOS", icon: Flame, data: result.mostVotes, unit: "voto", plural: "votos", explanation: "Soma dos votos recebidos em todas as enquetes." },
    { title: "Dono da resenha", subtitle: "QUEM LIDERA MAIS ENQUETES", icon: Crown, data: result.mostLeads, unit: "liderança", plural: "lideranças", explanation: "Enquetes em que lidera, incluindo empates." },
  ];
  const cards = <div className="round-awards">{awards.map(award => <article className="round-award" key={award.title}>
    <div className="award-heading"><award.icon size={16}/><span>{award.subtitle}</span></div>
    <h3>{award.title}</h3>
    <div className="award-winner"><div className="award-photos" aria-hidden="true">{award.data.people.slice(0, 2).map(person => <img src={person.avatar_url} alt="" key={person.id}/>)}</div><div><strong>{award.data.people.slice(0, 2).map(person => person.nickname).join(" e ")}{award.data.people.length > 2 && ` + ${award.data.people.length - 2}`}</strong><span>{award.data.count} {award.data.count === 1 ? award.unit : award.plural}{award.data.people.length > 1 && " · empate"}</span></div></div>
    <p>{award.explanation}</p>
  </article>)}</div>;
  return <>
    <details className="round-overview"><summary><span><strong>Quem tá rendendo assunto?</strong><small>Os destaques da rodada, em tempo real.</small></span><ChevronDown size={18}/></summary>
      <div className="round-content">{result.totalVotes ? <>{cards}<div className="round-bottom"><span>{result.totalVotes} {result.totalVotes === 1 ? "voto" : "votos"} em {result.activePolls} {result.activePolls === 1 ? "enquete" : "enquetes"} · tudo parcial.</span><button className="snapshot-trigger" type="button" onClick={() => setPrinting(true)}><Camera size={13}/> Print do resumo</button></div></> : <p className="round-empty">Os destaques aparecem com os primeiros votos. Por enquanto, ninguém foi entregue.</p>}</div>
    </details>
    {printing && <PrintDialog titleId="round-print-title" onClose={closePrint} className="round-snapshot"><h2 id="round-print-title">O grupo falou.<br/><span>E esses nomes renderam.</span></h2><div className="round-print-total">{result.totalVotes} {result.totalVotes === 1 ? "voto" : "votos"} · {result.activePolls} {result.activePolls === 1 ? "enquete" : "enquetes"} com votos · parcial</div>{cards}</PrintDialog>}
  </>;
}
