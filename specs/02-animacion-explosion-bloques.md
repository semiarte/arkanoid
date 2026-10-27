# SPEC 02 — Animación de explosión al romper bloques

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-10-27
> **Objective:** Al romper un bloque se reproduce su animación de explosión (`EXPLOSION_FRAMES`) en el lugar del bloque antes de que desaparezca visualmente.

---

## Scope

**In:**

- Al golpear un bloque, se registra una explosión activa (color, posición, tiempo de inicio) en lugar de hacer que el bloque desaparezca de inmediato visualmente.
- La explosión se dibuja con `drawFrame` usando las 4 frames de `EXPLOSION_FRAMES[color]`, calculando la frame actual a partir de `performance.now()` y `EXPLOSION_DURATION` (150ms por frame, 600ms en total).
- Puede haber varias explosiones animándose en paralelo (lista de explosiones activas).
- La puntuación se suma en el momento del golpe, igual que ahora (`state.score += BLOCK_POINTS[block.color]`), sin esperar a que termine la animación.
- El bloque deja de participar en colisiones (`alive = false`) en el momento del golpe, igual que ahora; solo cambia qué se dibuja mientras la explosión está en curso.
- Cuando se rompe el último bloque del nivel, el juego entra en un estado intermedio `exploding`: la bola y la pala se congelan (sin física ni input de movimiento) mientras se termina de reproducir la última explosión. Al completarse, se transiciona a `win`.
- Si se rompe el último bloque y aún hay otras explosiones en curso de bloques rotos justo antes, se espera a que termine la explosión que más tarde finalice.

**Out of scope (for future specs):**

- Sonido al romper bloques (`assets/sounds/*.mp3`).
- Partículas o efectos adicionales no cubiertos por `EXPLOSION_FRAMES`.
- Animación o efecto especial distinto para la pérdida de vida o el Game Over.
- Cambiar el número de golpes necesarios para romper un bloque (sigue siendo 1).

---

## Data model

```js
// game.js — nuevo estado dentro de `state`
state.explosions = [
  // { x, y, width, height, color, startTime }
];

// nuevo screen posible
state.screen = 'exploding'; // añadido a 'start' | 'playing' | 'paused' | 'gameover' | 'win'
```

Conventions:

- `startTime` se guarda con `performance.now()` en el momento del golpe.
- La frame a dibujar se calcula como `Math.floor((performance.now() - startTime) / EXPLOSION_DURATION)`, en rango `0..3`.
- Una explosión se elimina de `state.explosions` cuando su frame calculado supera 3 (animación completa, 600ms).
- `state.screen = 'exploding'` solo se usa para el caso del último bloque; las explosiones normales durante `'playing'` no cambian el `screen`.

---

## Implementation plan

1. Añadir `state.explosions = []` al estado inicial y a `createBlocks`/`restartGame` donde se resetea el estado. Prueba manual: el juego sigue funcionando igual que antes, sin cambios visibles.
2. En `bounceOffBlocks()`, al marcar `block.alive = false`, además de sumar la puntuación, empujar una explosión a `state.explosions` con `{ x: block.x, y: block.y, width: block.width, height: block.height, color: block.color, startTime: performance.now() }`. Prueba manual: romper un bloque no cambia aún lo que se ve (todavía no se dibuja), pero no hay errores de consola.
3. En `draw()`, tras dibujar los bloques vivos, iterar `state.explosions` y dibujar la frame correspondiente con `drawFrame(ctx, frame, x, y, width, height)` usando `EXPLOSION_FRAMES[color][frame]`. Prueba manual: romper un bloque muestra la animación de explosión de su color en su lugar.
4. En `update()` (o una función nueva `updateExplosions()` llamada desde `update()`), eliminar de `state.explosions` las que ya completaron sus 4 frames (600ms). Prueba manual: la animación desaparece sola tras 600ms sin dejar rastro.
5. Detectar en `bounceOffBlocks()` cuándo el bloque roto es el último (`state.blocks.every(b => !b.alive)`) y, en ese caso, cambiar `state.screen` a `'exploding'` en vez de a `'win'` directamente. Prueba manual: al romper el último bloque la bola y la pala se congelan (verificar que `updateBall`/movimiento de pala no se ejecutan en `screen === 'exploding'`).
6. En `update()`, cuando `state.screen === 'exploding'` y `state.explosions.length === 0` (ya no quedan explosiones activas), transicionar a `state.screen = 'win'`. Prueba manual: tras romper el último bloque, pasan ~600ms de animación congelada y luego aparece la pantalla de victoria.

---

## Acceptance criteria

- [x] Al romper un bloque, se reproduce en su lugar la animación de 4 frames de `EXPLOSION_FRAMES` correspondiente a su color.
- [x] La animación dura aproximadamente 600ms (150ms × 4 frames) y luego desaparece sin dejar el bloque dibujado ni la explosión congelada.
- [x] Romper varios bloques en rápida sucesión muestra varias animaciones de explosión simultáneas e independientes, cada una con el color correcto.
- [x] La puntuación se suma en el instante del golpe, no al terminar la animación.
- [x] Al romper el último bloque del nivel, la bola y la pala dejan de moverse mientras se completa la última animación de explosión.
- [x] La pantalla de victoria aparece solo después de que termine la animación de explosión del último bloque, no en el mismo frame del golpe.
- [x] Reiniciar la partida (`restartGame`) deja `state.explosions` vacío y no hay animaciones "fantasma" de la partida anterior.

---

## Decisions

- **Sí:** timestamp real con `performance.now()` por explosión en lugar de contar frames de juego. Es preciso independientemente del framerate real del navegador.
- **No:** contar frames de `requestAnimationFrame` asumiendo 60fps. Menos preciso y ya existe `performance.now()` disponible sin dependencias nuevas.
- **Sí:** lista de explosiones activas (`state.explosions`) en lugar de un único slot. Permite animaciones simultáneas al romper varios bloques seguidos, que es el caso común jugando.
- **Sí:** sumar la puntuación en el golpe, no al terminar la animación. Mantiene el comportamiento actual y evita acoplar scoring a timing visual.
- **Sí:** estado intermedio `'exploding'` antes de `'win'`. Da tiempo a que se vea la última explosión sin cortarla, mejora la sensación de cierre del nivel.
- **No:** congelar también el loop de dibujo durante `'exploding'`. Solo se congela la física/input; el dibujo sigue activo para que la animación se vea.

---

## What is **not** in this spec

- Sonido al romper bloques.
- Efectos de partículas adicionales fuera de `EXPLOSION_FRAMES`.
- Animaciones para pérdida de vida o Game Over.
- Cambios a la resistencia de los bloques (golpes necesarios para romperse).

Cada uno de estos, si se implementa, irá en su propio spec.
