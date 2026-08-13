--- landing-personal/src/components/hero/useScrollAnimation.ts (原始)


+++ landing-personal/src/components/hero/useScrollAnimation.ts (修改后)
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  SCROLL_PHASES,
  ROTATION_SPEED_DISPERSO,
  ROTATION_SPEED_ENSAMBLADO,
  ROTATION_TILT_X,
  MOUSE_THRESHOLD_NDC,
  MOUSE_REPULSION_FORCE,
  MOUSE_RETURN_SPEED,
  MOUSE_ENABLED,
} from './settings';

export type ScrollPhase =
  | 'PLANO_STATIC'
  | 'PLANO_DISPERSION'
  | 'PLANO_DISPERSO'
  | 'CROSSFADE_TO_A'
  | 'A_DISPERSO'
  | 'A_ENSAMBLAJE'
  | 'A_CONTEMPLACION'
  | 'A_DISPERSION_INV'
  | 'CROSSFADE_TO_B';

/**
 * Hook que maneja el estado del scroll y determina la fase actual
 */
export function useScrollProgress() {
  const scrollProgress = useRef(0);
  const currentPhase = useRef<ScrollPhase>('PLANO_STATIC');

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = Math.min(window.scrollY / total, 1);

      // Determinar fase actual basada en el progreso
      const progress = scrollProgress.current;
      if (progress >= SCROLL_PHASES.CROSSFADE_TO_B.start) {
        currentPhase.current = 'CROSSFADE_TO_B';
      } else if (progress >= SCROLL_PHASES.A_DISPERSION_INV.start) {
        currentPhase.current = 'A_DISPERSION_INV';
      } else if (progress >= SCROLL_PHASES.A_CONTEMPLACION.start) {
        currentPhase.current = 'A_CONTEMPLACION';
      } else if (progress >= SCROLL_PHASES.A_ENSAMBLAJE.start) {
        currentPhase.current = 'A_ENSAMBLAJE';
      } else if (progress >= SCROLL_PHASES.A_DISPERSO.start) {
        currentPhase.current = 'A_DISPERSO';
      } else if (progress >= SCROLL_PHASES.CROSSFADE_TO_A.start) {
        currentPhase.current = 'CROSSFADE_TO_A';
      } else if (progress >= SCROLL_PHASES.PLANO_DISPERSO.start) {
        currentPhase.current = 'PLANO_DISPERSO';
      } else if (progress >= SCROLL_PHASES.PLANO_DISPERSION.start) {
        currentPhase.current = 'PLANO_DISPERSION';
      } else {
        currentPhase.current = 'PLANO_STATIC';
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // inicializar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollProgress, currentPhase };
}

/**
 * Obtiene el progreso normalizado dentro de una fase específica (0 a 1)
 */
export function getPhaseProgress(
  scrollProgress: number,
  phase: keyof typeof SCROLL_PHASES
): number {
  const { start, end } = SCROLL_PHASES[phase];
  if (scrollProgress <= start) return 0;
  if (scrollProgress >= end) return 1;
  return (scrollProgress - start) / (end - start);
}

/**
 * Hook que aplica rotación continua al grupo según la fase actual
 */
export function useRotation(
  groupRef: React.RefObject<THREE.Group | null>,
  phase: ScrollPhase
) {
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const isDisperso = phase === 'PLANO_DISPERSO' || phase === 'A_DISPERSO';
    const isEnsamblado = phase === 'A_CONTEMPLACION';
    const isCrossfade = phase === 'CROSSFADE_TO_A' || phase === 'CROSSFADE_TO_B';

    let speed = 0;
    if (isDisperso || isCrossfade) {
      speed = ROTATION_SPEED_DISPERSO;
    } else if (isEnsamblado) {
      speed = ROTATION_SPEED_ENSAMBLADO;
    }

    if (speed > 0) {
      groupRef.current.rotation.y += delta * speed;
      groupRef.current.rotation.x += delta * speed * ROTATION_TILT_X;
    }
  });
}

/**
 * Hook que aplica repulsión de mouse a las posiciones de los puntos
 */
export function useMouseRepulsion(
  positionsRef: React.RefObject<Float32Array | null>,
  originalPositionsRef: React.RefObject<Float32Array | null>,
  cameraRef: React.RefObject<THREE.Camera | null>
) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const tempVector = new THREE.Vector3();

  useEffect(() => {
    if (!MOUSE_ENABLED) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Convertir a coordenadas normalizadas (-1 a 1)
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!MOUSE_ENABLED || !positionsRef.current || !originalPositionsRef.current || !cameraRef.current) {
      return;
    }

    const positions = positionsRef.current;
    const originals = originalPositionsRef.current;
    const camera = cameraRef.current;
    const mouse = mouseRef.current;

    for (let i = 0; i < positions.length; i += 3) {
      // Proyectar posición 3D a espacio de pantalla 2D
      tempVector.set(positions[i], positions[i + 1], positions[i + 2]);
      tempVector.project(camera);

      const dist = Math.sqrt(
        Math.pow(tempVector.x - mouse.x, 2) +
        Math.pow(tempVector.y - mouse.y, 2)
      );

      if (dist < MOUSE_THRESHOLD_NDC) {
        const factor = (1 - dist / MOUSE_THRESHOLD_NDC) * MOUSE_REPULSION_FORCE;
        // Aplicar offset temporal
        positions[i] += (Math.random() - 0.5) * factor * 0.5;
        positions[i + 1] += (Math.random() - 0.5) * factor * 0.5;
        positions[i + 2] += (Math.random() - 0.5) * factor * 0.5;
      } else {
        // Retorno suave a posición original
        positions[i] += (originals[i] - positions[i]) * MOUSE_RETURN_SPEED;
        positions[i + 1] += (originals[i + 1] - positions[i + 1]) * MOUSE_RETURN_SPEED;
        positions[i + 2] += (originals[i + 2] - positions[i + 2]) * MOUSE_RETURN_SPEED;
      }
    }
  });
}

/**
 * Interpola entre dos arrays de posiciones basado en un factor t (0 a 1)
 */
export function lerpPositions(
  target: Float32Array,
  from: Float32Array,
  to: Float32Array,
  t: number
): void {
  for (let i = 0; i < target.length; i++) {
    target[i] = from[i] + (to[i] - from[i]) * t;
  }
}