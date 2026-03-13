import desertBg from '@/assets/desert-bg.jpg';
import { GameConfig } from '@/lib/gameState';

interface WelcomeScreenProps {
  onStart: () => void;
  config: GameConfig;
}

const WelcomeScreen = ({ onStart, config }: WelcomeScreenProps) => {
  const bgImage = config.backgroundUrl || desertBg;
  const title = config.title || '40 dní na poušti';

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-desert-dark/60" />

      <div className="relative z-10 mx-4 max-w-2xl text-center">
        <h1 className="mb-8 text-5xl font-bold tracking-wide text-desert-gold md:text-7xl text-display animate-shimmer">
          {title}
        </h1>

        <div className="mb-10 space-y-4 rounded-lg bg-desert-dark/50 p-8 backdrop-blur-sm">
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Vítejte ve hře <strong>{title}</strong>.
          </p>
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Vydáváte se na cestu, která není jednoduchá.
          </p>
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Poušť zkouší vytrvalost, odvahu i srdce.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="animate-pulse-glow rounded-lg bg-primary px-10 py-4 text-xl font-bold text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
          >
            Začít hru
          </button>

          <a
            href="https://github.com/petrkucerak/desert-journey-game/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-secondary/80 px-6 py-3 text-base font-semibold text-secondary-foreground transition-all hover:bg-secondary hover:brightness-110 backdrop-blur-sm"
          >
            ❓ Jak to funguje
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
