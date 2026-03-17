# Stadium Filters — Technical Architecture

## Tech Stack

- **Rendering**: Vanilla HTML5 Canvas (2D context, pixel-art with `image-rendering: pixelated`)
- **Language**: Vanilla JavaScript with ES modules (`type="module"`)
- **Build**: None required — served directly via `npx serve`
- **Dev server**: `npm run dev` → `npx serve . -l 3000`

## Project Structure

```
project_baseball_filters/
├── index.html                    # Entry point, canvas + UI overlay
├── package.json                  # Dev server script
├── docs/
│   └── ARCHITECTURE.md           # This file
├── src/
│   ├── main.js                   # Bootstrap, wire up all modules, start loop
│   ├── engine/
│   │   ├── GameLoop.js           # Fixed-timestep update, variable render
│   │   ├── StateManager.js       # Central game state container
│   │   └── EventBus.js           # Pub/sub event system
│   ├── systems/
│   │   ├── FiltrationSystem.js   # Filter placement, degradation, quality
│   │   ├── EconomySystem.js      # Income, expenses, per-inning revenue
│   │   ├── EventSystem.js        # Random in-game events (weather, etc.)
│   │   └── ProgressionSystem.js  # Unlocks, achievements, milestones
│   ├── rendering/
│   │   ├── CanvasRenderer.js     # Low-level canvas drawing utilities
│   │   ├── SpriteSystem.js       # Sprite sheet loading and drawing
│   │   └── TileMap.js            # Grid-based stadium layout
│   ├── ui/
│   │   ├── HUD.js                # Money, day/inning, reputation display
│   │   ├── PanelManager.js       # Panels (shop, inspector, menus)
│   │   └── TooltipManager.js     # Hover tooltips
│   ├── assets/
│   │   ├── sprites.js            # Sprite atlas definitions
│   │   └── sounds.js             # Sound effect definitions
│   └── data/
│       └── gameConfig.js         # Game balance/tuning parameters
```

## Module Responsibilities

### Engine Layer (`src/engine/`)

| Module | Responsibility |
|--------|---------------|
| **GameLoop** | Drives the game with fixed-timestep updates (60 Hz) and variable-rate rendering. Prevents simulation spiral-of-death by clamping frame time. |
| **StateManager** | Single source of truth for all mutable game state (money, filters, day, reputation). Emits change events through EventBus when state is modified. Provides serialize/deserialize for save/load. |
| **EventBus** | Decouples modules via pub/sub. Systems emit events; other systems and UI subscribe. Supports `on`, `off`, `once`, `emit`, and `clear`. |

### Systems Layer (`src/systems/`)

| Module | Responsibility |
|--------|---------------|
| **FiltrationSystem** | Core gameplay: installing, degrading, repairing, and removing filters. Calculates per-filter efficiency based on condition. Emits quality metrics each tick. |
| **EconomySystem** | Revenue and expenses. Calculates per-inning income based on reputation and filter quality. Advances innings and days. |
| **EventSystem** | Random events triggered at the start of each new day. Events have durations and multipliers that affect filter degradation and revenue. |
| **ProgressionSystem** | Checks milestones and unlocks each inning/day. Unlocks new filter types based on day count and reputation thresholds. |

### Rendering Layer (`src/rendering/`)

| Module | Responsibility |
|--------|---------------|
| **CanvasRenderer** | Wraps Canvas 2D context with pixel-art-friendly helpers (integer coords, nearest-neighbor, palette drawing). |
| **SpriteSystem** | Loads sprite sheet images, maps named sprites to atlas regions, draws sprites by name. |
| **TileMap** | Manages the 2D tile grid representing the stadium. Converts between pixel and grid coordinates. Renders tiles as colored rectangles (placeholder) or sprite tiles. |

### UI Layer (`src/ui/`)

| Module | Responsibility |
|--------|---------------|
| **HUD** | HTML overlay showing money, day/inning, reputation, active event. Updates each tick. |
| **PanelManager** | Manages modal-style panels (filter shop, inspector). Panels are registered with render functions and opened/closed via events. |
| **TooltipManager** | Shows contextual tooltips on hover with filter info, costs, etc. |

### Data Layer (`src/data/`, `src/assets/`)

