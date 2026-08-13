# Brief Técnico — Landing Personal (MVP fin de semana)

**Alineado con:** Plan General del Proyecto — Landing Personal v1.1
**Propósito:** Este documento establece las reglas técnicas estrictas para la generación de código, asegurando que la implementación sea nativa de React/Next.js, altamente performante y libre de errores comunes al mezclar Three.js "vanilla" con frameworks reactivos.

---

## 1. Stack Tecnológico

- **Framework:** Next.js (App Router)
- **Renderizado 3D:** `@react-three/fiber` (R3F) + `@react-three/drei`
- **Geometría:** `THREE.BufferGeometry` + `THREE.Points` — nunca objetos individuales por punto
- **Control de scroll:** Listener nativo de scroll + normalización manual del progreso (0 a 1 por tramo). GSAP ScrollTrigger es opcional a futuro, pero para el MVP alcanza con cálculo manual.
- **Interacción mouse:** Cálculo de distancia en espacio de pantalla 2D (prohibido `THREE.Raycaster` contra `Points`)

---

## 2. Variables Configurables (Settings del Hero)

**Regla obligatoria para todo código generado:** Todos los valores numéricos de posición, tamaño, escala, rotación, tiempos de secuencia, ángulos, velocidades, colores, opacidades y umbrales deben estar definidos como **constantes configurables al inicio del archivo**, nunca hardcodeados dentro de funciones o hooks.

El desarrollador humano debe poder ajustar cualquier detalle visual cambiando una sola línea en la sección de settings, sin tocar lógica.

### 2.1 Settings de Escena

```typescript
// ============================================
// SETTINGS DEL HERO — AJUSTAR AQUÍ
// ============================================

// --- Cantidad de puntos ---
const POINT_COUNT_DESKTOP = 6000;      // N para desktop
const POINT_COUNT_MOBILE = 3000;        // N para mobile (< 768px)

// --- Dimensiones del plano inicial ---
const PLANE_WIDTH = 10;                 // ancho de la grilla plana
const PLANE_HEIGHT = 6;                 // alto de la grilla plana
const PLANE_Z = 0;                      // posición Z del plano

// --- Cámara ---
const CAMERA_FOV = 50;                  // field of view
const CAMERA_POSITION: [number, number, number] = [0, 0, 12];
const CAMERA_LOOK_AT: [number, number, number] = [0, 0, 0];

// --- Colores ---
const POINT_COLOR = '#ffffff';            // color de los puntos
const POINT_COLOR_HOVER = '#aaddff';    // color al pasar el mouse (futuro)
const BACKGROUND_COLOR = '#050505';     // fondo del canvas

// --- Tamaño de puntos ---
const POINT_SIZE = 0.03;                // tamaño base de cada punto
const POINT_SIZE_ATTENUATION = true;    // los puntos se achican con la distancia

// --- Materiales ---
const POINT_OPACITY = 0.9;              // opacidad base
const POINT_TRANSPARENT = true;         // permite opacidad variable
const POINT_DEPTH_WRITE = false;        // evita artefactos con transparencias superpuestas
```

### 2.2 Settings de Animación por Scroll

```typescript
// --- Rangos de scroll (0.0 a 1.0) ---
// Cada tramo define un rango del scroll total.
// La suma de duraciones no necesita ser 1.0; el último tramo puede terminar antes.
const SCROLL_PHASES = {
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
const ROTATION_SPEED_DISPERSO = 0.25;   // velocidad de rotación durante estados dispersos
const ROTATION_SPEED_ENSAMBLADO = 0.08; // velocidad de rotación durante contemplación
const ROTATION_TILT_X = 0.3;            // factor de inclinación en eje X (0 = solo Y)

// --- Dispersión ---
const DISPERSION_RADIUS = 4.0;          // radio máximo de dispersión aleatoria por punto
const DISPERSION_SEED = 42;             // semilla para reproducibilidad (opcional)

// --- Interpolación ---
const LERP_EASE = 'power2.out';         // tipo de easing para los lerps (si se usa GSAP)
// Para lerp manual: usar función easeInOutCubic o similar
```

### 2.3 Settings de Interacción de Mouse

