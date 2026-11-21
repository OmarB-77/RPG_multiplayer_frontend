import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Msg } from '../lib/types';
import { Rich } from './Rich';

interface Props {
  messages: Msg[];
  author: (m: Msg) => { label: string; sub?: string };
  /** Se presente, mostra il pulsante "Condividi" sui messaggi condivisibili (finestra privata). */
  canShare?: (m: Msg) => boolean;
  empty: string;
  children?: React.ReactNode;
}

export function MessageList({ messages, author, canShare, empty, children }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, children]);

  async function share(m: Msg) {
    setSharing(m.id);
    setError(null);
    try {
      await api(`/messages/${m.id}/share`, { method: 'POST', body: {} });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSharing(null);
    }
  }

  return (
    <div className="messages">
      {messages.length === 0 && <div className="empty">{empty}</div>}
      {messages.map((m) => {
        const a = author(m);
        const time = new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const shared = Boolean(m.meta?.shared);
        return (
          <div key={m.id} className={`msg ${m.author_type}`}>
            <div className="msg-head">
              <span className="msg-author">{a.label}</span>
              {a.sub && <span className="msg-sub">{a.sub}</span>}
              <span className="msg-time">{time}</span>
              {m.shared_from && <span className="badge">condiviso</span>}
              {shared && <span className="badge">condiviso con il gruppo</span>}
            </div>
            <div className="msg-body">
              <Rich text={m.content} />
            </div>
            {canShare?.(m) && !shared && (
              <button className="btn ghost small" disabled={sharing === m.id} onClick={() => void share(m)}>
                Condividi con il gruppo
              </button>
            )}
          </div>
        );
      })}
      {error && <div className="error small">{error}</div>}
      {children}
      <div ref={endRef} />
    </div>
  );
}
