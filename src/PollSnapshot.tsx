import { PollResults } from "./PollResults";
import { PrintDialog } from "./PrintDialog";
import type { Poll, Profile, Vote } from "./lib";

type Props = { poll: Poll; profiles: Profile[]; votes: Vote[]; viewerId?: string; onClose: () => void };

export function PollSnapshot({ poll, profiles, votes, viewerId, onClose }: Props) {
  return <PrintDialog titleId="snapshot-title" onClose={onClose}>
    <h2 id="snapshot-title">{poll.question}</h2>
    <PollResults profiles={profiles} votes={votes} viewerId={viewerId}/>
  </PrintDialog>;
}
