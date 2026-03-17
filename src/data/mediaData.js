/**
 * Media headline templates and event/condition pools.
 *
 * Consumed by MediaSystem for generating newspaper headlines based on
 * game state sentiment (positive/negative/neutral) and rival standings.
 */

// -- Headline templates ------------------------------------------------

export const POSITIVE_HEADLINES = [
  '{stadium} Shines After {event}',
  'Fans Cheer as {stadium} Delivers Another Great Day',
  '{stadium} Sets New Standard for Fan Comfort',
  'Record Attendance at {stadium} as Reputation Soars',
  '"Best Experience Ever" Say Fans After {event}',
  '{stadium} Praised for Outstanding Facility Management',
  'Local Hero: {stadium} Wins Over Community',
  '{stadium} Impresses During {event}',
  '"Finally, Clean Air!" Fans Rave About {stadium} Upgrades',
  '{stadium} Named "Hidden Gem" by Visiting Sportswriter',
  'EDITORIAL: The Quiet Miracle at {stadium}',
  '"I Actually Want to Come Back" -- Fans React to {event}',
  '{stadium} Concessions Praised: "Best Hot Dogs in the League"',
  'From Browntide to Prime Time: {stadium}\'s Remarkable Turnaround',
  'Visiting Team Impressed by {stadium} Facilities',
  '"The Water Tastes Like Water Now!" Fans Celebrate {event}',
  '{stadium} Staff Win Hearts With Record-Fast Repairs',
  'Ridgemont PTA Names {stadium} "Family Friendly Venue of the Year"',
  'LETTER TO EDITOR: "My Kid Wants to Be a Stadium Engineer Now"',
  '"No Smell!" Returning Fans Notice Major {stadium} Improvements',
  '{stadium} AC So Good, Fans Refuse to Leave After Game',
  'Off-Season Improvements Prepare {stadium} for Next Season',
  '{stadium} On Track for Stadium of the Year',
  'Opening Day Festivities Kick Off New Season at {stadium}',
];

export const NEGATIVE_HEADLINES = [
  'Fans Grumble After {event} at {stadium}',
  '{stadium} Struggles With {system} Issues',
  'Complaints Mount as {stadium} Quality Drops',
  '"Unacceptable!" Fans React to {condition} at {stadium}',
  '{stadium} Under Fire After Failed {event}',
  'Health Concerns Raised at {stadium}',
  'Attendance Drops as {stadium} Reputation Suffers',
  '{stadium} Faces Backlash Over Poor Conditions',
  '"Worse Than My Garage" -- Fans React to {condition}',
  'Social Media Explodes With {stadium} Complaints After {event}',
  'OPINION: Is {stadium} Even Trying Anymore?',
  'Viral Video Shows {condition} at {stadium}, League Responds',
  '{stadium} Restrooms Rated "Biohazard" on Yelp',
  '"My Dog\'s Kennel Has Better {system}" Says Disgruntled Fan',
  'Glendale Fans Mock {stadium}: "At Least We Have Running Water"',
  '{stadium} Hot Dog Stand Shut Down Due to {condition}',
  '"Bring a Jacket... and a Gas Mask" -- {stadium} Review Goes Viral',
  'Fan Petition to "Fix {stadium} or Close It" Gets {event} Signatures',
  'Victor Salazar Offers "Sympathy" to {stadium} in Press Conference',
  'EXPOSÉ: Inside the Failing Infrastructure of {stadium}',
  'Children\'s Birthday Party Ruined by {condition} at {stadium}',
  'Pipe Freeze Damages {stadium} Water Systems During Cold Snap',
  '{event} Incident Rattles Fans at {stadium}',
];

