# Stadium Filters: Game Design Document

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Core Game Loop](#2-core-game-loop)
3. [Economy System](#3-economy-system)
4. [Filtration Systems](#4-filtration-systems)
5. [Upgrade Paths](#5-upgrade-paths)
6. [Events](#6-events)
7. [Progression](#7-progression)
8. [UI Layout](#8-ui-layout)
9. [Technical Notes](#9-technical-notes)

---

## 1. Game Overview

### Elevator Pitch

**Stadium Filters** is a pixel-art economy/business simulation where you play as the Filtration Manager of a baseball stadium. Monitor air quality, water systems, HVAC, and drainage to keep fans happy, pass inspections, and grow your stadium from a minor-league park into a championship venue. Neglect your filters, and the whole operation falls apart.

### Genre

Management / Business Simulation with pixel-art aesthetics.

### Target Audience

- Fans of management sims (Game Dev Tycoon, Two Point Hospital, Project Highrise)
- Players who enjoy optimization puzzles and resource balancing
- Ages 12+, casual to mid-core difficulty

### Art Style

- **16-bit pixel art** with a clean, readable palette
- Stadium rendered as a detailed cross-section showing all internal systems
- Animated filter units, pipes, ducts, and fans with visible particle effects (dust, water droplets, steam)
- Color-coded system overlays: blue for water, white/gray for air, orange for HVAC, green for drainage
- Pixel characters (fans, staff, inspectors) with simple idle and reaction animations
- Day/night lighting shifts; weather effects overlay the stadium exterior
- UI elements styled as a clipboard/control panel aesthetic to match the "facilities manager" theme

---

## 2. Core Game Loop

The game operates on a **day-by-day** cycle with real-time simulation during game days. The core loop is:

```
MONITOR --> MAINTAIN/REPAIR --> UPGRADE --> SURVIVE EVENTS --> EARN REVENUE --> EXPAND
   ^                                                                              |
   |______________________________________________________________________________|
```

### Loop Breakdown

1. **Monitor**: Check filter health, system alerts, and upcoming schedule via the dashboard. Identify systems nearing failure or inefficiency thresholds.

2. **Maintain / Repair**: Assign staff to routine maintenance tasks or emergency repairs. Maintenance is preventive and cheap; repairs are reactive and expensive. Filters degrade over time based on usage intensity.

3. **Upgrade**: Spend earned revenue to improve filter components, unlock new tiers, or add capacity. Each upgrade has cost/benefit tradeoffs (e.g., better filter = higher energy cost).

4. **Survive Events**: Handle game days, weather events, and random crises. Events stress specific systems and test your preparedness. Poor handling causes fan complaints, health violations, or equipment damage.

5. **Earn Revenue**: Successful stadium operation generates income from ticket sales, concessions, and sponsorships. Revenue scales with fan satisfaction and stadium reputation.

6. **Expand**: As reputation grows, unlock new stadium sections (luxury boxes, additional concourses, press boxes, underground facilities) that require new or expanded filtration systems.

### Time System

- **Off-days**: Time passes in planning mode. The player reviews systems, orders parts, assigns maintenance, and makes upgrades. Time can be advanced manually.
- **Game days**: Time runs in real-time (with speed controls: 1x, 2x, 4x). Systems are stressed, events can trigger, and the player must respond to live issues.
- **Season structure**: A season consists of ~80 home games spread across spring, summer, and fall, with weather patterns shifting accordingly.

---

## 3. Economy System

### Income Sources

| Source | Description | Scaling Factor |
|--------|-------------|----------------|
| **Ticket Sales** | Base income per game day. Scales with attendance. | Attendance x ticket price tier |
| **Concessions** | Food/drink revenue. Requires functional water and HVAC. | Attendance x satisfaction modifier |
| **Sponsorships** | Periodic contracts that pay flat fees. Higher-tier sponsors require higher reputation. | Reputation level |
| **Event Bonuses** | Extra income for hosting special events (playoffs, concerts, corporate events). | Event tier x preparation quality |
| **Health Inspection Bonus** | Cash bonus for passing inspections with high marks. | Inspection grade (A/B/C) |

### Expenses

| Expense | Description | Frequency |
|---------|-------------|-----------|
| **Staff Wages** | Per-day cost for maintenance crew. More staff = higher cost but faster response. | Daily |
| **Filter Parts** | Replacement parts for degraded filters. Quality tiers affect cost and lifespan. | As needed |
| **Energy Costs** | Running cost for all active systems. Scales with system tier and load. | Daily (higher on game days) |
| **Emergency Repairs** | Premium cost when a system fails unexpectedly. 2-3x normal repair cost. | Event-driven |
| **Upgrade Costs** | One-time capital expenditure for system improvements. | On purchase |
| **Fines** | Penalties from failed health inspections or fan complaints exceeding thresholds. | Event-driven |

### Budget Management

- The player has a **bank balance** that carries between days
- A **daily operating cost** summary is visible at all times
- **Loans** are available at interest rates that increase with each loan taken (discouraging over-reliance on debt)
- At the end of each season, the **stadium owner** reviews performance; falling below a minimum profit threshold triggers a warning, and two consecutive bad seasons result in a game over
- **Budget forecast** tool shows projected income vs. expenses for the upcoming week

### Economic Balance Targets

- Early game: Tight margins, every dollar matters. One emergency can wipe out a week's profit.
- Mid game: Comfortable buffer if managed well, but expansion costs keep pressure on.
- Late game: Revenue is high but system complexity means cascading failures are catastrophic.

---

## 4. Filtration Systems

The stadium has **four main filtration domains**, each with distinct components, failure modes, and interactions.

### 4.1 Air Quality System

**Purpose**: Keep indoor air clean and breathable for fans and staff across all stadium sections.

**Components**:
| Component | Function | Failure Effect |
|-----------|----------|----------------|
| **HEPA Filters** | Remove particulates, dust, pollen from circulated air | Fans report poor air quality; allergy complaints rise |
| **Ventilation Fans** | Circulate air through ductwork across stadium zones | Stagnant air pockets; localized discomfort; overheating in enclosed areas |
| **Air Scrubbers** | Remove odors, smoke, and chemical contaminants | Persistent odors from concessions/restrooms; health code risk |

**Key Metrics**:
- Air Quality Index (AQI): 0-100 per zone. Below 60 triggers complaints; below 30 triggers health violations.
- Airflow Rate: Measured in CFM. Must meet minimum per-zone based on capacity.
- Filter Saturation: Percentage of filter life consumed. At 100%, the filter fails.

**Interactions**:
- High attendance increases particulate load, stressing HEPA filters faster.
- Concession cooking generates smoke and odors that load air scrubbers.
- HVAC system shares ductwork; HVAC failures can reduce airflow.

### 4.2 Water Filtration System

**Purpose**: Provide clean, safe water for drinking, restrooms, and cooling systems.

**Components**:
| Component | Function | Failure Effect |
|-----------|----------|----------------|
| **Drinking Fountains** | Filtered water supply at public access points | Fan satisfaction drops; concession drink sales spike (mixed blessing) |
| **Restroom Plumbing** | Water supply and waste processing for all restroom facilities | Restroom closures; major fan complaints; health violations |
| **Cooling Systems** | Water-based cooling for equipment and luxury zones | Equipment overheating; luxury box discomfort |

**Key Metrics**:
- Water Purity: 0-100%. Below 70% triggers health warnings. Below 40% forces shutdown.
- Flow Pressure: Must stay within operating range. Too low = no water; too high = pipe stress.
- Contamination Risk: Increases when filters degrade or pipes corrode.

**Interactions**:
- Drainage system backs up if water system is over-pressurized.
- HVAC cooling towers depend on water system health.
- Rain events increase water system load through infiltration.

### 4.3 HVAC System

**Purpose**: Maintain comfortable temperatures across all stadium zones, with different targets for luxury vs. general areas.

**Components**:
| Component | Function | Failure Effect |
|-----------|----------|----------------|
| **Heating Units** | Warm air generation for cold weather games | Cold fans; attendance drop in cold snaps |
| **Cooling Units** | Air conditioning for enclosed areas and luxury boxes | Overheating; luxury box complaints (high-value fans leave) |
| **Climate Zone Controllers** | Manage independent temperature zones (luxury boxes, press box, general concourse, field-level) | Uneven temperatures; wasted energy; targeted complaints |

**Key Metrics**:
- Temperature per zone: Target range depends on zone type and weather.
- Energy Efficiency: Ratio of comfort achieved to energy consumed. Inefficiency bleeds money.
- System Load: Percentage of max capacity in use. Sustained loads above 90% accelerate wear.

**Climate Zones**:
| Zone | Target Temp | Priority |
|------|-------------|----------|
| Luxury Boxes | 68-72F always | Highest (VIP satisfaction) |
| Press Box | 68-74F | High |
| General Concourse | 65-78F | Medium |
| General Seating (covered) | Best effort | Low |
| Field Level | N/A (open air) | N/A |

**Interactions**:
- Shares ductwork with air quality system; failure in one affects the other.
- Water cooling systems feed HVAC; water issues cascade to HVAC.
- Weather events (heatwave, cold snap) dramatically increase HVAC load.

### 4.4 Drainage System

**Purpose**: Manage rainwater, field drainage, and sewage/wastewater from all stadium facilities.

**Components**:
| Component | Function | Failure Effect |
|-----------|----------|----------------|
| **Rainwater Collection** | Roof gutters, downspouts, and retention basins | Flooding in concourses; structural water damage over time |
| **Field Drainage** | Sub-surface drainage grid beneath the playing field | Waterlogged field; game delays or cancellations (severe reputation hit) |
| **Sewage Processing** | Wastewater handling from restrooms and concessions | Sewage backup; immediate health violation; possible stadium closure |

**Key Metrics**:
- Drainage Capacity: Gallons per minute the system can handle. Must exceed inflow during rain.
- Backup Risk: Percentage chance of overflow per hour during heavy load.
- Pipe Integrity: Corrosion level of underground pipes. Degrades slowly but is very expensive to repair.

**Interactions**:
- Heavy rain stresses both rainwater and field drainage simultaneously.
- Sewage system load scales with attendance and concession activity.
- Water system over-pressurization can overload drainage.
- Oldest system in the stadium; pipe integrity starts low and is expensive to improve.

### System Interaction Matrix

| | Air Quality | Water | HVAC | Drainage |
|---|---|---|---|---|
| **Air Quality** | -- | Air scrubbers need water supply | Shared ductwork | Humidity affects air quality |
| **Water** | -- | -- | Cooling towers need water | Over-pressure floods drainage |
| **HVAC** | Duct failures reduce airflow | Depends on cooling water | -- | Condensation adds to drainage load |
| **Drainage** | Flooding creates air quality issues | Backups contaminate water | -- | -- |

---

## 5. Upgrade Paths

Each filtration system has **4 tiers** of upgrades. Higher tiers are more effective but cost more to purchase, operate, and maintain. The player must balance investment across all four systems.

### 5.1 Air Quality Upgrades

| Tier | Name | Cost | Energy/Day | Lifespan | AQI Bonus | Notes |
|------|------|------|-----------|----------|-----------|-------|
| T1 | Basic Fiber Filters | $500 | $20 | 10 games | +10 | Starting equipment. Cheap but clogs fast. |
| T2 | Pleated HEPA | $2,000 | $35 | 25 games | +25 | Better filtration, moderate cost. Unlocks air quality overlay. |
| T3 | Electrostatic Filters | $8,000 | $60 | 50 games | +40 | Self-cleaning feature reduces maintenance. High energy draw. |
| T4 | Smart HEPA Array | $25,000 | $45 | 80 games | +55 | AI-controlled, auto-adjusting. Lower energy than T3 despite better performance. |

**Ventilation Fan Upgrades**: Follow a similar 4-tier path from basic axial fans ($300) to variable-speed EC fans ($15,000).

**Air Scrubber Upgrades**: From activated carbon ($1,000) to photocatalytic oxidation systems ($30,000).

### 5.2 Water Filtration Upgrades

| Tier | Name | Cost | Energy/Day | Lifespan | Purity Bonus | Notes |
|------|------|------|-----------|----------|-------------|-------|
| T1 | Sediment Screens | $400 | $15 | 15 games | +10 | Removes large particles only. |
| T2 | Carbon Block Filters | $1,800 | $25 | 30 games | +25 | Removes chlorine taste, improves drinking water quality. |
| T3 | UV Purification | $10,000 | $50 | 60 games | +40 | Kills bacteria/viruses. Required for health inspection A-grade. |
| T4 | Reverse Osmosis Array | $35,000 | $70 | 100 games | +55 | Near-perfect purity. Produces waste water (adds drainage load). |

**Plumbing Upgrades**: From galvanized steel ($2,000) to PEX smart-piping ($40,000) with leak detection.

**Cooling System Upgrades**: From basic evaporative ($1,500) to closed-loop glycol systems ($20,000).

### 5.3 HVAC Upgrades

| Tier | Name | Cost | Energy/Day | Efficiency | Comfort Bonus | Notes |
|------|------|------|-----------|------------|--------------|-------|
| T1 | Window Units | $800 | $40 | 60% | +10 | Noisy, inefficient, cheap. Only covers small zones. |
| T2 | Split System | $5,000 | $55 | 75% | +25 | Covers full zones. Moderate noise. |
| T3 | VRF System | $20,000 | $45 | 90% | +40 | Variable refrigerant flow. Individual zone control. Lower energy than T2. |
| T4 | Geothermal Exchange | $50,000 | $25 | 98% | +55 | Massive upfront cost but lowest operating cost. Weather-resistant. |

**Climate Controller Upgrades**: From manual thermostats ($200) to smart zone management ($12,000) with predictive weather adjustment.

### 5.4 Drainage Upgrades

| Tier | Name | Cost | Energy/Day | Capacity | Integrity Bonus | Notes |
|------|------|------|-----------|----------|----------------|-------|
| T1 | Basic Gravity Drains | $600 | $10 | 500 GPM | +10 | Slow, clogs in heavy rain. |
| T2 | Pump-Assisted Drains | $3,000 | $30 | 1,200 GPM | +25 | Handles moderate rain. Pumps can fail. |
| T3 | Smart Sump System | $15,000 | $40 | 2,500 GPM | +40 | Sensor-driven pump activation. Predictive alerts. |
| T4 | Integrated Stormwater Management | $45,000 | $35 | 5,000 GPM | +55 | Retention basins, overflow routing, rainwater recycling. Feeds water system. |

**Field Drainage Upgrades**: From basic French drains ($2,000) to heated sub-surface grid ($30,000).

**Sewage Upgrades**: From basic septic ($1,000) to aerobic treatment system ($25,000) with odor elimination.

### Upgrade Strategy Considerations

- T3 and T4 upgrades often have **synergies** (e.g., T4 drainage feeds recycled water to T3+ water system, reducing costs).
- Rushing one system to T4 while neglecting others creates **vulnerability** to cross-system cascading failures.
- Some upgrades have **prerequisites** (e.g., T3 HVAC requires T2+ air quality for duct compatibility).
- **Seasonal timing** matters: upgrade HVAC before summer, drainage before spring rains.

---

## 6. Events

Events are the primary source of challenge and variety. They are divided into three categories.

### 6.1 Scheduled Events: Game Days

Game days are the core revenue-generating events. The team plays ~80 home games per season.

| Game Type | Attendance | System Stress | Revenue Modifier |
|-----------|-----------|---------------|-----------------|
| **Weekday Regular** | 40-60% capacity | Low | 1.0x |
| **Weekend Regular** | 60-80% capacity | Medium | 1.3x |
| **Rivalry Game** | 80-95% capacity | High | 1.6x |
| **Promotional Night** | 70-90% capacity | Medium-High | 1.5x (+ sponsor bonus) |
| **Playoff Game** | 100% capacity | Very High | 2.5x |
| **Championship Game** | 100% capacity | Maximum | 4.0x |

**Game Day Mechanics**:
- All systems run at elevated load proportional to attendance
- Concession activity peaks during innings 3-5 and the 7th inning stretch
- Restroom usage spikes between innings
- Game length varies (2.5-4 hours); extra innings extend all system stress
- Post-game cleanup period requires continued system operation

### 6.2 Weather Events

Weather follows seasonal patterns but individual events trigger randomly within those patterns.

| Event | Season | Duration | Primary Systems Affected | Severity |
|-------|--------|----------|------------------------|----------|
| **Light Rain** | Spring/Fall | 1-3 hours | Drainage (low), Field Drainage (medium) | Low |
| **Heavy Rain / Thunderstorm** | Spring/Summer | 2-6 hours | Drainage (high), Field Drainage (high), Electrical risk | High |
| **Heatwave** | Summer | 3-7 days | HVAC (extreme), Water (high), Air Quality (medium) | High |
| **Cold Snap** | Spring/Fall | 2-5 days | HVAC Heating (high), Water Pipes (freeze risk) | Medium-High |
| **Humidity Spike** | Summer | 1-3 days | Air Quality (high), HVAC (medium), Drainage condensation | Medium |
| **Wind Storm** | Any | 4-12 hours | Air Quality (medium), structural debris in drains | Medium |
| **Snow/Ice** | Early Spring/Late Fall | 1-2 days | Drainage (high), HVAC (high), Pipe freeze risk | High |

**Weather Forecasting**: The player receives a 3-day weather forecast with accuracy that improves with upgrades (basic: 60% accurate, upgraded weather station: 90% accurate). This allows preparation time.

### 6.3 Random Events

Random events test the player's preparedness and adaptability. They are drawn from a weighted pool, with probabilities adjusted by system health and reputation.

| Event | Probability | Trigger Conditions | Effect | Response Window |
|-------|------------|-------------------|--------|----------------|
| **Pipe Burst** | Medium | Low pipe integrity, freeze risk | Immediate water system failure in one zone; flooding | 5 minutes before cascade |
| **Power Outage** | Low-Medium | Storm, overloaded grid | All electric systems offline; backup generators (if owned) kick in | Immediate; duration varies |
| **Health Inspection** | Scheduled + Random | Every 20 games + random chance | Inspector checks all systems; grade affects reputation and fines | 24-hour warning (scheduled) or surprise |
| **VIP Visit** | Medium | High reputation | Celebrity/politician attends; luxury box systems must be perfect | 1-game warning |
| **Equipment Malfunction** | Medium-High | Low maintenance, old equipment | Random component failure; accelerated degradation | Varies by severity |
| **Sewage Backup** | Low | Neglected drainage, high attendance | Restroom closures, severe fan complaints, health risk | 10 minutes before spread |
| **Pest Infestation** | Low | Poor air filtration, food waste buildup | Air quality drops, concession shutdown risk | Multi-day resolution |
| **Sponsor Inspection** | Medium | Active sponsor contract | Sponsor evaluates stadium conditions; poor showing risks contract | 2-game warning |
| **Championship Announcement** | Rare | Late season, team performs well | Stadium will host championship; all systems must be peak | 5-game warning |
| **Charity Event / Concert** | Low-Medium | High reputation | Non-baseball event with unique system demands (stage lighting heat, etc.) | 3-game warning |

### Event Chaining

Events can chain or compound:
- **Heavy rain** + **Game day** = Field drainage crisis + fan complaints + potential game delay
- **Heatwave** + **Power outage** = No cooling, rapid fan distress, potential medical emergency (reputation disaster)
- **VIP visit** + **Pipe burst** = Maximum embarrassment, reputation hit multiplied
- **Health inspection** + **Any active failure** = Guaranteed poor grade and fine

---

## 7. Progression

### 7.1 Reputation System

Reputation is the central progression metric, ranging from **0 to 100**.

| Reputation Range | Stadium Tier | Unlocks |
|-----------------|-------------|---------|
| 0-20 | **Condemned** | Game over if sustained for 10 games |
| 21-40 | **Minor League** | Starting tier. Basic systems only. |
| 41-55 | **Single-A** | Unlock luxury box zone, T2 upgrades, second maintenance crew |
| 56-70 | **Double-A** | Unlock press box zone, T3 upgrades, weather station, third crew |
| 71-85 | **Triple-A** | Unlock underground facility zone, T4 upgrades, automation tools |
| 86-100 | **Major League** | Championship eligible, premium sponsors, full automation suite |

**Reputation Gain**:
- Successful game days with no major incidents: +1 to +3 depending on attendance
- Passing health inspections: +2 (B grade), +5 (A grade)
- Surviving severe events without failure: +3 to +5
- Completing sponsor objectives: +2

**Reputation Loss**:
- Fan complaints exceeding threshold: -1 to -3 per game
- Health inspection failure: -5 (C grade), -10 (D/F grade)
- System failure during game: -3 to -8 depending on severity
- Game cancellation due to facility failure: -15
- Sewage/contamination incident: -10

### 7.2 Stadium Expansion

As reputation increases, new stadium zones unlock that require filtration coverage.

| Zone | Unlock Requirement | New Systems Needed | Revenue Increase |
|------|-------------------|-------------------|-----------------|
| **Starting Stadium** | -- | Basic systems in all 4 categories | Baseline |
| **Luxury Box Wing** | Reputation 41 | Dedicated HVAC (precision), premium water filtration | +30% per game |
| **Press Box Level** | Reputation 56 | Dedicated air quality, network cooling | +10% + media reputation boost |
| **Underground Utility Hub** | Reputation 71 | Central drainage upgrade, backup generators | -15% operating cost |
| **Second Deck Expansion** | Reputation 80 | Expanded capacity for all systems | +50% ticket revenue |
| **Championship Pavilion** | Reputation 90 | Premium everything; showcase system | +100% for special events |

Each expansion increases stadium capacity but also increases the number of systems to manage, creating a satisfying complexity curve.

### 7.3 Seasonal Progression

The game progresses through **seasons** (years). Each season brings:

- **New baseline challenges**: System degradation carries over; pipes age, equipment wears
- **Roster changes**: The baseball team's performance affects attendance (simulated, not player-controlled)
- **Budget review**: Stadium owner evaluates yearly performance and sets next year's budget
- **Off-season**: 3-month planning phase for major upgrades and overhauls (reduced time pressure)
- **New sponsor opportunities**: Higher-tier sponsors become available with reputation
- **Technology unlocks**: New filter technologies become available in later seasons

### 7.4 Win / Lose Conditions

**Win Condition (Soft Victory)**:
- Reach Major League tier (reputation 86+)
- Successfully host a Championship Game with all systems at 90%+ efficiency
- Achieve "Stadium of the Year" award (hidden objective: all metrics above threshold for full season)

**Lose Conditions**:
- Reputation stays in "Condemned" range (0-20) for 10 consecutive games
- Two consecutive seasons with net financial loss
- Major health violation resulting in stadium closure (triggered by catastrophic failure of water + sewage systems simultaneously)
- Player can choose to continue after "winning" for an endless sandbox mode

**Difficulty Modes**:
| Mode | Description |
|------|-------------|
| **Rookie** | Slower degradation, cheaper repairs, generous inspection grading, weather forecast always accurate |
| **Veteran** | Standard balance as described in this document |
| **All-Star** | Faster degradation, tighter budgets, surprise inspections more frequent, events chain more often |
| **Hall of Fame** | Brutal. Minimal starting budget, aggressive degradation, cascading failures more likely, no loans |

---

## 8. UI Layout

### 8.1 Main View: Stadium Cross-Section

The primary game view is a **side-view cross-section** of the stadium, rendered in pixel art, showing:

```
+-----------------------------------------------------------------------+
|  [Sky / Weather Layer]                                                |
|  ~~~~~~ clouds ~~~~~~    Sun/Moon    ~~~~~~ rain particles ~~~~~~      |
+-----------------------------------------------------------------------+
|                                                                       |
|            /\          STADIUM EXTERIOR           /\                  |
|           /  \   [Upper Deck Seating]            /  \                 |
|          /    \_____________________________ /    \               |
|         / [Luxury]  [Press]  [Concourse]  [Luxury]  \                |
|        /   Boxes     Box     (General)     Boxes     \               |
|       |__________________________________________________|            |
|       |  [Concessions]  [Restrooms]  [Concessions]       |            |
|       |  [HVAC Room]    [Utility]    [Water Plant]        |            |
|       |________________[Field Level]_____________________|            |
|       |       [Field Drainage Grid - below turf]          |           |
|       |  [Underground: Sewage] [Pipes] [Drainage Tanks]   |           |
+-----------------------------------------------------------------------+
```

- Each section is **clickable** to zoom into that zone
- Systems are visible as animated pixel art components (spinning fans, flowing water, glowing filters)
- **Color-coded health indicators** appear on each component:
  - Green pulse: Healthy (80-100%)
  - Yellow pulse: Degraded (50-79%)
  - Orange pulse: Warning (25-49%)
  - Red flash: Critical/Failed (0-24%)
- Fans (characters) populate seating during game days with mood indicators (happy/neutral/unhappy pixel faces)

### 8.2 HUD (Heads-Up Display)

The HUD is always visible, styled as a **control panel / clipboard** along the top and right edges.

**Top Bar**:
```
+-----------------------------------------------------------------------+
| [Day 34] [Season 1] | [Game Day: vs. Rivals] | [$45,230] | [Rep: 52] |
| [8:15 PM]           | [Attendance: 78%]      | [+$1,200] | [**-->]   |
+-----------------------------------------------------------------------+
```

- **Date/Time**: Current day, time, season
- **Event Status**: Current game or off-day status
- **Bank Balance**: Current funds with daily income/loss indicator
- **Reputation**: Current reputation with trend arrow (up/down/stable)
- **Speed Controls**: Pause, 1x, 2x, 4x buttons

**Right Panel (System Summary)**:
```
+-------------------+
| SYSTEM HEALTH     |
|                   |
| Air:    [====--]  |  78%
| Water:  [=====.]  |  92%
| HVAC:   [===---]  |  65%
| Drain:  [======]  |  100%
|                   |
| ALERTS        (3) |
| ! HVAC Zone 2 hot |
| ! Filter #4 @ 90% |
| i Inspection tmrw  |
|                   |
| STAFF         2/3 |
| [Idle] [Repair]   |
| [Idle]            |
+-------------------+
```

- **System Health Bars**: One per filtration domain, showing aggregate health
- **Alert Feed**: Scrolling list of warnings and notifications, color-coded by severity
- **Staff Status**: Number of available vs. assigned maintenance crew

### 8.3 Detail Panels

Clicking on any system zone opens a **detail panel** as an overlay.

**System Detail View**:
```
+---------------------------------------------+
| AIR QUALITY - Zone: General Concourse    [X] |
+---------------------------------------------+
| Component      | Health | Status   | Action  |
|----------------|--------|----------|---------|
| HEPA Filter #1 | 82%    | Running  | [Maint] |
| HEPA Filter #2 | 34%    | WARNING  | [Repair]|
| Vent Fan A     | 91%    | Running  | [--]    |
| Vent Fan B     | 67%    | Degraded | [Maint] |
| Air Scrubber   | 55%    | Degraded | [Maint] |
+---------------------------------------------+
| Zone AQI: 64          | Target: 70+          |
| Airflow: 12,000 CFM   | Required: 10,000 CFM |
+---------------------------------------------+
| [Upgrade Zone]  [Assign Staff]  [Auto-Maint] |
+---------------------------------------------+
```

- Shows each individual component within the selected zone
- Health percentage, current status, and available actions
- Zone-level aggregate metrics at the bottom
- Quick-action buttons for upgrades, staff assignment, and automation toggle

### 8.4 Shop / Upgrade Screen

Accessible via a **wrench icon** button or hotkey. Styled as a supply catalog.

```
+-------------------------------------------------------+
| FILTRATION SUPPLY CATALOG                          [X] |
+-------------------------------------------------------+
| [Air] [Water] [HVAC] [Drainage] [Staff] [Special]     |
+-------------------------------------------------------+
|                                                        |
| HEPA Filters                                           |
|                                                        |
| [T1] Basic Fiber ............ $500    [CURRENT]        |
| [T2] Pleated HEPA ........... $2,000  [BUY]           |
|      +15 AQI, 2.5x lifespan, +$15/day energy          |
| [T3] Electrostatic .......... $8,000  [LOCKED: Rep 56] |
| [T4] Smart HEPA Array ....... $25,000 [LOCKED: Rep 71] |
|                                                        |
| You have: $45,230    Daily costs will change: +$15/day |
+-------------------------------------------------------+
```

- Tabbed by system category
- Each item shows tier, cost, stat changes, and unlock requirements
- Locked items show their unlock condition
- Running cost impact preview before purchase
- **Staff tab**: Hire/fire maintenance crew, assign specializations
- **Special tab**: Weather station, backup generator, automation tools, cosmetics

### 8.5 Additional Screens

- **Schedule View**: Calendar showing upcoming games, predicted weather, scheduled inspections
- **Financial Report**: Income statement, expense breakdown, trend graphs (pixel-art line charts)
- **Reputation Journal**: Log of reputation changes with causes
- **Tutorial / Handbook**: In-game filtration manual explaining systems (unlocks as player discovers them)

### 8.6 Overlay Modes

Toggle-able visual overlays on the main stadium view:

| Overlay | Shows | Color |
|---------|-------|-------|
| **Air Quality** | AQI per zone, particle density, airflow arrows | White/Gray |
| **Water** | Pipe network, pressure readings, flow direction | Blue |
| **Temperature** | Heat map of all zones | Red-Blue gradient |
| **Drainage** | Drain paths, water levels, capacity utilization | Green |
| **Satisfaction** | Fan happiness per zone | Yellow-Red gradient |

---

## 9. Technical Notes

### Platform Targets

- Primary: Web browser (HTML5 Canvas / WebGL)
- Stretch: Desktop (Electron wrapper or native)

### Resolution

- Base pixel art rendered at **320x180** (16:9), scaled up to display resolution
- UI elements may render at 2x pixel density for readability
- Minimum display: 1280x720

### Performance Targets

- 60 FPS during normal gameplay
- All simulation ticks processed within 16ms
- Save file size under 1MB

### Save System

- Auto-save at end of each game day
- 3 manual save slots
- Save includes: all system states, financial history, reputation log, season progress, upgrade status

### Audio Considerations

- Ambient stadium sounds (crowd murmur scales with attendance)
- System-specific sounds (fan hum, water flow, HVAC cycling)
- Alert sounds for warnings and failures (distinct tones per severity)
- Pixel-appropriate chiptune music for menus and ambiance

---

## Appendix A: First-Time Player Experience

1. **Tutorial Day 1**: Tour of the stadium. Learn to read system health. No stress.
2. **Tutorial Day 2**: First maintenance task. Learn to assign staff and replace a filter.
3. **Tutorial Day 3**: First game day. Low attendance. Systems hold up easily. Learn revenue cycle.
4. **Tutorial Day 4-5**: First weather event (light rain). Learn about drainage. First minor repair.
5. **Day 6+**: Training wheels off. Player manages independently with contextual hints.

The tutorial is integrated into gameplay, not a separate mode. The first few days are scripted to introduce systems gradually. By the end of the first homestand (roughly 6-8 games), the player has been introduced to all four filtration domains.

## Appendix B: Balancing Philosophy

- **No dominant strategy**: Each system upgrade path should have meaningful tradeoffs. Rushing T4 in one system should leave vulnerabilities elsewhere.
- **Recovery is possible**: Even after a bad event chain, a skilled player can recover. The game should feel tense but fair.
- **Meaningful choices**: Every spending decision should feel consequential, especially in early game. Late game choices shift from "can I afford this?" to "what's the highest priority?"
- **Emergent stories**: The interaction between systems, events, and progression should create unique narratives each playthrough ("The Great Sewage Crisis of Season 2" or "The Heatwave Championship").
- **Respectful of time**: A full season should take 3-5 hours of real time. The game should be saveable and resumable at any point.
