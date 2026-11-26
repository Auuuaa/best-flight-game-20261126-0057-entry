// Alpine Courier — the ring course: a route of glowing target rings strung down
// the valley, each one a decision about line, speed and altitude.

import { ROUTE, SCORING } from './config.js';
import { makeRng, range } from './random.js';

// Lay out one route's rings. Ring altitudes wander so the pilot climbs, dives
// and threads the valley instead of holding one height.
export function buildCourse(seed, routeIndex) {
  const rng = makeRng(seed * 911 + routeIndex * 37 + 5);
  const rings = [];
  let altitude = 1600;
  for (let i = 0; i < ROUTE.ringCount; i++) {
    const drift = range(rng, -900, 900);
    altitude = Math.max(ROUTE.ringMinAlt, Math.min(ROUTE.ringMaxAlt, altitude + drift));
    rings.push({
      index: i,
      x: ROUTE.firstRingAt + i * ROUTE.ringSpacing,
      altitude,
      radius: ROUTE.ringRadius,
      passed: false,
      missed: false,
    });
  }
  return { rings, next: 0, combo: 0 };
}

// Did the plane cross the next ring's plane this step? prevX/newX are the
// plane's distances before and after the step; alt is its altitude in feet.
// Returns 'hit', 'miss' or null.
export function checkRing(course, prevX, newX, alt) {
  const ring = course.rings[course.next];
  if (!ring) return null;
  if (newX < ring.x || prevX >= ring.x) return null;
  const dyFeet = Math.abs(alt - ring.altitude);
  const dyPixels = dyFeet * 0.09;
  if (dyPixels <= ring.radius) {
    ring.passed = true;
    course.next += 1;
    course.combo = Math.min(course.combo + SCORING.comboStep, SCORING.maxCombo);
    return 'hit';
  }
  ring.missed = true;
  course.next += 1;
  course.combo = 0;
  return 'miss';
}

// Points for threading a ring at the current combo.
export function ringPoints(course) {
  return ROUTE.ringScore * Math.max(1, course.combo);
}

export function ringsLeft(course) {
  return course.rings.length - course.next;
}

export function courseDone(course) {
  return course.next >= course.rings.length;
}
