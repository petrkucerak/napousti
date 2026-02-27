import { useState, useEffect, useCallback } from 'react';
import {
  GameState, GameEvent, Team,
  loadState, saveState, getChannel, getDefaultState,
  importState, exportState,
} from '@/lib/gameState';

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  // Listen for cross-tab updates
  useEffect(() => {
    const ch = getChannel();
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'state-update') {
        setState(e.data.state);
      }
    };
    ch.addEventListener('message', handler);
    // Also listen for storage events (fallback)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'desert-game-state' && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      ch.removeEventListener('message', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setPhase = useCallback((phase: GameState['phase']) => {
    updateState(s => ({ ...s, phase }));
  }, [updateState]);

  const setTeams = useCallback((teams: Team[]) => {
    updateState(s => ({ ...s, teams }));
  }, [updateState]);

  const moveTeam = useCallback((teamId: string, delta: number) => {
    updateState(s => ({
      ...s,
      teams: s.teams.map(t =>
        t.id === teamId
          ? { ...t, position: Math.max(0, Math.min(s.mapSize - 1, t.position + delta)) }
          : t
      ),
    }));
  }, [updateState]);

  const triggerEvent = useCallback((event: Omit<GameEvent, 'id' | 'active' | 'countdownRemaining'>) => {
    updateState(s => ({
      ...s,
      activeEvent: {
        ...event,
        id: Date.now().toString(),
        active: true,
        countdownRemaining: event.countdownTotal,
      },
    }));
  }, [updateState]);

  const tickEvent = useCallback(() => {
    updateState(s => {
      if (!s.activeEvent || !s.activeEvent.active) return s;
      const remaining = s.activeEvent.countdownRemaining - 1;
      if (remaining <= 0) {
        return { ...s, activeEvent: { ...s.activeEvent, countdownRemaining: 0, active: false } };
      }
      return { ...s, activeEvent: { ...s.activeEvent, countdownRemaining: remaining } };
    });
  }, [updateState]);

  const clearEvent = useCallback(() => {
    updateState(s => ({ ...s, activeEvent: null }));
  }, [updateState]);

  const resetGame = useCallback(() => {
    updateState(() => getDefaultState());
  }, [updateState]);

  const doExport = useCallback(() => exportState(state), [state]);

  const doImport = useCallback((json: string) => {
    const imported = importState(json);
    saveState(imported);
    setState(imported);
  }, []);

  return {
    state,
    setPhase,
    setTeams,
    moveTeam,
    triggerEvent,
    tickEvent,
    clearEvent,
    resetGame,
    doExport,
    doImport,
  };
}
