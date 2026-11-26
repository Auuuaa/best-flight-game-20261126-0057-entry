// Alpine Courier — deterministic screenshot staging. A URL like
// ?shot=play&seed=7 freezes the game in a composed state so the screenshots
// are reproducible: the same seed always renders the same frame. The states
// mirror real play — a title on the strip, a mid-flight ring approach, the
// moment of threading a ring, and a finished route — never a mockup.

import { ROUTE } from './config.js';

export function readShotParams(search) {
  const params = new URLSearchParams(search);
  return {
    shot: params.get('shot'),
    seed: Number(params.get('seed') || 7),
  };
}

// Stage the game for a screenshot. Returns true when a shot was staged.
export function stageShot(game, shot, seed) {
  if (!shot) return false;
  game.seed = seed;
  game.startRoute(seed, 0);
  const { plane, course, valley } = game;
  if (shot === 'start') {
    game.state = 'title';
    plane.distance = 120;
    plane.altitude = ROUTE.runwayAlt + 2;
    plane.speed = 0;
    plane.throttle = 0;
    game.cameraY = plane.altitude - 2400;
    return true;
  }
  if (shot === 'play') {
    game.state = 'playing';
    const ring = course.rings[2];
    plane.distance = ring.x - 620;
    plane.altitude = ring.altitude - 260;
    plane.speed = 152;
    plane.throttle = 0.72;
    plane.pitch = 0.35;
    plane.airborne = true;
    plane.landed = false;
    plane.fuel = 71;
    game.score = 480;
    course.next = 2;
    course.combo = 2;
    game.cameraY = plane.altitude - 2400;
    return true;
  }
  if (shot === 'ring') {
    game.state = 'playing';
    const ring = course.rings[3];
    plane.distance = ring.x - 40;
    plane.altitude = ring.altitude;
    plane.speed = 168;
    plane.throttle = 0.8;
    plane.pitch = 0.1;
    plane.airborne = true;
    plane.landed = false;
    plane.fuel = 64;
    game.score = 940;
    course.next = 3;
    course.combo = 3;
    ring.passed = true;
    course.next = 4;
    game.cameraY = plane.altitude - 2400;
    game.flash = { text: 'RING +400', until: Number.MAX_SAFE_INTEGER };
    return true;
  }
  if (shot === 'end') {
    game.state = 'complete';
    plane.distance = valley.runwayStart + 500;
    plane.altitude = ROUTE.runwayAlt + 2;
    plane.speed = 0;
    plane.throttle = 0;
    plane.airborne = false;
    plane.landed = true;
    plane.fuel = 38;
    game.score = 2480;
    course.next = course.rings.length;
    for (const r of course.rings) r.passed = true;
    game.cameraY = plane.altitude - 2400;
    return true;
  }
  return false;
}
