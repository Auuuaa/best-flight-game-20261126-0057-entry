// Alpine Courier — the valley itself: ground profile, mountain ridges, the river,
// the pine forest and the runway strip. Everything is a pure function of the
// seed and the route number, so the same valley renders identically every time.

import { VIEW, WORLD, ROUTE } from './config.js';
import { makeRng, range, intRange, makeNoise1D } from './random.js';

// Build a valley for one route. routeIndex 0 is the first valley; later routes
// raise the peaks and tighten the flying.
export function buildValley(seed, routeIndex) {
  const rng = makeRng(seed * 1000 + routeIndex * 77 + 13);
  const peakCeiling = WORLD.peakMinAlt + (WORLD.peakMaxAlt - WORLD.peakMinAlt) * Math.min(routeIndex * 0.25, 1);
  const ridgeNoise = makeNoise1D(rng, 26, 900);
  const floorNoise = makeNoise1D(rng, 40, 520);

  const routeLength = ROUTE.firstRingAt + ROUTE.ringCount * ROUTE.ringSpacing + 2200;
  const runwayStart = ROUTE.firstRingAt + ROUTE.ringCount * ROUTE.ringSpacing + 900;
  const runwayEnd = runwayStart + ROUTE.runwayLength;
  // The departure strip at the head of the valley: flat ground where the
  // plane parks, takes off and the title screen sits.
  const startStripStart = -200;
  const startStripEnd = 1100;

  // Ground altitude in feet at distance x (px along the valley).
  function groundAlt(x) {
    if (x >= startStripStart && x <= startStripEnd) return ROUTE.runwayAlt;
    if (x >= runwayStart && x <= runwayEnd) return ROUTE.runwayAlt;
    // Blend the runway shelf into the valley floor near its ends.
    const nearRunway =
      Math.max(0, 1 - Math.abs(x - (runwayStart + runwayEnd) / 2) / (ROUTE.runwayLength * 1.6));
    const floor = WORLD.valleyFloor + floorNoise(x) * 220;
    const peaks = WORLD.valleyFloor + 260 + ridgeNoise(x) * (peakCeiling - WORLD.valleyFloor - 260);
    const mountain = floor + (peaks - floor) * 0.35;
    let ground = mountain * (1 - nearRunway * 0.85) + ROUTE.runwayAlt * nearRunway * 0.85;
    // The approach: the last stretch before the runway slopes down to strip
    // level, so a pilot can see the runway and descend onto it instead of
    // meeting a hill at the end of the route.
    const approachStart = runwayStart - 3000;
    if (x > approachStart && x < runwayStart) {
      const t = (x - approachStart) / (runwayStart - approachStart);
      ground = ground * (1 - t * 0.85) + ROUTE.runwayAlt * t * 0.85;
    }
    return ground;
  }

  // The river winds along the valley floor; its centre line in feet of altitude.
  const riverNoise = makeNoise1D(rng, 18, 1400);
  function riverAlt(x) {
    return WORLD.valleyFloor - 40 + riverNoise(x) * 120;
  }

  // Pine positions: x along the valley, altitude pinned to the ground there.
  const trees = [];
  for (let x = 300; x < routeLength; x += WORLD.treeSpacing) {
    if (x >= startStripEnd - 120 && x <= startStripEnd + 120) continue;
    if (x >= runwayStart - 120 && x <= runwayEnd + 120) continue;
    if (rng() < 0.55) {
      trees.push({ x, size: range(rng, 0.7, 1.5), lean: range(rng, -0.08, 0.08) });
    }
  }

  // Clouds drift slowly above the valley.
  const clouds = [];
  for (let i = 0; i < WORLD.cloudCount; i++) {
    clouds.push({
      x: range(rng, 0, routeLength),
      y: range(rng, 60, 300),
      scale: range(rng, 0.6, 1.6),
      speed: range(rng, 4, 12),
    });
  }

  // Far ridge silhouettes for parallax: two layers, each a list of peaks.
  const ridges = [0.35, 0.6].map((parallax, layer) => {
    const layerRng = makeRng(seed * 31 + routeIndex * 7 + layer * 101);
    const peaks = [];
    let x = -200;
    while (x < routeLength * parallax + 1600) {
      peaks.push({ x, height: range(layerRng, 180, 420) * (1 - layer * 0.25) });
      x += range(layerRng, 260, 520);
    }
    return { parallax, peaks, base: 430 - layer * 90 };
  });

  // The windsock at the runway threshold, for the landing line-up.
  const windsock = { x: runwayStart + 60, alt: ROUTE.runwayAlt };

  return {
    seed,
    routeIndex,
    routeLength,
    runwayStart,
    runwayEnd,
    startStripStart,
    startStripEnd,
    groundAlt,
    riverAlt,
    trees,
    clouds,
    ridges,
    windsock,
    // Convert an altitude in feet to a screen y for a camera whose ground line
    // sits at VIEW.groundScreenY when the camera is at rest.
    altToScreenY(alt, cameraY) {
      return VIEW.groundScreenY - (alt - cameraY) * 0.09;
    },
  };
}

// Where the ground meets the plane: returns the ground altitude under the plane.
export function groundUnder(valley, distanceX) {
  return valley.groundAlt(distanceX);
}

// True when the plane's wheels are over a strip: the departure strip or the
// runway at the end of the route. Landings count on the runway only.
export function overRunway(valley, distanceX) {
  return distanceX >= valley.runwayStart && distanceX <= valley.runwayEnd;
}

export function overStrip(valley, distanceX) {
  return distanceX >= valley.startStripStart && distanceX <= valley.startStripEnd;
}
