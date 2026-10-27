# SPEC 01 — MVP del juego Arkanoid

> **Status:** Implemented
> **Depends on:** (ninguno)
> **Date:** 2026-10-18
> **Objective:** Jugar una partida completa de Arkanoid en el navegador: mover la pala con el teclado, romper un único nivel de bloques, perder vidas, pausar, y ver pantallas de victoria/derrota con el high score guardado en localStorage.

---

## Scope

**In:**

- `index.html` con un `<canvas>` fijo de 480x640px y carga de `assets/spritesheet.js`.
- `game.js` único con todo el bucle de juego (movimiento, colisiones, puntuación, estados).
- Pala controlada con flechas izquierda/derecha del teclado.
- Bola con física simple: rebote en paredes, pala y bloques; el ángulo de rebote en la pala depende del punto de impacto.
- Un único nivel fijo de bloques, usando los 7 colores del spritesheet (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`), cada color con una puntuación distinta y 1 golpe para romperse.
- 3 vidas. Perder la bola resta una vida; al llegar a 0, pantalla de Game Over.
- Pantalla de victoria al romper todos los bloques del nivel.
- Ambas pantallas (victoria/derrota) ofrecen reiniciar la partida.
- Pausa con tecla `Esc` o `P`, con overlay simple indicando "Pausado".
- High score único persistido en `localStorage`, mostrado en pantalla durante la partida y actualizado al terminar si se supera.

**Out of scope (for future specs):**

- Sonido (`assets/sounds/*.mp3`).
- Animación de explosión al romper bloques (`EXPLOSION_FRAMES`).
- Múltiples niveles o niveles generados aleatoriamente.
- Bloques con resistencia variable (más de 1 golpe).
- Power-ups.
- Controles por ratón o táctiles.
- Canvas responsive/adaptable a la ventana.
- Tabla de múltiples high scores (solo se guarda el máximo).

---

## Data model

```js
// game.js — estado del juego
const state = {
  screen: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  highScore: 0, // leído de localStorage al cargar
  paddle: { x: 200, y: 600, width: 80, height: 16, speed: 6 },
  ball: { x: 240, y: 300, radius: 8, dx: 3, dy: -3 },
  blocks: [/* { x, y, width, height, color, alive: true } */],
};
```

Conventions:

- Coordenadas: origen arriba-izquierda, igual que el canvas.
- Velocidades en píxeles/frame (bucle con `requestAnimationFrame`).
- Clave de `localStorage`: `arkanoid:highscore:v1` (string numérica).
- Puntos por color (de menor a mayor resistencia visual del spritesheet): `gray=10, red=20, yellow=30, cyan=40, magenta=50, hotpink=60, green=70`.

---

## Implementation plan

1. Crear `index.html` con `<canvas id="game" width="480" height="640">`, carga de `assets/spritesheet.js` y `game.js`. Prueba manual: abrir el archivo en el navegador y ver el canvas en blanco sin errores de consola.
2. En `game.js`, llamar a `loadSpritesheet` y dibujar un frame estático con la pala y la bola en sus posiciones iniciales. Prueba manual: recargar y ver pala y bola dibujadas.
3. Implementar movimiento de la pala con flechas izquierda/derecha y el bucle `requestAnimationFrame`. Prueba manual: la pala se mueve y no sale del canvas.
4. Implementar movimiento de la bola y rebote en paredes (izquierda, derecha, arriba) y en la pala. Prueba manual: la bola rebota indefinidamente si no hay bloques.
5. Generar el nivel fijo de bloques (grid con los 7 colores) y dibujarlos con `drawSprite`. Prueba manual: se ven todas las filas de bloques.
6. Implementar colisión bola-bloque: al golpear, el bloque desaparece, se suma su puntuación y la bola rebota. Prueba manual: romper bloques suma puntos visibles en pantalla.
7. Implementar pérdida de vida cuando la bola cae por debajo del canvas, reposicionando pala y bola si quedan vidas. Prueba manual: perder la bola resta una vida y se reinicia la posición.
8. Implementar pantalla de Game Over al llegar a 0 vidas, con opción de reiniciar (tecla o botón). Prueba manual: perder las 3 vidas muestra Game Over y reinicia correctamente.
9. Implementar pantalla de victoria al romper todos los bloques, con opción de reiniciar. Prueba manual: romper todos los bloques muestra pantalla de victoria.
10. Implementar pausa con `Esc`/`P`, deteniendo el bucle y mostrando overlay; reanudar con la misma tecla. Prueba manual: pausar congela el juego y reanudar continúa desde el mismo punto.
11. Implementar persistencia del high score en `localStorage`: leer al cargar, mostrar en pantalla, y actualizar al terminar la partida si `score > highScore`. Prueba manual: superar el high score y recargar la página conserva el nuevo valor.

---

## Acceptance criteria

- [x] `index.html` carga sin errores en la consola del navegador.
- [x] Las flechas izquierda/derecha mueven la pala sin que salga del canvas.
- [x] La bola rebota correctamente en paredes y pala.
- [x] Romper un bloque lo elimina y suma los puntos correspondientes a su color.
- [x] Perder la bola resta exactamente una vida.
- [x] Al llegar a 0 vidas se muestra la pantalla de Game Over.
- [x] Al romper todos los bloques se muestra la pantalla de victoria.
- [x] Pulsar `Esc` o `P` durante la partida pausa el juego y muestra un overlay; volver a pulsarla reanuda.
- [x] Al terminar una partida con puntuación mayor al high score guardado, el nuevo valor se persiste en `localStorage` bajo la clave `arkanoid:highscore:v1`.
- [x] Recargar la página después de superar el high score muestra el valor actualizado.
- [x] Desde la pantalla de Game Over o de victoria es posible reiniciar la partida.

---

## Decisions

- **Sí:** un único archivo `game.js` junto a `index.html`. Es un MVP simple, no requiere módulos separados.
- **No:** módulos ES por entidad (`paddle.js`, `ball.js`...). Overengineering para el alcance actual.
- **Sí:** canvas fijo de 480x640px. Simplifica cálculos de colisión; responsive queda para otro spec.
- **Sí:** localStorage con clave versionada (`arkanoid:highscore:v1`). Permite cambiar el formato más adelante sin romper partidas guardadas.
- **No:** sonido en este MVP. Los assets ya existen pero se añaden en un spec posterior centrado en audio.
- **No:** animación de explosión (`EXPLOSION_FRAMES`). El bloque desaparece al instante para simplificar el primer MVP jugable.
- **Sí:** 7 colores de bloques con puntuación distinta, 1 golpe cada uno. Usa el spritesheet existente sin añadir lógica de resistencia.
- **Sí:** 3 vidas fijas, sin pantalla de configuración. Mantiene el alcance mínimo.
- **Sí:** un único nivel fijo. Varios niveles o generación aleatoria quedan para specs futuros.

---

## What is **not** in this spec

- Sonido (`assets/sounds/*.mp3`).
- Animación de explosión al romper bloques.
- Múltiples niveles o niveles generados aleatoriamente.
- Bloques con más de 1 golpe de resistencia.
- Power-ups.
- Controles por ratón o táctiles.
- Canvas responsive.
- Tabla de múltiples high scores.

Cada uno de estos, si se implementa, irá en su propio spec.
