import { useGameState } from '@/hooks/useGameState';
import DesertMap from '@/components/DesertMap';

const MapView = () => {
  const { state } = useGameState();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="relative">
      <DesertMap teams={state.teams} activeEvent={state.activeEvent} config={state.config} />
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 z-30 rounded-lg bg-desert-dark/70 px-4 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-sm hover:bg-desert-dark/90 transition-colors"
      >
        ⛶ Celá obrazovka
      </button>
    </div>
  );
};

export default MapView;
