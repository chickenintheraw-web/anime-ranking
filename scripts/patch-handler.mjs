// Post-build patch for Windows: opennextjs-cloudflare leaves requireChunk as a
// stub that always throws because its tracedFiles path list uses OS separators,
// causing the .next/server/chunks/ include-check to miss every file on Windows.
//
// This script reads the chunk files from disk and embeds them directly into the
// two requireChunk stubs that bundleServer baked into handler.mjs.
//
// It also patches two .external.js files that wrangler bundles separately from
// handler.mjs. Those physical files still have fs.readFileSync / dynamic require
// calls that fail in Cloudflare Workers — we patch them the same way that the
// opennextjs-cloudflare esbuild plugin patches their bundled counterparts.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative, posix } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const handlerPath = join(root, '.open-next', 'server-functions', 'default', 'handler.mjs');
const chunksBase = join(root, '.open-next', 'server-functions', 'default', '.next', 'server', 'chunks');

function collectChunks(dir, relBase) {
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    const absPath = join(dir, name);
    const relPath = `${relBase}/${name}`;
    if (entry.isDirectory()) {
      result.push(...collectChunks(absPath, relPath));
    } else if (name.endsWith('.js') && !name.endsWith('.map')) {
      // Skip the runtime itself — it's the host, not a chunk to inline
      if (name === '[turbopack]_runtime.js') continue;
      result.push({ relPath, absPath });
    }
  }
  return result;
}

const chunks = collectChunks(chunksBase, 'server/chunks');
console.log(`Found ${chunks.length} chunk files to inline`);

// Build switch cases — each case runs the chunk in a minimal CJS wrapper and
// returns module.exports.  The `require` from the enclosing __commonJS scope
// in handler.mjs is accessible to any factory closures inside the chunk.
const cases = chunks.map(({ relPath, absPath }) => {
  let content = readFileSync(absPath, 'utf-8');
  // Strip trailing source-map comment so the injected code stays parseable
  content = content.replace(/\n?\/\/# sourceMappingURL=\S+\s*$/m, '');
  return `case ${JSON.stringify(relPath)}: { const _m={exports:{}}; (function(module,exports){ ${content} })(_m,_m.exports); return _m.exports; }`;
}).join('\n    ');

const replacement =
  `function requireChunk(chunkPath){switch(chunkPath){\n    ${cases}\n    default: throw new Error(\`Not found \${chunkPath}\`);}}`;

const STUB = 'function requireChunk(chunkPath){throw new Error(`Not found ${chunkPath}`)}';

let handler = readFileSync(handlerPath, 'utf-8');
const occurrences = (handler.split(STUB).length - 1);
if (occurrences === 0) {
  // On Linux/Mac, opennextjs-cloudflare patches requireChunk correctly during the
  // esbuild pass — the stub won't exist.  Nothing to do for this part.
  console.log('requireChunk stub not found — build environment patched it correctly, skipping requireChunk patch.');
} else {
  handler = handler.replaceAll(STUB, () => replacement);
  writeFileSync(handlerPath, handler);
  console.log(`Patched ${occurrences} requireChunk stub(s) with ${chunks.length} inlined chunks.`);
}

// === Patch physical .external.js files ===
// Wrangler bundles these files independently from handler.mjs (even though
// handler.mjs already has patched copies of them embedded via opennextjs-cloudflare's
// esbuild plugins). If the un-patched physical files end up being called at runtime,
// they fail with fs.readFileSync / dynamic-require errors that Cloudflare Workers
// cannot handle. Patching them here ensures both code paths use safe versions.

// --- 1. instrumentation-globals.external.js ---
// getInstrumentationModule() does a dynamic require of instrumentation.js which
// doesn't exist in this build. Replace with null so it doesn't crash.
const instrGlobalsPath = join(
  root, '.open-next', 'server-functions', 'default',
  'node_modules', 'next', 'dist', 'server', 'lib', 'router-utils',
  'instrumentation-globals.external.js'
);

const INSTR_DYNAMIC_REQUIRE =
  `cachedInstrumentationModule = (0, _interopdefault.interopDefault)(await require(_nodepath.default.join(projectDir, distDir, 'server', \`\${_constants.INSTRUMENTATION_HOOK_FILENAME}.js\`)));`;

let instrGlobals = readFileSync(instrGlobalsPath, 'utf-8');
if (instrGlobals.includes(INSTR_DYNAMIC_REQUIRE)) {
  instrGlobals = instrGlobals.replace(
    INSTR_DYNAMIC_REQUIRE,
    'cachedInstrumentationModule = null;'
  );
  writeFileSync(instrGlobalsPath, instrGlobals);
  console.log('Patched instrumentation-globals.external.js: getInstrumentationModule returns null.');
} else {
  console.log('instrumentation-globals.external.js: stub not found, already patched or changed.');
}

// --- 2. load-manifest.external.js ---
// loadManifest() and evalManifest() use fs.readFileSync which fails in Workers.
// Replace loadManifest with an inline-data version; make evalManifest safe.
const loadManifestExtPath = join(
  root, '.open-next', 'server-functions', 'default',
  'node_modules', 'next', 'dist', 'server', 'load-manifest.external.js'
);

// Collect all manifest JSON files from the build output and inline them.
const dotNextDir = join(root, '.open-next', 'server-functions', 'default', '.next');

function collectManifests(dir, relBase, result = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absPath = join(dir, entry.name);
    const relPath = `${relBase}/${entry.name}`;
    if (entry.isDirectory()) {
      collectManifests(absPath, relPath, result);
    } else if (
      entry.name.endsWith('.json') &&
      (entry.name.endsWith('-manifest.json') ||
        entry.name === 'required-server-files.json' ||
        entry.name === 'prefetch-hints.json')
    ) {
      result.push({ absPath, relPath });
    }
  }
  return result;
}

