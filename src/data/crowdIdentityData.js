// Crowd Identity Data — Names, personalities, stats for all walking sprites

// ── Name Pools (separate from StaffSystem to avoid coupling) ──────────
export const CROWD_FIRST_NAMES = [
  'Steve', 'Marcus', 'Terrell', 'Jimmy', 'Hector', 'Brandon', 'Kevin',
  'Darnell', 'Kyle', 'Omar', 'Jamal', 'Brent', 'Phil', 'Theo', 'Corey',
  'Andre', 'Malik', 'Travis', 'Dustin', 'Ricky', 'Oscar', 'Nolan',
  'Wendell', 'Clay', 'Reggie', 'Jerome', 'Trent', 'Blake', 'Xavier', 'Eli',
  'Maria', 'Linda', 'Keisha', 'Brenda', 'Tamika', 'Crystal', 'Yolanda',
  'Heather', 'Ashley', 'Monica', 'Sandra', 'Denise', 'Jasmine', 'Tina',
  'Carmen', 'Shantel', 'Dana', 'Tonya', 'Nicole', 'Amber', 'Kelly',
  'Patricia', 'Valerie', 'Megan', 'Rosa', 'Gina', 'Simone', 'Wendy', 'Joy', 'Lena',
];

export const CROWD_LAST_NAMES = [
  'Martinez', 'Johnson', 'Williams', 'Garcia', 'Brown', 'Davis', 'Rodriguez',
  'Wilson', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green',
  'Adams', 'Baker', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Turner', 'Phillips', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart',
  'Morales', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper',
  'Reed', 'Bailey', 'Bell', 'Howard', 'Ward', 'Torres', 'Sanders', 'Price',
  'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long',
];

// ── Fan Personalities (16 archetypes) ─────────────────────────────────
export const FAN_PERSONALITIES = [
  { id: 'diehard', label: 'Die-hard Fan', quote: "Raptors 'til I die!" },
  { id: 'heckler', label: 'Heckler', quote: 'Come on, ump! Get some glasses!' },
  { id: 'firstTimer', label: 'First-timer', quote: "Wow, this place is bigger than I thought!" },
  { id: 'hotdogAddict', label: 'Hot Dog Addict', quote: "I'm here for Big Tony's dogs, honestly." },
  { id: 'superstitious', label: 'Superstitious Fan', quote: 'Same seat, same hat, same outcome.' },
  { id: 'scorekeeper', label: 'Scorekeeper', quote: 'Got my pencil and my scorebook. Old school.' },
  { id: 'casualFan', label: 'Casual Fan', quote: "Wait, what inning is it?" },
  { id: 'familyOuting', label: 'Family Outing', quote: "The kids love coming here." },
  { id: 'loyalist', label: 'Season Ticket Holder', quote: "Been in this seat since '94." },
  { id: 'photoFan', label: 'Phone Fan', quote: 'Hold on, I need to get a selfie with the mascot.' },
  { id: 'statistician', label: 'Stats Nerd', quote: "Did you know the Raptors' OBP this month is .347?" },
  { id: 'oldTimer', label: 'Old-Timer', quote: "This ballpark's got soul. They don't build 'em like this anymore." },
  { id: 'loudmouth', label: 'Loud Fan', quote: "LET'S GOOOO RAPTORS!" },
  { id: 'sleeper', label: 'Nodding Off', quote: "Huh? ...great at-bat." },
  { id: 'nacho', label: 'Nacho Enthusiast', quote: 'The nachos here are criminally underrated.' },
  { id: 'beerLover', label: 'Beer Connoisseur', quote: "Cold one and a ballgame. Doesn't get better." },
];

// ── Worker Data ───────────────────────────────────────────────────────
export const WORKER_JOB_TITLES = [
  'Grounds Crew', 'Concessions', 'Security', 'Maintenance',
  'Custodial', 'Electrical', 'Plumbing', 'HVAC Technician',
  'Parking Attendant', 'Usher', 'Equipment Manager', 'Scoreboard Ops',
];

