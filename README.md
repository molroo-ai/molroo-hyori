<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
    <img alt="molroo" src="assets/logo-light.svg" width="180" />
  </picture>
</p>

<h1 align="center">molroo-hyori</h1>

<p align="center">
  <strong>Live2D Avatar Playground with exp3 Expression Engine</strong><br/>
  React 19 &middot; Vite 6 &middot; pixi-live2d-display &middot; exp3 Add Blending &middot; Idle Saccade<br/>
  <sub>Technical showcase for <a href="https://github.com/molroo-ai">molroo</a> emotion engine</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-e94560" alt="version" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

<p align="center">
  <a href="https://molroo-ai.github.io/molroo-hyori/"><strong>Live Demo</strong></a>
</p>

---

<p align="center">
  <img src="assets/preview.png" alt="molroo-hyori preview" width="720" />
</p>

## What is this?

A web-based Live2D avatar controller that demonstrates **exp3 expression blending** on top of motion playback. Instead of switching between canned expression files, each expression is a set of parameter deltas blended additively over the current motion state — enabling smooth, layered facial control.

### Key Features

- **20 expression presets** — exp3 Add-mode deltas (smile, angry, shy, smug, cry, etc.)
- **10 motion presets** — Idle, Tap, Flick, with body/head hit-area routing
- **Touch interaction** — Tap and flick on the avatar trigger contextual reactions
- **Idle saccade** — Procedural eye focus animation during idle state
- **Manual controls** — Head rotation, body rotation, eye gaze, mouth open sliders
- **Swappable characters** — `CharacterPackage` interface for plugging in different models

## Architecture

```
┌─ Browser ──────────────────────────────────────────────────────┐
│                                                                │
│  ┌─ Sidebar (280px) ─────────┐  ┌─ Viewer (flex) ──────────┐  │
│  │ ExpressionPanel (20 btns) │  │                           │  │
│  │ MotionPanel (presets+raw)  │  │   pixi-live2d-display     │  │
│  │ ControlPanel (sliders)    │  │   ┌───────────────────┐   │  │
│  │ ChatPanel (Phase 2)       │  │   │  Live2D Model     │   │  │
│  └───────────────────────────┘  │   │  + exp3 engine     │   │  │
│                                  │   │  + idle saccade    │   │  │
│                                  │   └───────────────────┘   │  │
│                                  └───────────────────────────┘  │
│                                                                │
│  useLive2D hook                                                │
│  ├── Pixi Application lifecycle (create / resize / destroy)    │
│  ├── EyeBall curve patch (saccade takes over idle eye curves)  │
│  ├── motionManager.update hook → saccade injection             │
│  ├── coreModel.update hook → exp3 expression fade injection    │
│  └── Pointer event detection → tap / flick → motion trigger    │
└────────────────────────────────────────────────────────────────┘
```

### exp3 Blending

Cubism SDK's official expression format (`exp3.json`) supports three blend modes:

| Mode | Formula | Use Case |
|------|---------|----------|
| **Add** | `current + delta * weight` | Eyebrow raise, eye squint on top of motion |
| **Multiply** | `current * (1 + (value - 1) * weight)` | Scale existing motion intensity |
| **Overwrite** | `lerp(current, target, weight)` | Force specific parameter value |

All 20 Hyori presets use **Add mode**, meaning expressions layer non-destructively over whatever motion is playing.

## Quick Start

### Prerequisites

- Node.js 18+
- The Hiyori model file (not included in repo — see [Model Setup](#model-setup))

### Install & Run

```bash
git clone https://github.com/molroo-ai/molroo-hyori.git
cd molroo-hyori
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Model Setup

The Live2D model file is excluded from the repository per Live2D's sample model terms. To run locally:

1. Download [Hiyori (hiyori_pro_zh)](https://www.live2d.com/en/learn/sample/) from Live2D's official sample page
2. Place the zip file at `public/models/hiyori_pro_zh.zip`
3. Restart the dev server

### Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run typecheck  # TypeScript strict check
```

## Project Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Layout (Sidebar + Viewer)
├── App.css                     # Global styles (dark theme)
├── hooks/
│   └── useLive2D.ts            # Core hook — all Live2D logic
├── lib/live2d/
│   ├── exp3-engine.ts          # exp3 Add/Multiply/Overwrite blending
│   ├── saccade.ts              # Idle eye focus animation
│   ├── saccade-timing.ts       # Saccade interval generation
│   ├── zip-loader.ts           # ZIP model loading
│   └── math.ts                 # lerp, clamp, easing
├── characters/
│   ├── types.ts                # CharacterPackage, MotionDef
│   └── hyori/
│       ├── index.ts            # Hyori character package
│       ├── expressions.ts      # 20 exp3 presets
│       └── motions.ts          # 10 motion definitions
└── components/
    ├── Live2DViewer.tsx         # Canvas + useLive2D
    ├── Sidebar.tsx              # Sidebar container
    ├── ExpressionPanel.tsx      # Expression toggle buttons
    ├── MotionPanel.tsx          # Preset + raw motion buttons
    ├── ControlPanel.tsx         # Parameter sliders
    └── ChatPanel.tsx            # Chat placeholder (Phase 2)
```

## CharacterPackage

Adding a new character is a matter of creating a new package:

```typescript
const myCharacter: CharacterPackage = {
  name: 'MyCharacter',
  modelUrl: '/models/my-model.zip',
  expressions: {
    happy: addExpr({ ParamEyeLSmile: 1, ParamEyeRSmile: 1 }),
    // ...
  },
  motions: {
    idle: { group: 'Idle', index: 0, label: 'Default idle' },
    // ...
  },
  display: { scale: 2.2, offsetY: 0 },
}
```

## Roadmap

- [ ] **Phase 2**: Chat integration (molroo-api + Anthropic SDK)
- [ ] **Phase 2**: Expression driven by emotion engine (VAD → exp3 mapping)
- [x] GitHub Pages deployment with auto-build

## Third-Party Notices

This project uses Live2D Cubism SDK and sample data. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for full license details.

> This content uses sample data owned and copyrighted by Live2D Inc.

Saccade and zip-loader code adapted from [Project AIRI](https://github.com/moeru-ai/airi) (MIT License).

## License

MIT
