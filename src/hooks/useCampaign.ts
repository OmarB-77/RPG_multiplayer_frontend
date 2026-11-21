import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Campaign, Character, CharacterCard, DiceRequest, Member, Msg } from '../lib/types';

function upsertById<T extends { id: string }>(list: T[], item: T, sortKey?: keyof T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  const next = i >= 0 ? list.map((x, k) => (k === i ? { ...x, ...item } : x)) : [...list, item];
  if (sortKey) next.sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
  return next;
}

/** Carica la stanza e la tiene aggiornata via Realtime. Sola lettura: le scritture passano dal backend. */
export function useCampaign(id: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [dice, setDice] = useState<DiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const { data } = await supabase
      .from('campaign_members')
      .select('user_id, role, profiles(display_name)')
      .eq('campaign_id', id);
    setMembers((data ?? []) as unknown as Member[]);
  }, [id]);

  const loadCards = useCallback(async () => {
    const { data } = await supabase.from('character_cards').select('*').eq('campaign_id', id);
    setCards((data ?? []) as CharacterCard[]);
  }, [id]);

  const loadMyChars = useCallback(async () => {
    const { data } = await supabase.from('characters').select('*').eq('campaign_id', id).neq('status', 'retired');
    setMyChars((data ?? []) as Character[]);
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, msgs, dr] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).maybeSingle(),
        supabase.from('messages').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(300),
        supabase.from('dice_requests').select('*').eq('campaign_id', id).order('created_at', { ascending: true }),
      ]);
      if (!alive) return;
      if (c.error || !c.data) {
        setError('Campagna non trovata o accesso negato');
        setLoading(false);
        return;
      }
      setCampaign(c.data as Campaign);
      setMessages(((msgs.data ?? []) as Msg[]).slice().reverse());
      setDice((dr.data ?? []) as DiceRequest[]);
      await Promise.all([loadMembers(), loadCards(), loadMyChars()]);
      if (alive) setLoading(false);
    })();

    const filter = `campaign_id=eq.${id}`;
    const ch = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter }, (p) =>
        setMessages((m) => upsertById(m, p.new as Msg, 'created_at')),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter }, (p) =>
        setMessages((m) => upsertById(m, p.new as Msg)),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dice_requests', filter }, (p) => {
        if (p.eventType !== 'DELETE') setDice((d) => upsertById(d, p.new as DiceRequest));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${id}` }, (p) =>
        setCampaign((c) => (c ? ({ ...c, ...(p.new as Partial<Campaign>) } as Campaign) : c)),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter }, () => {
        void loadMyChars();
        void loadCards();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_members', filter }, () =>
        void loadMembers(),
      )
      .subscribe();

    // Le carte pubbliche arrivano da una vista (niente Realtime): aggiornamento periodico leggero
    const poll = window.setInterval(() => void loadCards(), 20000);

    return () => {
      alive = false;
      window.clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, [id, loadCards, loadMembers, loadMyChars]);

  return { campaign, members, cards, myChars, messages, dice, loading, error, reloadMyChars: loadMyChars };
}
