# Stadium Filters: UI Specification

Reference document for implementing the game's user interface.
All layouts target the base resolution of **320x180** pixels (16:9), scaled up to display.
UI elements render at **2x pixel density** (640x360 effective) for text readability.

See also: `docs/GAME_DESIGN_DOCUMENT.md` (Sections 8, 9, Appendix A)
See also: `src/data/gameConfig.js` (color values, thresholds, tier data)

---

## Table of Contents

1. [Screen Map](#1-screen-map)
2. [Main Game View](#2-main-game-view)
3. [HUD](#3-hud)
4. [Detail Panels](#4-detail-panels)
5. [Shop / Upgrade Catalog](#5-shop--upgrade-catalog)
6. [Secondary Screens](#6-secondary-screens)
7. [Overlay Modes](#7-overlay-modes)
8. [Color System](#8-color-system)
9. [Information Hierarchy](#9-information-hierarchy)
10. [Interaction Flows](#10-interaction-flows)
11. [Event Notifications](#11-event-notifications)
12. [Tutorial Callouts](#12-tutorial-callouts)
13. [Responsive Behavior](#13-responsive-behavior)
14. [Accessibility](#14-accessibility)

---

## 1. Screen Map

```
                         +------------------+
                         |   TITLE SCREEN   |
                         | New / Load / Opt |
                         +--------+---------+
                                  |
                         +--------v---------+
                         | DIFFICULTY SELECT |
                         +--------+---------+
                                  |
              +-------------------v-------------------+
              |            MAIN GAME VIEW             |
              |  (Stadium Cross-Section + HUD + Alerts)|
              +--+------+------+------+------+-------++
                 |      |      |      |      |       |
           +-----v+ +---v--+ +v----+ +v---+ +v----+ +v--------+
           |Detail| | Shop | |Sched| |Fin.| |Rep  | |Settings |
           |Panel | |Cata- | |View | |Rep.| |Journ| |& Save   |
           |      | |log   | |     | |    | |     | |         |
           +------+ +------+ +-----+ +----+ +-----+ +---------+
```

All secondary screens are **modal overlays** on top of the main game view. The game world continues to render (dimmed) behind overlays but simulation pauses when a menu is open, unless the player has explicitly set speed > 0.

---

## 2. Main Game View

### 2.1 Layout

The main view occupies the full screen. It is divided into three layers:

```
+-----------------------------------------------------------------------+
|                        SKY LAYER (top 20%)                            |
|  Weather particles, clouds, sun/moon position, time-of-day gradient   |
+-----------------------------------------------------------------------+
|                                                                       |
|                    STADIUM LAYER (middle 55%)                         |
|                                                                       |
|  The pixel-art cross-section of the stadium. All zones visible.       |
|  Each zone is a clickable region. Filters render as animated sprites. |
|                                                                       |
+-----------------------------------------------------------------------+
|                    UNDERGROUND LAYER (bottom 25%)                     |
|  Drainage pipes, sewage, utility tunnels. Darker palette.             |
+-----------------------------------------------------------------------+
```

### 2.2 Stadium Zone Map

The cross-section is divided into clickable rectangular zones. Each zone belongs to one or more filtration domains.

```
+------------------------------------------------------------------+
|                  [Upper Deck Seating]                             |
+----------+-----------+-------------------+-----------+-----------+
| [Luxury  | [Press    |   [General        | [Press    | [Luxury   |
|  Box L]  |  Box L]   |   Concourse]      |  Box R]   |  Box R]   |
+----------+-----------+--------+----------+-----------+-----------+
| [Concessions L]  | [Restrooms] | [Concessions R]                |
+-------------------+------+------+------------------+-------------+
| [HVAC Room]    | [Utility Room]  | [Water Plant]                 |
+----------------+---------+--------+------------------+-----------+
|                  [FIELD LEVEL - open air]                         |
+------------------------------------------------------------------+
| [Field Drainage Grid]                                             |
+----------------+------------------+------------------------------+
| [Sewage L]     | [Pipe Network]   | [Drainage Tanks]             |
+----------------+------------------+------------------------------+
```

**Zone-to-domain mapping:**

| Zone | Primary Domain | Secondary Domain |
|------|---------------|-----------------|
| Upper Deck Seating | Air | HVAC |
| Luxury Boxes | HVAC | Air, Water |
| Press Box | Air | HVAC |
| General Concourse | Air | Water |
| Concessions | Water | Air |
| Restrooms | Water | Drainage |
| HVAC Room | HVAC | -- |
| Utility Room | All | -- |
| Water Plant | Water | -- |
| Field Level | -- (open air) | Drainage |
| Field Drainage | Drainage | -- |
| Sewage | Drainage | Water |
| Pipe Network | Water | Drainage |
| Drainage Tanks | Drainage | -- |

### 2.3 Zone Visual States

Each zone has a subtle background tint indicating its worst-condition filter:

| State | Background Treatment |
|-------|---------------------|
| All healthy | Normal palette, no overlay |
| Degraded (50-79%) | Faint yellow border pulse, 1-second cycle |
| Warning (25-49%) | Orange border pulse, 0.5-second cycle |
| Critical/Broken (0-24%) | Red border flash, 0.25-second cycle, alarm icon |

### 2.4 Animated Elements

| Element | Animation | Trigger |
|---------|-----------|---------|
| Filter sprites | Spinning/glowing when active, static when idle, sparks when broken | Filter condition |
| Ventilation fans | Rotation speed proportional to airflow rate | System load |
| Water pipes | Flow particles (blue dots) moving through pipes | Water system active |
| Drainage | Drip/flow particles in underground layer | Rain events, normal drainage |
| Stadium fans (people) | Idle sitting, cheering, leaving (unhappy) | Game day, satisfaction |
| Weather particles | Rain drops, snow, heat shimmer, wind debris | Active weather event |
| Smoke/steam | Rising from concessions, HVAC vents | Normal operation |

### 2.5 Camera

- Default view: full stadium visible, no zoom
- **Click a zone**: Smooth zoom to 2x on that zone (0.3s ease-in-out)
- **Right-click or Escape**: Zoom back to full view
- **Mouse wheel**: Zoom in/out (1x to 3x range)
- **Click-drag** (when zoomed): Pan across the stadium
- No camera movement when at 1x (full view)

---

## 3. HUD

The HUD is always rendered on top of the game view. It uses the clipboard/control-panel visual theme: slightly off-white background with a subtle paper texture, **Raptors red** (`#cc2244`) border, pixel-font text.

### 3.1 Top Bar

Anchored to the top edge, full width, **24px tall** (at 2x density).

```
+-----------------------------------------------------------------------+
| Day 34  Season 1  |  GAME: vs. Rivals  78% |  $45,230 +$1.2K | R:52 |
|  8:15 PM          |  Inning: 5th Top       |                  | -->  |
+--[||] [>] [>>] [>>>]---------------------------------------------+---+
```

**Left section (date/time):**
- Day number, season number (always visible)
- Time of day (during game days; shows "--:--" on off-days)
- Speed controls: Pause `||`, 1x `>`, 2x `>>`, 4x `>>>`
- Active speed button is highlighted in white; others are dimmed gray

**Center section (event/game status):**
- On game days: opponent name, attendance percentage, current inning
- On off-days: "OFF DAY - Planning Phase"
- During events: event name replaces opponent (e.g., "EVENT: Heatwave!")
- Event name uses the event severity color (see Section 8)

**Right section (economy + reputation):**
- Bank balance with +/- delta since last inning in smaller font
- Balance text turns red when below $1,000
- Reputation number (0-100) with a **trend arrow**:
  - Green up-arrow: gained reputation in last 3 innings
  - Red down-arrow: lost reputation in last 3 innings
  - Gray dash: stable

### 3.2 Right Panel (System Summary)

Anchored to the right edge, **64px wide** (at 2x), extends from below the top bar to the bottom.

```
+-------------------+
| SYSTEM HEALTH     |
|                   |
| Air   [=====---]  |
|       72%         |
| Water [=======-]  |
|       89%         |
| HVAC  [====----]  |
|       58%         |
| Drain [========]  |
|       100%        |
+-------------------+
| ALERTS        (3) |
| ! HVAC Zone 2 hot |
| ! Filter #4 @ 12% |
| i Inspect in 2d   |
|   (click to view) |
+-------------------+
| STAFF         1/3 |
| [Idle]            |
| [Repairing: HVAC] |
| [Idle]            |
+-------------------+
| [Wrench] [Calendar]|
| [Chart]  [Book]   |
+-------------------+
```

**System Health section:**
- Four horizontal bars, one per domain
- Bar fill color matches the condition (see color system)
- Domain name uses the domain color (Air: gray, Water: blue, HVAC: orange, Drainage: green)
- Percentage shown below each bar
- Clicking a bar scrolls the main view to that domain's primary zone and opens the detail panel

**Alert Feed section:**
- Shows up to 4 most recent alerts
- Scrollable if more than 4
- Each alert prefixed with an icon:
  - `!` (triangle) = warning/critical, in yellow or red
  - `i` (circle) = informational, in white
  - `$` (diamond) = financial, in green
- Clicking an alert opens the relevant detail panel
- Alerts auto-dismiss after 30 seconds unless critical
- Critical alerts (broken filters, health violations) persist until resolved

**Staff section:**
- Shows `[Available] / [Total]` count
- Each staff member shown with current assignment
- Status colors: Green = Idle (available), Yellow = Assigned (maintenance), Red = Emergency (repair)
- Clicking a staff member opens a quick-assign dropdown

**Quick-access buttons (bottom):**

| Button | Icon | Opens | Hotkey |
|--------|------|-------|--------|
| Shop | Wrench | Shop / Upgrade Catalog | `S` |
| Schedule | Calendar | Schedule View | `C` |
| Finances | Chart | Financial Report | `F` |
| Handbook | Book | Tutorial / Handbook | `H` |

### 3.3 Bottom Bar (Event Banner)

Only visible during active events. Slides up from the bottom, **20px tall**.

```
+-----------------------------------------------------------------------+
| !! HEATWAVE — Extreme heat stresses HVAC and water.  [2:34 remaining] |
+-----------------------------------------------------------------------+
```

- Background color matches event severity
- Shows event name, short description, and countdown timer
- Clicking it opens the event detail tooltip (see Section 11)
- Slides down and disappears when event ends (0.5s animation)

---

## 4. Detail Panels

Detail panels open as an overlay anchored to the **left side** of the screen (opposite the right panel), leaving the right panel and top bar visible. Panel dimensions: **192px wide, up to 160px tall** (at 2x density).

### 4.1 Zone Detail Panel

Opens when clicking a zone on the stadium cross-section.

```
+----------------------------------------------+
| AIR QUALITY - General Concourse          [X] |
+----------------------------------------------+
| Component        | Health | Status  | Action |
|------------------|--------|---------|--------|
| HEPA Filter #1   | 82%    | OK      | [M]    |
| HEPA Filter #2   | 34%    | WARN    | [R]    |
| Vent Fan A       | 91%    | OK      | [-]    |
| Vent Fan B       | 67%    | DEG     | [M]    |
| Air Scrubber     | 55%    | DEG     | [M]    |
+----------------------------------------------+
| AQI: 64 / target 70+                        |
| Airflow: 12,000 / req 10,000 CFM            |
+----------------------------------------------+
| [Upgrade Zone]  [Assign Staff]  [Auto-Maint] |
+----------------------------------------------+
```

**Header:** Domain name + zone name. Domain color used for accent. `[X]` closes the panel.

**Component table:**
- One row per installed filter/component in this zone
- Health column uses the condition color (green/yellow/orange/red percentage text)
- Status column shows short status: `OK`, `DEG` (degraded), `WARN`, `CRIT`, `DEAD`
- Action column:
  - `[M]` = Maintenance (available when condition < 80%, costs 30% of filter cost)
  - `[R]` = Repair (available when condition < 25%, costs repair price)
  - `[-]` = No action needed
  - Grayed out if no staff available or not enough money
  - Hovering shows cost tooltip

**Zone metrics:** Shows the primary metric for this domain (AQI, Purity, Comfort, Capacity) with current value and target.

**Quick actions (bottom row):**
- **Upgrade Zone**: Opens the shop filtered to this domain
- **Assign Staff**: Opens a dropdown of idle staff to assign to this zone
- **Auto-Maint**: Toggle. When ON (shown as filled checkbox), staff automatically perform maintenance on components in this zone when they drop below 50%. Shows as dimmed if no staff assigned.

### 4.2 Filter Detail Tooltip

Clicking a specific component row in the zone detail panel opens a **tooltip popup** (128x80px) next to the row.

```
+--------------------------------+
| Pleated HEPA Filter            |
| Tier 2 - Air Quality           |
+--------------------------------+
| Condition: 34% [======----]    |
| Efficiency: 27%                |
| Installed: Day 12              |
| Games remaining: ~6            |
+--------------------------------+
| Repair: $600                   |
| Upgrade to T3: $6,000          |
|   (Requires Rep 56)            |
+--------------------------------+
| [Repair] [Upgrade] [Remove]    |
+--------------------------------+
```

- Shows full name, tier, domain
- Condition bar with percentage
- Current efficiency (derived from condition)
- Install date and estimated remaining lifespan
- Available actions with costs
- Upgrade button grayed with requirement text if locked

---

## 5. Shop / Upgrade Catalog

Modal overlay, centered, **256x160px** (at 2x density). Dimmed game view behind.

### 5.1 Layout

```
+-------------------------------------------------------+
| FILTRATION SUPPLY CATALOG                          [X] |
+-------------------------------------------------------+
| [Air] [Water] [HVAC] [Drainage] [Staff] [Special]     |
+-------------------------------------------------------+
|                                                        |
| << HEPA Filters            [1/3 components] >>        |
|                                                        |
| +---------------------------------------------------+ |
| | [T1] Basic Fiber Filter                            | |
| |      $500  |  +10 AQI  |  10 games  |  $20/day    | |
| |      [CURRENT - Installed x2]                      | |
| +---------------------------------------------------+ |
| | [T2] Pleated HEPA                                  | |
| |      $2,000  |  +25 AQI  |  25 games  |  $35/day  | |
| |      [BUY - $2,000]                                | |
| +---------------------------------------------------+ |
| | [T3] Electrostatic Filter                          | |
| |      $8,000  |  +40 AQI  |  50 games  |  $60/day  | |
| |      [LOCKED] Requires Double-A (Rep 56)           | |
| +---------------------------------------------------+ |
| | [T4] Smart HEPA Array                              | |
| |      $25,000  |  +55 AQI  |  80 games  |  $45/day | |
| |      [LOCKED] Requires Triple-A (Rep 71)           | |
| +---------------------------------------------------+ |
|                                                        |
| Balance: $45,230          Daily cost impact: +$15/day  |
+-------------------------------------------------------+
```

### 5.2 Tab Descriptions

| Tab | Contents |
|-----|----------|
| **Air** | HEPA Filters, Ventilation Fans, Air Scrubbers (3 component categories, 4 tiers each) |
| **Water** | Water Filters, Plumbing, Cooling Systems (3 categories) |
| **HVAC** | HVAC Units, Climate Controllers (2 categories) |
| **Drainage** | Drain Systems, Field Drainage, Sewage Processing (3 categories) |
| **Staff** | Hire crew ($1,000 each), assign specializations, view staff details |
| **Special** | Weather Station, Backup Generator, Automation Tools, stadium cosmetics |

### 5.3 Item Card Layout

Each tier is displayed as a card in a vertical list:

```
+---------------------------------------------------+
| [Tier Badge]  Item Name                            |
|                                                    |
|  Cost: $X,XXX    Quality: +NN    Lifespan: NN gm  |
|  Energy: $NN/day                                   |
|                                                    |
|  [ACTION BUTTON]                                   |
+---------------------------------------------------+
```

**Tier Badge:** Circular badge showing T1/T2/T3/T4, colored by tier (see color system).

**Action Button states:**

| State | Button Text | Color | Behavior |
|-------|-------------|-------|----------|
| Available | `BUY - $X,XXX` | Green | Opens confirmation dialog |
| Current | `CURRENT - Installed xN` | Blue (dimmed) | No action |
| Too expensive | `BUY - $X,XXX` (dimmed) | Gray | Shows "Not enough money" tooltip on hover |
| Locked (rep) | `LOCKED - Requires [Tier Name] (Rep N)` | Dark gray | Shows unlock requirements |
| Locked (prereq) | `LOCKED - Requires [Component] T[N]` | Dark gray | Shows prerequisite |

### 5.4 Purchase Confirmation

Small centered dialog (128x64px):

```
+----------------------------------+
| Purchase Pleated HEPA?           |
|                                  |
| Cost: $2,000                     |
| Daily energy: +$35              |
| AQI improvement: +15            |
|                                  |
| Balance after: $43,230           |
|                                  |
| [Cancel]            [Confirm]    |
+----------------------------------+
```

After confirming, the item is purchased and the player must click a valid zone in the stadium to place it. The cursor changes to a placement reticle.

### 5.5 Staff Tab

```
+-------------------------------------------------------+
| MAINTENANCE CREW                                   [X] |
+-------------------------------------------------------+
| Current: 2 / Max: 8       Wage: $150/day each         |
+-------------------------------------------------------+
| Staff #1   [Idle]                                      |
|   Assigned: General Concourse                          |
|   [Reassign]  [Fire - saves $150/day]                  |
+-------------------------------------------------------+
| Staff #2   [Repairing]                                 |
|   Assigned: HVAC Room - Emergency                      |
|   [Reassign]                                           |
+-------------------------------------------------------+
|                                                        |
| [Hire New Staff - $1,000]                              |
|   Next wage total: $450/day                            |
+-------------------------------------------------------+
```

---

## 6. Secondary Screens

All secondary screens are modal overlays with the same frame style as the shop.

### 6.1 Schedule View

Hotkey: `C`

```
+-------------------------------------------------------+
| SEASON SCHEDULE                                    [X] |
+-------------------------------------------------------+
| << Week 5 of 10 >>                                     |
+-------+-------+-------+-------+-------+-------+-------+
| Mon   | Tue   | Wed   | Thu   | Fri   | Sat   | Sun   |
+-------+-------+-------+-------+-------+-------+-------+
| Day 29| Day 30| Day 31| Day 32| Day 33| Day 34| Day 35|
| OFF   | vs.   | vs.   | OFF   | vs.   | vs.   | vs.   |
|       | Bears | Bears |       | Hawks | Hawks | Hawks |
|       | Wkday | Wkday |       | Promo | Wkend | Wkend |
+-------+-------+-------+-------+-------+-------+-------+
| Weather Forecast:                                      |
|   Tomorrow: [Sun icon] Clear (85% confidence)          |
|   Day +2:   [Cloud icon] Light Rain (70%)              |
|   Day +3:   [Sun icon] Clear (55%)                     |
+-------------------------------------------------------+
| Upcoming:                                              |
|   Day 40: Health Inspection (scheduled)                |
|   Day 52: Rivalry Series vs. Tigers                    |
+-------------------------------------------------------+
```

- Current day highlighted with a bright border
- Game day types shown with abbreviated labels and color-coded
- Weather forecast shows icon + name + confidence percentage
- Confidence text colored: green (>70%), yellow (50-70%), red (<50%)

### 6.2 Financial Report

Hotkey: `F`

```
+-------------------------------------------------------+
| FINANCIAL REPORT                                   [X] |
+-------------------------------------------------------+
| [This Game] [This Week] [This Season] [All Time]      |
+-------------------------------------------------------+
|                                                        |
| INCOME                          EXPENSES               |
| Tickets:      $12,500           Staff:      $450       |
| Concessions:  $7,200            Energy:     $380       |
| Sponsorships: $1,500            Maintenance: $220      |
| Event Bonus:  $0                Repairs:    $1,800     |
|                                 Fines:      $0         |
| ─────────────────               ──────────────────     |
| Total Income: $21,200           Total Exp:  $2,850     |
|                                                        |
|              NET PROFIT: $18,350                        |
+-------------------------------------------------------+
| [Trend Graph - 20 data points]                         |
|                                                        |
|  $20K |        *   *                                   |
|  $15K |     *    *   *  *                              |
|  $10K |  *              *  *                           |
|   $5K | *                    *                         |
|    $0 +--+--+--+--+--+--+--+--                        |
|        D1 D5 D10 D15 D20 D25 D30                      |
+-------------------------------------------------------+
```

- Tab selector for time range (per-game, weekly, seasonal, all-time)
- Income and expenses in two columns with line items
- Net profit highlighted: green if positive, red if negative
- Bottom section: pixel-art line graph showing net profit trend over time
- Graph line color: green (profit), red (loss)

### 6.3 Reputation Journal

Hotkey: `R` (or click reputation number in top bar)

```
+-------------------------------------------------------+
| REPUTATION JOURNAL                                 [X] |
+-------------------------------------------------------+
| Current: 52 [==========----------] SINGLE-A            |
| Next tier: DOUBLE-A at 56 (+4 needed)                  |
+-------------------------------------------------------+
| Recent Changes:                                        |
|                                                        |
| Day 34  +2  Successful game day (high attendance)      |
| Day 33  -5  Health Inspection: Grade D                 |
| Day 33  +3  Survived Wind Storm without failure        |
| Day 32  +1  Successful game day                        |
| Day 31  -3  Filter failure during operations           |
| Day 30  +2  Successful game day (high attendance)      |
| ...                                                    |
+-------------------------------------------------------+
| Tier Progress:                                         |
| Condemned [##] Minor [####] SingleA [##--] DoubleA ... |
+-------------------------------------------------------+
```

- Full reputation bar at top showing current tier and progress to next
- Chronological log of all reputation changes with amounts and reasons
- Gains shown in green, losses in red
- Bottom: visual tier progress bar showing all tiers with current position marked

### 6.4 Settings & Save

Hotkey: `Escape` (opens pause menu first, settings accessible from there)

```
+-------------------------------------------------------+
| SETTINGS                                           [X] |
+-------------------------------------------------------+
| Difficulty: Veteran                                    |
|                                                        |
| Audio:                                                 |
|   Music Volume:    [=====-----] 50%                    |
|   SFX Volume:      [========--] 80%                    |
|   Ambient Volume:  [=======---] 70%                    |
|                                                        |
| Display:                                               |
|   Fullscreen: [ON]                                     |
|   Show FPS:   [OFF]                                    |
|   Pixel Scale: [Auto] [2x] [3x] [4x]                  |
|                                                        |
| Gameplay:                                              |
|   Auto-pause on event:  [ON]                           |
|   Alert sound:          [ON]                           |
|   Tutorial hints:       [ON]                           |
+-------------------------------------------------------+
| SAVE / LOAD                                            |
|   [Auto-Save: Day 34, 8:15 PM]                        |
|   [Slot 1: Day 28, Season 1]  [Save] [Load]           |
|   [Slot 2: Empty]             [Save]                   |
|   [Slot 3: Empty]             [Save]                   |
+-------------------------------------------------------+
| [Return to Game]    [Main Menu]    [Quit]              |
+-------------------------------------------------------+
```

---

## 7. Overlay Modes

Overlays are toggled via hotkeys or buttons. Only one overlay active at a time. The overlay renders a semi-transparent color layer over the stadium view with data callouts.

### 7.1 Overlay List

| Overlay | Hotkey | Color Layer | Data Shown |
|---------|--------|-------------|------------|
| Air Quality | `1` | White/light gray tint | AQI number per zone, particle density dots, airflow direction arrows |
| Water | `2` | Blue tint | Pipe network lines, pressure readings at junctions, flow direction arrows |
| Temperature | `3` | Red-blue gradient | Heat map coloring per zone (blue=cold, red=hot), target temp labels |
| Drainage | `4` | Green tint | Drain pipe paths, water level bars in tanks, capacity % per section |
| Satisfaction | `5` | Yellow-red gradient | Fan happiness score per zone, emoji face indicators |
| None | `0` or same key | -- | Removes overlay |

### 7.2 Overlay Visual Treatment

- Semi-transparent colored wash (40% opacity) over the stadium
- Data callouts appear as small pixel labels anchored to zone centers
- Pipe/duct networks drawn as colored lines connecting components
- Animated flow particles move along pipe/duct lines
- Zones below threshold flash their border in the overlay color

---

## 8. Color System

### 8.1 Filter Condition Colors

Used everywhere health is displayed (bars, text, zone borders, component sprites).

| Condition Range | Name | Hex Color | RGB | Usage |
|----------------|------|-----------|-----|-------|
| 80-100% | Healthy | `#4CAF50` | 76, 175, 80 | Bar fill, text, sprite glow, zone border |
| 50-79% | Degraded | `#FFC107` | 255, 193, 7 | Bar fill, text, sprite tint, zone pulse |
| 25-49% | Warning | `#FF9800` | 255, 152, 0 | Bar fill, text, sprite tint, zone pulse |
| 1-24% | Critical | `#F44336` | 244, 67, 54 | Bar fill, text, sprite flash, zone flash |
| 0% | Broken | `#B71C1C` | 183, 28, 28 | Bar fill (dark red), sparks animation |

### 8.2 Domain Colors

Used for system labels, overlay tints, pipe/duct rendering, tab accents.

| Domain | Primary Hex | Light Hex | Dark Hex | Usage |
|--------|------------|-----------|----------|-------|
| Air Quality | `#CCCCCC` | `#E0E0E0` | `#888888` | Gray tones, airflow particles |
| Water | `#4488FF` | `#88BBFF` | `#2255AA` | Blue tones, water particles |
| HVAC | `#FF8844` | `#FFAA77` | `#CC5500` | Orange tones, heat/cold indicators |
| Drainage | `#44BB44` | `#77DD77` | `#228822` | Green tones, drain flow |

### 8.3 Tier Colors

Used for tier badges in the shop, upgrade indicators, and filter sprite accent.

| Tier | Hex Color | Name |
|------|-----------|------|
| T1 | `#9E9E9E` | Gray (basic) |
| T2 | `#2196F3` | Blue (improved) |
| T3 | `#9C27B0` | Purple (advanced) |
| T4 | `#FFD700` | Gold (premium) |

### 8.4 UI Chrome Colors

| Element | Hex | Usage |
|---------|-----|-------|
| Panel background | `#F5F0E8` | Off-white paper texture base |
| Panel border | `#1a2a4a` | Raptors navy frame |
| Text primary | `#212121` | Main text, labels |
| Text secondary | `#757575` | Descriptions, hints |
| Text accent | `#1565C0` | Clickable links, interactive labels |
| Button normal | `#455A64` | Default button background |
| Button hover | `#607D8B` | Hovered button |
| Button active | `#37474F` | Pressed button |
| Button disabled | `#BDBDBD` | Grayed out buttons |
| Positive value | `#2E7D32` | Money gain, positive delta |
| Negative value | `#C62828` | Money loss, fines, penalties |

### 8.5 Event Severity Colors

Used for event banner background, alert icons, notification borders.

| Severity | Hex | Usage |
|----------|-----|-------|
| Info | `#1565C0` | Blue — informational events, scheduled items |
| Caution | `#F9A825` | Yellow — moderate events, weather warnings |
| Danger | `#E65100` | Orange — severe events, system warnings |
| Critical | `#B71C1C` | Dark red — emergencies, failures, game over |
| Success | `#2E7D32` | Green — positive outcomes, achievements |

---

## 9. Information Hierarchy

### 9.1 Always Visible (HUD - no interaction required)

These elements are on screen at all times during gameplay:

| Element | Location | Purpose |
|---------|----------|---------|
| Day / Season / Time | Top bar, left | Orientation in game timeline |
| Game status or event | Top bar, center | What's happening right now |
| Bank balance + delta | Top bar, right | Financial pressure awareness |
| Reputation + trend | Top bar, far right | Core progression metric |
| Speed controls | Top bar, below date | Pacing control |
| 4 system health bars | Right panel, top | At-a-glance system status |
| Alert feed | Right panel, middle | Urgent items needing attention |
| Staff status | Right panel, bottom | Resource availability |
| Event banner | Bottom bar (when active) | Active event awareness |

### 9.2 One-Click Access (click zone or button)

Available with a single click, without opening a menu:

| Element | Access Method | Purpose |
|---------|--------------|---------|
| Zone detail panel | Click any zone on stadium | Component-level health |
| Filter tooltip | Click component row in detail panel | Full filter details + actions |
| Repair/Maintain action | Click `[M]` or `[R]` button in detail panel | Direct maintenance |
| Assign staff | Click staff in right panel or detail panel | Resource allocation |
| Overlay toggle | Press `1`-`5` or click overlay buttons | System visualization |
| Reputation journal | Click reputation number in top bar | Rep change history |

### 9.3 Menu Access (requires opening an overlay screen)

Requires opening a modal:

| Element | Access Method | Purpose |
|---------|--------------|---------|
| Shop / Upgrade catalog | `S` key or wrench button | Purchase and upgrade |
| Schedule view | `C` key or calendar button | Upcoming games and weather |
| Financial report | `F` key or chart button | Detailed income/expense |
| Handbook | `H` key or book button | Game reference |
| Settings / Save | `Escape` key | Configuration, save/load |

### 9.4 Contextual (appears only when relevant)

| Element | Trigger | Duration |
|---------|---------|----------|
| Event banner | Event starts | Until event ends |
| Achievement popup | Milestone reached | 5 seconds, then fades |
| Tier change banner | Reputation crosses tier boundary | 4 seconds |
| Tutorial callouts | First-time actions | Until dismissed |
| Purchase confirmation | Buy button clicked | Until confirmed/cancelled |
| Game over screen | Win/lose condition met | Persistent |
| Inspection grade popup | Inspection resolves | 5 seconds |

---

## 10. Interaction Flows

### 10.1 Installing a New Filter

```
1. Player opens Shop (press S or click wrench)
2. Player selects domain tab (Air / Water / HVAC / Drainage)
3. Player browses component categories (arrows to navigate)
4. Player clicks [BUY] on desired tier
5. Confirmation dialog appears showing cost and impact
6. Player clicks [Confirm]
   - Money deducted immediately
   - Shop closes
   - Cursor changes to a placement reticle (pulsing green square)
   - Valid zones highlight with green borders
   - Invalid zones show red X overlay
7. Player clicks a valid zone
   - Filter sprite appears with a "pop-in" animation
   - Zone health bar updates
   - Brief "+1 [Component Name]" floating text at placement point
8. If player presses Escape during placement: refund and cancel
```

### 10.2 Repairing a Filter

```
1. Player clicks a zone on the stadium (or clicks system health bar)
2. Zone detail panel opens on the left
3. Player identifies a degraded/warning/critical component
4. Player clicks [M] (maintenance) or [R] (repair)
   - If staff available: staff member assigned, repair begins
     - Progress bar appears on the component row
     - Duration: 5 seconds (maintenance) or 15 seconds (repair)
     - Component condition restores during progress
   - If no staff available: "No staff available" tooltip
   - If not enough money: "Not enough money" tooltip
5. When complete: condition restored, staff returns to idle
   - Brief "Repaired!" floating text
   - Staff status in right panel updates
```

### 10.3 Upgrading an Existing Filter

```
1. Player clicks a zone, then clicks a component row to open tooltip
2. Player clicks [Upgrade] in the tooltip
   - If locked: tooltip shows "Requires [Tier Name] (Rep N)"
   - If affordable: confirmation dialog with cost (new - 50% old)
3. Player confirms
   - Old filter replaced with upgrade animation (old fades, new pops in)
   - Condition reset to 100%
   - Zone metrics update
   - "+1 [New Name]" floating text
```

### 10.4 Responding to an Event

```
1. Event triggers:
   - Event banner slides up from bottom
   - Alert sound plays (severity-appropriate)
   - Game auto-pauses if "Auto-pause on event" setting is ON
   - Right panel alert feed adds entry
2. Player reads event description in banner
3. Player clicks banner for more detail (tooltip showing full effects)
4. Player responds:
   - For system stress events (weather): check affected systems, repair/maintain
   - For inspections: ensure all systems above threshold before timer expires
   - For VIP visits: focus on luxury box systems
5. Event timer counts down in the banner
6. Event ends:
   - Banner slides down
   - Resolution notification appears:
     - Inspection: grade + money + rep change
     - VIP: "Impressed +4" or "Disappointed -6"
     - Weather: "Survived!" or damage summary
   - Post-event alert in feed with outcome
```

### 10.5 Hiring Staff

```
1. Player opens Shop, clicks Staff tab
   (or clicks staff count in right panel)
2. Current staff list shown with assignments
3. Player clicks [Hire New Staff - $1,000]
   - If affordable: new staff member added, money deducted
   - Staff appears in right panel as [Idle]
   - Daily wage total updates
4. To assign: click staff member > dropdown of zones
5. To fire: click [Fire] button on staff card
   - Confirmation: "Fire Staff #N? Saves $150/day"
```

### 10.6 Purchasing a Stadium Expansion

```
1. System notifies player: "Stadium expansion available: [Name]!"
2. Player opens Shop > Special tab > Expansions section
3. Expansion card shows:
   - Cost, revenue boost, new systems required
   - [Purchase - $XX,XXX] button
4. Player clicks Purchase > confirmation dialog
5. After confirming:
   - Money deducted
   - Stadium cross-section animates: new zone builds in (3-second build animation)
   - New zone appears with empty filter slots
   - Alert: "New zone requires filtration! Install systems in [Zone Name]"
   - Zone flashes with warning border until filters installed
```

---

## 11. Event Notifications

### 11.1 Notification Types

| Type | Visual | Sound | Duration | Dismissal |
|------|--------|-------|----------|-----------|
| **Event Start** | Banner slide-up + alert icon | Alert chime (severity-matched) | Until event ends | Auto (event end) |
| **Event End** | Banner slide-down + result popup | Resolution jingle | 5 seconds | Auto-fade or click |
| **Achievement** | Gold banner, top-center, slides down | Achievement fanfare | 5 seconds | Auto-fade or click |
| **Tier Change** | Full-width banner, centered | Promotion trumpet / demotion thud | 4 seconds | Auto-fade or click |
| **Filter Broken** | Red flash on zone + alert entry | Alarm buzz | Until repaired | Manual (repair filter) |
| **Money Warning** | Balance text turns red + flash | Cash register ding | 3 seconds | Auto-fade |
| **Inspection Grade** | Centered popup with letter grade | Grade-dependent (fanfare or buzzer) | 5 seconds | Click |
| **Tutorial Hint** | Callout bubble pointing to element | Soft ping | Until dismissed | Click "Got it" |

### 11.2 Notification Stacking

When multiple notifications fire simultaneously:
1. Event banners take priority (only one at a time)
2. Achievement/tier popups queue and show sequentially (2-second gap)
3. Alert feed entries stack in the right panel (newest on top)
4. Filter broken alerts persist and stack (each filter gets its own)

### 11.3 Notification Animation Specs

| Animation | Duration | Easing |
|-----------|----------|--------|
| Banner slide up | 0.4s | ease-out |
| Banner slide down | 0.5s | ease-in |
| Popup fade in | 0.3s | ease-out |
| Popup fade out | 0.5s | ease-in |
| Achievement slide down | 0.5s | bounce (slight overshoot) |
| Zone flash (broken) | 0.25s on, 0.25s off | linear loop |
| Zone pulse (warning) | 0.5s on, 0.5s off | sine |
| Floating text (+$, +rep) | 1.5s total, rises 20px, fades out last 0.5s | linear rise, ease-in fade |

---

## 12. Tutorial Callouts

The tutorial is integrated into the first 5-6 game days. Callouts are speech-bubble-shaped pointers that highlight specific UI elements. They pause the game until dismissed.

### 12.1 Tutorial Sequence

| Day | Trigger | Callout Target | Message | Player Action Required |
|-----|---------|---------------|---------|----------------------|
| **Day 1** | Game starts | Stadium cross-section (center) | "Welcome to your stadium! This cross-section shows all your filtration systems. Each zone needs working filters to keep fans happy." | Click "Got it" |
| Day 1 | After dismissing intro | Right panel health bars | "These bars show the health of your four main systems: Air, Water, HVAC, and Drainage. Keep them green!" | Click "Got it" |
| Day 1 | After dismissing health | Top bar reputation | "This is your Reputation score. It goes up when systems run well and down when things break. Reach Major League status to win!" | Click "Got it" |
| **Day 2** | Day starts | A filter in the stadium (any zone) | "Your filters degrade over time. Click a zone to see the details." | Click any zone |
| Day 2 | Zone detail opens | Maintenance button [M] | "When a filter's health drops, click [M] to perform maintenance. This costs money but keeps things running." | Click [M] on any filter |
| Day 2 | After maintenance | Staff section in right panel | "Maintenance requires available staff. You start with 1 crew member. Hire more in the Shop to handle multiple tasks." | Click "Got it" |
| **Day 3** | First game day begins | Top bar game status | "It's game day! Fans are arriving. Your systems will be stressed by attendance. Watch for alerts!" | Click "Got it" |
| Day 3 | Inning ends | Top bar money section | "You earn money each inning from tickets, concessions, and sponsors. More fans + better systems = more revenue!" | Click "Got it" |
| **Day 4-5** | Weather event triggers | Event banner | "A weather event! These stress specific systems. Check the affected systems and repair anything that's struggling." | Dismiss event or interact with a zone |
| Day 4-5 | After weather event | Shop button (wrench) | "Open the Shop to buy better filters, hire staff, or purchase upgrades. Higher-tier filters last longer and perform better." | Open shop |
| Day 4-5 | Shop opened first time | Shop tab bar | "Browse by system type. Each category has 4 tiers of equipment. Better tiers unlock as your Reputation grows." | Click any tab |
| **Day 6** | Day starts | No callout | *Tutorial complete. A final message appears:* "You're on your own now, Manager. Keep those filters running! (Hints are available in the Handbook.)" | Auto-dismiss after 4 seconds |

### 12.2 Callout Visual Design

```
         +--------- target element ---------+
         |                                   |
    +----v-----------------------------------+
    |  [?] Tutorial: Health Bars             |
    |                                        |
    |  These bars show the health of your    |
    |  four main systems. Keep them green!   |
    |                                        |
    |                          [Got it -->]  |
    +----------------------------------------+
```

- Rounded-rectangle speech bubble with a pixel-art arrow pointing to the target element
- Light yellow background (`#FFF8E1`) with Raptors navy border (`#1a2a4a`)
- Question mark icon in the header
- Target element highlighted with a pulsing white border; rest of screen dimmed at 50% opacity
- "Got it" button in bottom-right (or action instruction if player must do something)
- Callouts can be skipped entirely via Settings > Tutorial hints > OFF

### 12.3 Contextual Hints (Post-Tutorial)

After the tutorial, the following hints appear once each when relevant:

| Trigger | Hint |
|---------|------|
| First filter reaches 0% | "A filter has broken! Broken filters are expensive to repair. Try to maintain them before they fail." |
| First health inspection | "Inspection incoming! Your grade depends on overall system quality. A-grade earns $5,000 bonus!" |
| First expansion unlocked | "You've unlocked a stadium expansion! Open the Shop > Special tab to purchase it." |
| Balance drops below $500 | "Running low on funds! Consider taking a loan or reducing staff to cut costs." |
| First T2 unlock | "New technology available! Tier 2 upgrades are now in the Shop. They cost more but last longer." |
| First event chain | "Multiple events at once! Prioritize the most critical system and work your way down." |

---

## 13. Responsive Behavior

### 13.1 Resolution Scaling

The game targets 320x180 base resolution scaled to the display:

| Display Resolution | Scale Factor | Effective Size |
|-------------------|-------------|----------------|
| 1280x720 | 4x | 320x180 |
| 1920x1080 | 6x | 320x180 |
| 2560x1440 | 8x | 320x180 |

UI text renders at 2x the game pixel scale for readability (so at 1080p, game pixels are 6x but text pixels are 3x, allowing finer text detail while maintaining pixel aesthetic).

### 13.2 Panel Behavior on Small Screens

If the viewport is narrower than 1280px:
- Right panel collapses to icon-only mode (health bars become small dots, alerts become badge count)
- Clicking the collapsed panel expands it as an overlay
- Detail panels render full-width instead of side-anchored

### 13.3 Input Modes

| Input | Behavior |
|-------|----------|
| **Mouse** | Primary. Click to select, hover for tooltips, scroll to zoom. |
| **Keyboard** | Hotkeys for screens (S/C/F/H/Esc), overlays (1-5), speed (Space=pause, +/- for speed). Tab cycles through zones. |
| **Touch (stretch goal)** | Tap = click, pinch = zoom, long-press = tooltip. Right panel accessible via swipe-in from right edge. |

---

## 14. Accessibility

### 14.1 Color Blindness Support

The condition system uses both color AND a secondary indicator to avoid relying on color alone:

| Condition | Color | Secondary Indicator |
|-----------|-------|-------------------|
| Healthy | Green | Steady glow, full bar |
| Degraded | Yellow | Slow pulse, partially empty bar |
| Warning | Orange | Fast pulse, mostly empty bar, `!` icon |
| Critical | Red | Flash, nearly empty bar, `!!` icon |
| Broken | Dark red | Sparks animation, empty bar, skull icon |

### 14.2 Text Readability

- All UI text uses pixel fonts at a minimum of 8px rendered height (at 2x density = 16 actual screen pixels at 1080p)
- High contrast between text and background (minimum 4.5:1 ratio)
- Numbers in health bars and tooltips are always accompanied by the bar visual

### 14.3 Audio Cues

Every visual alert has a corresponding audio cue:
- Different alert tones for info / caution / danger / critical
- Achievement has a distinct fanfare
- Filter breaking has a distinct alarm
- Audio cues are independently toggleable in settings

---

## Appendix: Hotkey Reference

| Key | Action |
|-----|--------|
| `Space` | Pause / Unpause |
| `+` / `=` | Increase speed |
| `-` | Decrease speed |
| `S` | Open Shop |
| `C` | Open Schedule |
| `F` | Open Financial Report |
| `H` | Open Handbook |
| `R` | Open Reputation Journal |
| `Escape` | Close panel / Open pause menu |
| `1` | Toggle Air Quality overlay |
| `2` | Toggle Water overlay |
| `3` | Toggle Temperature overlay |
| `4` | Toggle Drainage overlay |
| `5` | Toggle Satisfaction overlay |
| `0` | Clear overlay |
| `Tab` | Cycle through zones |
| `M` | Quick-maintain (when zone detail open, targets worst component) |
