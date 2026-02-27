import desertBg from '@/assets/desert-bg.jpg';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${desertBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-desert-dark/60" />

      <div className="relative z-10 mx-4 max-w-2xl text-center">
        <h1 className="mb-8 text-5xl font-bold tracking-wide text-desert-gold md:text-7xl text-display animate-shimmer">
          40 dní na poušti
        </h1>

        <div className="mb-10 space-y-4 rounded-lg bg-desert-dark/50 p-8 backdrop-blur-sm">
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Vítejte ve hře <strong>40 dní na poušti</strong>.
          </p>
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Vydáváte se na cestu, která není jednoduchá.
          </p>
          <p className="text-lg leading-relaxed text-primary-foreground md:text-xl">
            Poušť zkouší vytrvalost, odvahu i srdce.
          </p>
        </div>

        <button
          onClick={onStart}
          className="animate-pulse-glow rounded-lg bg-primary px-10 py-4 text-xl font-bold text-primary-foreground transition-all hover:scale-105 hover:brightness-110"
        >
          Začít hru
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
