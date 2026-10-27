# SPEC 04 — Niveles progresivos

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-27
> **Objective:** Al romper todos los bloques de un nivel, el juego avanza al siguiente nivel (de 3 predefinidos) conservando vidas y puntuación, en vez de terminar la partida.

---

## Scope

**In:**

- 3 niveles fijos predefinidos, cada uno con su propio layout de bloques (grid de colores/posiciones distinto). La velocidad de la bola y el tamaño de la pala son iguales en los 3 niveles.
- Tras completar el estado `exploding` del último bloque de un nivel (SPEC 02), el juego entra en un nuevo estado `levelcomplete` mostrando un overlay "Nivel X completado" en vez de ir directo a `win` (salvo que sea el último nivel).
- Desde `levelcomplete`, una tecla (la misma usada para iniciar/reiniciar partida) avanza al siguiente nivel: se cargan los bloques del nuevo nivel y se reposicionan bola y pala a sus posiciones iniciales, sin tocar vidas ni puntuación.
- Al completar el nivel 3 (último), en vez de `levelcomplete` se transiciona directamente a la pantalla `win` final, igual que el comportamiento actual.
- El HUD durante `playing` muestra el nivel actual (p. ej. "Nivel 1/3") junto al score y las vidas.
- `restartGame` (desde `gameover` o `win`) reinicia siempre al nivel 1 con vidas y score en sus valores iniciales, igual que ahora.

**Out of scope (for future specs):**

- Generación procedural o aleatoria de niveles.
- Aumento de velocidad de la bola u otra dificultad progresiva entre niveles.
- Reinicio de vidas por nivel (las vidas se conservan, no se resetean).
- Más de 3 niveles o selección manual de nivel.
- Guardar progreso de nivel entre sesiones (si se pierde la pestaña, se empieza desde el nivel 1 en la siguiente partida).

---

## Data model

```js
// game.js — estado del juego (extiende el de SPEC 01/02)
state.screen = 'start'; // 'start' | 'playing' | 'paused' | 'exploding' | 'levelcomplete' | 'gameover' | 'win'
state.level = 1; // 1 | 2 | 3

// nuevos layouts de nivel, uno por índice (0 = nivel 1, etc.)
const LEVELS = [
  /* nivel 1: array de filas/colores, igual formato que el nivel único actual */
  /* nivel 2: ... */
  /* nivel 3: ... */
];
```

Conventions:

- `state.level` es 1-indexado para mostrar en el HUD ("Nivel 1/3"); se usa `LEVELS[state.level - 1]` para indexar el array de layouts.
- `createBlocks()` recibe el layout de `LEVELS[state.level - 1]` en vez de un único layout fijo.
- Al avanzar de nivel, se resetean `state.ball` y `state.paddle` a sus posiciones/velocidad iniciales (igual que tras perder una vida), y `state.explosions = []`.

---

## Implementation plan

1. Extraer el layout de bloques actual de SPEC 01 a `LEVELS[0]` y definir `LEVELS[1]` y `LEVELS[2]` como dos layouts nuevos (variando posiciones/colores). Añadir `state.level = 1`. Prueba manual: el juego sigue mostrando el nivel 1 igual que antes, sin cambios visibles.
2. Modificar `createBlocks()` para que use `LEVELS[state.level - 1]` en vez de un layout fijo embebido. Prueba manual: el nivel 1 se sigue viendo igual; no hay errores de consola.
3. Mostrar "Nivel X/3" en el HUD junto al score/vidas durante `playing`. Prueba manual: se ve el indicador de nivel correcto durante la partida.
4. En la transición que hoy pasa de `exploding` a `win` (SPEC 02, paso 6), cambiar la lógica: si `state.level < 3`, transicionar a `state.screen = 'levelcomplete'`; si `state.level === 3`, transicionar a `'win'` como hasta ahora. Prueba manual: romper todos los bloques del nivel 1 muestra el overlay de nivel completado en vez de la pantalla de victoria.
5. Dibujar el overlay de `levelcomplete` ("Nivel X completado", instrucción de tecla para continuar) y manejar el input de esa tecla para: incrementar `state.level`, llamar a `createBlocks()` con el nuevo nivel, resetear posición/velocidad de bola y pala, vaciar `state.explosions`, y pasar `state.screen = 'playing'`. Prueba manual: pulsar la tecla en el overlay carga el nivel 2 con los bloques nuevos, bola y pala en posición inicial, y las vidas/score previos intactos.
6. Verificar el ciclo completo: romper nivel 1 → overlay → nivel 2 → romper nivel 2 → overlay → nivel 3 → romper nivel 3 → pantalla `win` final. Prueba manual: jugar la partida completa de principio a fin sin perder vidas y confirmar que llega a `win` tras el nivel 3, con el score acumulado de los 3 niveles.
7. Verificar que `restartGame` reinicia `state.level = 1` junto con vidas y score. Prueba manual: tras llegar a `win` o `gameover` en cualquier nivel, reiniciar vuelve siempre al nivel 1.

---

## Acceptance criteria

- [x] Existen 3 niveles con layouts de bloques distintos entre sí.
- [x] Al romper todos los bloques del nivel 1 o 2, se muestra un overlay "Nivel X completado" en vez de la pantalla de victoria.
- [x] Pulsar la tecla de continuar en `levelcomplete` carga el siguiente nivel con bola y pala reposicionadas, conservando vidas y puntuación acumuladas.
- [x] El HUD muestra el nivel actual durante la partida.
- [x] Al romper todos los bloques del nivel 3 (último), se muestra la pantalla de victoria final, no un overlay de nivel completado.
- [x] Perder todas las vidas en cualquier nivel muestra Game Over, igual que antes (el nivel no afecta esta condición).
- [x] Reiniciar la partida desde Game Over o victoria vuelve siempre al nivel 1 con vidas y score en sus valores iniciales.
- [x] El high score se sigue actualizando en `localStorage` con la puntuación final acumulada de la partida (no por nivel individual).

---

## Decisions

- **Sí:** 3 niveles fijos predefinidos en un array `LEVELS`, igual filosofía que el nivel único actual (SPEC 01). Evita la complejidad de un generador procedural para esta primera iteración de progresión.
- **No:** generación procedural o aleatoria de niveles. Se puede añadir en un spec futuro si se necesita más variedad.
- **Sí:** conservar vidas y puntuación entre niveles. Es el comportamiento estándar esperado en un Arkanoid con progresión.
- **No:** reiniciar vidas por nivel. Rompería la expectativa estándar y no fue solicitado.
- **Sí:** mismo tamaño de pala y velocidad de bola en los 3 niveles; solo cambia el layout de bloques. Mantiene el alcance acotado a "progresión de niveles", sin mezclar ajustes de dificultad que merecerían su propio spec.
- **Sí:** overlay intermedio `levelcomplete` con tecla para continuar, en vez de avanzar automáticamente. Da al jugador una pausa clara entre niveles y reutiliza el patrón de pantallas existente (start/gameover/win).
- **No:** persistir el nivel actual entre sesiones (recargar la página). Fuera de alcance; cada partida nueva empieza en el nivel 1.

---

## What is **not** in this spec

- Niveles procedurales o aleatorios.
- Dificultad progresiva más allá del layout de bloques (velocidad de bola, tamaño de pala, etc.).
- Reinicio de vidas por nivel.
- Más de 3 niveles o selección manual de nivel.
- Persistencia de progreso de nivel entre sesiones.

Cada uno de estos, si se implementa, irá en su propio spec.
