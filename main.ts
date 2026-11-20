import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const sourceRoot = fileURLToPath(new URL('.', import.meta.url));
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handInGuide() {
  const captures = readdirSync(join(sourceRoot, 'screenshots')).filter(name => /\.(jpe?g|png)$/i.test(name));
  if (captures.length !== 3) throw new Error('Leonida expects exactly three browser captures.');
  mkdirSync(outputRoot, { recursive: true });
  for (const directory of ['app', 'screenshots']) {
    cpSync(join(sourceRoot, directory), join(outputRoot, directory), { recursive: true });
  }
  writeFileSync(join(outputRoot, 'dossier.json'), buildDossier(outputRoot, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }));
}

handInGuide();
