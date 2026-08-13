
import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAMERA_FOV,
  CAMERA_POSITION,
  BACKGROUND_COLOR,
  SCROLL_HEIGHT,
} from './settings';
import { useScrollProgress, useRotation, type ScrollPhase } from './useScrollAnimation';
import { usePlaneGeometry, useCubeGeometry, getPointCount } from './geometries';
import { PointsSystem } from './PointsSystem';

/**
 * Escena 3D que contiene todos los sistemas de puntos
 */
function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { scrollProgress, currentPhase } = useScrollProgress();
  const [pointCount] = useState(getPointCount());

  // Generar geometrías (se generan una sola vez al montar)
  const planeGeometries = usePlaneGeometry(pointCount);
  const cubeGeometries = useCubeGeometry(pointCount, 3, 40);

  // Aplicar rotación según fase
  useRotation(groupRef, currentPhase.current);

  return (
    <group ref={groupRef}>
      {/* Sistema de puntos del plano */}
      <PointsSystem
        assembledPositions={planeGeometries.assembled}
        dispersedPositions={planeGeometries.dispersed}
        phase={currentPhase.current}
        scrollProgress={scrollProgress.current}
        isPlane={true}
      />

      {/* Sistema de puntos del cubo (Modelo A) */}
      <PointsSystem
        assembledPositions={cubeGeometries.assembled}
        dispersedPositions={cubeGeometries.dispersed}
        phase={currentPhase.current}
        scrollProgress={scrollProgress.current}
        isPlane={false}
      />
    </group>
  );
}

/**
 * Componente principal del Hero con Canvas 3D
 */
export function Hero() {
  return (
    <>
      {/* Contenedor scrolleable */}
      <div style={{ height: SCROLL_HEIGHT }} />

      {/* Canvas 3D fijo */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
        }}
        camera={{
          fov: CAMERA_FOV,
          position: CAMERA_POSITION,
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[BACKGROUND_COLOR]} />
        <HeroScene />
      </Canvas>

      {/* Overlay de contenido */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {/* El contenido de texto va aquí */}
      </div>
    </>
  );
}