import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus,
  ArrowRight,
  ArrowDown,
  Search,
  Users,
  MessageCircle,
  Heart,
  Check,
  X,
  Camera,
  LogOut,
} from "lucide-react";
import {
  supabase,
  withStarterPolls,
  votingOpensAt,
  read,
  type Profile,
  type Poll,
  type Vote,
} from "./lib";
import "./style.css";
import { VotingChoices } from "./VotingChoices";
import { PollResults } from "./PollResults";
import { PollSnapshot } from "./PollSnapshot";
import { RoundHighlights } from "./RoundHighlights";
import { Participants } from "./Participants";
// Remove only the original demo records from browsers that already opened the app.
const legacyProfileIds = new Set(["ana", "pedro", "bia", "lucas", "julia", "rafa"]);
const legacyPollIds = new Set(["p0", "p1", "p2"]);
function App() {
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const closeSnapshot = useCallback(() => setSnapshotId(null), []);
  const [now, setNow] = useState(Date.now);
  const votingOpen = now >= votingOpensAt;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [profiles, setProfiles] = useState<Profile[]>(() =>
      supabase ? [] : read<Profile[]>("ww-people", []).filter(p => !legacyProfileIds.has(p.id)),
    ),
    [polls, setPolls] = useState<Poll[]>(() =>
      supabase ? [] : withStarterPolls(read<Poll[]>("ww-polls", []).filter(p => !legacyPollIds.has(p.id))),
    ),
    [votes, setVotes] = useState<Vote[]>(() =>
      supabase ? [] : read<Vote[]>("ww-votes", []).filter(v => !legacyPollIds.has(v.poll_id) && !legacyProfileIds.has(v.candidate_id) && !v.voter_id.startsWith("seed-")),
    ),
    [me, setMe] = useState<Profile | null>(() =>
      supabase ? null : read("ww-me", null),
    );
  const [modal, setModal] = useState<"join" | "create" | null>(null),
    [nickname, setNickname] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [question, setQuestion] = useState(""),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("recent"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [loading, setLoading] = useState(!!supabase);
  useEffect(() => {
    if (!supabase) {
      localStorage.setItem("ww-people", JSON.stringify(profiles));
      localStorage.setItem("ww-polls", JSON.stringify(polls));
      localStorage.setItem("ww-votes", JSON.stringify(votes));
      localStorage.setItem("ww-me", JSON.stringify(me));
    }
  }, [profiles, polls, votes, me]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let active = true;
    let revision = 0;
    async function refresh() {
      const currentRevision = ++revision;
      const r = await Promise.all([
        db.from("profiles").select("*"),
        db.from("polls").select("*"),
        db.from("votes").select("*"),
      ]);
      if (!active || currentRevision !== revision) return;
      if (r.some((x) => x.error)) {
        setError(
          "Não foi possível carregar os dados. Confira a configuração do Supabase.",
        );
        setLoading(false);
        return;
      }
      setProfiles(r[0].data as Profile[]);
      setPolls(r[1].data as Poll[]);
      setVotes(r[2].data as Vote[]);
      setError("");
      const {
        data: { session },
      } = await db.auth.getSession();
      if (active && currentRevision === revision)
        setMe(
          (r[0].data as Profile[]).find((p) => p.id === session?.user.id) ||
            null,
        );
      setLoading(false);
    }
    void refresh();
    const c = db
      .channel("roda")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => void refresh(),
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") void refresh();
      });
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("online", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("online", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void db.removeChannel(c);
    };
  }, []);
  function open(m: "join" | "create") {
    setError("");
    setNickname(me?.nickname || "");
    setFile(null);
    setModal(m === "create" && !me ? "join" : m);
  }
  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const name = nickname.trim();
      if (name.length < 2 || name.length > 24)
        throw Error("Use um apelido entre 2 e 24 caracteres.");
      if (!file && !me) throw Error("Escolha uma foto para entrar.");
      if (
        file &&
        (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 10485760)
      )
        throw Error("Use JPG, PNG ou WebP de até 10 MB.");
      let id = me?.id || crypto.randomUUID(),
        avatar = me?.avatar_url || "";
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          const r = await supabase.auth.signInAnonymously();
          if (r.error) throw r.error;
          id = r.data.user!.id;
        } else id = session.user.id;
        if (file) {
          const path = `${id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
          const r = await supabase.storage.from("avatars").upload(path, file);
          if (r.error) throw r.error;
          avatar = supabase.storage.from("avatars").getPublicUrl(path)
            .data.publicUrl;
        }
        const r = await supabase
          .from("profiles")
          .upsert({ id, nickname: name, avatar_url: avatar });
        if (r.error) throw r.error;
      } else {
        if (
          profiles.some(
            (p) =>
              p.id !== id && p.nickname.toLowerCase() === name.toLowerCase(),
          )
        )
          throw Error("Esse apelido já está na roda. Escolha outro.");
        if (file)
          avatar = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = reject;
            r.readAsDataURL(file!);
          });
      }
      const p = { id, nickname: name, avatar_url: avatar };
      setProfiles((ps) => [...ps.filter((x) => x.id !== id), p]);
      setMe(p);
      setModal(null);
      setToast("Perfil pronto. Você tá na roda!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setError("");
    try {
      const q = question.trim();
      if (q.length < 12 || q.length > 180)
        throw Error("Escreva entre 12 e 180 caracteres.");
      const p = {
        id: crypto.randomUUID(),
        question: q,
        author_id: me.id,
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        const r = await supabase.from("polls").insert(p);
        if (r.error) throw r.error;
      }
      setPolls((ps) => [p, ...ps.filter((x) => x.id !== p.id)]);
      setModal(null);
      setQuestion("");
      setToast("Pergunta no ar. Que comecem os julgamentos!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao publicar.");
    } finally {
      setBusy(false);
    }
  }
  async function vote(p: Poll, c: Profile) {
    if (!votingOpen) {
      setToast("A votação abre hoje às 12h, no horário de Brasília.");
      return false;
    }
    if (!me) {
      open("join");
      return false;
    }
    if (
      c.id === me.id ||
      votes.some((v) => v.poll_id === p.id && v.voter_id === me.id)
    )
      return false;
    setBusy(true);
    try {
      const v = { poll_id: p.id, voter_id: me.id, candidate_id: c.id };
      if (supabase) {
        const r = await supabase.from("votes").insert(v);
        if (r.error) throw r.error;
      }
      setVotes((vs) => [
        ...vs.filter((x) => !(x.poll_id === p.id && x.voter_id === me.id)),
        v,
      ]);
      setToast(`Voto em ${c.nickname} registrado. Sem ressentimentos, hein?`);
      return true;
    } catch {
      setToast("Não foi possível votar. Atualize e tente novamente.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const filtered = polls
    .filter((p) => p.question.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "popular"
        ? votes.filter((v) => v.poll_id === b.id).length -
          votes.filter((v) => v.poll_id === a.id).length
        : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
  const snapshotPoll = polls.find(poll => poll.id === snapshotId);
  return (
    <>
      <header>
        <a className="brand" href="#">
          WHO’S WHO<span>?</span>
          <i />
        </a>
        <nav>
          <a href="#feed">
            <MessageCircle size={17} /> Enquetes
          </a>
          <span>ENTRE AMIGOS, SEM FILTRO.</span>
        </nav>
        <button className="account" onClick={() => open("join")}>
          {me && <img src={me.avatar_url} alt="" />}
          {me?.nickname || "Entrar na roda"}
          <ArrowRight size={16} />
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <i /> O GRUPO TEM MUITO A EXPLICAR
            </div>
            <h1>Quem é quem <span>no grupo?</span></h1>
            <p>Crie uma pergunta, vote em um amigo e veja o resultado.</p>
          </div>
          <button className="primary" onClick={() => open("create")}>
            <Plus size={19} /> Criar enquete
          </button>
        </section>
        <section className="content" id="feed">
          <div className="feed">
            {!loading && <Participants profiles={profiles} viewerId={me?.id}/>}
            {!votingOpen && <div className="voting-notice" role="status"><strong>Votação abre às 12h</strong><span>Hoje, 29/10 · horário de Brasília. Você já pode entrar e criar perguntas.</span></div>}
            {!loading && <RoundHighlights profiles={profiles} votes={votes}/>}
            <div className="feed-heading">
              <div>
                <div className="eyebrow muted">A CONVERSA TÁ RENDENDO</div>
                <h2>
                  Na roda <span>{polls.length}</span>
                </h2>
              </div>
              <label className="sort">
                <ArrowDown size={14} />
                <select
                  aria-label="Ordenar enquetes"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recent">Mais recentes</option>
                  <option value="popular">Mais votadas</option>
                </select>
              </label>
            </div>
            <label className="search">
              <Search size={17} />
              <input
                placeholder="Encontre uma pergunta…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {loading && <p className="empty">Carregando a roda…</p>}
            {error && !modal && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {!loading && !filtered.length && (
              <p className="empty">
                {query
                  ? "Nenhuma pergunta encontrada."
                  : "Seja o primeiro a soltar uma pergunta!"}
              </p>
            )}
            {filtered.map((p) => {
              const author = profiles.find((a) => a.id === p.author_id),
                pv = votes.filter((v) => v.poll_id === p.id),
                mine = pv.find((v) => v.voter_id === me?.id);
              return (
                <article className="poll" key={p.id}>
                  <div className="poll-meta">
                    {author && <img src={author.avatar_url} alt="" />}
                    <strong>{author?.nickname || "WHO’S WHO?"}</strong>
                    <span>{author ? "mandou essa" : "pra começar"}</span>
                    <time>
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(p.created_at))}
                    </time>
                    <span className="live">
                      <i /> AO VIVO
                    </span>
                    <button className="snapshot-trigger" type="button" onClick={() => setSnapshotId(p.id)} aria-label={`Abrir modo print: ${p.question}`}><Camera size={13}/><span>Print</span></button>
                  </div>
                  <div className="question-number">
                    PERGUNTA {String(polls.length - polls.findIndex(item => item.id === p.id)).padStart(2, "0")}
                  </div>
                  <h3>{p.question}</h3>
                  <div className="vote-label">
                    {!votingOpen ? <span>Escolha seu voto a partir das 12h (Brasília).</span> : mine ? (
                      <span className="voted">
                        <Check size={14} /> Voto registrado. Agora acompanha o
                        estrago.
                      </span>
                    ) : (
                      <>
                        QUEM É ESSA PESSOA?
                        <span>
                          Selecione e confirme <ArrowDown size={12} />
                        </span>
                      </>
                    )}
                  </div>
                  <VotingChoices
                    profiles={profiles}
                    viewerId={me?.id}
                    votedCandidateId={mine?.candidate_id}
                    votingOpen={votingOpen}
                    busy={busy}
                    onJoin={() => open("join")}
                    onConfirm={candidate => vote(p, candidate)}
                  />
                  <PollResults profiles={profiles} votes={pv} viewerId={me?.id} />
                  <div className="poll-bottom">
                    <Users size={14} />
                    <span>Um voto por pessoa. Sem votar em si mesmo.</span>
                    <Heart size={14} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <footer>
          <a className="brand" href="#">
            WHO’S WHO<span>?</span>
          </a>
          <span>O que acontece na roda… vira assunto no grupo.</span>
          <span>Feito entre amigos. ✳</span>
        </footer>
        {!supabase && (
          <div className="demo-badge">
            <i /> Modo local · dados neste navegador
          </div>
        )}
      </main>
      {snapshotPoll && <PollSnapshot poll={snapshotPoll} profiles={profiles} votes={votes.filter(vote => vote.poll_id === snapshotPoll.id)} viewerId={me?.id} onClose={closeSnapshot}/>}
      {modal && (
        <div className="overlay" onClick={() => !busy && setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              disabled={busy}
              aria-label="Fechar"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <div className="eyebrow">
              {modal === "join" ? "PUXA UMA CADEIRA" : "SOLTA A PERGUNTA"}
            </div>
            <h2 id="modal-title">
              {modal === "join"
                ? me
                  ? "Seu perfil na roda."
                  : "Quem é você na roda?"
                : "Vai sobrar pra quem?"}
            </h2>
            <p>
              {modal === "join"
                ? "Um apelido, uma foto e pronto. A resenha te espera."
                : "Aquela pergunta que só o seu grupo entende."}
            </p>
            <form onSubmit={modal === "join" ? join : create}>
              {modal === "join" ? (
                <>
                  <label className="upload">
                    {preview || me?.avatar_url ? (
                      <img src={preview || me?.avatar_url} alt="Sua foto" />
                    ) : (
                      <Camera />
                    )}
                    <span>
                      Escolher foto<small>JPG, PNG ou WebP · até 10 MB</small>
                    </span>
                    <input
                      aria-label="Escolher foto"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="field">
                    Seu apelido
                    <input
                      autoFocus
                      required
                      minLength={2}
                      maxLength={24}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Como o grupo te chama?"
                    />
                  </label>
                </>
              ) : (
                <label className="field">
                  Sua pergunta
                  <textarea
                    autoFocus
                    required
                    minLength={12}
                    maxLength={180}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Quem do grupo tem mais chance de…"
                  />
                  <small>{question.length}/180 · fica aberta para sempre</small>
                </label>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="primary submit" disabled={busy}>
                {busy
                  ? "Salvando…"
                  : modal === "join"
                    ? "Bora pra roda"
                    : "Publicar enquete"}
                <ArrowRight size={17} />
              </button>
            </form>
            {me && modal === "join" && (
              <button
                className="logout"
                onClick={async () => {
                  if (supabase) await supabase.auth.signOut();
                  setMe(null);
                  setModal(null);
                }}
              >
                <LogOut size={15} /> Sair da roda
              </button>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

