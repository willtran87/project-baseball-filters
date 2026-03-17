# Stadium Filters -- QA Report

## Summary

Full code review and testing of all game systems. Tests written covering state management, economy, filtration, and events. Multiple bugs identified and fixed directly in source code.

---

## Bugs Found and Fixed

### BUG-001: EconomySystem used nonexistent `state.stadiumCapacity`
- **File**: `src/systems/EconomySystem.js` (line ~48)
- **Severity**: Critical (crash/NaN income)
- **Description**: `_processInning()` referenced `this.state.stadiumCapacity` which did not exist on StateManager. The capacity is defined in `config.stadium.baseCapacity`.
- **Fix**: Changed to `this.state.config.stadium?.baseCapacity ?? 15000`.

### BUG-002: EventSystem did not set `currentGameDayType` on state
- **File**: `src/systems/EventSystem.js`
- **Severity**: High (economy calculations always used default)
- **Description**: EventSystem determined game day type on each new day but only stored it internally. EconomySystem reads `state.currentGameDayType` to calculate attendance and stress, which was always undefined, falling back to `'weekdayRegular'` regardless of actual game type.
- **Fix**: Added `configKey` to GAME_DAY_TYPES constants and set `state.currentGameDayType` in `_onNewDay()`.

### BUG-003: GAME_DAY_TYPES names did not match config keys
- **File**: `src/systems/EventSystem.js`
- **Severity**: High (game day type lookup always failed)
- **Description**: EventSystem's `GAME_DAY_TYPES` used display names like `'Weekday Regular'` but `config.gameDayTypes` used camelCase keys like `'weekdayRegular'`. Added `configKey` property to each entry.
- **Fix**: Added `configKey` field to all GAME_DAY_TYPES entries.

### BUG-004: EventSystem directly set reputation bypassing clamping
- **File**: `src/systems/EventSystem.js` (multiple methods)
- **Severity**: Medium (potential reputation out-of-range)
- **Description**: `_endEvent()`, `_resolveInspection()`, and `_resolveVIPVisit()` manually calculated clamped reputation and used `state.set('reputation', ...)`. StateManager has `adjustReputation()` specifically for clamped reputation changes. The manual clamping could miss edge cases and didn't emit `state:reputation` events consistently.
- **Fix**: Replaced all manual reputation calculations with `state.adjustReputation()`.

### BUG-005: ProgressionSystem missing milestone condition handlers
- **File**: `src/systems/ProgressionSystem.js`
- **Severity**: Medium (many milestones could never trigger)
- **Description**: `_conditionMet()` only handled 4 conditions (`money_gte`, `day_gte`, `reputation_gte`, `filters_gte`) but `gameConfig.milestones` defined conditions like `events_survived_gte`, `inspection_grade`, `expansions_gte`, `season_gte`, and `championship_hosted` which all returned `false`.
- **Fix**: Added handlers for all milestone conditions.

### BUG-006: StateManager.serialize() omitted `paused` state
- **File**: `src/engine/StateManager.js`
- **Severity**: Low (pause state lost on save/load)
- **Description**: `serialize()` did not include `this.paused` and `deserialize()` did not restore it. If a player saved while paused and loaded, the game would unpause.
- **Fix**: Added `paused` to both `serialize()` and `deserialize()`.

### BUG-007: SaveLoad._write() mutated input data object
- **File**: `src/engine/saveLoad.js`
- **Severity**: Low (side effect, potential data corruption)
- **Description**: `_write()` added `_savedAt` directly to the passed-in data object (`data._savedAt = Date.now()`), mutating the serialized state. If the same object was reused, it would accumulate `_savedAt`.
- **Fix**: Changed to spread into a new object: `const toStore = { ...data, _savedAt: Date.now() }`.

### BUG-008: Inspection grade not stored for milestone tracking
- **File**: `src/systems/EventSystem.js`
- **Severity**: Low (milestone "Spotless" could never trigger)
- **Description**: `_resolveInspection()` calculated the grade but never stored it on state. The `inspection_grade` milestone condition checked `state.lastInspectionGrade` which was always null.
- **Fix**: Added `this.state.lastInspectionGrade = grade` in `_resolveInspection()`.

