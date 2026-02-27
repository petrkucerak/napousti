import { MAP_LOCATIONS, Team, GameEvent } from '@/lib/gameState';
import desertBg from '@/assets/desert-bg.jpg';

interface DesertMapProps {
  teams: Team[];
  activeEvent: GameEvent | null;
}

const DesertMap = ({ teams, activeEvent }: DesertMapProps) => {
  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${desertBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-desert-dark/40" />

      {/* Event bar */}
      {activeEvent && (
        <div className={`relative z-20 flex items-center justify-center gap-4 px-6 py-4 text-center ${
          activeEvent.active
            ? 'bg-primary/90 backdrop-blur-sm'
            : 'bg-destructive/90 backdrop-blur-sm'
        }`}>
          <span className="text-xl font-bold text-primary-foreground md:text-2xl">
            {activeEvent.title}
          </span>
          {activeEvent.description && (
            <span className="text-base text-primary-foreground/80">
              — {activeEvent.description}
            </span>
          )}
          <span className={`ml-4 rounded-lg px-4 py-1 text-2xl font-bold ${
            activeEvent.active
              ? 'bg-desert-dark/50 text-desert-gold'
              : 'bg-desert-dark/80 text-destructive-foreground animate-pulse'
          }`}>
            {activeEvent.active
              ? `⏱ ${activeEvent.countdownRemaining}s`
              : '🔔 Čas vypršel!'
            }
          </span>
        </div>
      )}

      {/* Title */}
      <div className="relative z-10 pt-6 text-center">
        <h1 className="text-4xl font-bold text-desert-gold text-display animate-shimmer md:text-5xl drop-shadow-lg">
          40 dní na poušti
        </h1>
      </div>

      {/* Map path */}
      <div className="relative z-10 flex flex-1 items-center overflow-x-auto px-4 py-8">
        <div className="mx-auto flex items-end gap-1 md:gap-2">
          {MAP_LOCATIONS.map((loc, i) => {
            const teamsHere = teams.filter(t => t.position === i);
            return (
              <div key={i} className="flex flex-col items-center" style={{ minWidth: '70px' }}>
                {/* Team markers */}
                <div className="mb-2 flex flex-wrap justify-center gap-1 min-h-[40px]">
                  {teamsHere.map(team => (
                    <div
                      key={team.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-primary-foreground/50 md:h-10 md:w-10 md:text-sm"
                      style={{ backgroundColor: team.color, color: '#fff' }}
                      title={team.name}
                    >
                      {team.name.charAt(0)}
                    </div>
                  ))}
                </div>

                {/* Location node */}
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl shadow-md transition-all md:h-16 md:w-16 md:text-3xl ${
                  i === 0 || i === MAP_LOCATIONS.length - 1
                    ? 'bg-desert-oasis/80 ring-2 ring-desert-gold'
                    : 'bg-desert-dark/60 backdrop-blur-sm'
                }`}>
                  {loc.icon}
                </div>

                {/* Label */}
                <span className="mt-1 max-w-[80px] text-center text-xs font-semibold text-primary-foreground drop-shadow-md md:text-sm">
                  {loc.name}
                </span>

                {/* Position number */}
                <span className="mt-0.5 text-xs text-primary-foreground/60">
                  {i}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team legend */}
      <div className="relative z-10 flex flex-wrap justify-center gap-4 pb-6">
        {teams.map(team => (
          <div key={team.id} className="flex items-center gap-2 rounded-full bg-desert-dark/60 px-4 py-2 backdrop-blur-sm">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <span className="text-sm font-semibold text-primary-foreground">
              {team.name} (pozice {team.position})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesertMap;
