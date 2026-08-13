--- landing-personal/src/components/hero/PointsSystem.tsx (原始)


+++ landing-personal/src/components/hero/PointsSystem.tsx (修改后)
import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  POINT_COLOR,
  POINT_SIZE,
  POINT_SIZE_ATTENUATION,
  POINT_TRANSPARENT,
  POINT_DEPTH_WRITE,
  SCROLL_PHASES,
} from './settings';
import { getPhaseProgress, lerpPositions, ScrollPhase } from './useScrollAnimation';

interface PointsSystemProps {
  assembledPositions: Float32Array;
  dispersedPositions: Float32Array;
  phase: ScrollPhase;
  scrollProgress: number;
  targetOpacity?: number;
  isPlane?: boolean;
}

/**
 * Componente que renderiza un sistema de puntos con transición entre estado ensamblado y disperso
 */
export function PointsSystem({
  assembledPositions,
  dispersedPositions,
  phase,
  scrollProgress,
  targetOpacity = 1,
  isPlane = false,
}: PointsSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const { camera } = useThree();

  // Crear geometría inicial
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const initialPositions = new Float32Array(dispersedPositions.length);
    initialPositions.set(dispersedPositions);
    geom.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    positionsRef.current = initialPositions;
    return geom;
  }, [dispersedPositions.length]);

  // Actualizar posiciones en cada frame según la fase
  useFrame(() => {
    if (!positionsRef.current || !pointsRef.current) return;

    const positions = positionsRef.current;
    let t = 0;

    // Determinar interpolación según fase
    if (phase === 'PLANO_DISPERSION') {
      // Plano: ensamblado → disperso
      t = getPhaseProgress(scrollProgress, 'PLANO_DISPERSION');
      lerpPositions(positions, assembledPositions, dispersedPositions, t);
    } else if (phase === 'A_ENSAMBLAJE' && !isPlane) {
      // Modelo A: disperso → ensamblado
      t = getPhaseProgress(scrollProgress, 'A_ENSAMBLAJE');
      lerpPositions(positions, dispersedPositions, assembledPositions, t);
    } else if (phase === 'A_DISPERSION_INV' && !isPlane) {
      // Modelo A: ensamblado → disperso (inverso)
      t = getPhaseProgress(scrollProgress, 'A_DISPERSION_INV');
      lerpPositions(positions, assembledPositions, dispersedPositions, t);
    }

    // Marcar atributo como necesitado de actualización
    geometry.attributes.position.needsUpdate = true;
  });

  // Calcular opacidad basada en fase
  let opacity = targetOpacity;
  if (phase === 'CROSSFADE_TO_A') {
    if (isPlane) {
      // Plano saliendo: fade out
      const t = getPhaseProgress(scrollProgress, 'CROSSFADE_TO_A');
      opacity = 1 - t;
    } else {
      // Modelo A entrando: fade in
      const t = getPhaseProgress(scrollProgress, 'CROSSFADE_TO_A');
      opacity = t;
    }
  } else if (phase === 'CROSSFADE_TO_B') {
    if (!isPlane) {
      // Modelo A saliendo: fade out
      const t = getPhaseProgress(scrollProgress, 'CROSSFADE_TO_B');
      opacity = 1 - t;
    }
  }

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={POINT_COLOR}
        size={POINT_SIZE}
        sizeAttenuation={POINT_SIZE_ATTENUATION}
        transparent={POINT_TRANSPARENT}
        depthWrite={POINT_DEPTH_WRITE}
        opacity={opacity}
      />
    </points>
  );
}