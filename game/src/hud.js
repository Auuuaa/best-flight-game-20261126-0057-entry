// Alpine Courier — everything the pilot reads: the top HUD bar, the fuel and
// damage gauges, the lit instrument panel, the event banners and the title,
// pause, crash and route-complete screens. All of it is drawn on the canvas
// so a screenshot shows exactly what the pilot sees.

import { VIEW, PLANE } from './config.js';

const PANEL = { x: 340, y: 700, width: 600, height: 86 };

function panel(ctx, x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0c1420';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function label(ctx, text, x, y, size, color, align) {
  ctx.save();
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function bar(ctx, x, y, w, h, fraction, good, bad, glowColor) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped <= 0) {
    ctx.restore();
    return;
  }
  ctx.fillStyle = clamped > 0.3 ? good : bad;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = clamped > 0.3 ? 8 : 0;
  ctx.beginPath();
  ctx.roundRect(x, y, w * clamped, h, 4);
  ctx.fill();
  ctx.restore();
}

// The attitude indicator: a ball split sky/brown, rolled by the bank and
// pitched by the climb, with a fixed aircraft symbol in the middle.
function drawAttitude(ctx, cx, cy, radius, bank, pitch) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-bank);
  const pitchOffset = Math.max(-radius, Math.min(radius, pitch * radius * 0.9));
  ctx.fillStyle = '#2f6fb4';
  ctx.fillRect(-radius, -radius + pitchOffset, radius * 2, radius);
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(-radius, pitchOffset, radius * 2, radius);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-radius, pitchOffset);
  ctx.lineTo(radius, pitchOffset);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx - 2, cy);
  ctx.moveTo(cx + 2, cy);
  ctx.lineTo(cx + 14, cy);
  ctx.moveTo(cx, cy - 2);
  ctx.lineTo(cx, cy + 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  label(ctx, 'ATT', cx, cy + radius + 11, 10, 'rgba(255,255,255,0.65)', 'center');
}

// A round dial with a needle: used for the altimeter and the airspeed.
function drawDial(ctx, cx, cy, radius, value, max, title, unit) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#101c2c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    const inner = radius - (i % 5 === 0 ? 9 : 5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * (radius - 2), cy + Math.sin(a) * (radius - 2));
    ctx.stroke();
  }
  const angle = -Math.PI * 0.75 + (Math.max(0, Math.min(1, value / max))) * Math.PI * 1.5;
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ffd34d';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (radius - 7), cy + Math.sin(angle) * (radius - 7));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  label(ctx, title, cx, cy + radius + 11, 10, 'rgba(255,255,255,0.65)', 'center');
  label(ctx, String(Math.round(value)), cx, cy + radius - 12, 11, '#ffffff', 'center');
}