const manifests = collectManifests(dotNextDir, '');

// BUILD_ID for the NEXT_BUILD_ID env check
const buildId = readFileSync(join(dotNextDir, 'BUILD_ID'), 'utf-8').trim();

// Generate the inline return statements for each manifest
const manifestCases = manifests.map(({ absPath, relPath }) => {
  // Normalize relPath to use forward slashes regardless of platform
  const normalizedRel = relPath.split('\\').join('/');
  const json = readFileSync(absPath, 'utf-8').trim();
  return `  if (path.endsWith(${JSON.stringify(normalizedRel)})) { return ${json}; }`;
}).join('\n');

// The patched loadManifest function body
const patchedLoadManifest = `function loadManifest(path, shouldCache, cache, skipParse, handleMissing) {
  path = path.replaceAll('\\\\', '/');
  if (path.endsWith('BUILD_ID')) { return ${JSON.stringify(buildId)}; }
${manifestCases}
  // Known optional manifests — return {} rather than crash
  var p = path.replace(/\\.json$/, '');
  if (p.endsWith('react-loadable-manifest') ||
      p.endsWith('subresource-integrity-manifest') ||
      p.endsWith('server-reference-manifest') ||
      p.endsWith('dynamic-css-manifest') ||
      p.endsWith('fallback-build-manifest') ||
      p.endsWith('prefetch-hints')) {
    return {};
  }
  throw new Error('Unexpected loadManifest(' + path + ') call!');
}`;

// evalManifest uses vm.runInNewContext which is not available in Workers.
// Inline all client-reference-manifest data so tryLoadClientReferenceManifest
// gets a real manifest back and setManifestsSingleton is actually called.
function collectClientRefManifests(dir, result = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectClientRefManifests(absPath, result);
    } else if (entry.name.endsWith('_client-reference-manifest.js')) {
      result.push(absPath);
    }
  }
  return result;
}

const clientRefFiles = collectClientRefManifests(join(dotNextDir, 'server', 'app'));
const evalManifestEntries = [];
for (const absPath of clientRefFiles) {
  const content = readFileSync(absPath, 'utf-8');
  const tempCtx = { __RSC_MANIFEST: {} };
  try {
    new Function('globalThis', content)(tempCtx);
  } catch (e) {
    console.warn(`Warning: could not execute ${absPath}: ${e.message}`);
    continue;
  }
  for (const [key, value] of Object.entries(tempCtx.__RSC_MANIFEST)) {
    const suffix = absPath.replace(/\\/g, '/').split('/.next/')[1];
    if (suffix) evalManifestEntries.push({ suffix, key, value });
  }
}
console.log(`Inlining ${evalManifestEntries.length} client-reference-manifest entries into evalManifest.`);

const evalManifestCases = evalManifestEntries.map(({ suffix, key, value }) =>
  `  if (path.endsWith(${JSON.stringify(suffix)})) { return { __RSC_MANIFEST: { ${JSON.stringify(key)}: ${JSON.stringify(value)} } }; }`
).join('\n');

const patchedEvalManifest = `function evalManifest(path, shouldCache, cache, handleMissing) {
  path = (path || '').replaceAll('\\\\', '/');
${evalManifestCases}
  return {};
}`;

const LOAD_MANIFEST_FN_RE = /function loadManifest\([^)]*\)\s*\{[\s\S]*?^}/m;
const EVAL_MANIFEST_FN_RE = /function evalManifest\([^)]*\)\s*\{[\s\S]*?^}/m;

let loadManifestExt = readFileSync(loadManifestExtPath, 'utf-8');
const alreadyPatched = loadManifestExt.includes('Unexpected loadManifest') &&
  loadManifestExt.includes('_client-reference-manifest');

if (alreadyPatched) {
  console.log('load-manifest.external.js: already patched with client-reference-manifest data, skipping.');
} else {
  loadManifestExt = loadManifestExt.replace(LOAD_MANIFEST_FN_RE, () => patchedLoadManifest);
  loadManifestExt = loadManifestExt.replace(EVAL_MANIFEST_FN_RE, () => patchedEvalManifest);
  writeFileSync(loadManifestExtPath, loadManifestExt);
  console.log(`Patched load-manifest.external.js with ${manifests.length} inlined manifests.`);
}
