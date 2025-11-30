import React, { useState } from 'react';
import GameCanvas from './components/GameEngine';
import { GameState } from './types';
import { Play, RotateCcw, Trophy, Heart, Skull } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    lives: 3,
    level: 1
  });

  const startGame = () => {
    setGameState({
      status: 'playing',
      score: 0,
      lives: 3,
      level: 1
    });
  };

  const addScore = (points: number) => {
    setGameState(prev => ({ ...prev, score: prev.score + points }));
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Header HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none select-none text-white mix-blend-difference">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <span className="font-retro text-xl">{gameState.score.toString().padStart(6, '0')}</span>
        </div>
        <div className="font-bold text-lg tracking-widest opacity-50">NEON TANK 1990</div>
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <span className="font-retro text-xl">x {gameState.lives}</span>
        </div>
      </div>

      {/* 3D Game Canvas */}
      <div className="w-full h-full">
        {gameState.status !== 'idle' && (
            <GameCanvas 
              key={gameState.status === 'playing' ? 'game-running' : 'game-stopped'} 
              gameState={gameState} 
              setGameState={setGameState} 
              onScore={addScore} 
            />
        )}
        {/* Preview background when idle */}
        {gameState.status === 'idle' && (
            <GameCanvas 
              key="game-idle"
              gameState={{...gameState, status: 'idle'}} // Pass idle so loop doesn't run logic
              setGameState={setGameState} 
              onScore={addScore} 
            />
        )}
      </div>

      {/* Overlays */}
      {gameState.status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 font-retro mb-8 drop-shadow-[0_5px_5px_rgba(255,165,0,0.5)] text-center">
            NEON<br/>TANK
          </h1>
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl flex flex-col items-center">
             <div className="grid grid-cols-2 gap-8 mb-8 text-gray-300 text-sm">
                <div className="flex flex-col items-center">
                    <div className="flex gap-1 mb-2">
                        <div className="w-8 h-8 border border-white rounded flex items-center justify-center">W</div>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-8 h-8 border border-white rounded flex items-center justify-center">A</div>
                        <div className="w-8 h-8 border border-white rounded flex items-center justify-center">S</div>
                        <div className="w-8 h-8 border border-white rounded flex items-center justify-center">D</div>
                    </div>
                    <span className="mt-2">MOVE</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-8 border border-white rounded flex items-center justify-center mb-2">SPACE</div>
                    <span>FIRE</span>
                </div>
             </div>
             <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
                <Play className="fill-black" />
                START MISSION
            </button>
          </div>
        </div>
      )}

      {(gameState.status === 'gameover' || gameState.status === 'victory') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md z-20">
            {gameState.status === 'victory' ? (
                 <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
            ) : (
                 <Skull className="w-24 h-24 text-white mb-4 animate-pulse" />
            )}
          
          <h2 className="text-5xl font-retro text-white mb-4">
            {gameState.status === 'victory' ? 'MISSION CLEAR' : 'GAME OVER'}
          </h2>
          <p className="text-white/80 text-xl mb-8">FINAL SCORE: {gameState.score}</p>
          
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-white text-red-900 hover:bg-gray-200 font-bold text-lg rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw />
            RETRY
          </button>
        </div>
      )}
      
      {/* Mobile Controls Overlay (Visible only on small screens) */}
      <div className="absolute bottom-8 right-8 md:hidden flex flex-col gap-4 z-30 opacity-50">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white text-white font-bold">FIRE</div>
      </div>
    </div>
  );
};

export default App;