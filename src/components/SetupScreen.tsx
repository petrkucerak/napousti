import { useState } from 'react';
import { Team, TEAM_COLORS } from '@/lib/gameState';

interface SetupScreenProps {
  onStart: (teams: Team[]) => void;
  onImport: (json: string) => void;
}

const SetupScreen = ({ onStart, onImport }: SetupScreenProps) => {
  const [teamCount, setTeamCount] = useState(3);
  const [teams, setTeams] = useState<{ name: string; color: string }[]>(
    Array.from({ length: 3 }, (_, i) => ({
      name: `Tým ${i + 1}`,
      color: TEAM_COLORS[i],
    }))
  );

  const handleCountChange = (count: number) => {
    setTeamCount(count);
    setTeams(prev => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ name: `Tým ${next.length + 1}`, color: TEAM_COLORS[next.length % TEAM_COLORS.length] });
      }
      return next.slice(0, count);
    });
  };

  const handleStart = () => {
    const gameTeams: Team[] = teams.map((t, i) => ({
      id: `team-${i}`,
      name: t.name || `Tým ${i + 1}`,
      color: t.color,
      position: 0,
    }));
    onStart(gameTeams);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onImport(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-foreground text-display">
          Nastavení hry
        </h1>

        {/* Team count */}
        <div className="mb-6">
          <label className="mb-2 block text-lg font-semibold text-foreground">
            Počet týmů
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                className={`h-12 w-12 rounded-lg text-lg font-bold transition-all ${
                  teamCount === n
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Team config */}
        <div className="mb-8 space-y-3">
          {teams.slice(0, teamCount).map((team, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <input
                type="color"
                value={team.color}
                onChange={e => {
                  const next = [...teams];
                  next[i] = { ...next[i], color: e.target.value };
                  setTeams(next);
                }}
                className="h-10 w-10 cursor-pointer rounded border-none"
              />
              <input
                type="text"
                value={team.name}
                onChange={e => {
                  const next = [...teams];
                  next[i] = { ...next[i], name: e.target.value };
                  setTeams(next);
                }}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-lg text-foreground"
                placeholder={`Tým ${i + 1}`}
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStart}
            className="rounded-lg bg-primary px-6 py-3 text-lg font-bold text-primary-foreground transition-all hover:brightness-110"
          >
            🏜️ Spustit hru
          </button>
          <button
            onClick={handleImportClick}
            className="rounded-lg bg-secondary px-6 py-3 text-base font-semibold text-secondary-foreground transition-all hover:bg-secondary/80"
          >
            📂 Načíst uloženou hru (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