---

## Test Coverage

### Test Files Created

| File | Tests | Description |
|------|-------|-------------|
| `tests/state.test.js` | 18 | StateManager set/get, adjustReputation clamping, filter CRUD, serialize/deserialize, EventBus core operations |
| `tests/economy.test.js` | 11 | Inning timer, speed multiplier, pause behavior, income calculation, day advancement, event revenue multiplier, stadium capacity |
| `tests/filtration.test.js` | 20 | Installation (cost, domain validation, IDs), degradation (rate, event multiplier, pause), efficiency scaling, repair (cost, emergency rate, broken status reset), upgrade (tier, rep-gating), removal, reputation effects, cross-system cascades, status helper |
| `tests/events.test.js` | 14 | Event triggering, active event duration, pause behavior, event properties, game day type assignment, weather forecast, inspection resolution, season detection |

### Test Infrastructure

- `tests/testRunner.js` -- Minimal test framework (describe/it/assert)
- `tests/helpers.js` -- Factory functions for test doubles
- `tests/runAll.js` -- Aggregator that runs all suites
- `tests/test.html` -- Browser-based test runner with colored output

### Running Tests

Open `tests/test.html` in a browser via the dev server:
```
npm run dev
# Navigate to http://localhost:3000/tests/test.html
```

---

## Balance Observations

### Economy
- Starting money ($8,000) is reasonable for early game. With base ticket price $25 and ~6,000-9,000 attendance for weekday games, per-inning revenue is substantial.
- The 9-inning per game day structure means ~4.5 minutes of real time per game day at 1x speed (30s per inning). This matches the GDD target of 3-5 hours per season.
- Emergency repair multiplier (2.5x) is punishing enough to encourage preventive maintenance.

### Filtration
- Tier 1 filters have 10-game lifespans (100 condition / 1 per second / ~270 seconds per game = roughly 10-15 games). This feels reasonable for early game tension.
- Cross-system interactions add good depth but currently only emit events without applying mechanical penalties. The cascade system is ready for expansion.

### Events
- Weather event probabilities are reasonable (55% total chance of some event per day from config; additionally weather/random checks happen periodically).
- Event compounding (weather + game day stress) creates emergent difficulty -- this is working well.
- VIP visit (+3 rep on success, -5 rep on failure) creates asymmetric risk which matches the GDD's design philosophy.

### Progression
- Reputation tiers are well-spaced. Starting at 35 (Minor League) gives room to fall to Condemned without immediate game over.
- The condemned streak counter (10 games) provides a reasonable recovery window.

---

## Integration Issues

1. **AudioManager event names mismatch**: AudioManager listens for `filter:failed` and `filter:degraded` but FiltrationSystem emits `filter:broken`. The `filter:failed` listener never fires. Minor issue since `filter:broken` events reach the audio through other paths.

2. **GameLoop speed vs StateManager speed**: GameLoop has its own `_speed` property that controls update frequency. StateManager also has a `speed` property. These are not synchronized. The GameLoop speed is what actually affects game pacing, while `state.speed` is informational only. This could confuse UI code that reads `state.speed`.

3. **ProgressionSystem._checkUnlocks()** was updated to use reputation tiers for feature unlocks, but the old `config.unlocks` array (with `filterType`, `dayRequired`, `reputationRequired`) is still in the config but no longer referenced. Dead config data.

---

## Recommendations

1. Synchronize GameLoop speed and StateManager speed, or remove the redundant one.
2. Add the `gameEvents` legacy config events to the new EventSystem architecture or remove them (currently both old and new event systems coexist).
3. Consider adding a visual indicator in the HUD for the current game day type and weather forecast.
4. The `systemInteractions` cascade events are emitted but no system currently applies mechanical effects from them -- this is a natural next feature to implement.
