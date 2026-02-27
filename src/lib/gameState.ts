// Game state types and management with BroadcastChannel synchronization

export interface Team {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  countdownTotal: number;
  countdownRemaining: number;
  active: boolean;
}

export interface GameState {
  phase: 'welcome' | 'setup' | 'playing';
  teams: Team[];
  mapSize: number;
  activeEvent: GameEvent | null;
}

export const MAP_LOCATIONS = [
  { name: 'Start – tábor', icon: '⛺' },
  { name: 'Vyprahlá poušť', icon: '🏜️' },
  { name: 'Písečná bouře', icon: '🌪️' },
  { name: 'Skály', icon: '🪨' },
  { name: 'Oáza', icon: '🌴' },
  { name: 'Pravé poledne', icon: '☀️' },
  { name: 'Místo se štíry', icon: '🦂' },
  { name: 'Jeskyně', icon: '🕳️' },
  { name: 'Noc', icon: '🌙' },
  { name: 'Slané jezero', icon: '💧' },
  { name: 'Den', icon: '🌅' },
  { name: 'Místo s hady', icon: '🐍' },
  { name: 'Vyprahlá poušť', icon: '🏜️' },
  { name: 'Oáza', icon: '🌴' },
  { name: 'Písečná bouře', icon: '🌪️' },
  { name: 'Skály', icon: '🪨' },
  { name: 'Noc', icon: '🌙' },
  { name: 'Jeskyně', icon: '🕳️' },
  { name: 'Pravé poledne', icon: '☀️' },
  { name: 'Cíl – zaslíbená země', icon: '🏁' },
];

export const TEAM_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
];

const STORAGE_KEY = 'desert-game-state';
const CHANNEL_NAME = 'desert-game-sync';

let channel: BroadcastChannel | null = null;

export function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function getDefaultState(): GameState {
  return {
    phase: 'welcome',
    teams: [],
    mapSize: MAP_LOCATIONS.length,
    activeEvent: null,
  };
}

export function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return getDefaultState();
}

export function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  getChannel().postMessage({ type: 'state-update', state });
}

export function exportState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): GameState {
  return JSON.parse(json);
}