```typescript
// --- Mouse / Repulsión ---
const MOUSE_THRESHOLD_NDC = 0.08;       // distancia umbral en coordenadas normalizadas (-1 a 1)
const MOUSE_REPULSION_FORCE = 0.8;      // fuerza máxima de repulsión
const MOUSE_RETURN_SPEED = 0.1;         // velocidad de retorno a posición original (lerp factor)
const MOUSE_ENABLED = true;             // activar/desactivar interacción
```

### 2.4 Settings del Placeholder (Cubo)

```typescript
// --- Cubo placeholder ---
const CUBE_SIZE = 3;                    // tamaño del cubo
const CUBE_SUBDIVISIONS = 40;           // segmentos por cara (cuanto más alto, más puntos)
const CUBE_POSITION: [number, number, number] = [0, 0, 0];
```

---

## 3. Paradigma de Integración: React Three Fiber (R3F)

### 3.1 Regla Obligatoria

Está **prohibido** usar la inicialización "vanilla" de Three.js:
- No crear escena, cámara ni renderer manualmente dentro de un `useEffect`.
- No montar en un `div` vía `document.getElementById` o `ref.current`.

Se debe usar exclusivamente **`@react-three/fiber`** y **`@react-three/drei`**. La geometría de puntos debe implementarse como:

```jsx
<points>
  <bufferGeometry>
    <bufferAttribute attach="attributes-position" ... />
  </bufferGeometry>
  <pointsMaterial ... />
</points>
```

### 3.2 Justificación

- **Prevención de Memory Leaks:** En Next.js App Router, los componentes se montan y desmontan. R3F gestiona automáticamente el ciclo de vida del WebGL context, la geometría y los materiales, liberando la memoria de la GPU al navegar.
- **Declarativo vs Imperativo:** R3F permite que el código 3D sea declarativo y reactivo, integrándose con el ecosistema de React.

---

## 4. Estructura DOM para Scroll y Canvas

### 4.1 Layout Obligatorio

```
<div className="scroll-wrapper" style={{ height: '400vh' }}>
  {/* El Canvas está FUERA del flujo de scroll, fixed */}
</div>

<Canvas
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 0
  }}
>
  {/* Escena 3D */}
</Canvas>

<div className="content-overlay" style={{ position: 'relative', zIndex: 1 }}>
  {/* Texto, secciones, etc. */}
</div>
```

### 4.2 Reglas

- El contenedor principal (`scroll-wrapper`) debe tener una altura fija mayor al viewport. El valor exacto debe ser configurable (ver §2.1), pero como orientación: `300vh` a `600vh`, ajustable según cantidad de tramos.
- El `<Canvas>` debe tener `position: fixed`, `top: 0`, `left: 0`, `width: 100vw`, `height: 100vh`.
- El `z-index` del Canvas debe ser inferior al contenido de texto (overlay).

### 4.3 Justificación

Este es el patrón estándar de la industria para experiencias "scrollytelling". Fijar el canvas y scrollear un contenedor transparente por encima garantiza que el canvas siempre ocupe el 100% de la ventana sin importar el tamaño del contenido, y evita el colapso del layout.

---

## 5. Arquitectura de Estados por Modelo

### 5.1 Principio: Cada Modelo es una Unidad Autónoma

Cada modelo 3D define su propia cantidad de puntos (N). No hay restricción de N uniforme entre modelos distintos.

```
Modelo X:
  ├── Nₓ: cantidad de puntos propia del modelo
  ├── Estado Disperso: array de Nₓ × 3 floats (posiciones aleatoriamente desplazadas)
  ├── Estado Ensamblado: array de Nₓ × 3 floats (posiciones originales de sus vértices)
  └── Pipeline interno: lerp(Estado Disperso, Estado Ensamblado, progreso)
```

### 5.2 Obtención de Puntos de un Modelo Real

Cuando se reemplace el placeholder (cubo) por un modelo real:

1. Cargar la geometría del modelo (GLTF/OBJ).
2. Si el modelo tiene menos vértices que el N deseado, usar `THREE.MeshSurfaceSampler` (de Three.js examples) para samplear puntos adicionales sobre la superficie.
3. Si tiene más, submuestrear aleatoriamente hasta alcanzar N.
4. Generar el array de "Estado Disperso" aplicando la función de dispersión (ver §6) sobre el array de "Estado Ensamblado".