export const NEUTRAL_HEADLINES = [
  '{stadium} Holds Steady Through {event}',
  'Another Day at {stadium}: Fans Report Mixed Reviews',
  '{stadium} Manages Through {event} Without Incident',
  'League Roundup: {stadium} Keeps Pace',
  '{stadium} Season Continues With Modest Results',
  '"It Was Fine, I Guess" -- The {stadium} Experience',
  'WEATHER: {event} Affects Turnout at {stadium}',
  '{stadium} Neither Impresses Nor Disappoints, Sources Say',
  'Stadium Rankings: {stadium} Holds Position at Number... Something',
  '{stadium} Concourse Traffic Report: Moderate',
  'BRIEF: {event} at {stadium}. Fans Survive.',
  'Area Man Reports "Adequate" Experience at {stadium}',
  'Off-Season Renovations Underway at Historic {stadium}',
  'Scout Night Brings Big-League Eyes to Minor League Diamond',
];

export const RIVAL_POSITIVE_HEADLINES = [
  'Ridgemont Surpasses Glendale in League Quality Rankings!',
  'Victor Salazar Refuses to Comment on {stadium}\'s Rise',
  '"We\'re Better Than Glendale Now" Chant Erupts at {stadium}',
  'Grizzlies Fans Caught Sneaking Into {stadium} for Better Seats',
  'POLL: Fans Prefer {stadium} Over Glendale 3-to-1',
  'Victor Seen Nervously Googling "{stadium} Upgrades"',
  'League Awards Committee "Very Impressed" With {stadium}',
];

export const RIVAL_NEGATIVE_HEADLINES = [
  'Glendale Opens New Wing While {stadium} Struggles',
  'Victor Salazar: "Ridgemont Is No Competition for Us"',
  'Grizzlies Stadium Named "Superior Facility" Over {stadium}',
  '"Even Glendale Has Better Plumbing" -- Frustrated {stadium} Fan',
  'Victor Sends Condolence Flowers to {stadium} Front Office',
  'Glendale PR Tweets Comparison of Their Restrooms vs. {stadium}\'s',
];

export const EVENTS_POSITIVE = [
  'Sold-Out Weekend', 'Perfect Inspection Score', 'VIP Night Success',
  'Championship Preparation', 'Charity Event', 'Rival Victory',
  'System Upgrades', 'Record Profits', 'Fan Appreciation Day',
  'Perfect Game', 'Scout Visit', 'Sponsor Bonus',
  'Bobblehead Night', 'Free Hot Dog Promotion', 'Fireworks Night',
  'Little League Visit', 'Military Appreciation Game', 'Alumni Day',
  'Record Concession Sales', 'Zero-Complaint Game Day',
  'Research Breakthrough', 'Stadium Expansion', 'Off-Season Upgrades',
  'Opening Day Festivities',
];

export const EVENTS_NEGATIVE = [
  'Equipment Failures', 'Health Inspection', 'Pipe Burst',
  'Power Outage', 'Sewage Incident', 'Budget Cuts',
  'Poor Inspection Results', 'Pest Problems',
  'Overflowing Toilets', 'AC Meltdown', 'Brown Water Alert',
  'Mysterious Smell', 'Fan Evacuation Scare', 'Concession Shutdown',
  'Sponsor Walkout', 'Duct Collapse', 'Pipe Freeze', 'Cold Snap Damage',
];

export const EVENTS_NEUTRAL = [
  'Midweek Game', 'Weather Delay', 'Regular Season Play',
  'Routine Maintenance', 'Staff Changes',
  'Tuesday Night Baseball', 'Mid-Season Slump', 'Trade Deadline Day',
  'Rain Delay', 'Scheduled Off-Day', 'Minor System Update',
  'Off-Season Renovation', 'Scout Night',
];

export const SYSTEM_NAMES = ['Air Quality', 'Water Filtration', 'HVAC', 'Drainage'];

export const CONDITIONS_NEGATIVE = [
  'Poor Air Quality', 'Water Issues', 'Uncomfortable Temperatures',
  'Drainage Failures', 'System Breakdowns', 'Sewage Odors',
  'Brown Tap Water', 'Sweltering Heat', 'Freezing Concourse',
  'Backed-Up Drains', 'Flickering Lights',
];
