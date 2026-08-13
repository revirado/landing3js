--- landing-personal/src/components/hero/settings.ts (原始)


+++ landing-personal/src/components/hero/settings.ts (修改后)
// ============================================
// SETTINGS DEL HERO — AJUSTAR AQUÍ
// ============================================

// --- Cantidad de puntos ---
export const POINT_COUNT_DESKTOP = 6000;      // N para desktop
export const POINT_COUNT_MOBILE = 3000;        // N para mobile (< 768px)

// --- Dimensiones del plano inicial ---
export const PLANE_WIDTH = 10;                 // ancho de la grilla plana
export const PLANE_HEIGHT = 6;                 // alto de la grilla plana
export const PLANE_Z = 0;                      // posición Z del plano

// --- Cámara ---
export const CAMERA_FOV = 50;                  // field of view
export const CAMERA_POSITION: [number, number, number] = [0, 0, 12];
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, 0];

// --- Colores ---
export const POINT_COLOR = '#ffffff';            // color de los puntos
export const POINT_COLOR_HOVER = '#aaddff';    // color al pasar el mouse (futuro)
export const BACKGROUND_COLOR = '#050505';     // fondo del canvas

// --- Tamaño de puntos ---
export const POINT_SIZE = 0.03;                // tamaño base de cada punto
export const POINT_SIZE_ATTENUATION = true;    // los puntos se achican con la distancia

// --- Materiales ---
export const POINT_OPACITY = 0.9;              // opacidad base
export const POINT_TRANSPARENT = true;         // permite opacidad variable
export const POINT_DEPTH_WRITE = false;        // evita artefactos con transparencias superpuestas

// --- Rangos de scroll (0.0 a 1.0) ---
// Cada tramo define un rango del scroll total.
export const SCROLL_PHASES = {
  PLANO_STATIC:       { start: 0.00, end: 0.08 },  // plano quieto
  PLANO_DISPERSION:   { start: 0.08, end: 0.22 },  // plano → plano disperso
  PLANO_DISPERSO:     { start: 0.22, end: 0.32 },  // plano disperso girando
  CROSSFADE_TO_A:     { start: 0.32, end: 0.42 },  // crossfade plano disperso → modelo A disperso
  A_DISPERSO:         { start: 0.42, end: 0.52 },  // modelo A disperso girando
  A_ENSAMBLAJE:       { start: 0.52, end: 0.68 },  // modelo A disperso → ensamblado
  A_CONTEMPLACION:    { start: 0.68, end: 0.82 },  // modelo A ensamblado girando
  A_DISPERSION_INV:   { start: 0.82, end: 0.92 },  // modelo A ensamblado → disperso (preparando siguiente)
  CROSSFADE_TO_B:     { start: 0.92, end: 1.00 },  // crossfade modelo A disperso → modelo B disperso
} as const;

// --- Velocidades de rotación (radianes por segundo) ---
export const ROTATION_SPEED_DISPERSO = 0.25;   // velocidad de rotación durante estados dispersos
export const ROTATION_SPEED_ENSAMBLADO = 0.08; // velocidad de rotación durante contemplación
export const ROTATION_TILT_X = 0.3;            // factor de inclinación en eje X (0 = solo Y)

// --- Dispersión ---
export const DISPERSION_RADIUS = 4.0;          // radio máximo de dispersión aleatoria por punto
export const DISPERSION_SEED = 42;             // semilla para reproducibilidad (opcional)

// --- Mouse / Repulsión ---
export const MOUSE_THRESHOLD_NDC = 0.08;       // distancia umbral en coordenadas normalizadas (-1 a 1)
export const MOUSE_REPULSION_FORCE = 0.8;      // fuerza máxima de repulsión
export const MOUSE_RETURN_SPEED = 0.1;         // velocidad de retorno a posición original (lerp factor)
export const MOUSE_ENABLED = true;             // activar/desactivar interacción

// --- Cubo placeholder ---
export const CUBE_SIZE = 3;                    // tamaño del cubo
export const CUBE_SUBDIVISIONS = 40;           // segmentos por cara (cuanto más alto, más puntos)
export const CUBE_POSITION: [number, number, number] = [0, 0, 0];

// --- Altura del scroll wrapper ---
export const SCROLL_HEIGHT = '400vh';          // altura total del contenedor scrolleable