### 5.3 Regla Crítica: N Constante Dentro de un Pipeline

Dentro de un mismo pipeline (grilla → estado disperso → modelo ensamblado), **todos los arrays de posiciones deben tener exactamente la misma longitud N**. Nunca interpolar arrays de distinta longitud.

---

## 6. Función de Dispersión — El Estado Disperso

### 6.1 Definición

El "estado disperso" de cualquier modelo (incluido el plano inicial) se genera aplicando un offset aleatorio a cada punto de su estado ensamblado:

```typescript
function generarEstadoDisperso(
  posicionesEnsambladas: Float32Array, // longitud = N × 3
  radioDispersion: number = DISPERSION_RADIUS  // configurable, ver §2.2
): Float32Array {
  const disperso = new Float32Array(posicionesEnsambladas.length);

  for (let i = 0; i < posicionesEnsambladas.length; i += 3) {
    const ox = (Math.random() - 0.5) * radioDispersion;
    const oy = (Math.random() - 0.5) * radioDispersion;
    const oz = (Math.random() - 0.5) * radioDispersion;

    disperso[i]     = posicionesEnsambladas[i]     + ox;
    disperso[i + 1] = posicionesEnsambladas[i + 1] + oy;
    disperso[i + 2] = posicionesEnsambladas[i + 2] + oz;
  }

  return disperso;
}
```

### 6.2 Propiedades

- **Determinística por sesión:** Los offsets aleatorios se generan una sola vez al montar el componente y se almacenan en un `useRef`. No regenerar en cada frame.
- **Coherencia visual:** El radio de dispersión debe ser proporcional al tamaño del modelo. Un modelo pequeño necesita menos dispersión que uno grande. Usar `DISPERSION_RADIUS` configurable.
- **Reutilizable:** La misma función se aplica al plano inicial, al cubo placeholder, y a cualquier modelo futuro.

---

## 7. Pipeline de Scroll y Crossfade

### 7.1 Estados Globales de la Experiencia

| Tramo | Scroll (0–1 global) | Estado Visual | Implementación Técnica |
|---|---|---|---|
| 0 | `PLANO_STATIC` | Plano alineado | Grilla 2D estática |
| 1 | `PLANO_DISPERSION` | Plano → Plano disperso | Lerp grilla→disperso del plano + rotación del grupo |
| 2 | `PLANO_DISPERSO` | Plano disperso girando | Estado disperso del plano, rotación continua |
| 3 | `CROSSFADE_TO_A` | Crossfade plano disperso → Modelo A disperso | Fade-out plano (opacity 1→0) + fade-in Modelo A disperso (opacity 0→1). Ambos giran a misma velocidad. |
| 4 | `A_DISPERSO` | Modelo A disperso girando | Estado disperso del Modelo A, rotación continua |
| 5 | `A_ENSAMBLAJE` | Modelo A disperso → Modelo A ensamblado | Lerp disperso→ensamblado del Modelo A |
| 6 | `A_CONTEMPLACION` | Modelo A ensamblado girando | Modelo ensamblado, rotación suave |
| 7 | `A_DISPERSION_INV` | Modelo A ensamblado → disperso | Lerp inverso ensamblado→disperso (preparando siguiente modelo) |
| 8 | `CROSSFADE_TO_B` | Crossfade Modelo A disperso → Modelo B disperso | Fade-out Modelo A + fade-in Modelo B. Ambos dispersos, misma rotación. |

> **Nota:** Los rangos de scroll son orientativos y ajustables vía `SCROLL_PHASES` (ver §2.2). Lo importante es la secuencia de estados.

### 7.2 Crossfade por Opacidad

El crossfade entre dos modelos se resuelve con **dos instancias independientes de `<points>`** superpuestas:

```jsx
// Modelo saliente (ej. plano disperso)
<points>
  <pointsMaterial transparent opacity={opacityOut} size={POINT_SIZE} ... />
  {/* geometría del modelo saliente */}
</points>

// Modelo entrante (ej. modelo A disperso)
<points>
  <pointsMaterial transparent opacity={opacityIn} size={POINT_SIZE} ... />
  {/* geometría del modelo entrante */}
</points>
```

