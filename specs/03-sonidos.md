# SPEC 03 — Sonidos de rebote y rotura de bloques

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-10-27
> **Objective:** Reproducir `ball-bounce.mp3` cuando la bola rebota en paredes o pala, y `break-sound.mp3` cuando la bola rompe un bloque.

---

## Scope

**In:**

- Reproducir `assets/sounds/ball-bounce.mp3` al rebotar la bola en las paredes (izquierda, derecha, arriba) y en la pala.
- Reproducir `assets/sounds/break-sound.mp3` en el instante en que un bloque es golpeado (mismo momento en que se suma la puntuación y se activa su explosión, SPEC 02), no al terminar la animación.
- Ambos sonidos se precargan al iniciar el juego (junto a `loadSpritesheet`) y se reproducen clonando el `Audio` precargado, permitiendo instancias superpuestas si varios eventos ocurren casi al mismo tiempo (p. ej. romper dos bloques en frames consecutivos).
- Volumen fijo, sin control de usuario ni mute.
- Se asume que para cuando se dispara cualquier sonido ya hubo interacción del usuario (pantalla `start` requiere input para comenzar), por lo que no se añade manejo especial de desbloqueo de audio.

**Out of scope (for future specs):**

- Control de volumen o mute.
- Música de fondo.
- Sonidos para otros eventos (perder vida, game over, victoria, pausa).
- Manejo explícito de políticas de autoplay más allá de la interacción ya existente.

---

## Data model

No introduce nuevas estructuras de datos persistentes. Se añaden dos referencias `Audio` precargadas en `game.js` (fuera de `state`), por ejemplo:

```js
const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break: new Audio('assets/sounds/break-sound.mp3'),
};

function playSound(audio) {
  audio.cloneNode().play();
}
```

---

## Implementation plan

1. Declarar el objeto `sounds` con los dos `Audio` precargados y la función auxiliar `playSound(audio)` que clona y reproduce. Prueba manual: el juego sigue funcionando igual que antes, sin cambios visibles ni errores de consola.
2. Llamar a `playSound(sounds.bounce)` en los puntos donde la bola rebota en paredes (izquierda, derecha, arriba) y en la pala. Prueba manual: rebotar en cada pared y en la pala reproduce el sonido de rebote.
3. Llamar a `playSound(sounds.break)` en `bounceOffBlocks()`, en el mismo punto donde se marca `block.alive = false` y se suma la puntuación. Prueba manual: romper un bloque reproduce el sonido de rotura en el instante del golpe, no al terminar la explosión.
4. Romper varios bloques en rápida sucesión (o rebotar varias veces seguidas) y verificar que los sonidos se superponen sin cortarse entre sí. Prueba manual: los sonidos solapados se escuchan ambos, no se interrumpe el anterior.

---

## Acceptance criteria

- [x] Rebotar en la pared izquierda, derecha, superior o en la pala reproduce `ball-bounce.mp3`.
- [x] Romper un bloque reproduce `break-sound.mp3` en el instante del golpe (mismo frame en que se suma la puntuación), no al terminar la animación de explosión.
- [x] Romper dos o más bloques en frames consecutivos reproduce instancias superpuestas de `break-sound.mp3`, sin cortar sonidos anteriores.
- [x] No hay errores de consola relacionados con carga o reproducción de audio en una sesión normal de juego.

---

## Decisions

- **Sí:** precargar los `Audio` una vez al cargar el script y clonar (`cloneNode().play()`) en cada reproducción. Permite solapamiento sin volver a descargar el archivo en cada hit.
- **No:** crear un `new Audio(ruta)` nuevo en cada evento. Más simple pero repite la carga del recurso innecesariamente.
- **Sí:** sonido de bloque en el instante del golpe, igual que el scoring (consistente con SPEC 02, que tampoco espera a que termine la animación).
- **No:** control de volumen/mute en este spec. Fuera de alcance mínimo; se puede añadir después si se necesita.
- **No:** manejo explícito de desbloqueo de audio (autoplay policy). El juego ya requiere una interacción de teclado para salir de la pantalla `start`, lo que cuenta como gesto de usuario válido para el navegador.

---

## What is **not** in this spec

- Control de volumen o mute.
- Música de fondo.
- Sonidos para perder vida, game over, victoria o pausa.
- Manejo adicional de políticas de autoplay.

Cada uno de estos, si se implementa, irá en su propio spec.
