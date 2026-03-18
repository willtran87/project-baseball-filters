/**
 * domainZoneMap — Defines which zones each domain's infrastructure protects.
 *
 * Every domain provides full coverage to ALL zones because infrastructure
 * routes through the entire stadium. The routing paths explain how:
 *
 * Water:  Mechanical (treatment plant) → Underground (mains) → Field (sprinklers)
 *         → Concourse (restrooms/fountains) → Luxury (suite plumbing) → Pressbox (break room)
 *
 * Air:    Mechanical (AHU) → Concourse (main halls) → Luxury (suite vents)
 *         → Pressbox (broadcast booth) → Field (open air circulation) → Underground (ventilation)
 *
 * HVAC:   Mechanical (chillers/boilers) → Underground (trunk lines) → Concourse (zone valves)
 *         → Luxury (individual climate) → Pressbox (server cooling) → Field (radiant systems)
 *
 * Drainage: Underground (storm sewers) → Field (SubAir/french drains)
 *           → Concourse (floor drains) → Mechanical (sump pumps) → Luxury (waste lines) → Pressbox (roof drains)
 *
 * Electrical: Mechanical (main switchgear) → Underground (conduit runs) → Field (scoreboard/lights)
 *             → Concourse (lighting/POS) → Luxury (suite power) → Pressbox (broadcast equipment)
 *
 * Pest:   Concourse (food court/trash) → Underground (tunnels/nesting) → Mechanical (warm equipment)
 *         → Luxury (suite dining) → Field (grounds/turf) → Pressbox (storage areas)
 */

export const DOMAIN_ZONE_PROTECTION = {
  water:      ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
  air:        ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
  hvac:       ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
  drainage:   ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
  electrical: ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
  pest:       ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'],
};

export const ALL_ZONES = ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'];
