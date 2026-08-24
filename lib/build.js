#!/usr/bin/env node
/* ============================================================
   ድርኛ (Direnya) — build CLI
   -------------------------------------------------------------
   Usage:
     node lib/build.js <input> <output.html>            (one combined file)
     node lib/build.js <input> <output-folder> --split   (upload-ready: index.html + style.css + script.js)

   <input> is EITHER:
     - a single .ወብ file (one file, #ገጽ/#ዘይቤ/#ትእዛዝ sections), OR
     - a project folder containing ገጽ.ድር (required), ዘይቤ.ድር, ትእዛዝ.ድር

   Default output: ONE standalone .html file (CSS/JS inlined) —
   simplest possible "publish," works by itself anywhere.

   --split output: three real separate files wired together with
   <link>/<script src> — what you actually want to upload to a
   static host (Vercel, Netlify, GitHub Pages, cPanel, anywhere).
   ============================================================ */
const fs = require('fs');
const path = require('path');

const transpileHTML = require('./html-transpiler.js');
const transpileCSS = require('./css-transpiler.js');
const transpileJS = require('./js-transpiler.js');
const { parseWeb } = require('./web-format.js');

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function loadSource(input) {
  const stat = fs.existsSync(input) ? fs.statSync(input) : null;
  if (!stat) {
    console.error(`Error: "${input}" not found.`);
    process.exit(1);
  }
  if (stat.isFile()) {
    // single .ወብ (or any text) file — split into sections
    const raw = fs.readFileSync(input, 'utf8');
    const { html, css, js } = parseWeb(raw);
    if (!html) {
      console.error(`Error: "${input}" has no #ገጽ content — every project needs at least a page.`);
      process.exit(1);
    }
    return { htmlSrc: html, cssSrc: css || null, jsSrc: js || null };
  }
  // project folder — three separate files
  const htmlSrc = readIfExists(path.join(input, 'ገጽ.ድር'));
  const cssSrc  = readIfExists(path.join(input, 'ዘይቤ.ድር'));
  const jsSrc   = readIfExists(path.join(input, 'ትእዛዝ.ድር'));
  if (!htmlSrc) {
    console.error(`Error: ${path.join(input, 'ገጽ.ድር')} not found — every project needs at least a page file.`);
    process.exit(1);
  }
  return { htmlSrc, cssSrc, jsSrc };
}

// Robust injection: works whether the page has a real </head>/</body>,
// only an <html> wrapper with no head at all, or (fallback) neither —
// so a beginner's page without an explicit ራስ (head) section never ends
// up with a stray, unmatched closing tag.
function injectIntoHead(html, block) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${block}\n</head>`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/(<html[^>]*>)/i, `$1\n<head>\n${block}\n</head>`);
  return block + '\n' + html;
}
function injectBeforeBodyClose(html, block) {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${block}\n</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${block}\n</html>`);
  return html + '\n' + block;
}

function transpileAll({ htmlSrc, cssSrc, jsSrc }) {
  const allWarnings = [];
  const { html, warnings: hw } = transpileHTML(htmlSrc);
  allWarnings.push(...hw.map(w => `[ገጽ] ${w}`));

  let css = '';
  if (cssSrc) {
    const r = transpileCSS(cssSrc);
    css = r.css;
    allWarnings.push(...r.warnings.map(w => `[ዘይቤ] ${w}`));
  }

  let js = '';
  if (jsSrc) {
    const r = transpileJS(jsSrc);
    js = r.js;
    allWarnings.push(...r.warnings.map(w => `[ትእዛዝ] ${w}`));
  }

  return { html, css, js, warnings: allWarnings };
}

function buildCombined(input, outFile) {
  const { html, css, js, warnings } = transpileAll(loadSource(input));
  const runtimeSrc = fs.readFileSync(path.join(__dirname, 'runtime.js'), 'utf8');

  let finalHtml = html;
  if (css.trim()) finalHtml = injectIntoHead(finalHtml, `<style>\n${css}\n</style>`);
  if (js.trim()) finalHtml = injectBeforeBodyClose(finalHtml, `<script>\n${runtimeSrc}\n${js}\n</script>`);
  if (!/<!doctype/i.test(finalHtml)) finalHtml = '<!DOCTYPE html>\n' + finalHtml;

  fs.writeFileSync(outFile, finalHtml, 'utf8');
  console.log(`✓ Built ${outFile}`);
  reportWarnings(warnings);
}

function buildSplit(input, outDir) {
  const { html, css, js, warnings } = transpileAll(loadSource(input));
  fs.mkdirSync(outDir, { recursive: true });

  let outHtml = html;
  if (css.trim()) outHtml = injectIntoHead(outHtml, `<link rel="stylesheet" href="style.css">`);
  if (js.trim()) outHtml = injectBeforeBodyClose(outHtml, `<script src="runtime.js"></script>\n<script src="script.js"></script>`);
  if (!/<!doctype/i.test(outHtml)) outHtml = '<!DOCTYPE html>\n' + outHtml;

  fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf8');
  if (css.trim()) fs.writeFileSync(path.join(outDir, 'style.css'), css, 'utf8');
  if (js.trim()) {
    fs.writeFileSync(path.join(outDir, 'script.js'), js, 'utf8');
    fs.copyFileSync(path.join(__dirname, 'runtime.js'), path.join(outDir, 'runtime.js'));
  }

  console.log(`✓ Built ${outDir}/ (index.html${css.trim() ? ', style.css' : ''}${js.trim() ? ', script.js, runtime.js' : ''})`);
  console.log(`  Upload this whole folder to any static host — Vercel, Netlify, GitHub Pages, etc.`);
  reportWarnings(warnings);
}

function reportWarnings(warnings) {
  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log('  - ' + w));
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const split = args.includes('--split');
  const [input, out] = args.filter(a => a !== '--split');
  if (!input || !out) {
    console.error('Usage:');
    console.error('  node lib/build.js <input> <output.html>            (one combined file)');
    console.error('  node lib/build.js <input> <output-folder> --split   (upload-ready separate files)');
    console.error('<input> is a .ወብ file OR a project folder (ገጽ.ድር/ዘይቤ.ድር/ትእዛዝ.ድር).');
    process.exit(1);
  }
  if (split) buildSplit(input, out);
  else buildCombined(input, out);
}

module.exports = { buildCombined, buildSplit };
