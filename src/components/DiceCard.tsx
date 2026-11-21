import { useState } from 'react';
import { api } from '../lib/api';
import type { DiceRequest } from '../lib/types';

interface Props {
  request: DiceRequest;
  isMine: boolean;
  ownerName: string;
}

/** Richiesta di tiro: il giocatore interessato preme "Tira" (il risultato lo genera il server). */
export function DiceCard({ request, isMine, ownerName }: Props) {
  const [busy, setBusy] = useState(false);
  const [physical, setPhysical] = useState(false);
  const [values, setValues] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mod = request.modifier ? (request.modifier > 0 ? ` + ${request.modifier}` : ` − ${Math.abs(request.modifier)}`) : '';
  const formula = `${request.dice}${mod}`;

  async function roll() {
    setBusy(true);
    setError(null);
    try {
      let body: unknown = {};
      if (physical) {
        const parsed = values
          .split(/[ ,;]+/)
          .filter(Boolean)
          .map(Number);
        body = { values: parsed };
      }
      await api(`/rolls/${request.id}/roll`, { method: 'POST', body });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`dice-card ${request.scope}`}>
      <div className="dice-head">
        <span className="dice-icon" aria-hidden>
          🎲
        </span>
        <div>
          <strong>{request.skill ?? 'Tiro'}</strong> — {formula}
          <div className="small muted">
            {request.scope === 'private' ? 'Tiro segreto' : 'Tiro di gruppo'}
            {request.reason ? ` · ${request.reason}` : ''}
          </div>
        </div>
      </div>
      {isMine ? (
        <div className="dice-actions">
          {physical && (
            <input
              className="input"
              placeholder={`Valori dei dadi (es. ${request.dice.startsWith('1d') ? '14' : '3, 5'})`}
              value={values}
              onChange={(e) => setValues(e.target.value)}
            />
          )}
          <button className="btn primary" disabled={busy || (physical && !values.trim())} onClick={() => void roll()}>
            {physical ? 'Conferma' : 'Tira'}
          </button>
          <button className="btn ghost small" onClick={() => setPhysical((p) => !p)}>
            {physical ? 'Usa il tiro digitale' : 'Ho dadi fisici'}
          </button>
        </div>
      ) : (
        <div className="small muted">In attesa di {ownerName}…</div>
      )}
      {error && <div className="error small">{error}</div>}
    </div>
  );
}
