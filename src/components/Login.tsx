import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || email.split('@')[0] } },
        });
        if (error) throw error;
        if (!data.session) setInfo('Controlla la tua email per confermare la registrazione, poi accedi.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="panel login-card" onSubmit={submit}>
        <h1>Cronache del Master</h1>
        <p className="muted">Campagne di ruolo condivise, guidate da un Dungeon Master AI.</p>

        {mode === 'signup' && (
          <label>
            Nome da mostrare
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <div className="error">{error}</div>}
        {info && <div className="ok">{info}</div>}

        <button className="btn primary" disabled={busy}>
          {mode === 'signin' ? 'Accedi' : 'Registrati'}
        </button>
        <button type="button" className="btn ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </form>
    </div>
  );
}
