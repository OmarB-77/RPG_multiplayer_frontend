import { useMemo, useState } from 'react';
import { useCampaign } from '../hooks/useCampaign';
import { api } from '../lib/api';
import { makeNamer } from '../lib/names';
import { supabase } from '../lib/supabase';
import { Composer } from './Composer';
import { DiceCard } from './DiceCard';
import { MessageList } from './MessageList';
import { PrivateWindow } from './PrivateWindow';
import { SystemPicker } from './SystemPicker';

const STAGE_LABEL = {
  setup: 'Sessione zero',
  characters: 'Creazione personaggi',
  playing: 'In gioco',
  archived: 'Archiviata',
} as const;

interface Props {
  campaignId: string;
  userId: string;
  onExit: () => void;
}

export function Room({ campaignId, userId, onExit }: Props) {
  const { campaign, members, cards, myChars, messages, dice, loading, error, reloadMyChars } = useCampaign(campaignId);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const namer = useMemo(() => makeNamer(members, cards, myChars), [members, cards, myChars]);
  const mainMessages = useMemo(() => messages.filter((m) => m.channel === 'main'), [messages]);
  const groupDice = dice.filter((d) => d.status === 'pending' && d.scope === 'group');
  const myPrivateDice = dice.filter((d) => d.status === 'pending' && d.scope === 'private' && d.user_id === userId);

  if (loading) return <div className="center muted">Caricamento della stanza…</div>;
  if (error || !campaign) {
    return (
      <div className="center">
        <p className="error">{error ?? 'Errore'}</p>
        <button className="btn" onClick={onExit}>
          Torna alle campagne
        </button>
      </div>
    );
  }

  const isOwner = campaign.owner_id === userId;
  const systemName = campaign.settings?.system;

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function closeAdventure() {
    if (!confirm("Chiudere l'avventura? Il Master ne farà un riassunto e la campagna tornerà alla sessione zero.")) return;
    const { data } = await supabase
      .from('adventures')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .maybeSingle();
    if (!data) throw new Error('Nessuna avventura attiva');
    await api(`/adventures/${data.id}/close`, { method: 'POST', body: {} });
  }

  return (
    <div className="room">
      <header className="room-head">
        <button className="btn ghost" onClick={onExit}>
          ← Campagne
        </button>
        <div className="room-title">
          <h1>{campaign.name}</h1>
          <div className="small muted">
            {STAGE_LABEL[campaign.status]}
            {systemName ? ` · ${systemName}` : ''}
            {' · '}codice invito: <code>{campaign.invite_code}</code>
          </div>
        </div>
        <button className="btn primary" onClick={() => setPrivateOpen(true)}>
          Finestra privata
          {myPrivateDice.length > 0 && <span className="dot" />}
        </button>
      </header>

      <main className="room-main">
        {campaign.status === 'setup' && <SystemPicker campaign={campaign} isOwner={isOwner} />}

        <section className="story">
          <MessageList
            messages={mainMessages}
            author={namer.author}
            empty="La storia non è ancora cominciata. Il Master attende…"
          >
            {groupDice.map((d) => (
              <DiceCard key={d.id} request={d} isMine={d.user_id === userId} ownerName={namer.userName(d.user_id)} />
            ))}
            {campaign.dm_status === 'thinking' && <div className="thinking">Il Master sta scrivendo…</div>}
          </MessageList>
          <Composer
            campaignId={campaignId}
            channel="main"
            placeholder={
              campaign.status === 'playing' ? 'Cosa fa il tuo personaggio?' : 'Scrivi al gruppo e al Master…'
            }
            disabled={campaign.status === 'archived'}
          />
        </section>
      </main>

      <aside className="room-side">
        <section className="panel">
          <h3>Il gruppo</h3>
          <ul className="people">
            {members.map((m) => {
              const card = cards.filter((c) => c.user_id === m.user_id);
              return (
                <li key={m.user_id}>
                  <div>
                    <strong>{m.profiles?.display_name ?? 'Giocatore'}</strong>
                    {m.role === 'owner' && <span className="badge">creatore</span>}
                    {m.user_id === userId && <span className="badge">tu</span>}
                  </div>
                  {card.length === 0 && <div className="small muted">Nessun personaggio</div>}
                  {card.map((c) => (
                    <div key={c.id} className="small">
                      <em>{c.name}</em>
                      {c.public_summary ? <span className="muted"> — {c.public_summary}</span> : null}
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <h3>Azioni</h3>
          <div className="stack">
            {campaign.status === 'characters' && isOwner && (
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void act(() => api(`/campaigns/${campaignId}/start`, { method: 'POST', body: {} }))}
              >
                Inizia l'avventura
              </button>
            )}
            {campaign.status === 'playing' && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => void act(() => api(`/campaigns/${campaignId}/close-round`, { method: 'POST', body: {} }))}
              >
                Chiudi il round (il Master risponde ora)
              </button>
            )}
            {campaign.status === 'playing' && isOwner && (
              <button className="btn ghost" disabled={busy} onClick={() => void act(closeAdventure)}>
                Concludi l'avventura
              </button>
            )}
            {campaign.status === 'characters' && !isOwner && (
              <p className="small muted">Preparate i personaggi nella finestra privata. Il creatore avvierà l'avventura.</p>
            )}
            {campaign.settings?.mode && (
              <p className="small muted">
                Modalità: {campaign.settings.mode === 'round' ? 'a round' : `libera (${campaign.settings.debounce_seconds ?? 20}s)`}
              </p>
            )}
          </div>
          {actionError && <div className="error small">{actionError}</div>}
        </section>
      </aside>

      {privateOpen && (
        <PrivateWindow
          campaignId={campaignId}
          userId={userId}
          messages={messages}
          dice={dice}
          characters={myChars}
          author={namer.author}
          onClose={() => setPrivateOpen(false)}
          onCharsChanged={() => void reloadMyChars()}
          initialTab={campaign.status === 'characters' && myChars.length === 0 ? 'sheet' : 'chat'}
        />
      )}
    </div>
  );
}
