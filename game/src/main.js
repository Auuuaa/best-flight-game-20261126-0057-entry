// Alpine Courier — the game itself: states, the loop, the wind, the score and
// the wiring between the plane, the valley, the rings, the HUD and the sound.
// A bush plane, a mountain valley, eight rings and one runway home.

import { VIEW, PLANE, ROUTE, WORLD } from './config.js';
import { buildValley, groundUnder, overRunway, overStrip } from './terrain.js';
import { makePlane, stepPlane, resolveGroundContact, servicePlane } from './plane.js';
import { buildCourse, checkRing, ringPoints, courseDone } from './rings.js';
import { makeInput, bindInput, consume } from './input.js';
import { makeAudio, updateEngineSound, playRingChime, playThud, playLandingJingle } from './audio.js';
import { drawHud, drawBanner, drawTitleScreen, drawPausedScreen, drawCrashedScreen, drawCompleteScreen } from './hud.js';
import { renderWorld, makeParticles, addBurst, stepParticles } from './render.js';
import { readShotParams, stageShot } from './shots.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = makeInput();
  bindInput(input, canvas);
  const audio = makeAudio();
  const game = {
    canvas,
    ctx,
    input,
    audio,
    state: 'title',
    seed: WORLD.seedDefault,
    route: 0,
    score: 0,
    valley: null,
    course: null,
    plane: null,
    particles: makeParticles(),
    cameraY: -1980,
    wind: 0,
    windTarget: 0,
    flash: null,
    shotMode: false,
    lastTime: 0,
    exhaustAcc: 0,
  };
  game.startRoute = function startRoute(seed, routeIndex) {
    game.seed = seed;
    game.route = routeIndex;
    game.valley = buildValley(seed, routeIndex);
    game.course = buildCourse(seed, routeIndex);
    game.plane = makePlane();
    game.plane.distance = 120;
    game.plane.altitude = ROUTE.runwayAlt + 2;
    game.cameraY = game.plane.altitude - 2400;
    game.wind = 0;
    game.windTarget = 0;
    game.flash = null;
    game.particles.length = 0;
  };
  game.startRoute(game.seed, 0);
  return game;
}

function showFlash(game, text, ms) {
  game.flash = { text, until: performance.now() + ms };
}

function updateWind(game, dt) {
  // Gusts wander slowly and push the plane up or down a little.
  game.windTarget += (Math.random() - 0.5) * 14 * dt;
  game.windTarget = Math.max(-70, Math.min(70, game.windTarget));
  game.wind += (game.windTarget - game.wind) * Math.min(1, dt * 0.8);
}

