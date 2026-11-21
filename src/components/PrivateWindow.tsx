import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Character, DiceRequest, Msg } from '../lib/types';
import { CharacterPanel } from './CharacterPanel';
import { Composer } from './Composer';
import { DiceCard } from './DiceCard';
import { MessageList } from './MessageList';

interface Props {
  campaignId: string;
  userId: string;
  messages: Msg[];
  dice: DiceRequest[];
  characters: Character[];
  author: (m: Msg) => { label: string; sub?: string };
  onClose: () => void;
  onCharsChanged: () => void;
  initialTab?: 'chat' | 'sheet';
}

/** Pop-up personale: chat privata con il Master, scheda PG, tiri segreti. */
export function PrivateWindow({
  campaignId,
  userId,
  messages,
  dice,
  characters,
  author,
  onClose,
  onCharsChanged,
  initialTab = 'chat',
}: Props) {
  const [tab, setTab] = useState<'chat' | 'sheet'>(initialTab);

  // Il canale privato contiene SOLO il proprio thread (garantito dalla RLS); filtro difensivo comunque
  const thread = useMemo(
    () => messages.filter((m) => m.channel === 'private' && m.thread_user_id === userId),
    [messages, userId],
  );
  const myPending = dice.filter((d) => d.status === 'pending' && d.scope === 'private' && d.user_id === userId);

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <aside className="popup" role="dialog" aria-label="Finestra privata" onClick={(e) => e.stopPropagation()}>
        <header className="popup-head">
          <div>
            <strong>Finestra privata</strong>
            <div className="small muted">Solo tu e il Master potete leggere questa chat.</div>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </header>

        <nav className="tabs">
          <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            Chat con il Master
            {myPending.length > 0 && <span className="dot" />}
          </button>
          <button className={tab === 'sheet' ? 'active' : ''} onClick={() => setTab('sheet')}>
            La mia scheda
          </button>
        </nav>

        {tab === 'chat' ? (
          <>
            <MessageList
              messages={thread}
              author={author}
              empty="Qui puoi fare azioni segrete, porre domande al Master o preparare ciò che poi deciderai di condividere."
              canShare={(m) => m.author_type === 'player' || m.author_type === 'dm'}
            >
              {myPending.map((d) => (
                <DiceCard key={d.id} request={d} isMine ownerName="te" />
              ))}
            </MessageList>
            <Composer campaignId={campaignId} channel="private" placeholder="Scrivi al Master (privato)…" />
          </>
        ) : (
          <div className="popup-scroll">
            <CharacterPanel
              campaignId={campaignId}
              characters={characters}
              onChanged={onCharsChanged}
              onAskMaster={async (text) => {
                await api(`/campaigns/${campaignId}/messages`, { body: { channel: 'private', content: text } });
                setTab('chat');
              }}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
