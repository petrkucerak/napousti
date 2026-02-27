import { useState, useEffect, useCallback } from 'react';
import { GameState, GameEvent, MAP_LOCATIONS } from '@/lib/gameState';

interface AdminPanelProps {
  state: GameState;
  moveTeam: (teamId: string, delta: number) => void;
  triggerEvent: (event: Omit<GameEvent, 'id' | 'active' | 'countdownRemaining'>) => void;
  tickEvent: () => void;
  clearEvent: () => void;
  resetGame: () => void;
  doExport: () => string;
  doImport: (json: string) => void;
}

const AdminPanel = ({
  state, moveTeam, triggerEvent, tickEvent, clearEvent, resetGame, doExport, doImport,
}: AdminPanelProps) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventTime, setEventTime] = useState(60);
  const [showReset, setShowReset] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Countdown ticker
  useEffect(() => {
    if (!state.activeEvent?.active) return;
    const interval = setInterval(tickEvent, 1000);
    return () => clearInterval(interval);
  }, [state.activeEvent?.active, tickEvent]);

  // Play sound when countdown ends
  useEffect(() => {
    if (state.activeEvent && !state.activeEvent.active && state.activeEvent.countdownRemaining === 0) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 500);
      } catch { /* ignore */ }
    }
  }, [state.activeEvent?.active, state.activeEvent?.countdownRemaining]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedTeam) return;
    if (e.key === '1' || e.key === '+') { moveTeam(selectedTeam, 1); e.preventDefault(); }
    if (e.key === '2') { moveTeam(selectedTeam, 2); e.preventDefault(); }
    if (e.key === '-') { moveTeam(selectedTeam, -1); e.preventDefault(); }
  }, [selectedTeam, moveTeam]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExport = () => {
    const json = doExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'desert-game-save.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => doImport(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const handleTriggerEvent = () => {
    if (!eventTitle.trim()) return;
    triggerEvent({
      title: eventTitle,
      description: eventDesc,
      countdownTotal: eventTime,
    });
    setEventTitle('');
    setEventDesc('');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-foreground text-display">
          🏜️ Administrace hry
        </h1>

        {/* Teams */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-foreground text-display">Týmy</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Klikni na tým pro výběr → klávesy: <kbd className="rounded bg-muted px-1">1</kbd> (+1), <kbd className="rounded bg-muted px-1">2</kbd> (+2), <kbd className="rounded bg-muted px-1">-</kbd> (-1)
          </p>
          <div className="space-y-3">
            {state.teams.map(team => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  selectedTeam === team.id
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div
                  className="h-10 w-10 rounded-full shadow-sm"
                  style={{ backgroundColor: team.color }}
                />
                <div className="flex-1">
                  <div className="text-lg font-bold text-foreground">{team.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Pozice: {team.position} / {MAP_LOCATIONS.length - 1}
                    {MAP_LOCATIONS[team.position] && ` — ${MAP_LOCATIONS[team.position].icon} ${MAP_LOCATIONS[team.position].name}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); moveTeam(team.id, -1); }}
                    className="rounded-lg bg-destructive/20 px-3 py-2 text-sm font-bold text-foreground hover:bg-destructive/40 transition-colors"
                  >
                    -1
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); moveTeam(team.id, 1); }}
                    className="rounded-lg bg-accent/20 px-3 py-2 text-sm font-bold text-foreground hover:bg-accent/40 transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); moveTeam(team.id, 2); }}
                    className="rounded-lg bg-primary/20 px-3 py-2 text-sm font-bold text-foreground hover:bg-primary/40 transition-colors"
                  >
                    +2
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events */}
        <section className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground text-display">Událost</h2>

          {state.activeEvent ? (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${state.activeEvent.active ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <div className="text-lg font-bold text-foreground">{state.activeEvent.title}</div>
                {state.activeEvent.description && (
                  <div className="text-sm text-muted-foreground">{state.activeEvent.description}</div>
                )}
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {state.activeEvent.active
                    ? `⏱ ${state.activeEvent.countdownRemaining}s`
                    : '🔔 Čas vypršel!'
                  }
                </div>
              </div>
              <button
                onClick={clearEvent}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Zavřít událost
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Název události"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              />
              <input
                type="text"
                placeholder="Popis (volitelné)"
                value={eventDesc}
                onChange={e => setEventDesc(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-foreground">Čas (s):</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={eventTime}
                  onChange={e => setEventTime(Number(e.target.value))}
                  className="w-24 rounded-md border border-input bg-background px-3 py-2 text-foreground"
                />
              </div>
              <button
                onClick={handleTriggerEvent}
                disabled={!eventTitle.trim()}
                className="rounded-lg bg-primary px-6 py-2 text-base font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                🚀 Spustit událost
              </button>
            </div>
          )}
        </section>

        {/* Controls */}
        <section className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            💾 Uložit hru (JSON)
          </button>
          <button
            onClick={handleImport}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            📂 Načíst hru (JSON)
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="rounded-lg bg-destructive/20 px-4 py-2 text-sm font-semibold text-foreground hover:bg-destructive/40 transition-colors"
          >
            🗑️ Resetovat hru
          </button>
        </section>

        {/* Reset confirmation */}
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-desert-dark/70">
            <div className="rounded-xl bg-card p-8 shadow-2xl">
              <h3 className="mb-4 text-xl font-bold text-foreground text-display">Opravdu resetovat?</h3>
              <p className="mb-6 text-muted-foreground">Všechna herní data budou smazána.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { resetGame(); setShowReset(false); }}
                  className="rounded-lg bg-destructive px-6 py-2 font-bold text-destructive-foreground hover:brightness-110 transition-all"
                >
                  Ano, resetovat
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="rounded-lg bg-secondary px-6 py-2 font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map mode link hint */}
        <div className="mt-8 rounded-lg bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Pro projekci mapy otevřete <strong>/map</strong> v novém okně prohlížeče.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
