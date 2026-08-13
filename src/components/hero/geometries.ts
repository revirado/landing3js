
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  POINT_COUNT_DESKTOP,
  POINT_COUNT_MOBILE,
  PLANE_WIDTH,
  PLANE_HEIGHT,
  DISPERSION_RADIUS,
} from './settings';

/**
 * Genera una grilla plana de puntos en el plano XZ
 */
export function generatePlaneGeometry(
  pointCount: number,
  width: number = PLANE_WIDTH,
  height: number = PLANE_HEIGHT
): Float32Array {
  const positions = new Float32Array(pointCount * 3);

  const cols = Math.ceil(Math.sqrt(pointCount * (width / height)));
  const rows = Math.ceil(pointCount / cols);
  const stepX = width / cols;
  const stepZ = height / rows;

  let idx = 0;
  for (let row = 0; row < rows && idx < pointCount * 3; row++) {
    for (let col = 0; col < cols && idx < pointCount * 3; col++) {
      positions[idx] = (col - cols / 2) * stepX + stepX / 2;     // x
      positions[idx + 1] = 0;                                     // y
      positions[idx + 2] = (row - rows / 2) * stepZ + stepZ / 2; // z
      idx += 3;
    }
  }

  return positions;
}

/**
 * Genera un cubo subdividido como placeholder
 */
export function generateCubeGeometry(
  targetPointCount: number,
  size: number = 3,
  subdivisions: number = 40
): Float32Array {
  const geometry = new THREE.BoxGeometry(size, size, size, subdivisions, subdivisions, subdivisions);
  const positions = geometry.attributes.position.array as Float32Array;

  // Si tenemos más puntos de los necesarios, submuestreamos
  if (positions.length / 3 > targetPointCount) {
    const sampled = new Float32Array(targetPointCount * 3);
    const step = Math.floor(positions.length / (targetPointCount * 3));
    for (let i = 0; i < targetPointCount * 3; i++) {
      sampled[i] = positions[Math.min(i * step, positions.length - 1)];
    }
    geometry.dispose();
    return sampled;
  }

  return positions;
}

/**
 * Genera el estado disperso a partir de posiciones ensambladas
 * Aplica un offset aleatorio a cada punto dentro del radio de dispersión
 */
export function generateDispersedState(
  assembledPositions: Float32Array,
  radius: number = DISPERSION_RADIUS
): Float32Array {
  const dispersed = new Float32Array(assembledPositions.length);

  for (let i = 0; i < assembledPositions.length; i += 3) {
    const ox = (Math.random() - 0.5) * radius;
    const oy = (Math.random() - 0.5) * radius;
    const oz = (Math.random() - 0.5) * radius;

    dispersed[i] = assembledPositions[i] + ox;
    dispersed[i + 1] = assembledPositions[i + 1] + oy;
    dispersed[i + 2] = assembledPositions[i + 2] + oz;
  }

  return dispersed;
}

/**
 * Hook que genera y almacena las geometrías del plano (ensamblado y disperso)
 */
export function usePlaneGeometry(pointCount: number) {
  return useMemo(() => {
    const assembled = generatePlaneGeometry(pointCount);
    const dispersed = generateDispersedState(assembled);
    return { assembled, dispersed };
  }, [pointCount]);
}

/**
 * Hook que genera y almacena las geometrías del cubo placeholder (ensamblado y disperso)
 */
export function useCubeGeometry(pointCount: number, size: number, subdivisions: number) {
  return useMemo(() => {
    const assembled = generateCubeGeometry(pointCount, size, subdivisions);
    const dispersed = generateDispersedState(assembled);
    return { assembled, dispersed };
  }, [pointCount, size, subdivisions]);
}

/**
 * Obtiene el count de puntos según el viewport
 */
export function getPointCount(): number {
  if (typeof window === 'undefined') return POINT_COUNT_DESKTOP;
  return window.innerWidth < 768 ? POINT_COUNT_MOBILE : POINT_COUNT_DESKTOP;
}