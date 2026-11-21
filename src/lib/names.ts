import type { Character, CharacterCard, Member, Msg } from './types';

/** Restituisce una funzione che dà il nome da mostrare per l'autore di un messaggio. */
export function makeNamer(members: Member[], cards: CharacterCard[], myChars: Character[]) {
  const users = new Map(members.map((m) => [m.user_id, m.profiles?.display_name ?? 'Giocatore']));
  const chars = new Map<string, string>();
  cards.forEach((c) => chars.set(c.id, c.name));
  myChars.forEach((c) => chars.set(c.id, c.name));

  return {
    userName: (id: string | null) => (id ? (users.get(id) ?? 'Giocatore') : 'Giocatore'),
    author(m: Msg): { label: string; sub?: string } {
      if (m.author_type === 'dm') return { label: 'Master' };
      if (m.author_type === 'system') return { label: 'Sistema' };
      const user = users.get(m.author_user_id ?? '') ?? 'Giocatore';
      const ch = m.character_id ? chars.get(m.character_id) : undefined;
      if (m.author_type === 'dice') return { label: ch ?? user };
      return ch ? { label: ch, sub: user } : { label: user };
    },
  };
}
