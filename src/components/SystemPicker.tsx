import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Campaign, SystemInfo } from '../lib/types';

interface Props {
  campaign: Campaign;
  isOwner: boolean;
}

/** Sessione zero: scelta dello stile di gioco (solo il creatore può confermare). */
export function SystemPicker({ campaign, isOwner }: Props) {
  const [systems, setSystems] = useState<SystemInfo[]>([]);
  const s = campaign.settings ?? {};
  const [system, setSystem] = useState(s.system ?? '');
  const [tone, setTone] = useState(s.tone ?? '');
  const [genre, setGenre] = useState(s.genre ?? '');
  const [duration, setDuration] = useState(s.duration ?? '');
  const [experience, setExperience] = useState(s.experience ?? '');
  const [lines, setLines] = useState(s.lines_veils ?? '');
  const [mode, setMode] = useState<'free' | 'round'>(s.mode ?? 'free');
  const [debounce, setDebounce] = useState(s.debounce_seconds ?? 20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SystemInfo[]>('/systems').then(setSystems).catch((e) => setError(e.message));
  }, []);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await api(`/campaigns/${campaign.id}/setup`, {
        method: 'PATCH',
        body: {
          system,
          tone: tone || undefined,
          genre: genre || undefined,
          duration: duration || undefined,
          experience: experience || undefined,
          lines_veils: lines || undefined,
          mode,
          debounce_seconds: debounce,
        },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function askMaster() {
    try {
      await api(`/campaigns/${campaign.id}/messages`, {
        body: {
          channel: 'main',
          content:
            'Master, aiutaci a scegliere lo stile di gioco: presentaci brevemente i sistemi disponibili e chiedici le nostre preferenze.',
        },
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel setup">
      <h2>Sessione zero — scegliete il vostro stile di gioco</h2>
      <p className="muted">
        {isOwner
          ? 'Scegli il sistema e il tono, poi conferma. Puoi chiedere consiglio al Master nella chat qui sotto.'
          : 'Il creatore della campagna sceglierà il sistema. Intanto potete parlarne con il Master nella chat qui sotto.'}
      </p>

      <div className="system-grid">
        {systems.map((sys) => (
          <button
            key={sys.id}
            type="button"
            className={`system-card ${system === sys.id ? 'selected' : ''}`}
            disabled={!isOwner}
            onClick={() => setSystem(sys.id)}
          >
            <strong>{sys.name}</strong>
            <span>{sys.style}</span>
            <span className="muted small">
              {sys.ideal_for} · complessità {sys.complexity.toLowerCase()}
            </span>
          </button>
        ))}
      </div>

      {isOwner && (
        <>
          <div className="form-grid">
            <label>
              Genere / ambientazione
              <input className="input" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="es. fantasy cupo, noir, sci-fi…" />
            </label>
            <label>
              Tono
              <input className="input" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="es. epico, horror, leggero…" />
            </label>
            <label>
              Durata prevista
              <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="one-shot, mini-campagna, lunga" />
            </label>
            <label>
              Esperienza del gruppo
              <input className="input" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="principianti, esperti…" />
            </label>
            <label className="wide">
              Limiti e sensibilità (Linee e Veli)
              <textarea className="input" rows={2} value={lines} onChange={(e) => setLines(e.target.value)} placeholder="Temi da evitare o da trattare con delicatezza" />
            </label>
            <label>
              Modalità messaggi
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value as 'free' | 'round')}>
                <option value="free">Libera (il Master risponde dopo una breve pausa)</option>
                <option value="round">A round (risponde quando tutti hanno agito)</option>
              </select>
            </label>
            <label>
              Secondi di raccolta (modalità libera)
              <input className="input" type="number" min={3} max={120} value={debounce} onChange={(e) => setDebounce(Number(e.target.value))} />
            </label>
          </div>
          <div className="row">
            <button className="btn" type="button" onClick={() => void askMaster()}>
              Chiedi consiglio al Master
            </button>
            <button className="btn primary" disabled={!system || busy} onClick={() => void confirm()}>
              Conferma e passa ai personaggi
            </button>
          </div>
        </>
      )}
      {!isOwner && (
        <div className="row">
          <button className="btn" type="button" onClick={() => void askMaster()}>
            Chiedi consiglio al Master
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </section>
  );
}
