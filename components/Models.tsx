import React, { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere, Stars, Trail } from '@react-three/drei';
import { COLORS, TILE_SIZE } from '../constants';
import { Direction, Position } from '../types';

// Helper to convert grid position to world position
// Centering the map around (0,0,0)
export const gridToWorld = (x: number, z: number) => {
  const offset = 6; // Half of 13 approx
  return [(x - offset) * TILE_SIZE, 0.5, (z - offset) * TILE_SIZE] as [number, number, number];
};

interface TankModelProps {
  position: Position;
  direction: Direction;
  rotation?: number;
  turretRotation?: number;
  colorBody: string;
  colorTurret: string;
  isMoving?: boolean;
}

export const TankModel: React.FC<TankModelProps> = ({ 
  position, 
  direction, 
  rotation = 0,
  turretRotation = 0,
  colorBody, 
  colorTurret, 
  isMoving 
}) => {
  const groupRef = useRef<any>(null);
  const turretRef = useRef<any>(null);
  const [wx, wy, wz] = gridToWorld(position.x, position.z);
  
  // Base rotation logic for enemies (legacy compatibility or simple AI)
  let baseRotationY = rotation;
  if (!rotation) {
    switch (direction) {
      case Direction.UP: baseRotationY = Math.PI; break;
      case Direction.DOWN: baseRotationY = 0; break;
      case Direction.LEFT: baseRotationY = -Math.PI / 2; break;
      case Direction.RIGHT: baseRotationY = Math.PI / 2; break;
    }
  }

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.set(wx, wy, wz);
      groupRef.current.rotation.y = baseRotationY;
      
      if (isMoving) {
        groupRef.current.position.y = wy + Math.sin(state.clock.elapsedTime * 15) * 0.05;
      }
    }
    if (turretRef.current) {
      turretRef.current.rotation.y = turretRotation;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <RoundedBox args={[0.8, 0.4, 0.8]} radius={0.05} castShadow receiveShadow>
        <meshStandardMaterial 
          color={colorBody} 
          metalness={0.8} 
          roughness={0.1} 
          emissive={colorBody}
          emissiveIntensity={0.6}
        />
      </RoundedBox>
      {/* Tracks */}
      <mesh position={[0.42, -0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.9]} />
        <meshStandardMaterial color="#111" emissive="#111" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.42, -0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.9]} />
        <meshStandardMaterial color="#111" emissive="#111" emissiveIntensity={0.2} />
      </mesh>
      {/* Turret Group */}
      <group ref={turretRef} position={[0, 0.35, 0]}>
        <RoundedBox args={[0.5, 0.3, 0.6]} radius={0.05} castShadow>
          <meshStandardMaterial 
            color={colorTurret} 
            emissive={colorTurret}
            emissiveIntensity={0.8}
          />
        </RoundedBox>
        {/* Barrel */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
};

export const BrickWall: React.FC<{ x: number; z: number }> = ({ x, z }) => {
  const [wx, , wz] = gridToWorld(x, z);
  return (
    <RoundedBox position={[wx, 0.5, wz]} args={[0.95, 0.95, 0.95]} radius={0.05} castShadow receiveShadow>
      <meshStandardMaterial 
        color={COLORS.brick} 
        emissive={COLORS.brick} 
        emissiveIntensity={0.3} 
      />
      {/* Detail lines to look like bricks */}
      <lineSegments position={[0,0,0.51]}>
         <edgesGeometry args={[new THREE.BoxGeometry(0.95, 0.95, 0.01)]} />
         <lineBasicMaterial color="#ff6600" />
      </lineSegments>
    </RoundedBox>
  );
};

import * as THREE from 'three';

export const SteelWall: React.FC<{ x: number; z: number }> = ({ x, z }) => {
  const [wx, , wz] = gridToWorld(x, z);
  return (
    <RoundedBox position={[wx, 0.5, wz]} args={[1, 1, 1]} radius={0.02} castShadow receiveShadow>
      <meshStandardMaterial 
        color={COLORS.steel} 
        metalness={1} 
        roughness={0} 
        emissive={COLORS.steel}
        emissiveIntensity={0.4}
      />
    </RoundedBox>
  );
};

export const WaterTile: React.FC<{ x: number; z: number }> = ({ x, z }) => {
  const [wx, , wz] = gridToWorld(x, z);
  return (
    <mesh position={[wx, 0.1, wz]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color={COLORS.water} 
        emissive={COLORS.water}
        emissiveIntensity={0.5}
        opacity={0.8} 
        transparent 
      />
    </mesh>
  );
};

export const BaseEagle: React.FC<{ x: number; z: number; dead: boolean }> = ({ x, z, dead }) => {
  const [wx, , wz] = gridToWorld(x, z);
  return (
    <group position={[wx, 0.5, wz]}>
      <RoundedBox args={[1, 1, 0.5]} position={[0, 0, 0.25]} castShadow receiveShadow>
         <meshStandardMaterial color="#333" />
      </RoundedBox>
      {dead ? (
        <mesh>
             <sphereGeometry args={[0.4]} />
             <meshStandardMaterial color="#000" />
        </mesh>
      ) : (
        <mesh position={[0, 0, -0.2]} castShadow>
            <icosahedronGeometry args={[0.4, 1]} />
            <meshStandardMaterial color={COLORS.base} emissive={COLORS.base} emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
};

export const BulletMesh: React.FC<{ position: Position }> = ({ position }) => {
  const [wx, , wz] = gridToWorld(position.x, position.z);
  return (
    <group position={[wx, 0.5, wz]}>
      <Trail
        width={1}
        length={4}
        color={new THREE.Color(COLORS.bullet)}
        attenuation={(t) => t * t}
      >
        <mesh>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color={COLORS.bullet} emissive={COLORS.bullet} emissiveIntensity={5} />
        </mesh>
      </Trail>
      <pointLight color={COLORS.bullet} intensity={0.5} distance={1} />
    </group>
  );
};

export const ExplosionMesh: React.FC<{ position: Position; scale: number }> = ({ position, scale }) => {
  const [wx, , wz] = gridToWorld(position.x, position.z);
  return (
    <mesh position={[wx, 0.5, wz]} scale={[scale, scale, scale]}>
      <sphereGeometry args={[0.5]} />
      <meshStandardMaterial color="orange" emissive="red" emissiveIntensity={1} transparent opacity={1 - scale * 0.5} />
    </mesh>
  );
};