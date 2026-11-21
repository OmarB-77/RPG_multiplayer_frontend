import { useState } from 'react';
import { api } from '../lib/api';
import type { Character } from '../lib/types';

function SheetValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <span className="muted">—</span>;
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v !== 'object')) return <span>{value.join(', ')}</span>;
    return (
      <ul className="sheet-list">
        {value.map((v, i) => (
          <li key={i}>
            <SheetValue value={v} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    return (
      <dl className="sheet-dl">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>
              <SheetValue value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{String(value)}</span>;
}

function readFile(file: File): Promise<{ text?: string; pdf?: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Impossibile leggere il file'));
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      r.onload = () => resolve({ pdf: String(r.result).split(',')[1] ?? '' });
      r.readAsDataURL(file);
    } else {
      r.onload = () => resolve({ text: String(r.result) });
      r.readAsText(file);
    }
  });
}

interface Props {
  campaignId: string;
  characters: Character[];
  onChanged: () => void;
  onAskMaster: (text: string) => Promise<void>;
}

export function CharacterPanel({ campaignId, characters, onChanged, onAskMaster }: Props) {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [sheetJson, setSheetJson] = useState('');
  const [background, setBackground] = useState('');
  const [summary, setSummary] = useState('');

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const importText = () =>
    run(async () => {
      await api(`/campaigns/${campaignId}/characters/import`, { body: { raw_text: raw } });
      setRaw('');
      setInfo('Scheda importata: il Master ti scriverà qui per i dati mancanti.');
      onChanged();
    });

  const importFile = (file: File) =>
    run(async () => {
      const { text, pdf } = await readFile(file);
      await api(`/campaigns/${campaignId}/characters/import`, {
        body: pdf ? { pdf_base64: pdf } : { raw_text: text },
      });
      setInfo('Scheda importata: il Master ti scriverà qui per i dati mancanti.');
      onChanged();
    });

  const createManual = () =>
    run(async () => {
      await api(`/campaigns/${campaignId}/characters`, { body: { name: newName } });
      setNewName('');
      onChanged();
    });

  function startEdit(c: Character) {
    setEditing(c.id);
    setSheetJson(JSON.stringify(c.sheet ?? {}, null, 2));
    setBackground(c.background_md ?? '');
    setSummary(c.public_summary ?? '');
  }

  const saveEdit = (c: Character) =>
    run(async () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(sheetJson || '{}');
      } catch {
        throw new Error('La scheda non è un JSON valido');
      }
      await api(`/characters/${c.id}`, {
        method: 'PATCH',
        body: { sheet_patch: parsed, background_md: background, public_summary: summary },
      });
      setEditing(null);
      onChanged();
    });

  return (
    <div className="characters">
      {characters.length === 0 && (
        <div className="empty">Non hai ancora un personaggio. Importane uno, creane uno con il Master o inizia da un nome.</div>
      )}

      {characters.map((c) => (
        <article key={c.id} className="char">
          <header>
            <h3>{c.name}</h3>
            <span className="badge">{c.status === 'draft' ? 'bozza' : 'pronto'}</span>
            {c.system && <span className="badge">{c.system}</span>}
          </header>
          {c.public_summary && <p className="muted">{c.public_summary}</p>}

          {c.missing_fields?.length > 0 && (
            <div className="missing">
              <strong>Il Master ti chiederà ancora:</strong>
              <ul>
                {c.missing_fields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {editing === c.id ? (
            <div className="edit">
              <label>
                Sintesi pubblica (visibile agli altri giocatori)
                <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </label>
              <label>
                Background
                <textarea className="input" rows={5} value={background} onChange={(e) => setBackground(e.target.value)} />
              </label>
              <label>
                Scheda (JSON). I campi modificati vengono uniti a quelli esistenti.
                <textarea className="input mono" rows={10} value={sheetJson} onChange={(e) => setSheetJson(e.target.value)} />
              </label>
              <div className="row">
                <button className="btn primary" disabled={busy} onClick={() => void saveEdit(c)}>
                  Salva
                </button>
                <button className="btn ghost" onClick={() => setEditing(null)}>
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              <details open>
                <summary>Scheda</summary>
                <SheetValue value={c.sheet} />
              </details>
              {c.background_md && (
                <details>
                  <summary>Background</summary>
                  <p className="pre">{c.background_md}</p>
                </details>
              )}
              <button className="btn ghost small" onClick={() => startEdit(c)}>
                Modifica
              </button>
            </>
          )}
        </article>
      ))}

      <section className="panel">
        <h3>Importa una scheda esistente</h3>
        <p className="muted small">Incolla il testo oppure carica un file (.txt, .md, .json, .pdf). Il Master ti chiederà ciò che manca.</p>
        <textarea className="input" rows={5} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Incolla qui la scheda…" />
        <div className="row">
          <button className="btn primary" disabled={busy || !raw.trim()} onClick={() => void importText()}>
            Importa testo
          </button>
          <label className="btn">
            Carica file
            <input
              type="file"
              hidden
              accept=".txt,.md,.json,.pdf,application/pdf,text/*,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>Crea un nuovo personaggio</h3>
        <div className="row">
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void run(() => onAskMaster('Vorrei creare un nuovo personaggio: guidami passo passo.'))}
          >
            Crealo con il Master
          </button>
        </div>
        <div className="row">
          <input className="input" placeholder="…oppure parti da un nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn" disabled={busy || !newName.trim()} onClick={() => void createManual()}>
            Aggiungi
          </button>
        </div>
      </section>

      {info && <div className="ok">{info}</div>}
      {error && <div className="error">{error}</div>}
      {busy && <div className="muted small">Operazione in corso…</div>}
    </div>
  );
}