// The compass tape: a sliding strip of cardinal ticks under the heading.
function drawCompass(ctx, cx, cy, width, heading) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - width / 2, cy - 12, width, 24, 6);
  ctx.fillStyle = '#101c2c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.stroke();
  ctx.clip();
  const points = [
    [0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'],
    [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'], [360, 'N'],
  ];
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [deg, name] of points) {
    let delta = deg - heading;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const x = cx + delta * 2.1;
    if (x < cx - width / 2 - 20 || x > cx + width / 2 + 20) continue;
    ctx.fillText(name, x, cy - 2);
    ctx.fillRect(x - 0.5, cy + 6, 1, 5);
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 14);
  ctx.lineTo(cx + 6, cy - 14);
  ctx.lineTo(cx, cy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  label(ctx, 'HDG', cx, cy + 24, 10, 'rgba(255,255,255,0.65)', 'center');
}

export function drawHud(ctx, game, now) {
  const { plane, course, score } = game;
  // Top-left: score, route and rings.
  panel(ctx, 16, 14, 300, 64, 0.82);
  label(ctx, `SCORE ${score.toLocaleString('en-US')}`, 30, 32, 20, '#ffffff');
  label(ctx, `ROUTE ${game.route + 1}   RING ${course.next}/${course.rings.length}`, 30, 56, 13, '#bcd6f5');
  if (course.combo > 1) {
    label(ctx, `COMBO x${course.combo}`, 218, 56, 13, '#ffd34d');
  }
  // Top-right: the three flight numbers.
  panel(ctx, VIEW.width - 316, 14, 300, 64, 0.82);
  label(ctx, `ALT ${Math.max(0, Math.round(plane.altitude)).toLocaleString('en-US')} FT`, VIEW.width - 302, 32, 16, '#ffffff');
  label(ctx, `SPD ${Math.round(plane.speed)} KT`, VIEW.width - 302, 56, 13, '#bcd6f5');
  label(ctx, `HDG ${String(Math.round(plane.heading)).padStart(3, '0')}°`, VIEW.width - 172, 56, 13, '#bcd6f5');
  // Top-centre: fuel and damage.
  panel(ctx, VIEW.width / 2 - 150, 14, 300, 64, 0.82);
  label(ctx, 'FUEL', VIEW.width / 2 - 136, 30, 11, '#bcd6f5');
  bar(ctx, VIEW.width / 2 - 136, 40, 272, 10, plane.fuel / PLANE.fuelCapacity, '#37c978', '#ff5340', '#37c978');
  label(ctx, 'DMG', VIEW.width / 2 - 136, 62, 11, '#bcd6f5');
  bar(ctx, VIEW.width / 2 - 96, 56, 232, 8, plane.damage / PLANE.maxDamage, '#ffb02e', '#ff5340', '#ffb02e');

  // Low-fuel warning flashes.
  if (plane.fuel < 20 && plane.airborne && Math.floor(now / 400) % 2 === 0) {
    label(ctx, 'LOW FUEL — LAND ON THE RUNWAY', VIEW.width / 2, 108, 16, '#ff5340', 'center');
  }

  // Bottom instrument panel: attitude, altimeter, airspeed, compass.
  panel(ctx, PANEL.x, PANEL.y, PANEL.width, PANEL.height, 0.88);
  drawAttitude(ctx, PANEL.x + 52, PANEL.y + 38, 28, plane.bank, plane.pitch);
  drawDial(ctx, PANEL.x + 150, PANEL.y + 38, 28, plane.altitude, 6000, 'ALT FT', 'ft');
  drawDial(ctx, PANEL.x + 248, PANEL.y + 38, 28, plane.speed, 240, 'SPD KT', 'kt');
  drawCompass(ctx, PANEL.x + 430, PANEL.y + 34, 220, plane.heading);
  label(ctx, 'THR', PANEL.x + 560, PANEL.y + 18, 10, 'rgba(255,255,255,0.65)', 'center');
  bar(ctx, PANEL.x + 540, PANEL.y + 30, 40, 34, plane.throttle, '#37c978', '#37c978', '#37c978');
}

// A big centre banner, used for events and state screens.
export function drawBanner(ctx, title, subtitle) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, VIEW.width / 2, VIEW.height / 2 - 130);
  ctx.shadowBlur = 0;
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillStyle = '#e8f1fb';
  ctx.fillText(subtitle, VIEW.width / 2, VIEW.height / 2 - 84);
  ctx.restore();
}

export function drawTitleScreen(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 18, 32, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 72px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.fillText('ALPINE COURIER', VIEW.width / 2, 210);
  ctx.shadowBlur = 0;
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffd34d';
  ctx.fillText('Fly the valley. Thread the rings. Land her home.', VIEW.width / 2, 268);
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillStyle = '#e8f1fb';
  const lines = [
    '↑ / ↓  pitch    ← / →  throttle    SPACE  airbrake    P  pause',
    'Thread all 8 rings, then land on the runway to refuel and finish the route.',
    'Watch the fuel — an empty tank glides, it does not fly.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 330 + i * 30));
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillStyle = Math.floor(performance.now() / 500) % 2 === 0 ? '#ffffff' : '#ffd34d';
  ctx.fillText('Press ENTER or click to fly', VIEW.width / 2, 470);
  ctx.restore();
}

export function drawPausedScreen(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 18, 32, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawBanner(ctx, 'PAUSED', 'Press P to keep flying');
  ctx.restore();
}

export function drawCrashedScreen(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 8, 8, 0.5)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawBanner(ctx, 'DOWN IN THE VALLEY', `Score ${game.score.toLocaleString('en-US')}  —  press R to fly again`);
  ctx.restore();
}

export function drawCompleteScreen(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 24, 14, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawBanner(ctx, 'ROUTE COMPLETE', `Route ${game.route + 1} flown — score ${game.score.toLocaleString('en-US')}`);
  ctx.textAlign = 'center';
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillStyle = '#e8f1fb';
  ctx.fillText('Press ENTER for the next valley — faster, higher, tighter.', VIEW.width / 2, VIEW.height / 2 - 40);
  ctx.restore();
}
