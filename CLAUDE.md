# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid clone for the browser: plain HTML, CSS, and JavaScript, zero dependencies (see README.md). **No game code exists yet** — the repo currently only contains assets (`assets/spritesheet-breakout.png`, `assets/spritesheet.js`, `assets/sounds/*.mp3`) and the spec workflow tooling described below. There is no `index.html`, build step, package manager, or test runner.

Replies to the user should match the language they write in (the README is in Spanish).

## Spec-driven workflow

This repo develops features through a two-step slash-command workflow (skills installed in `.agents/skills/` and `.claude/skills/`, tracked by `skills-lock.json`, sourced from `Klerith/fernando-skills`):

- **`/spec <description>`** — produces a numbered spec file at `specs/NN-slug.md` (the `specs/` folder does not exist yet). Asks clarifying questions before writing; saves the file in `Draft` state. Never writes code.
- **`/spec-impl <NN-slug>`** — implements a spec, but **only if its state means "Approved"**. Creates/switches to branch `spec-NN-slug` (behavior controlled by `specs/.spec-config.yml`, `AutoCreateBranch: true` by default), then implements the plan step by step, pausing for review after each step. Never commits automatically.

When asked to build a feature in this repo, prefer going through `/spec` first rather than writing code directly, unless the user explicitly asks for a quick, un-specced change.

## Spritesheet asset

`assets/spritesheet.js` is the only existing game-adjacent code. It defines sprite coordinates into `assets/spritesheet-breakout.png` and lazy-loads the image into an offscreen canvas:

- `SPRITES` — rects for `paddle`, `ball`, and `blocks.<color>` (gray/red/yellow/cyan/magenta/hotpink/green).
- `EXPLOSION_FRAMES` — 4-frame animation per block color, `EXPLOSION_DURATION = 150`ms per frame.
- `loadSpritesheet(cb)` — call once; queues callbacks until the image is decoded onto an offscreen canvas (`ssImg`/`ssLoaded`).
- `drawSprite(ctx, name, x, y, w, h)` — draws a static sprite by name; block sprites use the `block_<color>` naming convention (e.g. `block_red`) which maps into `SPRITES.blocks`.
- `drawFrame(ctx, frame, x, y, w, h)` — draws a single explosion animation frame.

Any future game code should load the spritesheet via `loadSpritesheet` before attempting to draw, since `drawSprite`/`drawFrame` are no-ops until `ssLoaded` is true.
