import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import {
  GRID_SIZE,
  LEVEL_1,
  COLORS,
  GAME_SPEED,
  BULLET_SPEED,
  TANK_COOLDOWN,
} from "../constants";
import {
  Direction,
  TileType,
  Position,
  Tank,
  Bullet,
  Explosion,
  GameState,
} from "../types";
import {
  TankModel,
  BrickWall,
  SteelWall,
  WaterTile,
  BaseEagle,
  BulletMesh,
  ExplosionMesh,
  gridToWorld,
} from "./Models";

// Utility: Check collision with map grid
// Improved collision detection considering tank size (0.8x0.8)
const checkGridCollision = (pos: Position, map: number[][]): boolean => {
  // Tank size is 0.8, so we check a slightly smaller radius to allow smooth movement
  const tankRadius = 0.35; // Half of 0.7 (slightly smaller than 0.8 for smoother feel)

  // Check the four corners of the tank's bounding box
  const checkPoints = [
    { x: pos.x + tankRadius, z: pos.z + tankRadius }, // Top-right
    { x: pos.x - tankRadius, z: pos.z + tankRadius }, // Top-left
    { x: pos.x + tankRadius, z: pos.z - tankRadius }, // Bottom-right
    { x: pos.x - tankRadius, z: pos.z - tankRadius }, // Bottom-left
  ];

  for (const point of checkPoints) {
    const gridX = Math.floor(point.x + 0.5); // Round to nearest grid cell
    const gridZ = Math.floor(point.z + 0.5);

    // Out of bounds check
    if (gridX < 0 || gridX >= GRID_SIZE || gridZ < 0 || gridZ >= GRID_SIZE) {
      return true;
    }

    const tile = map[gridZ][gridX];
    if (
      tile === TileType.BRICK ||
      tile === TileType.STEEL ||
      tile === TileType.WATER ||
      tile === TileType.BASE
    ) {
      return true;
    }
  }

  return false;
};

// Utility: Check bullet collision with rect (simple radius check approximation)
const isColliding = (p1: Position, p2: Position, threshold: number = 0.6) => {
  const dx = p1.x - p2.x;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dz * dz) < threshold;
};

interface GameEngineProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onScore: (pts: number) => void;
  enemyCount: number;
}

