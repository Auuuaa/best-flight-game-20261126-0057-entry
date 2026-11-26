# best-flight-game-20261126-0057-entry

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/Auuuaa/best-flight-game-20261126-0057-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/Auuuaa/best-flight-game-20261126-0057-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

**Alpine Courier** — a bush-plane flight game. Fly a red-and-cream high-wing
through a mountain valley, thread all 8 glowing rings, mind the fuel, and
bring her home onto the runway strip to finish the route. Every route ends
on the strip; every next valley is faster, higher and tighter.

A complete, original, offline 2D canvas game: keyboard (arrows + Space) and
mouse (hold to steer), synthesized WebAudio engine hum and chimes, zero
network requests, zero asset files — every sprite, mountain and instrument is
drawn in code. Chase view over recognisable terrain, the aircraft in frame
with lit instruments, a runway and target rings ahead, and altitude, speed
and heading live on the HUD.

## Controls

| Key | Action |
| --- | --- |
| ↑ / ↓ (or W / S) | Pitch up / down |
| → / ← (or D / A) | Throttle up / down |
| Space | Airbrake — bleed speed for a ring or a landing |
| Mouse (hold) | Steer toward the pointer |
| P | Pause |
| R | Restart after a crash |
| Enter / click | Start, continue to the next valley |

## How a route works

- 8 rings are strung down the valley at changing altitudes. Thread one for
  100 points times your combo, plus fuel. Miss one and the combo resets.
- Fuel drains with the throttle. Land on the runway to refuel and repair —
  an empty tank glides, it does not fly.
- Terrain strikes cost 25% damage and bounce you back up. At 100% the
  flight is over. Landings must be slow (≤ 135 kt) and gentle (≤ 260 ft/s
  descent) or the gear folds.
- Finish all 8 rings and land on the strip to complete the route: 500
  points plus 5 per percent of fuel left, then the next valley.

## Play it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Or open `game/index.html` from any static server.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output folder and writes
`dossier.json` with the vendored `makefun-game.ts` library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=j8zsssgk&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
