// Alpine Courier — the world on screen: dawn sky, far ridges, drifting clouds,
// the valley floor with its fields, river and pines, the runway, the glowing
// rings and the bush plane itself, with exhaust, sparks and confetti.

import { VIEW, ROUTE } from './config.js';

// A deterministic hash of an integer, for field colours and tree shapes.
function hash(n) {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 1597334677) >>> 0;
  h ^= h >>> 16;
  return h / 4294967296;
}

function skyGradient(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#2a5d9e');
  g.addColorStop(0.45, '#7fb0d8');
  g.addColorStop(0.72, '#f2c98a');
  g.addColorStop(1, '#e8b478');
  return g;
}

function drawSun(ctx, time) {
  const x = 1080;
  const y = 150 + Math.sin(time * 0.00005) * 6;
  const glow = ctx.createRadialGradient(x, y, 10, x, y, 130);
  glow.addColorStop(0, 'rgba(255, 236, 180, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 214, 130, 0.45)');
  glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(x - 140, y - 140, 280, 280);
  ctx.fillStyle = '#ffedbe';
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRidges(ctx, valley, cameraX, time) {
  for (const ridge of valley.ridges) {
    const offset = cameraX * ridge.parallax;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-4, VIEW.height);
    for (let sx = -4; sx <= VIEW.width + 4; sx += 8) {
      const wx = sx + offset;
      let peak = 0;
      for (const p of ridge.peaks) {
        const d = Math.abs(wx - p.x);
        peak = Math.max(peak, Math.max(0, p.height * (1 - d / 420)));
      }
      ctx.lineTo(sx, ridge.base - peak);
    }
    ctx.lineTo(VIEW.width + 4, VIEW.height);
    ctx.closePath();
    ctx.fillStyle = ridge.parallax < 0.5 ? 'rgba(90, 120, 160, 0.55)' : 'rgba(70, 98, 138, 0.8)';
    ctx.fill();
    ctx.restore();
  }
}

