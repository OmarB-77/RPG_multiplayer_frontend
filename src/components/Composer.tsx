import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  campaignId: string;
  channel: 'main' | 'private';
  placeholder: string;
  disabled?: boolean;
}

export function Composer({ campaignId, channel, placeholder, disabled }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/campaigns/${campaignId}/messages`, { body: { channel, content } });
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="composer">
      {error && <div className="error small">{error}</div>}
      <div className="composer-row">
        <textarea
          value={text}
          rows={2}
          placeholder={placeholder}
          disabled={disabled || busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button className="btn primary" disabled={disabled || busy || !text.trim()} onClick={() => void send()}>
          Invia
        </button>
      </div>
      <div className="hint">Invio per inviare · Maiusc+Invio per andare a capo · fuori gioco: inizia con [OOC]</div>
    </div>
  );
}
