import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { CampaignList } from './components/CampaignList';
import { Login } from './components/Login';
import { Room } from './components/Room';
import { supabase } from './lib/supabase';

function campaignFromHash(): string | null {
  const m = /^#\/c\/([0-9a-f-]{36})$/i.exec(window.location.hash);
  return m ? m[1] : null;
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [campaignId, setCampaignId] = useState<string | null>(campaignFromHash());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const onHash = () => setCampaignId(campaignFromHash());
    window.addEventListener('hashchange', onHash);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const open = (id: string | null) => {
    window.location.hash = id ? `#/c/${id}` : '';
    setCampaignId(id);
  };

  if (session === undefined) return <div className="center muted">Caricamento…</div>;
  if (!session) return <Login />;

  const userId = session.user.id;
  const displayName = (session.user.user_metadata?.display_name as string | undefined) ?? session.user.email ?? '';

  return campaignId ? (
    <Room key={campaignId} campaignId={campaignId} userId={userId} onExit={() => open(null)} />
  ) : (
    <CampaignList displayName={displayName} onOpen={open} />
  );
}