**Reglas del crossfade:**
- Ambos sistemas de puntos deben estar en su **estado disperso** (no ensamblado).
- Ambos deben rotar a la **misma velocidad angular** (mismo eje, misma velocidad = `ROTATION_SPEED_DISPERSO`).
- La transición de opacidad debe ser suave: `opacityOut = 1 - progress`, `opacityIn = progress`.
- Durante el crossfade, ninguno de los dos debe estar en transición de dispersión o ensamblaje.

### 7.3 Rotación Durante el Estado Disperso

Durante las fases de "disperso girando", el grupo `<group>` que contiene los `<points>` debe rotar continuamente:

```typescript
useFrame((_, delta) => {
  if (estadoActual === 'disperso') {
    groupRef.current.rotation.y += delta * ROTATION_SPEED_DISPERSO;
    groupRef.current.rotation.x += delta * ROTATION_SPEED_DISPERSO * ROTATION_TILT_X;
  }
});
```

La rotación debe ser **suave y continua**, no brusca. Velocidad configurable vía `ROTATION_SPEED_DISPERSO`.

### 7.4 Reversibilidad

Todo el pipeline debe ser **totalmente reversible** al scrollear hacia arriba:
- Los lerps se invierten automáticamente porque dependen del progreso de scroll.
- Los crossfade de opacidad se invierten (`opacityOut = progress`, `opacityIn = 1 - progress`).
- La rotación no se resetea; continúa desde su ángulo actual.

---

## 8. Gestión del Estado del Scroll (Prevención de Re-renders)

### 8.1 Regla Obligatoria

El progreso del scroll **nunca** debe almacenarse en un `useState` si se va a actualizar en cada frame o evento de scroll.

**Correcto:**
```typescript
const scrollProgress = useRef(0);

useEffect(() => {
  const handleScroll = () => {
    const total = document.body.scrollHeight - window.innerHeight;
    scrollProgress.current = window.scrollY / total;
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

useFrame(() => {
  // Leer scrollProgress.current sin causar re-render
  const progress = scrollProgress.current;
  // Interpolar posiciones...
});
```

**Prohibido:**
```typescript
const [scrollProgress, setScrollProgress] = useState(0); // ❌ Destruye el rendimiento
```

### 8.2 Justificación

Si se usa `useState` para el scroll, React intentará re-renderizar todo el árbol de componentes 60 veces por segundo. Esto destruye el rendimiento de la aplicación. Usar `useRef` permite mutar el valor sin disparar re-renders de React, dejando que el loop de WebGL (`useFrame`) maneje la animación de forma nativa y fluida.

---

## 9. Optimización de la Interacción del Mouse (Anti-Raycasting)

### 9.1 Regla Obligatoria

Para la interacción del mouse, **no usar `THREE.Raycaster`** contra el objeto `<points>`.

**Correcto:** Implementar un cálculo de distancia en **espacio de pantalla 2D**:

```typescript
function aplicarRepulsionMouse(
  positions: Float32Array,
  mouse: { x: number, y: number },        // coordenadas normalizadas (-1 a 1)
  camera: THREE.Camera,
  umbral: number = MOUSE_THRESHOLD_NDC,    // configurable, ver §2.3
  fuerza: number = MOUSE_REPULSION_FORCE   // configurable, ver §2.3
) {
  const tempVector = new THREE.Vector3();

  for (let i = 0; i < positions.length; i += 3) {
    tempVector.set(positions[i], positions[i + 1], positions[i + 2]);
    tempVector.project(camera);

    const dist = Math.sqrt(
      (tempVector.x - mouse.x) ** 2 + 
      (tempVector.y - mouse.y) ** 2
    );

    if (dist < umbral) {
      const factor = (1 - dist / umbral) * fuerza;
      // Aplicar offset en espacio mundo
      positions[i]     += (Math.random() - 0.5) * factor;
      positions[i + 1] += (Math.random() - 0.5) * factor;
      positions[i + 2] += (Math.random() - 0.5) * factor;
    }
  }
}
```

### 9.2 Justificación

- **Rendimiento Crítico (60fps):** Hacer raycasting contra miles de partículas (`THREE.Points`) en cada evento de `mousemove` o en cada frame es computacionalmente caro y causará caídas de FPS severas, especialmente en móviles.
- **Simplicidad Matemática:** La proyección 2D es matemáticamente trivial, requiere cero cálculos de intersección de rayos con bounding boxes de partículas y logra exactamente el mismo efecto visual de "material vivo" de forma infinitamente más ligera.