export const WORKER_BIOS = [
  'Been here since the stadium opened.',
  'Third year on the crew. Knows every back hallway.',
  'Just started last week. Still learning the ropes.',
  'Transferred from Glendale. Much happier here.',
  'Works double shifts on game days.',
  'Keeps a toolbox that weighs more than most people.',
  'Knows every shortcut in the building.',
  'Moonlights as a little league coach.',
];

// ── VIP Data ──────────────────────────────────────────────────────────
export const VIP_TITLES = [
  'Corporate Box Guest', 'Season Ticket Premium', 'Board Member',
  'Sponsor Representative', 'League Official', 'City Council Member',
  'Local Business Owner', 'Celebrity Guest',
];

export const VIP_COMPANIES = [
  'Pinnacle Partners', 'Ridgemont Savings Bank', 'ValleyCo Industries',
  'GreenLeaf Organics', 'Metro Development Group', 'Eastside Motors',
  'Summit Financial', 'BlueRidge Consulting', 'Heritage Insurance',
  'Lakewood Properties', 'Ironhill Construction', 'Coastal Media Group',
];

// ── Raptors Roster Template ───────────────────────────────────────────
export const RAPTORS_POSITIONS = [
  { pos: 'C',  label: 'Catcher' },
  { pos: '1B', label: 'First Base' },
  { pos: '2B', label: 'Second Base' },
  { pos: 'SS', label: 'Shortstop' },
  { pos: '3B', label: 'Third Base' },
  { pos: 'LF', label: 'Left Field' },
  { pos: 'CF', label: 'Center Field' },
  { pos: 'RF', label: 'Right Field' },
  { pos: 'DH', label: 'Designated Hitter' },
  { pos: 'P',  label: 'Starting Pitcher' },
  { pos: 'UTIL', label: 'Utility' },
  { pos: 'UTIL', label: 'Utility' },
  { pos: 'PH', label: 'Pinch Hitter' },
  { pos: 'PR', label: 'Pinch Runner' },
  { pos: 'C2', label: 'Backup Catcher' },
  { pos: 'RP', label: 'Relief Pitcher' },
  { pos: 'RP', label: 'Relief Pitcher' },
  { pos: 'RP', label: 'Relief Pitcher' },
  { pos: 'SU', label: 'Setup Man' },
  { pos: 'CL', label: 'Closer' },
];

export const PLAYER_FIRST_NAMES = [
  'J.', 'D.', 'K.', 'T.', 'R.', 'M.', 'A.', 'C.', 'B.', 'E.',
  'Mike', 'Carlos', 'Derek', 'Trey', 'Manny', 'Jake', 'Luis',
  'Brandon', 'Nolan', 'Ty', 'Cal', 'Ozzie', 'Bo', 'Dustin', 'Chase',
];

export const PLAYER_LAST_NAMES = [
  'Rodriguez', 'Chen', 'Jackson', 'Torres', 'Bell', 'Vaughn', 'Delgado',
  'Crawford', 'Ramirez', 'Mitchell', 'Kowalski', 'Grant', 'Peralta',
  'Nakamura', 'Okafor', 'Gibson', 'Moreno', 'Walsh', 'Banks', 'Vega',
  'Cruz', 'Fielder', 'Reyes', 'Harper', 'Guerrero', 'Santiago', 'Abbott',
  'Sandoval', 'McCoy', 'Dunn',
];

// ── Away Team Names (mapped to AWAY_COLOR_SCHEMES indices) ────────────
export const AWAY_TEAM_NAMES = [
  'Lakewood Blue Jays',
  'Greenfield Shamrocks',
  'Ember City Foxes',
  'Crescent City Monarchs',
  'Red Bluff Cardinals',
  'Harbor Point Anchors',
  'Goldfield Miners',
  'Bayshore Pelicans',
];

// ── Mascot Identity ───────────────────────────────────────────────────
export const MASCOT_IDENTITY = {
  name: 'Rally the Raptor',
  title: 'Team Mascot',
  personality: 'Energetic, goofy, beloved by kids. Never breaks character.',
  quote: '*enthusiastic raptor noises*',
  funFact: 'Rally has a 47-game streak of correctly predicting the 7th inning stretch song.',
};
