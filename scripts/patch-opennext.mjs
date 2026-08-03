// Patches @opennextjs/cloudflare to include app-paths-manifest.json in NodeModuleLoader.
// Without this, App Router pages are never loaded on Cloudflare Pages when building
// with Turbopack, because NodeModuleLoader.load() only reads pages-manifest.json
// (which is empty for App Router-only projects).
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dynamicRequiresPath = join(
  root,
  'node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/dynamic-requires.js'
);

const ORIGINAL = `    const manifests = await getPagesManifests(serverDir);
    const files = manifests.filter((file) => file.endsWith(".js"));`;

const PATCHED = `    const pagesManifests = await getPagesManifests(serverDir);
    const appPathsManifests = await getAppPathsManifests(serverDir);
    const manifests = pagesManifests.concat(appPathsManifests);
    const files = manifests.filter((file) => file.endsWith(".js"));`;

let source = readFileSync(dynamicRequiresPath, 'utf-8');

if (source.includes(PATCHED)) {
  console.log('dynamic-requires.js already patched, skipping.');
  process.exit(0);
}

if (!source.includes(ORIGINAL)) {
  console.error('ERROR: Expected patch target not found in dynamic-requires.js');
  console.error('The @opennextjs/cloudflare version may have changed; review scripts/patch-opennext.mjs');
  process.exit(1);
}

source = source.replace(ORIGINAL, PATCHED);
writeFileSync(dynamicRequiresPath, source);
console.log('Patched dynamic-requires.js: NodeModuleLoader.load() now includes app-paths-manifest.json');
