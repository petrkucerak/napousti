import { useGameState } from '@/hooks/useGameState';
import { Team, GameConfig } from '@/lib/gameState';
import WelcomeScreen from '@/components/WelcomeScreen';
import SetupScreen from '@/components/SetupScreen';
import AdminPanel from '@/components/AdminPanel';

const Index = () => {
  const {
    state, setPhase, setTeams, setConfig, setDefaultEventTime, moveTeam,
    triggerEvent, tickEvent, clearEvent,
    resetGame, doExport, doImport,
  } = useGameState();

  const handleStartSetup = () => setPhase('setup');

  const handleStartGame = (teams: Team[], defaultTime: number, config: GameConfig) => {
    setTeams(teams);
    setDefaultEventTime(defaultTime);
    setConfig(config);
    setPhase('playing');
  };

  const handleImport = (json: string) => {
    doImport(json);
  };

  if (state.phase === 'welcome') {
    return <WelcomeScreen onStart={handleStartSetup} config={state.config} />;
  }

  if (state.phase === 'setup') {
    return <SetupScreen onStart={handleStartGame} onImport={handleImport} />;
  }

  return (
    <AdminPanel
      state={state}
      moveTeam={moveTeam}
      triggerEvent={triggerEvent}
      tickEvent={tickEvent}
      clearEvent={clearEvent}
      resetGame={resetGame}
      doExport={doExport}
      doImport={doImport}
    />
  );
};

export default Index;
