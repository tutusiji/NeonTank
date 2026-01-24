import React, { useState } from "react";
import GameCanvas from "./components/GameEngine";
import { GameState } from "./types";
import {
  Play,
  RotateCcw,
  Trophy,
  Heart,
  Skull,
  Plus,
  Minus,
  Wand2,
  Loader2,
} from "lucide-react";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: "idle",
    score: 0,
    lives: 3,
    level: 1,
  });

  const [enemyCount, setEnemyCount] = useState(5);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMap, setCustomMap] = useState<number[][] | null>(null);

  const increaseEnemies = () => {
    setEnemyCount((prev) => Math.min(100, prev + 5));
  };

  const decreaseEnemies = () => {
    setEnemyCount((prev) => Math.max(5, prev - 5));
  };

  const startGame = () => {
    setGameState({
      status: "playing",
      score: 0,
      lives: 3,
      level: 1,
    });
  };

  const generateLevel = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const fullPrompt = `Generate a 13x13 grid for a Tank Battle game based on the theme: "${prompt}".
      Rules:
      - Use 0 for empty space, 1 for brick wall, 2 for steel wall, 3 for water.
      - The base (eagle) MUST be at coordinates [12][6] (value 4).
      - Ensure there is empty space around [12][6] for player spawn.
      - Return ONLY the JSON 2D array of numbers.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      });
      
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json|```/g, "").trim();
      const map = JSON.parse(cleanJson);
      if (Array.isArray(map) && map.length === 13) {
        setCustomMap(map);
        alert("Level generated successfully! Click Start to play.");
      }
    } catch (e) {
      console.error("Failed to generate level", e);
      alert("Failed to generate level. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addScore = (points: number) => {
    setGameState((prev) => ({ ...prev, score: prev.score + points }));
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Header HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none select-none text-white mix-blend-difference">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <span className="font-retro text-xl">
            {gameState.score.toString().padStart(6, "0")}
          </span>
        </div>
        <div className="font-bold text-lg tracking-widest opacity-50">
          NEON TANK 1990
        </div>
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <span className="font-retro text-xl">x {gameState.lives}</span>
        </div>
      </div>

      {/* 3D Game Canvas */}
      <div className="w-full h-full">
        {gameState.status !== "idle" && (
          <GameCanvas
            key={
              gameState.status === "playing" ? "game-running" : "game-stopped"
            }
            gameState={gameState}
            setGameState={setGameState}
            onScore={addScore}
            enemyCount={enemyCount}
            customMap={customMap}
          />
        )}
        {/* Preview background when idle */}
        {gameState.status === "idle" && (
          <GameCanvas
            key="game-idle"
            gameState={{ ...gameState, status: "idle" }} // Pass idle so loop doesn't run logic
            setGameState={setGameState}
            onScore={addScore}
            enemyCount={enemyCount}
            customMap={customMap}
          />
        )}
      </div>

      {/* Overlays */}
      {gameState.status === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 font-retro mb-8 drop-shadow-[0_5px_5px_rgba(255,165,0,0.5)] text-center">
            NEON
            <br />
            TANK
          </h1>
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl flex flex-col items-center">
            <div className="grid grid-cols-3 gap-8 mb-6 text-gray-300 text-xs">
              {/* Movement: Arrow Keys */}
              <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                  <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-base">
                    ↑
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-base">
                    ←
                  </div>
                  <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-base">
                    ↓
                  </div>
                  <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-base">
                    →
                  </div>
                </div>
                <span className="mt-2 text-[10px] uppercase">Move Tank</span>
              </div>

              {/* Turret: WASD */}
              <div className="flex flex-col items-center">
                <div className="flex gap-1 mb-2">
                  <div className="w-6 h-6 border border-yellow-500 rounded flex items-center justify-center text-yellow-500">
                    W
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 border border-yellow-500 rounded flex items-center justify-center text-yellow-500">
                    A
                  </div>
                  <div className="w-6 h-6 border border-yellow-500 rounded flex items-center justify-center text-yellow-500">
                    S
                  </div>
                  <div className="w-6 h-6 border border-yellow-500 rounded flex items-center justify-center text-yellow-500">
                    D
                  </div>
                </div>
                <span className="mt-2 text-[10px] uppercase text-yellow-500">Aim Turret</span>
              </div>

              {/* Fire: Space */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-6 border border-white rounded flex items-center justify-center mb-2">
                  SPACE
                </div>
                <span className="text-[10px] uppercase">Fire</span>
              </div>
            </div>

            {/* Enemy Count Selector */}
            <div className="mb-6 flex flex-col items-center">
              <div className="text-gray-400 text-sm mb-2">ENEMY COUNT</div>
              <div className="flex items-center gap-4">
                <button
                  onClick={decreaseEnemies}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  disabled={enemyCount <= 5}
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <div className="w-20 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {enemyCount}
                  </div>
                </div>
                <button
                  onClick={increaseEnemies}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  disabled={enemyCount >= 100}
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* AI Map Generator */}
            <div className="mb-6 w-full flex flex-col items-center">
              <div className="text-gray-400 text-sm mb-2 uppercase tracking-widest">AI Level Generator</div>
              <div className="flex w-full gap-2">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A water world..." 
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-yellow-500 transition-colors"
                />
                <button
                  onClick={generateLevel}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
                >
                  {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                </button>
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

      {(gameState.status === "gameover" || gameState.status === "victory") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md z-20">
          {gameState.status === "victory" ? (
            <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
          ) : (
            <Skull className="w-24 h-24 text-white mb-4 animate-pulse" />
          )}

          <h2 className="text-5xl font-retro text-white mb-4">
            {gameState.status === "victory" ? "MISSION CLEAR" : "GAME OVER"}
          </h2>
          <p className="text-white/80 text-xl mb-8">
            FINAL SCORE: {gameState.score}
          </p>

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
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white text-white font-bold">
          FIRE
        </div>
      </div>
    </div>
  );
};

export default App;
