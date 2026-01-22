export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3,
  BASE = 4, // The Eagle
}

export interface Position {
  x: number;
  z: number;
}

export interface GameObject {
  id: string;
  position: Position;
  direction: Direction;
  rotation: number; // Y-axis rotation in radians
  active: boolean;
}

export interface Bullet extends GameObject {
  owner: 'player' | 'enemy';
  velocity: { x: number; z: number };
}

export interface Tank extends GameObject {
  type: 'player' | 'enemy';
  cooldown: number;
  hp: number;
  turretRotation: number; // Turret rotation for player
}

export interface Explosion {
  id: string;
  position: Position;
  scale: number;
  createdAt: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'gameover' | 'victory';
  score: number;
  lives: number;
  level: number;
}