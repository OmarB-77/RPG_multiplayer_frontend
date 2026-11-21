export type Stage = 'setup' | 'characters' | 'playing' | 'archived';

export interface Campaign {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  status: Stage;
  settings: {
    system?: string;
    tone?: string;
    genre?: string;
    duration?: string;
    experience?: string;
    rules_preference?: string;
    lines_veils?: string;
    mode?: 'free' | 'round';
    debounce_seconds?: number;
  };
  dm_status: 'idle' | 'thinking';
}

export interface Member {
  user_id: string;
  role: 'owner' | 'player';
  profiles: { display_name: string } | null;
}

export interface CharacterCard {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  public_summary: string | null;
  status: string;
}

export interface Character extends CharacterCard {
  system: string | null;
  sheet: Record<string, unknown>;
  background_md: string | null;
  narrative_profile: Record<string, unknown>;
  missing_fields: string[];
}

export interface Msg {
  id: string;
  campaign_id: string;
  channel: 'main' | 'private';
  thread_user_id: string | null;
  author_type: 'player' | 'dm' | 'system' | 'dice';
  author_user_id: string | null;
  character_id: string | null;
  content: string;
  meta: Record<string, any> | null;
  shared_from: string | null;
  created_at: string;
}

export interface DiceRequest {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  scope: 'private' | 'group';
  dice: string;
  modifier: number;
  skill: string | null;
  reason: string | null;
  status: 'pending' | 'rolled' | 'cancelled';
  result: { values: number[]; modifier: number; total: number; source: string } | null;
}

export interface SystemInfo {
  id: string;
  name: string;
  style: string;
  ideal_for: string;
  complexity: string;
  main_dice: string;
  roll_model: string;
  sheet_hints: string[];
}
