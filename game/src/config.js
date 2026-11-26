// Alpine Courier — tuning constants for the flight model, the valley and the route.
// Every number here is a gameplay decision, not a magic value: keep them in one
// place so a balance pass touches this file and nothing else.

export const VIEW = {
  width: 1280,
  height: 800,
  planeScreenX: 420,
  groundScreenY: 700,
  feetPerPixel: 1 / 0.09,
};

export const PLANE = {
  // Speeds in knots, altitudes in feet, fuel in percent.
  minSpeed: 55,
  maxSpeed: 225,
  cruiseSpeed: 140,
  stallSpeed: 70,
  climbRate: 620, // ft/s at full pitch up and healthy speed
  sinkRate: 520, // ft/s at full pitch down
  stallSink: 420, // ft/s when the wing stops flying — hard, but recoverable
  maxAltitude: 6000,
  turnBank: 0.5, // radians of visual bank at full pitch change
  fuelCapacity: 100,
  fuelBurnBase: 0.045, // %/s just to stay airborne
  fuelBurnThrottle: 0.38, // %/s at full throttle
  fuelPerRing: 6, // bonus fuel for threading a ring
  damagePerHit: 25, // terrain strike
  maxDamage: 100,
  safeLandingSpeed: 135, // kts — any faster and the runway punishes you
  safeLandingSink: 260, // ft/s — any harder and the gear folds
};

export const ROUTE = {
  ringCount: 8,
  firstRingAt: 3200, // px of distance along the valley
  ringSpacing: 2600, // px between rings
  ringRadius: 95, // px — generous, the game is about lines, not pixel hunts
  ringMinAlt: 900, // ft
  ringMaxAlt: 4300, // ft
  runwayLength: 950, // px of flat strip at the end of the route
  runwayAlt: 420, // ft — the valley floor
  ringScore: 100,
  landingBonus: 500,
  fuelBonusScore: 5, // points per percent of fuel left on landing
};

export const WORLD = {
  seedDefault: 7,
  peakMinAlt: 1400, // ft — lowest mountain crest
  peakMaxAlt: 2600, // ft — highest crest on later routes
  valleyFloor: 380, // ft — lowest ground between the peaks
  cloudCount: 14,
  treeSpacing: 90,
};

export const SCORING = {
  comboStep: 1, // each ring in a row adds +1 to the multiplier
  maxCombo: 8,
};
