#!/usr/bin/env node
/* ============================================================
   ድርኛ (Diregna) — dev tool: rename-project.js
   -------------------------------------------------------------
   Renames the project itself — NOT a dictionary word (for that,
   see scripts/sync-playground.js and the note in dictionaries.js).
   This tool exists because "ድርኛ"/"Diregna"/"diregna" are just
   plain branding TEXT sprinkled across ~18 files (page titles,
   comments, a CodeMirror mode name, README/docs) — not data any
   transpiler reads — so the fix is a careful find-and-replace,
   not a dictionary edit.

   USAGE — always dry-run first (this is the default, nothing is
   written unless you pass --apply):

     node scripts/rename-project.js \
       --amharic="ድርኛ:NEWAMHARIC" \
       --latin="Diregna:NewName" \
       --lower="diregna:newname"

   Review the output, then re-run the exact same command with
   --apply added at the end to actually write the changes:

     node scripts/rename-project.js \
       --amharic="ድርኛ:NEWAMHARIC" \
       --latin="Diregna:NewName" \
       --lower="diregna:newname" \
       --apply

   All three pairs are optional — pass only the ones you want to
   change. Each is "OLD:NEW". Replacement is exact literal text
   matching (not a regex), so no special characters need escaping.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXTENSIONS = new Set(['.js', '.html', '.md']);
const SKIP_DIRS = new Set(['node_modules', '.git']);

function parsePair(arg) {
  const idx = arg.indexOf(':');
  if (idx === -1) {
    console.error(`Error: "${arg}" isn't in OLD:NEW form.`);
    process.exit(1);
  }
  return [arg.slice(0, idx), arg.slice(idx + 1)];
}

function parseArgs(argv) {
  const opts = { pairs: [], apply: false };
  for (const arg of argv) {
    if (arg === '--apply') { opts.apply = true; continue; }
    const m = arg.match(/^--(amharic|latin|lower)=(.+)$/);
    if (m) { opts.pairs.push(parsePair(m[2])); continue; }
    console.error(`Unrecognized argument: ${arg}`);
    process.exit(1);
  }
  return opts;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function run() {
  const { pairs, apply } = parseArgs(process.argv.slice(2));
  if (pairs.length === 0) {
    console.error('Nothing to do — pass at least one of --amharic=, --latin=, --lower= (each as OLD:NEW).');
    process.exit(1);
  }

  console.log(apply ? '=== APPLYING changes ===' : '=== DRY RUN (nothing will be written — add --apply to actually change files) ===');
  pairs.forEach(([oldStr, newStr]) => console.log(`  "${oldStr}" -> "${newStr}"`));
  console.log('');

  const files = walk(ROOT);
  let totalReplacements = 0;
  let filesChanged = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    let updated = original;
    let fileReplacements = 0;

    for (const [oldStr, newStr] of pairs) {
      const count = updated.split(oldStr).length - 1;
      if (count > 0) {
        updated = updated.split(oldStr).join(newStr);
        fileReplacements += count;
      }
    }

    if (fileReplacements > 0) {
      filesChanged++;
      totalReplacements += fileReplacements;
      const relPath = path.relative(ROOT, file);
      console.log(`${apply ? '✓' : '·'} ${relPath} — ${fileReplacements} replacement(s)`);
      if (apply) fs.writeFileSync(file, updated, 'utf8');
    }
  }

  console.log(`\n${filesChanged} file(s), ${totalReplacements} total replacement(s).`);
  if (!apply) {
    console.log('\nThis was a DRY RUN — nothing was written. Re-run with --apply to actually make these changes.');
  } else {
    console.log('\nDone. Now run:  node scripts/sync-playground.js');
    console.log('(playground/*.js still have the OLD name in their own copies until you sync — dictionaries.js etc. just changed in lib/.)');
    console.log('Then check playground/index.html by hand — its inline <script> and visible UI text were renamed directly, not via sync.');
  }
}

run();
