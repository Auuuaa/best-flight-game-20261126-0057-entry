// Alpine Courier — the bush plane: throttle, pitch, lift, stall, fuel and damage.
// The model is arcade on purpose: speed answers the throttle, the wing answers
// the speed, and the pilot answers for both.

import { PLANE, ROUTE } from './config.js';

export function makePlane() {
  return {
    // Distance flown along the valley, in px.
    distance: 0,
    altitude: ROUTE.runwayAlt + 2, // ft above sea level, parked on the strip
    speed: 0, // knots
    verticalSpeed: 0, // ft/s, positive climbs
    throttle: 0, // 0..1
    pitch: 0, // -1 (full down) .. 1 (full up), smoothed
    bank: 0, // radians of visual bank
    heading: 90, // degrees — 090 is due east, down the valley
    fuel: PLANE.fuelCapacity,
    damage: 0,
    airborne: false,
    landed: true,
    takeoffGrace: 0, // seconds after liftoff during which the strip is ignored
    // Crash / landing flags set by step() for the game to react to.
    justHitTerrain: false,
    justLanded: false,
    justCrashed: false,
  };
}

// One physics step. input: { pitchUp, pitchDown, throttleUp, throttleDown,
// airbrake }. dt in seconds. wind is the current vertical gust in ft/s.
export function stepPlane(plane, input, dt, wind) {
  plane.justHitTerrain = false;
  plane.justLanded = false;
  plane.justCrashed = false;
  plane.takeoffGrace = Math.max(0, plane.takeoffGrace - dt);

  // Throttle answers in smooth steps; the airbrake kills speed fast.
  if (input.throttleUp) plane.throttle = Math.min(1, plane.throttle + dt * 0.55);
  if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - dt * 0.7);
  if (input.airbrake) plane.throttle = Math.max(0, plane.throttle - dt * 1.4);

  // Pitch input is smoothed so the nose moves like a control surface, not a switch.
  const targetPitch = (input.pitchUp ? 1 : 0) - (input.pitchDown ? 1 : 0);
  plane.pitch += (targetPitch - plane.pitch) * Math.min(1, dt * 6);
  plane.bank += (plane.pitch * PLANE.turnBank - plane.bank) * Math.min(1, dt * 5);

  // Target speed follows the throttle; climbing costs speed, diving buys it back.
  let targetSpeed = PLANE.minSpeed + plane.throttle * (PLANE.maxSpeed - PLANE.minSpeed);
  targetSpeed -= plane.pitch * 34;
  if (input.airbrake) targetSpeed = Math.min(targetSpeed, 95);
  const accel = plane.airborne ? 26 : 40;
  plane.speed += Math.max(-60 * dt, Math.min(accel * dt, targetSpeed - plane.speed));
  plane.speed = Math.max(0, plane.speed);

  // Lift: below stall speed the wing gives up and the plane sinks hard.
  const flying = plane.speed >= PLANE.stallSpeed;
  let climbTarget = 0;
  if (plane.airborne) {
    climbTarget = plane.pitch * PLANE.climbRate * Math.min(1, plane.speed / PLANE.cruiseSpeed);
    if (!flying) climbTarget = -PLANE.stallSink;
    climbTarget += wind;
  }
  plane.verticalSpeed += (climbTarget - plane.verticalSpeed) * Math.min(1, dt * 3.2);
  plane.altitude += plane.verticalSpeed * dt;

  // Heading drifts with the climb and the wind: a climbing plane noses left of
  // the valley, a diving one right of it. It is the compass the HUD shows.
  const headingTarget = 90 - plane.pitch * 14 - wind * 0.02;
  plane.heading += (headingTarget - plane.heading) * Math.min(1, dt * 2);

  // Takeoff: enough speed on the strip and the plane leaves the ground.
  // The grace window keeps the liftoff frame from counting as a landing:
  // vertical speed is still ramping up from zero in that first frame.
  if (!plane.airborne && plane.speed > 78 && plane.pitch > 0.25) {
    plane.airborne = true;
    plane.landed = false;
    plane.takeoffGrace = 0.6;
  }

  // Fuel: the throttle is what drinks it.
  if (plane.airborne || plane.speed > 30) {
    plane.fuel = Math.max(0, plane.fuel - (PLANE.fuelBurnBase + plane.throttle * PLANE.fuelBurnThrottle) * dt);
  }
  // Out of fuel the engine quits: throttle dies and the plane glides down.
  if (plane.fuel <= 0) {
    plane.throttle = Math.max(0, plane.throttle - dt);
    if (plane.airborne) plane.verticalSpeed = Math.min(plane.verticalSpeed, -160);
  }

  // Distance only grows while the wheels are turning or the wing is flying.
  if (plane.speed > 4) plane.distance += plane.speed * 1.7 * dt;
  if (plane.altitude > PLANE.maxAltitude) {
    plane.altitude = PLANE.maxAltitude;
    plane.verticalSpeed = Math.min(0, plane.verticalSpeed);
  }
}

// The ground (or runway) is under the plane: decide between a landing, a
// bounce and a crash. Returns nothing; sets the plane's just* flags.
export function resolveGroundContact(plane, groundAlt, onRunway) {
  if (plane.altitude > groundAlt + 2 || plane.speed <= 4) return;
  plane.altitude = groundAlt;
  if (!plane.airborne) return; // still taxiing on the strip
  if (plane.takeoffGrace > 0) return; // just lifted off — not a landing
  if (plane.verticalSpeed > 0) return; // climbing away — a takeoff, not a landing

  const gentle = Math.abs(plane.verticalSpeed) <= PLANE.safeLandingSink;
  const slow = plane.speed <= PLANE.safeLandingSpeed;
  if (onRunway && gentle && slow) {
    plane.airborne = false;
    plane.landed = true;
    plane.verticalSpeed = 0;
    plane.justLanded = true;
    return;
  }
  if (onRunway && gentle && !slow) {
    // Too fast for the strip: a hard bounce, gear damage, keep rolling.
    plane.damage = Math.min(PLANE.maxDamage, plane.damage + 10);
    plane.verticalSpeed = 190;
    plane.speed *= 0.72;
    plane.justHitTerrain = true;
    return;
  }
  // Rough ground or a mountain: a strike, a bounce, and real damage.
  plane.damage = Math.min(PLANE.maxDamage, plane.damage + PLANE.damagePerHit);
  plane.verticalSpeed = 240;
  plane.speed *= 0.6;
  plane.justHitTerrain = true;
  if (plane.damage >= PLANE.maxDamage) {
    plane.justCrashed = true;
    plane.airborne = false;
    plane.speed = 0;
  }
}

// Servicing after a good landing: full tanks, patched airframe.
export function servicePlane(plane) {
  plane.fuel = PLANE.fuelCapacity;
  plane.damage = 0;
}
