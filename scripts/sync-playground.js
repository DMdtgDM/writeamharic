#!/usr/bin/env node
/* ============================================================
   ድርኛ (Direnya) — dev tool: sync-playground.js
   -------------------------------------------------------------
   playground/index.html can't use require() or fetch() sibling
   files reliably (fetch() of local files is blocked by CORS when
   the page is opened via file://, which is the whole point of the
   playground — no server needed). So the five pure-data/pure-logic
   engine modules are copied byte-for-byte into playground/ as
   plain sibling <script src="..."> files instead.

   That means lib/ is the ONLY place you should ever edit these
   five files. After editing any of them, run:

       node scripts/sync-playground.js

   This copies the current lib/ versions over the playground/
   copies and tells you if anything actually changed. It also
   flags the one place that can't be auto-synced this way: the
   runtime shim, which is inlined as a JS string constant
   (RUNTIME_JS) directly inside playground/index.html rather than
   loaded as a file — see the comment at that constant for why,
   and check it by hand against lib/runtime.js when you touch
   either one.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIB = path.join(ROOT, 'lib');
const PLAYGROUND = path.join(ROOT, 'playground');

// Files that ARE synced as real sibling files (playground <script src="...">s these directly).
const SYNCED_FILES = [
  'dictionaries.js',
  'html-transpiler.js',
  'css-transpiler.js',
  'js-transpiler.js',
  'web-format.js',
];

// Files that exist in lib/ but are intentionally NOT copied —
// documented here so "why isn't this in playground/?" has an answer.
const NOT_SYNCED = {
  'build.js': 'Node/CLI-only (uses fs, path, process — none of which exist in a browser).',
  'runtime.js': 'Content is inlined as the RUNTIME_JS constant in playground/index.html instead of loaded as a file, to survive file:// CORS restrictions. Sync this one BY HAND — this script only warns, it cannot safely rewrite JS embedded inside an HTML file.',
};

function sync() {
  let changed = 0, unchanged = 0;

  for (const file of SYNCED_FILES) {
    const src = path.join(LIB, file);
    const dest = path.join(PLAYGROUND, file);
    if (!fs.existsSync(src)) {
      console.log(`⚠ ${file}: missing from lib/ — skipped`);
      continue;
    }
    const srcContent = fs.readFileSync(src, 'utf8');
    const destContent = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
    if (srcContent === destContent) {
      unchanged++;
      console.log(`= ${file} (already in sync)`);
    } else {
      fs.writeFileSync(dest, srcContent, 'utf8');
      changed++;
      console.log(`✓ ${file} (${destContent === null ? 'created' : 'updated'})`);
    }
  }

  console.log(`\n${changed} file(s) updated, ${unchanged} already in sync.`);

  // Manual-check reminder for runtime.js specifically
  const runtimeCanonical = fs.readFileSync(path.join(LIB, 'runtime.js'), 'utf8');
  const playgroundHtml = fs.readFileSync(path.join(PLAYGROUND, 'index.html'), 'utf8');
  const m = playgroundHtml.match(/const RUNTIME_JS = `([\s\S]*?)`;/);
  if (m) {
    // crude but effective: check the three function names + bodies' key substrings still match
    const inlineJS = m[1];
    const RUNTIME_FUNCTION_NAMES = ['ጻፍ', 'አሳውቅ', 'አትም', 'ንጥል_በመለያ', 'ንጥሎች_በመደብ', 'ጽሑፍ_አስቀምጥ',
      'ጽሑፍ_አግኝ', 'ስልት_አስቀምጥ', 'መደብ_ጨምር', 'መደብ_አስወግድ', 'መደብ_ቀያይር', 'ዋጋ_አግኝ', 'ዋጋ_አስቀምጥ', 'ስማ',
      'tsaf', 'asawek', 'atim', 'nitil_bemeleya', 'nitiloch_bemedeb', 'tsihuf_askemt', 'tsihuf_agn',
      'silt_askemt', 'medeb_chemr', 'medeb_aswegd', 'medeb_keyayir', 'waga_agn', 'waga_askemt', 'sima'];
    const definedAs = (src, fn) => src.includes(`function ${fn}`) || src.includes(`var ${fn} =`);
    const namesInCanonical = RUNTIME_FUNCTION_NAMES.every(fn => definedAs(runtimeCanonical, fn));
    const namesInInline = RUNTIME_FUNCTION_NAMES.every(fn => definedAs(inlineJS, fn));
    if (namesInCanonical && namesInInline) {
      console.log(`✓ RUNTIME_JS in playground/index.html still defines all ${RUNTIME_FUNCTION_NAMES.length} functions from lib/runtime.js (names match — this is a shallow check, not a full diff; re-read both by eye after any real change to runtime.js).`);
    } else {
      console.log('✗ MISMATCH: lib/runtime.js and playground/index.html\'s RUNTIME_JS no longer define the same functions. Fix RUNTIME_JS by hand.');
    }
  } else {
    console.log('⚠ Could not find RUNTIME_JS in playground/index.html — check manually.');
  }

  console.log('\nNot synced (by design):');
  for (const [file, why] of Object.entries(NOT_SYNCED)) {
    console.log(`  - ${file}: ${why}`);
  }
}

if (require.main === module) sync();
module.exports = sync;