function updatePlaying(game, dt, now) {
  const { plane, valley, course, input } = game;
  // Mouse steering: hold the button and the nose follows the pointer.
  if (input.mouseDown && input.mouseY !== null) {
    const rect = game.canvas.getBoundingClientRect();
    const scale = game.canvas.height / rect.height;
    const planeY = valley.altToScreenY(plane.altitude, game.cameraY);
    const targetY = (input.mouseY - rect.top) * scale;
    input.pitchUp = targetY < planeY - 14;
    input.pitchDown = targetY > planeY + 14;
  }
  const prevX = plane.distance;
  updateWind(game, dt);
  stepPlane(plane, input, dt, game.wind);
  const ground = groundUnder(valley, plane.distance);
  const onStrip = overRunway(valley, plane.distance) || overStrip(valley, plane.distance);
  resolveGroundContact(plane, ground, onStrip);

  if (plane.justHitTerrain) {
    playThud(game.audio);
    showFlash(game, plane.damage >= PLANE.maxDamage ? 'TERRAIN STRIKE!' : 'TERRAIN STRIKE — DAMAGE!', 1400);
    addBurst(game.particles, VIEW.planeScreenX, valley.altToScreenY(plane.altitude, game.cameraY), 14, ['#ff9a3c', '#777777', '#d8402e'], 160);
  }
  if (plane.justCrashed) {
    game.state = 'crashed';
    playThud(game.audio);
    addBurst(game.particles, VIEW.planeScreenX, valley.altToScreenY(plane.altitude, game.cameraY), 40, ['#ff9a3c', '#555555', '#d8402e', '#ffd34d'], 260);
    return;
  }
  if (plane.justLanded) {
    if (courseDone(course)) {
      const landingBonus = ROUTE.landingBonus + Math.round(plane.fuel) * ROUTE.fuelBonusScore;
      game.score += landingBonus;
      game.state = 'complete';
      playLandingJingle(game.audio);
      servicePlane(plane);
      addBurst(game.particles, VIEW.planeScreenX, valley.altToScreenY(plane.altitude, game.cameraY), 46, ['#ffd34d', '#37c978', '#ffffff', '#ff7a2e'], 220);
      showFlash(game, `LANDED +${landingBonus}`, 2000);
    } else {
      showFlash(game, 'REFUELLED — KEEP FLYING', 1600);
      playLandingJingle(game.audio);
      servicePlane(plane);
      plane.airborne = false;
      plane.landed = true;
    }
    return;
  }

  // Rings: threading one pays points and fuel, missing one breaks the combo.
  const result = checkRing(course, prevX, plane.distance, plane.altitude);
  if (result === 'hit') {
    const points = ringPoints(course);
    game.score += points;
    plane.fuel = Math.min(PLANE.fuelCapacity, plane.fuel + PLANE.fuelPerRing);
    playRingChime(game.audio);
    showFlash(game, `RING +${points}`, 1200);
    const ring = course.rings[course.next - 1];
    addBurst(game.particles, VIEW.planeScreenX + 40, valley.altToScreenY(ring.altitude, game.cameraY), 22, ['#ffd34d', '#ffb02e', '#ffffff'], 200);
  } else if (result === 'miss') {
    showFlash(game, 'RING MISSED — COMBO LOST', 1200);
  }

  // Exhaust puffs trail the prop while the engine works.
  if (plane.airborne && plane.throttle > 0.15) {
    game.exhaustAcc += dt;
    if (game.exhaustAcc > 0.09) {
      game.exhaustAcc = 0;
      game.particles.push({
        x: VIEW.planeScreenX - 56,
        y: valley.altToScreenY(plane.altitude, game.cameraY) + 4,
        vx: -60 - plane.speed * 0.4,
        vy: 12,
        life: 0.8,
        decay: 1.4,
        size: 4,
        color: 'rgba(220,220,220,0.5)',
      });
    }
  }

  // The camera chases the plane's altitude so it stays framed.
  const targetCameraY = plane.altitude - 2400;
  game.cameraY += (targetCameraY - game.cameraY) * Math.min(1, dt * 2.4);
}

function frame(game, now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - game.lastTime) / 1000 || 0.016));
  game.lastTime = now;
  const { input } = game;

  if (consume(input, 'pause') && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
  }
  if (consume(input, 'restart') && (game.state === 'crashed' || game.state === 'paused')) {
    game.startRoute(game.seed, game.route);
    game.score = 0;
    game.state = 'playing';
  }
  if (consume(input, 'confirm')) {
    if (game.state === 'title') game.state = 'playing';
    else if (game.state === 'complete') {
      game.startRoute(game.seed, game.route + 1);
      game.state = 'playing';
    } else if (game.state === 'crashed') {
      game.startRoute(game.seed, game.route);
      game.score = 0;
      game.state = 'playing';
    }
  }

  if (game.state === 'playing' && !game.shotMode) updatePlaying(game, dt, now);
  stepParticles(game.particles, dt);
  updateEngineSound(game.audio, game.plane.throttle, game.plane.airborne);

  const ctx = game.ctx;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  renderWorld(ctx, game, now);
  drawHud(ctx, game, now);
  if (game.flash && now < game.flash.until) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(game.flash.text, VIEW.width / 2, 150);
    ctx.restore();
  }
  if (game.state === 'title') drawTitleScreen(ctx, game);
  if (game.state === 'paused') drawPausedScreen(ctx);
  if (game.state === 'crashed') drawCrashedScreen(ctx, game);
  if (game.state === 'complete') drawCompleteScreen(ctx, game);

  const status = document.getElementById('status');
  if (status) {
    status.textContent =
      game.state === 'playing'
        ? `Flying: altitude ${Math.round(game.plane.altitude)} feet, speed ${Math.round(game.plane.speed)} knots, score ${game.score}.`
        : game.state === 'title'
          ? 'Alpine Courier. Press Enter to fly.'
          : `Alpine Courier: ${game.state}. Score ${game.score}.`;
  }
}

export function startGame(game) {
  const { shot, seed } = readShotParams(window.location.search);
  if (shot) {
    game.shotMode = stageShot(game, shot, seed);
    if (game.shotMode) {
      // One composed frame, then stop the clock: the screenshot is stable.
      game.lastTime = performance.now();
      frame(game, performance.now());
      window.__shotReady = true;
      window.__game = game;
      return;
    }
  }
  game.lastTime = performance.now();
  window.__game = game;
  const loop = (now) => {
    frame(game, now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
