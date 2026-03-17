# Minor League Major Filtration

A pixel-art management simulation where you play as the Filtration Manager of a minor-league baseball stadium. Monitor air quality, water systems, HVAC, and drainage to keep fans happy, pass inspections, and grow your stadium into a championship venue.

## Gameplay

- **4 Filtration Domains**: Air, Water, HVAC, and Drainage — each with independent health systems
- **6 Stadium Zones**: Field, Concourse, Mechanical, Underground, Luxury Boxes, and Press Box
- **Staff Management**: Hire, assign, and specialize crew members across domains
- **Sponsor Contracts**: Reputation-gated deals with quality requirements and breach penalties
- **Story Progression**: 6-chapter narrative with rival stadiums, media coverage, and milestone unlocks
- **Dynamic Events**: Weather, inspections, equipment failures, and crowd surges test your preparedness

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5 Canvas (pixel-art rendering)
- No build step required

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

| Key | Action |
|-----|--------|
| **S** | Shop |
| **F** | Crew |
| **J** | Journal |
| **N** | News |
| **C** | Deals |
| **G** | Systems |
| **Space** | Pause |
| **1-3** | Game Speed |
| **M** | Mute |
| **Esc** | Menu |

## Project Structure

```
src/
├── engine/       # Game loop, state management, event bus, save/load
├── systems/      # Filtration, economy, events, progression, staff, story
├── rendering/    # Canvas renderer, sprites, tilemap, zones, particles
├── ui/           # HUD, panels, shop, tooltips, input handling
├── assets/       # Sprite definitions, portraits, palette, sounds
└── data/         # Game config, NPC dialogue, story data, tech tree
```

## License

MIT
