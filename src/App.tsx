
import React, { useState } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';
import GameSetup from './components/GameSetup';
import GameScoring from './components/GameScoring';
import GameStatistics from './components/GameStatistics';
import GameHistory from './components/GameHistory';

// Initialize Supabase client - Replace with your actual Supabase project details
const supabaseUrl = 'https://mipvwpynhcadvhknjpdq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

// Debug information
console.log('Supabase Key:', supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Game states
type GameState = 'setup' | 'scoring' | 'statistics' | 'history';

function App() {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('setup');
  const [players, setPlayers] = useState<string[]>([]);
  const [targetScore, setTargetScore] = useState<number>(100);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Switch between different components based on game state
  const renderComponent = () => {
    switch (gameState) {
      case 'setup':
        return (
          <GameSetup 
            startGame={(players, targetScore) => {
              setPlayers(players);
              setTargetScore(targetScore);
              setGameState('scoring');
            }}
          />
        );
      case 'scoring':
        return (
          <GameScoring 
            players={players}
            targetScore={targetScore}
            gameId={currentGameId}
            setGameId={setCurrentGameId}
            finishGame={() => setGameState('statistics')}
            supabase={supabase}
          />
        );
      case 'statistics':
        return (
          <GameStatistics 
            gameId={currentGameId}
            supabase={supabase}
            startNewGame={() => setGameState('setup')}
            viewHistory={() => setGameState('history')}
          />
        );
      case 'history':
        return (
          <GameHistory 
            supabase={supabase}
            startNewGame={() => setGameState('setup')}
          />
        );
      default:
        return <GameSetup startGame={() => setGameState('scoring')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">RunCount</h1>
        <p className="text-sm">Straight Pool (14.1) Scoring App</p>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {renderComponent()}
      </main>
      <footer className="bg-gray-200 p-2 text-center text-sm text-gray-600">
        RunCount &copy; {new Date().getFullYear()} - Straight Pool Scoring App
      </footer>
    </div>
  );
}

export default App;
