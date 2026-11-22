// Cala Solara — gta6-01 submission packager (Node 22, standard library only).
// Copies game/ and screenshots/ to the output directory and generates a deterministic
// makefun/dossier/v1 JSON manifest using the kit's vendored buildDossier library.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SCORER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

function packageEntry(): void {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

  const shotsDest = join(outputDir, 'screenshots');
  mkdirSync(shotsDest, { recursive: true });
  const shotsSrc = join(repoRoot, 'screenshots');
  if (existsSync(shotsSrc)) {
    cpSync(shotsSrc, shotsDest, { recursive: true });
  }

  const dossierBytes = buildDossier(outputDir, SCORER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
}

packageEntry();