| Module | Responsibility |
|--------|---------------|
| **gameConfig.js** | All tunable game parameters: starting money, filter type definitions (cost, efficiency, condition), event definitions (probability, multipliers), unlock conditions, milestones. |
| **sprites.js** | Sprite atlas layout — maps sprite names to pixel regions in sprite sheets. |
| **sounds.js** | Sound effect paths and volume levels. |

## Data Flow

```
                    ┌──────────────┐
                    │  Game Config  │  (static data)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
 User Input ──────►│ StateManager  │◄────── Save/Load
                    │  (game state) │
                    └──────┬───────┘
                           │ reads/writes
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌───────────┐ ┌──────────┐ ┌──────────┐
      │ Filtration │ │ Economy  │ │  Events  │  ... systems
      └─────┬─────┘ └────┬─────┘ └────┬─────┘
            │             │            │
            └─────────────┼────────────┘
                          │ emit events
                   ┌──────▼───────┐
                   │   EventBus   │
                   └──────┬───────┘
                          │ notify
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         ┌────────┐ ┌──────────┐ ┌──────────┐
         │  HUD   │ │  Panels  │ │ Tooltips │  ... UI
         └────────┘ └──────────┘ └──────────┘
                          │
                   ┌──────▼───────┐
                   │   Renderer   │◄── SpriteSystem, TileMap
                   │   (Canvas)   │
                   └──────────────┘
```

## Game Loop Architecture

The game uses a **fixed-timestep update with variable render**:

```
┌─── requestAnimationFrame ───┐
│                              │
│  1. Calculate frame time     │
│  2. Clamp to MAX_FRAME_TIME  │
│  3. Add to accumulator       │
│                              │
│  while (accumulator >= dt):  │
│    update(FIXED_DT)          │  ← deterministic 60 Hz simulation
│    accumulator -= dt         │
│                              │
│  interpolation = acc / dt    │
│  render(interpolation)       │  ← smooth rendering at display rate
│                              │
└──────────────────────────────┘
```

- **FIXED_DT** = 1/60 second (60 ticks/sec)
- **MAX_FRAME_TIME** = 0.25 seconds (prevents death spiral on tab-away)
- **Interpolation** factor (0-1) can be used for smooth movement between ticks

## Key Interfaces

### System Interface
All game systems follow the same pattern:
```js
class SomeSystem {
  constructor(state, eventBus) { ... }  // inject dependencies
  update(dt) { ... }                     // called at fixed timestep
}
```

### EventBus Events
| Event | Payload | Emitter |
|-------|---------|---------|
| `game:init` | `{ config }` | main.js |
| `game:newDay` | `{ day }` | EconomySystem |
| `state:{key}` | `{ key, value, old }` | StateManager |
| `filter:added` | filter object | StateManager |
| `filter:removed` | filter object | StateManager |
| `filter:install` | `{ type, x, y }` | UI → FiltrationSystem |
| `filter:repair` | `{ id }` | UI → FiltrationSystem |
| `filter:broken` | filter object | FiltrationSystem |
| `filter:repaired` | filter object | FiltrationSystem |
| `filtration:quality` | `{ avgEfficiency, filterCount }` | FiltrationSystem |
| `economy:inningEnd` | `{ income, maintenance, balance }` | EconomySystem |
| `event:started` | event object | EventSystem |
| `event:ended` | event object | EventSystem |
| `progression:achievement` | milestone object | ProgressionSystem |
| `progression:unlock` | unlock object | ProgressionSystem |
| `ui:message` | `{ text, type }` | any system |
| `ui:openPanel` | `{ name }` | UI interactions |
| `ui:closePanel` | — | UI interactions |

## Save/Load

StateManager provides `serialize()` and `deserialize()` methods. Save data is a plain JSON object stored in `localStorage`. The state:loaded event is emitted after deserialize so UI can refresh.

## Canvas Dimensions

- **Logical resolution**: 480 x 320 pixels
- **Pixel scale**: 2x (rendered at 960 x 640 CSS pixels)
- **Tile size**: 16 x 16 pixels (30 x 20 tile grid)
- **image-rendering**: `pixelated` / `crisp-edges` for sharp pixel art
