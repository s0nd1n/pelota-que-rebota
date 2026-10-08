# AGENTS.md

Single-file [p5.js](https://p5js.org/) sketch ("Pelotita Loca"). No build, package manager, tests, lint, or CI. Libraries are loaded from CDNs; nothing is vendored.

## Layout
- `index.html` — page shell; loads p5 and p5.sound from jsDelivr, then `sketch.js`. Contains a small CSS reset and a fixed, top-centered `<h1>` overlay title over the canvas.
- `sketch.js` — all logic. Uses p5 **global mode**: `setup()`, `draw()`, `mousePressed()`, `windowResized()` are auto-invoked globals, not module exports. Do not add `import`/`export`.

## Running
- Open `index.html` directly (file:// is fine), or serve statically (e.g. `python3 -m http.server`).
- Requires internet access — p5 and p5.sound are CDN scripts.
- Use a static server (not `file://`) if you need to debug with browser devtools, and keep the browser/PWA focused: p5 pauses its `requestAnimationFrame` loop when the tab is hidden, so the ball will appear frozen.

## Sound (p5.sound)
- p5 2.x does **not** bundle p5.sound; it is a separate CDN package: `https://cdn.jsdelivr.net/npm/p5.sound@0.4.1/dist/p5.sound.min.js` (load it *after* p5).
- The Bounce sound is synthesized with `p5.Oscillator` + `p5.Envelope`; there are no audio asset files.
- Browsers block audio until a user gesture. `mousePressed()` calls `userStartAudio()`; without a click there is no sound. Do not remove it.
- `p5.Envelope.play()` uses the envelope's own `sustain` value as the note duration `triggerAttackRelease(this.node.sustain)`, so `setADSR(..., sustain, ...)` doubles as the blip length. Keep sustain at `0` for a short percussive hit.

## Conventions / gotchas
- Comments and UI text are in Spanish; keep it that way.
- Physics constants live in `sketch.js`: gravity `0.5`, ball radius `25`, speed cap `velocidadMax = 30`. Each bounce uses a random restitution `random(0.75, 1.15)`, so some hits gain energy and some bounce softer.
- The ball bounces off all four edges, changes to a random contrasting color on every bounce (`cambiarColor`), and uses **squash & stretch**: it flattens on the impact axis (`deformacion`/`deformDir*`) and stretches along its velocity otherwise (`dibujarPelota`).
- When the cursor comes within `radioPanico` (`radio + 80`), the ball flees from it (`escaparDelCursor`), pushing harder the closer the cursor gets. It does **not** stop on hover anymore.
- A particle system (`Particula` + `actualizarParticulas`) emits `emisionPorFrame` (2) particles per frame from the mouse position; sizes vary widely (`random(2, 14)`, fragments `random(1, 6)`). Each lives `vidaParticula` = 10000 ms and is capped at `maxParticulas` (2000). Particles fall (`gravedadParticula`) and settle at the bottom edge of the canvas, staying there until they expire; lifetime uses `millis()`, so particles expire instantly if the tab was hidden (p5 pauses `draw`).
- At 80% of its life a normal particle makes a small explosion into 5–8 short-lived fragments (`explotar`, fragment `vida` 400–900 ms). Fragments have `esFragmento = true` and never explode, so there is no chain reaction; total count is capped at `maxFragmentos` (2800).
- Canvas calls `resizeCanvas(windowWidth, windowHeight)` in `windowResized()`; keep that if you change layout.

## Git
- Default branch: `main`; remote `origin` → `s0nd1n/pelota-que-rebota`.
