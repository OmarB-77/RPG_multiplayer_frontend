import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../lib/types';

const STAGE = { setup: 'Sessione zero', characters: 'Personaggi', playing: 'In gioco', archived: 'Archiviata' } as const;

interface Props {
  displayName: string;
  onOpen: (id: string) => void;
}

export function CampaignList({ displayName, onOpen }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    setCampaigns((data ?? []) as Campaign[]);
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = await api<Campaign>('/campaigns', { body: { name } });
      setName('');
      onOpen(c.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ campaign_id: string }>('/campaigns/join', { body: { invite_code: code } });
      setCode('');
      onOpen(r.campaign_id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Cronache del Master</h1>
        <div className="row">
          <span className="muted">{displayName}</span>
          <button className="btn ghost" onClick={() => void supabase.auth.signOut()}>
            Esci
          </button>
        </div>
      </header>

      <div className="two-col">
        <section className="panel">
          <h2>Le tue campagne</h2>
          {campaigns.length === 0 && <p className="muted">Nessuna campagna ancora. Creane una o entra con un codice invito.</p>}
          <ul className="camp-list">
            {campaigns.map((c) => (
              <li key={c.id}>
                <button className="camp" onClick={() => onOpen(c.id)}>
                  <strong>{c.name}</strong>
                  <span className="muted small">{STAGE[c.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="stack">
          <form className="panel" onSubmit={create}>
            <h2>Nuova campagna</h2>
            <input className="input" placeholder="Nome della campagna" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            <button className="btn primary" disabled={busy}>
              Crea
            </button>
          </form>
          <form className="panel" onSubmit={join}>
            <h2>Entra con un codice</h2>
            <input className="input" placeholder="Codice invito" value={code} onChange={(e) => setCode(e.target.value)} required />
            <button className="btn" disabled={busy}>
              Entra
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
