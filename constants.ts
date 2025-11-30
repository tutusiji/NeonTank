import { TileType } from './types';

export const GRID_SIZE = 13;
export const TILE_SIZE = 1;
export const GAME_SPEED = 0.08;
export const BULLET_SPEED = 0.15;
export const TANK_COOLDOWN = 30; // Frames

// Visual Colors
export const COLORS = {
  ground: '#222222',
  brick: '#d35400',
  steel: '#7f8c8d',
  water: '#3498db',
  player: '#f1c40f', // Classic Gold/Yellowish
  playerTurret: '#f39c12',
  enemy: '#c0392b',
  enemyTurret: '#e74c3c',
  bullet: '#ecf0f1',
  base: '#8e44ad',
};

// 13x13 Map (Classic Inspired)
// 0: Empty, 1: Brick, 2: Steel, 3: Water, 4: Base
export const LEVEL_1: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 2, 2, 2, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 2, 0, 2, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 1, 4, 1, 0, 0, 0, 0, 0],
];