const GameLoop: React.FC<GameEngineProps> = ({
  gameState,
  setGameState,
  onScore,
  enemyCount,
}) => {
  // --- Mutable Game State (Refs for performance) ---
  const playerRef = useRef<Tank>({
    id: "p1",
    position: { x: 4, z: 12 },
    direction: Direction.UP,
    active: true,
    type: "player",
    cooldown: 0,
    hp: 1,
  });

  // Generate enemies based on enemyCount
  const initialEnemies = useMemo(() => {
    const enemies: Tank[] = [];
    const map = LEVEL_1;

    // Spawn enemies in top 3 rows, distributed evenly
    for (let i = 0; i < enemyCount; i++) {
      let x: number, z: number;
      let attempts = 0;

      // Try to find a valid spawn position
      do {
        // Distribute across the top area
        const row = i % 3; // Use rows 0, 1, 2
        const col = Math.floor((i / 3) % GRID_SIZE); // Distribute across columns

        x = col;
        z = row;

        // Add some randomness to avoid perfect grid
        if (attempts > 0) {
          x = Math.floor(Math.random() * GRID_SIZE);
          z = Math.floor(Math.random() * 3);
        }

        attempts++;
      } while (
        attempts < 20 &&
        (map[z][x] !== TileType.EMPTY || (x === 4 && z === 12)) // Avoid obstacles and player spawn
      );

      enemies.push({
        id: `e${i + 1}`,
        position: { x, z },
        direction: Direction.DOWN,
        active: true,
        type: "enemy",
        cooldown: 50 + i * 10, // Stagger shooting
        hp: 1,
      });
    }

    return enemies;
  }, [enemyCount]);

  // Initialize enemies directly to prevent empty array triggering win condition on first frame
  const enemiesRef = useRef<Tank[]>(initialEnemies);

  const bulletsRef = useRef<Bullet[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);

  // We need a local copy of the map to destroy bricks
  const mapRef = useRef<number[][]>(JSON.parse(JSON.stringify(LEVEL_1)));

  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});

  // --- React State for Rendering ---
  const [snapshot, setSnapshot] = useState({
    player: playerRef.current,
    enemies: enemiesRef.current,
    bullets: [] as Bullet[],
    explosions: [] as Explosion[],
    mapRev: 0,
  });

  // --- Initialization ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Reset game when starting new game
  useEffect(() => {
    if (gameState.status === "playing") {
      // Reset player
      playerRef.current = {
        id: "p1",
        position: { x: 4, z: 12 },
        direction: Direction.UP,
        active: true,
        type: "player",
        cooldown: 0,
        hp: 1,
      };

      // Reset enemies with new count
      enemiesRef.current = initialEnemies.map((e) => ({ ...e, active: true }));

      // Reset bullets and explosions
      bulletsRef.current = [];
      explosionsRef.current = [];

      // Reset map
      mapRef.current = JSON.parse(JSON.stringify(LEVEL_1));
    }
  }, [gameState.status, initialEnemies]);

  // --- The Game Loop (Runs 60fps) ---
  useFrame((state, delta) => {
    if (gameState.status !== "playing") return;

    const player = playerRef.current;
    const map = mapRef.current;

    // 1. Player Movement
    let moving = false;
    let intendedPos = { ...player.position };

    if (keys.current["ArrowUp"] || keys.current["KeyW"]) {
      player.direction = Direction.UP;
      intendedPos.z -= GAME_SPEED;
      moving = true;
    } else if (keys.current["ArrowDown"] || keys.current["KeyS"]) {
      player.direction = Direction.DOWN;
      intendedPos.z += GAME_SPEED;
      moving = true;
    } else if (keys.current["ArrowLeft"] || keys.current["KeyA"]) {
      player.direction = Direction.LEFT;
      intendedPos.x -= GAME_SPEED;
      moving = true;
    } else if (keys.current["ArrowRight"] || keys.current["KeyD"]) {
      player.direction = Direction.RIGHT;
      intendedPos.x += GAME_SPEED;
      moving = true;
    }

    // Simple grid collision for player
    if (moving && player.active) {
      // Basic Wall Collision - only update position if no collision
      if (!checkGridCollision(intendedPos, map)) {
        player.position = intendedPos;
      }
      // If collision detected, do nothing - tank stays in place (no bouncing)
    }

    // 2. Player Shooting
    if (player.cooldown > 0) player.cooldown--;
    if (
      (keys.current["Space"] || keys.current["Enter"]) &&
      player.cooldown <= 0 &&
      player.active
    ) {
      bulletsRef.current.push({
        id: `b_${Date.now()}_p`,
        position: { ...player.position },
        direction: player.direction,
        active: true,
        owner: "player",
      });
      player.cooldown = TANK_COOLDOWN;
    }

    // 3. Enemy Logic (Simple AI)
    enemiesRef.current.forEach((enemy) => {
      if (!enemy.active) return;

      // Move
      let enemyIntended = { ...enemy.position };
      const moveAmt = GAME_SPEED * 0.5; // Enemies slower

      switch (enemy.direction) {
        case Direction.UP:
          enemyIntended.z -= moveAmt;
          break;
        case Direction.DOWN:
          enemyIntended.z += moveAmt;
          break;
        case Direction.LEFT:
          enemyIntended.x -= moveAmt;
          break;
        case Direction.RIGHT:
          enemyIntended.x += moveAmt;
          break;
      }

      // Change direction if hit wall or randomly
      if (checkGridCollision(enemyIntended, map) || Math.random() < 0.02) {
        const dirs = [
          Direction.UP,
          Direction.DOWN,
          Direction.LEFT,
          Direction.RIGHT,
        ];
        enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
      } else {
        enemy.position = enemyIntended;
      }

      // Shoot randomly
      if (enemy.cooldown > 0) enemy.cooldown--;
      if (enemy.cooldown <= 0 && Math.random() < 0.05) {
        bulletsRef.current.push({
          id: `b_${Date.now()}_${enemy.id}`,
          position: { ...enemy.position },
          direction: enemy.direction,
          active: true,
          owner: "enemy",
        });
        enemy.cooldown = TANK_COOLDOWN * 2;
      }
    });

    // 4. Bullet Logic & Collision
    let mapChanged = false;
    bulletsRef.current.forEach((bullet) => {
      if (!bullet.active) return;

      // Move Bullet
      switch (bullet.direction) {
        case Direction.UP:
          bullet.position.z -= BULLET_SPEED;
          break;
        case Direction.DOWN:
          bullet.position.z += BULLET_SPEED;
          break;
        case Direction.LEFT:
          bullet.position.x -= BULLET_SPEED;
          break;
        case Direction.RIGHT:
          bullet.position.x += BULLET_SPEED;
          break;
      }

      // A. Wall Collision
      const gx = Math.round(bullet.position.x);
      const gz = Math.round(bullet.position.z);

      if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
        const tile = map[gz][gx];
        if (tile === TileType.BRICK) {
          map[gz][gx] = TileType.EMPTY;
          bullet.active = false;
          mapChanged = true;
          explosionsRef.current.push({
            id: Math.random().toString(),
            position: { x: gx, z: gz },
            scale: 1,
            createdAt: state.clock.elapsedTime,
          });
        } else if (tile === TileType.STEEL) {
          bullet.active = false;
          explosionsRef.current.push({
            id: Math.random().toString(),
            position: { x: gx, z: gz },
            scale: 0.5,
            createdAt: state.clock.elapsedTime,
          });
        } else if (tile === TileType.BASE) {
          bullet.active = false;
          map[gz][gx] = 0;
          setGameState((prev) => ({ ...prev, status: "gameover" }));
          explosionsRef.current.push({
            id: Math.random().toString(),
            position: { x: gx, z: gz },
            scale: 3,
            createdAt: state.clock.elapsedTime,
          });
        }
      } else {
        bullet.active = false; // Out of bounds
      }

      // B. Tank Collision
      if (bullet.active) {
        if (bullet.owner === "player") {
          // Check enemies
          enemiesRef.current.forEach((enemy) => {
            if (enemy.active && isColliding(bullet.position, enemy.position)) {
              enemy.active = false;
              bullet.active = false;
              onScore(100);
              explosionsRef.current.push({
                id: Math.random().toString(),
                position: enemy.position,
                scale: 1.5,
                createdAt: state.clock.elapsedTime,
              });
            }
          });
        } else {
          // Check player
          if (player.active && isColliding(bullet.position, player.position)) {
            player.active = false;
            bullet.active = false;
            setGameState((prev) => ({ ...prev, status: "gameover" }));
            explosionsRef.current.push({
              id: Math.random().toString(),
              position: player.position,
              scale: 2,
              createdAt: state.clock.elapsedTime,
            });
          }
        }
      }
    });

    // C. Bullet vs Bullet Collision (bullets cancel each other out)
    // Check if player bullets and enemy bullets collide
    const playerBullets = bulletsRef.current.filter(
      (b) => b.active && b.owner === "player",
    );
    const enemyBullets = bulletsRef.current.filter(
      (b) => b.active && b.owner === "enemy",
    );

    playerBullets.forEach((playerBullet) => {
      enemyBullets.forEach((enemyBullet) => {
        if (playerBullet.active && enemyBullet.active) {
          // Check if bullets are close enough to cancel each other
          // Use a slightly larger threshold (0.4) for easier bullet cancellation
          if (isColliding(playerBullet.position, enemyBullet.position, 0.5)) {
            playerBullet.active = false;
            enemyBullet.active = false;
            // Create small explosion effect
            explosionsRef.current.push({
              id: Math.random().toString(),
              position: {
                x: (playerBullet.position.x + enemyBullet.position.x) / 2,
                z: (playerBullet.position.z + enemyBullet.position.z) / 2,
              },
              scale: 0.8,
              createdAt: state.clock.elapsedTime,
            });
          }
        }
      });
    });

    // 5. Clean up
    bulletsRef.current = bulletsRef.current.filter((b) => b.active);
    enemiesRef.current = enemiesRef.current.filter((e) => e.active);

    explosionsRef.current = explosionsRef.current.filter(
      (e) => state.clock.elapsedTime - e.createdAt < 0.5,
    );
    explosionsRef.current.forEach((e) => (e.scale *= 0.9));

    // Win condition
    if (enemiesRef.current.length === 0 && gameState.status === "playing") {
      setGameState((prev) => ({ ...prev, status: "victory" }));
    }

    // Update React Render State
    setSnapshot({
      player: { ...player },
      enemies: [...enemiesRef.current],
      bullets: [...bulletsRef.current],
      explosions: [...explosionsRef.current],
      mapRev: mapChanged ? snapshot.mapRev + 1 : snapshot.mapRev,
    });
  });

  // --- Rendering ---

  // Memoize Map Elements
  const mapElements = useMemo(() => {
    const elements: React.ReactElement[] = [];
    const map = mapRef.current;
    for (let z = 0; z < GRID_SIZE; z++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = map[z][x];
        if (tile === TileType.BRICK)
          elements.push(<BrickWall key={`w-${x}-${z}`} x={x} z={z} />);
        if (tile === TileType.STEEL)
          elements.push(<SteelWall key={`s-${x}-${z}`} x={x} z={z} />);
        if (tile === TileType.WATER)
          elements.push(<WaterTile key={`wt-${x}-${z}`} x={x} z={z} />);
        if (tile === TileType.BASE)
          elements.push(
            <BaseEagle key={`b-${x}-${z}`} x={x} z={z} dead={false} />,
          );
        if (
          z === 12 &&
          x === 6 &&
          tile === 0 &&
          LEVEL_1[12][6] === TileType.BASE
        ) {
          elements.push(
            <BaseEagle key={`b-${x}-${z}-dead`} x={x} z={z} dead={true} />,
          );
        }
      }
    }
    elements.push(
      <mesh
        key="floor"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={COLORS.ground} />
      </mesh>,
    );
    return elements;
  }, [snapshot.mapRev]);

  return (
    <group>
      {mapElements}
      {snapshot.player.active && (
        <TankModel
          position={snapshot.player.position}
          direction={snapshot.player.direction}
          colorBody={COLORS.player}
          colorTurret={COLORS.playerTurret}
          isMoving={Object.values(keys.current).some((v) => v)}
        />
      )}
      {snapshot.enemies.map((e) => (
        <TankModel
          key={e.id}
          position={e.position}
          direction={e.direction}
          colorBody={COLORS.enemy}
          colorTurret={COLORS.enemyTurret}
          isMoving={true}
        />
      ))}
      {snapshot.bullets.map((b) => (
        <BulletMesh key={b.id} position={b.position} />
      ))}
      {snapshot.explosions.map((e) => (
        <ExplosionMesh key={e.id} position={e.position} scale={e.scale} />
      ))}
    </group>
  );
};

const GameCanvas: React.FC<GameEngineProps> = ({
  gameState,
  setGameState,
  onScore,
  enemyCount,
}) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 12], fov: 35, near: 0.1, far: 100 }}
    >
      <color attach="background" args={["#151515"]} />
      <Environment files="/potsdamer_platz_1k.hdr" />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight
        position={[-5, 15, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <GameLoop
        gameState={gameState}
        setGameState={setGameState}
        onScore={onScore}
        enemyCount={enemyCount}
      />

      <ContactShadows
        resolution={1024}
        scale={30}
        blur={2}
        opacity={0.5}
        far={10}
        color="#000000"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
};

export default GameCanvas;
