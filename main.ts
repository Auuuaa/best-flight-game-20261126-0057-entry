// Alpine Courier — the hand-in program for the best-flight-game bounty.
// Node 22, standard library only. It takes the game (game/) and the four
// screenshots (screenshots/) from beside this file, copies them into the
// output directory, and writes the dossier the judge reads, using the kit's
// vendored library. The grader runs this program twice from a container whose
// working directory is not the repository, so every path here is resolved from
// this file's own directory, never from process.cwd().
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this program lives on disk — the repository root at the submitted commit.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader writes to /output; a local run uses MAKEFUN_OUTPUT_DIR instead.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer enforces: keep the entry inside them or it is refused.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(source, target) {
  cpSync(source, target, { recursive: true });
}

function copyShots(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const name of readdirSync(sourceDir).sort()) {
    if (name.startsWith('.')) continue;
    const from = join(sourceDir, name);
    if (statSync(from).isFile()) copyFileSync(from, join(targetDir, name));
  }
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyShots(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

const dossier = buildDossier(outputDir, DOSSIER_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A one-line receipt on stdout (it never touches /output, so the two runs
// stay byte-identical): what was handed in and how big the dossier is.
const shotNames = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).filter((n) => !n.startsWith('.'))
  : [];
console.log(`Alpine Courier handed in: game/ + ${shotNames.length} screenshots, dossier ${dossier.length} bytes.`);