function drawClouds(ctx, valley, cameraX, time) {
  ctx.save();
  for (const cloud of valley.clouds) {
    const drift = ((cloud.x + time * 0.001 * cloud.speed - cameraX * 0.15) % 2600 + 2600) % 2600 - 400;
    const cx = drift;
    const cy = cloud.y * 0.9 + 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70 * cloud.scale, 20 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 40 * cloud.scale, cy + 6, 42 * cloud.scale, 14 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 44 * cloud.scale, cy + 5, 46 * cloud.scale, 15 * cloud.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The valley floor: a filled profile with patchwork fields, a river ribbon,
// pine trees and the runway strip with its windsock.
function drawTerrain(ctx, valley, cameraX, cameraY) {
  const toY = (alt) => valley.altToScreenY(alt, cameraY);
  ctx.save();
  // Ground profile.
  ctx.beginPath();
  ctx.moveTo(-4, VIEW.height + 4);
  for (let sx = -4; sx <= VIEW.width + 4; sx += 8) {
    const wx = sx + cameraX;
    ctx.lineTo(sx, toY(valley.groundAlt(wx)));
  }
  ctx.lineTo(VIEW.width + 4, VIEW.height + 4);
  ctx.closePath();
  const groundGrad = ctx.createLinearGradient(0, 380, 0, VIEW.height);
  groundGrad.addColorStop(0, '#7d9b58');
  groundGrad.addColorStop(0.5, '#5d7f43');
  groundGrad.addColorStop(1, '#3e5c2e');
  ctx.fillStyle = groundGrad;
  ctx.fill();

  // Rocky crests where the ground climbs high.
  ctx.beginPath();
  ctx.moveTo(-4, VIEW.height + 4);
  for (let sx = -4; sx <= VIEW.width + 4; sx += 8) {
    const wx = sx + cameraX;
    const alt = valley.groundAlt(wx);
    ctx.lineTo(sx, alt > 1500 ? toY(alt) : VIEW.height + 4);
  }
  ctx.lineTo(VIEW.width + 4, VIEW.height + 4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(122, 110, 96, 0.85)';
  ctx.fill();

  // Patchwork fields on the floor: deterministic gold and green strips.
  for (let sx = 0; sx < VIEW.width; sx += 8) {
    const wx = Math.floor((sx + cameraX) / 220);
    const alt = valley.groundAlt(sx + cameraX);
    if (alt > 900) continue;
    const h = hash(wx);
    if (h < 0.28) {
      ctx.fillStyle = h < 0.14 ? 'rgba(214, 178, 90, 0.35)' : 'rgba(120, 160, 80, 0.4)';
      ctx.fillRect(sx, toY(alt), 8, VIEW.height - toY(alt));
    }
  }

  // The river: a narrow, meandering ribbon that only shows where the floor
  // runs low, breaking where the ground climbs away from it.
  ctx.save();
  ctx.strokeStyle = 'rgba(95, 168, 216, 0.9)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let started = false;
  for (let sx = -4; sx <= VIEW.width + 4; sx += 8) {
    const wx = sx + cameraX;
    const ground = valley.groundAlt(wx);
    if (ground > 720) {
      started = false;
      continue;
    }
    const y = toY(valley.riverAlt(wx)) + 24 + Math.sin(wx * 0.01) * 7;
    if (!started) {
      ctx.moveTo(sx, y);
      started = true;
    } else {
      ctx.lineTo(sx, y);
    }
  }
  ctx.stroke();
  ctx.restore();

  // Pines.
  for (const tree of valley.trees) {
    const sx = tree.x - cameraX;
    if (sx < -30 || sx > VIEW.width + 30) continue;
    const ground = valley.groundAlt(tree.x);
    const baseY = toY(ground);
    const h = 34 * tree.size;
    ctx.save();
    ctx.translate(sx, baseY);
    ctx.rotate(tree.lean);
    ctx.fillStyle = '#2c4d26';
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(-h * 0.32, -h * 0.25);
    ctx.lineTo(h * 0.32, -h * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#35622c';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.8);
    ctx.lineTo(-h * 0.24, -h * 0.05);
    ctx.lineTo(h * 0.24, -h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(-2, -h * 0.08, 4, h * 0.08);
    ctx.restore();
  }

  // The departure strip at the head of the valley, drawn like the runway.
  const ss = valley.startStripStart - cameraX;
  const se = valley.startStripEnd - cameraX;
  if (se > 0 && ss < VIEW.width) {
    const y = toY(ROUTE.runwayAlt);
    ctx.save();
    ctx.fillStyle = '#3a3f46';
    ctx.fillRect(Math.max(0, ss), y - 4, Math.min(VIEW.width, se) - Math.max(0, ss), 14);
    ctx.fillStyle = '#f5f5f5';
    for (let x = Math.max(ss, 0); x < Math.min(se, VIEW.width); x += 46) {
      ctx.fillRect(x, y + 2, 24, 3);
    }
    ctx.restore();
  }

  // The runway: asphalt, centreline dashes, threshold bars and a windsock.
  const rs = valley.runwayStart - cameraX;
  const re = valley.runwayEnd - cameraX;
  if (re > 0 && rs < VIEW.width) {
    const y = toY(ROUTE.runwayAlt);
    ctx.save();
    ctx.fillStyle = '#3a3f46';
    ctx.fillRect(Math.max(0, rs), y - 4, Math.min(VIEW.width, re) - Math.max(0, rs), 14);
    ctx.fillStyle = '#f5f5f5';
    for (let x = Math.max(rs, 0); x < Math.min(re, VIEW.width); x += 46) {
      ctx.fillRect(x, y + 2, 24, 3);
    }
    ctx.fillStyle = '#e8b13c';
    ctx.fillRect(Math.max(0, rs), y - 7, 6, 20);
    ctx.fillRect(Math.min(VIEW.width, re) - 6, y - 7, 6, 20);
    // Windsock on a pole at the threshold.
    const wx = valley.windsock.x - cameraX;
    if (wx > 0 && wx < VIEW.width) {
      ctx.strokeStyle = '#d8d8d8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx, y - 4);
      ctx.lineTo(wx, y - 46);
      ctx.stroke();
      ctx.fillStyle = '#ff7a2e';
      ctx.beginPath();
      ctx.moveTo(wx, y - 46);
      ctx.lineTo(wx + 26, y - 40);
      ctx.lineTo(wx, y - 34);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

// A ring: a glowing ellipse facing the pilot, amber while it waits, green
// once threaded, dim once missed. The next ring pulses so the eye finds it.
function drawRings(ctx, valley, course, cameraX, cameraY, time) {
  const toY = (alt) => valley.altToScreenY(alt, cameraY);
  for (const ring of course.rings) {
    const sx = ring.x - cameraX;
    if (sx < -160 || sx > VIEW.width + 160) continue;
    const sy = toY(ring.altitude);
    const rx = ring.radius * 0.52;
    const ry = ring.radius;
    const isNext = course.rings[course.next] === ring;
    const pulse = isNext ? 1 + Math.sin(time * 0.006) * 0.08 : 1;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = isNext ? 22 : 10;
    ctx.shadowColor = ring.passed ? '#37c978' : ring.missed ? '#888888' : '#ffb02e';
    ctx.strokeStyle = ring.passed ? '#37c978' : ring.missed ? '#999999' : '#ffb02e';
    ctx.lineWidth = isNext ? 7 : 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx - 8, ry - 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Chevrons point the way through.
    ctx.fillStyle = ring.passed ? '#37c978' : '#ffb02e';
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.lineTo(2, 0);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    if (isNext) {
      ctx.font = '800 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`RING ${ring.index + 1}`, 0, -ry - 14);
    }
    ctx.restore();
  }
}

// The bush plane, drawn in code: red-and-cream high-wing, spinning prop,
// banking with the pitch. Drawn side-on, nose to the right.
export function drawPlane(ctx, plane, screenX, screenY, time) {
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(-plane.pitch * 0.32);
  ctx.rotate(plane.bank * 0.12);
  // Propeller blur: a spinning disc ahead of the nose.
  const propAngle = time * 0.045;
  ctx.save();
  ctx.translate(46, -2);
  ctx.rotate(propAngle);
  ctx.strokeStyle = 'rgba(40, 40, 40, 0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.rotate(Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.restore();
  // Fuselage.
  ctx.fillStyle = '#d8402e';
  ctx.beginPath();
  ctx.moveTo(-52, 2);
  ctx.quadraticCurveTo(-52, -14, -20, -16);
  ctx.lineTo(28, -14);
  ctx.quadraticCurveTo(50, -10, 50, 0);
  ctx.quadraticCurveTo(50, 8, 30, 10);
  ctx.lineTo(-30, 12);
  ctx.quadraticCurveTo(-52, 10, -52, 2);
  ctx.closePath();
  ctx.fill();
  // Cream cheatline and tail flash.
  ctx.fillStyle = '#f6ead2';
  ctx.fillRect(-30, -6, 74, 5);
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.moveTo(-52, 2);
  ctx.lineTo(-66, -18);
  ctx.lineTo(-58, -18);
  ctx.lineTo(-46, -2);
  ctx.closePath();
  ctx.fill();
  // High wing.
  ctx.fillStyle = '#b93222';
  ctx.beginPath();
  ctx.roundRect(-18, -30, 44, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  ctx.fillRect(-14, -30, 6, 9);
  // Tailplane.
  ctx.fillStyle = '#b93222';
  ctx.beginPath();
  ctx.moveTo(-52, -2);
  ctx.lineTo(-70, -12);
  ctx.lineTo(-62, -12);
  ctx.lineTo(-46, -4);
  ctx.closePath();
  ctx.fill();
  // Cabin windows, lit from inside.
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#ffe9a8';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(6, -12, 12, 9, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(22, -12, 10, 9, 3);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Landing gear.
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, 11);
  ctx.lineTo(-24, 22);
  ctx.moveTo(22, 11);
  ctx.lineTo(28, 22);
  ctx.stroke();
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(-24, 23, 5, 0, Math.PI * 2);
  ctx.arc(28, 23, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Particles: exhaust puffs, ring sparks, crash debris, landing confetti.
export function makeParticles() {
  return [];
}

export function addBurst(particles, x, y, count, colors, speed) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 40,
      life: 1,
      decay: 0.9 + Math.random() * 1.4,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

export function stepParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function drawParticles(ctx, particles) {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// One full frame: sky, ridges, clouds, terrain, rings, plane, particles.
export function renderWorld(ctx, game, time) {
  const { valley, plane, course, particles } = game;
  const cameraX = Math.max(0, plane.distance - VIEW.planeScreenX);
  const cameraY = game.cameraY;
  ctx.fillStyle = skyGradient(ctx);
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawSun(ctx, time);
  drawClouds(ctx, valley, cameraX, time);
  drawRidges(ctx, valley, cameraX, time);
  drawTerrain(ctx, valley, cameraX, cameraY);
  drawRings(ctx, valley, course, cameraX, cameraY, time);
  const planeY = valley.altToScreenY(plane.altitude, cameraY);
  drawPlane(ctx, plane, VIEW.planeScreenX, planeY, time);
  drawParticles(ctx, particles);
}