---

## 10. Reglas de Performance

### 10.1 Cantidad de Puntos (N)

- **Desktop:** `POINT_COUNT_DESKTOP` (ver §2.1).
- **Mobile:** `POINT_COUNT_MOBILE` (detectar con `window.innerWidth < 768`).
- Nunca hardcodear N sin comentario sobre performance.

### 10.2 Mutación de Buffers (No Recrear Geometría)

Las interpolaciones deben **mutar el buffer de posiciones existente**, nunca recrear la geometría:

```typescript
// CORRECTO
useFrame(() => {
  for (let i = 0; i < positions.length; i++) {
    positions[i] = lerp(positionsA[i], positionsB[i], progress);
  }
  geometry.attributes.position.needsUpdate = true;
});

// PROHIBIDO
useFrame(() => {
  const newGeo = new THREE.BufferGeometry(); // ❌ Memory leak + garbage collection spikes
  // ...
});
```

### 10.3 Materiales

- Usar `PointsMaterial` con `sizeAttenuation: POINT_SIZE_ATTENUATION` (ver §2.1).
- Para el crossfade, usar `transparent: POINT_TRANSPARENT` y controlar `opacity`.
- Evitar `depthWrite: true` cuando se usan materiales transparentes superpuestos. Usar `POINT_DEPTH_WRITE` configurable (ver §2.1).

---

## 11. Instrucciones de Formato de Salida para el LLM

Al generar el código para las Fases 1 y 2, el LLM debe entregar el componente principal completo y autocontenido en un **único bloque de código** (ej. `HeroScene.tsx`). Este archivo debe incluir, **en este orden exacto**:

1. **Sección de Settings** (ver §2): todas las constantes configurables al inicio del archivo.
2. **Funciones auxiliares:**
   - Generar la grilla plana.
   - Generar el estado disperso (función de dispersión).
   - Generar el placeholder de cubo con alta subdivisión.
   - Calcular el progreso de scroll por tramo.
   - Aplicar repulsión del mouse.
3. **Componente interno de R3F** que usa `useFrame` para la animación.
4. **Componente de React** que envuelve el `<Canvas>`.

**Regla de no-hardcodeo:** Si el LLM necesita un valor numérico (posición, tamaño, velocidad, color, umbral), debe buscarlo en la sección de Settings. Nunca escribir un número mágico dentro de una función.

**Por qué es conveniente:** Los LLM tienden a fragmentar el código en 5 o 6 archivos pequeños desde el primer prompt, lo que obliga al desarrollador a crear la estructura de carpetas y lidiar con errores de importación antes de ver si la lógica funciona. Recibir un archivo "monolítico" pero bien estructurado permite copiar, pegar y ver el resultado visual en 2 minutos. Una vez validado que la lógica de interpolación funciona, se puede pedir al LLM que lo modularice en un segundo prompt.

---

## 12. Checklist Técnico del MVP

- [ ] Canvas fijo con `position: fixed`, `z-index` inferior al contenido.
- [ ] Scroll wrapper con altura suficiente para generar espacio de scroll.
- [ ] Progreso de scroll almacenado en `useRef`, nunca en `useState`.
- [ ] Grilla plana generada como array de posiciones `Float32Array`.
- [ ] Función de dispersión reutilizable aplicada a la grilla y al modelo placeholder.
- [ ] Interpolación de posiciones (lerp) dentro de `useFrame`.
- [ ] Rotación continua del grupo durante fases de estado disperso.
- [ ] Crossfade por opacidad entre dos sistemas de `<points>` superpuestos.
- [ ] Interacción de mouse por proyección 2D (sin `Raycaster`).
- [ ] Buffer de posiciones mutado in-place, geometría nunca recreada en `useFrame`.
- [ ] N configurable y consciente de mobile.
- [ ] **Todas las constantes numéricas extraídas a una sección de Settings al inicio del archivo.**
- [ ] Código autocontenido en un único archivo para iteración rápida.

---

*Documento versión 1.1 — Brief Técnico*
*Alineado con: Plan General del Proyecto v1.1*
