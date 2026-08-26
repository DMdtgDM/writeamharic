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

   MULTI-PAGE PROJECTS
   -------------------------------------------------------------
   Add a ገጾች/ ("pages") folder next to ገጽ.ድር:

     project/
       ገጽ.ድር          <- home page      -> index.html
       ዘይቤ.ድር         <- shared style   -> style.css  (all pages)
       ትእዛዝ.ድር        <- shared script  -> script.js  (all pages)
       ገጾች/
         ግንኙነት.ድር     <- extra page     -> ግንኙነት.html
         ስለኛ.ድር       <- extra page     -> ስለኛ.html

   Each file in ገጾች/ is just page markup (plain ገጽ content by
   default — no #ገጽ marker needed), and can optionally add its
   own #ዘይቤ / #ትእዛዝ sections for page-specific CSS/JS, which are
   emitted as <name>.css / <name>.js and loaded AFTER the shared
   style.css/script.js so page rules can override shared ones.

   Link between pages with a normal relative href, e.g.:
     <አገናኝ አድራሻ="ግንኙነት.html">አግኙን</አገናኝ>

   A project with a ገጾች/ folder is ALWAYS built as a folder of
   real separate files (like --split) — combined single-file
   output only makes sense for a single page, and --split is
   implied whenever there's more than one page to build.
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
  // project folder — three shared files, plus optional extra pages
  const htmlSrc = readIfExists(path.join(input, 'ገጽ.ድር'));
  const cssSrc  = readIfExists(path.join(input, 'ዘይቤ.ድር'));
  const jsSrc   = readIfExists(path.join(input, 'ትእዛዝ.ድር'));
  if (!htmlSrc) {
    console.error(`Error: ${path.join(input, 'ገጽ.ድር')} not found — every project needs at least a page file.`);
    process.exit(1);
  }

  const pagesDir = path.join(input, 'ገጾች');
  let extraPages = [];
  if (fs.existsSync(pagesDir) && fs.statSync(pagesDir).isDirectory()) {
    extraPages = fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.ድር'))
      .map(f => {
        const name = f.slice(0, -'.ድር'.length); // filename without extension
        const raw = fs.readFileSync(path.join(pagesDir, f), 'utf8');
        const { html, css, js } = parseWeb(raw);
        if (!html) {
          console.error(`Error: ${path.join(pagesDir, f)} has no page content.`);
          process.exit(1);
        }
        return { name, htmlSrc: html, cssSrc: css || null, jsSrc: js || null };
      });
  }

  return { htmlSrc, cssSrc, jsSrc, extraPages };
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

function writePageHtml(outDir, fileName, html, extraLinkTags, extraScriptTags) {
  let outHtml = html;
  if (extraLinkTags) outHtml = injectIntoHead(outHtml, extraLinkTags);
  if (extraScriptTags) outHtml = injectBeforeBodyClose(outHtml, extraScriptTags);
  if (!/<!doctype/i.test(outHtml)) outHtml = '<!DOCTYPE html>\n' + outHtml;
  fs.writeFileSync(path.join(outDir, fileName), outHtml, 'utf8');
}

function buildSplit(input, outDir) {
  const source = loadSource(input);
  const { html, css, js, warnings } = transpileAll(source);
  const extraPages = source.extraPages || [];
  fs.mkdirSync(outDir, { recursive: true });

  const linkTag = css.trim() ? `<link rel="stylesheet" href="style.css">` : '';
  const scriptTags = js.trim() ? `<script src="runtime.js"></script>\n<script src="script.js"></script>` : '';

  writePageHtml(outDir, 'index.html', html, linkTag || null, scriptTags || null);
  if (css.trim()) fs.writeFileSync(path.join(outDir, 'style.css'), css, 'utf8');
  if (js.trim()) {
    fs.writeFileSync(path.join(outDir, 'script.js'), js, 'utf8');
    fs.copyFileSync(path.join(__dirname, 'runtime.js'), path.join(outDir, 'runtime.js'));
  }

  const builtFiles = ['index.html'];
  if (css.trim()) builtFiles.push('style.css');
  if (js.trim()) builtFiles.push('script.js', 'runtime.js');

  // Extra pages (ገጾች/) — each gets its own HTML file, sharing the
  // project's style.css/script.js, plus its own <name>.css/<name>.js
  // if it declared page-specific #ዘይቤ/#ትእዛዝ sections.
  for (const page of extraPages) {
    const { html: pHtml, warnings: pHw } = transpileHTML(page.htmlSrc);
    warnings.push(...pHw.map(w => `[ገጾች/${page.name}] ${w}`));

    let pCss = '';
    if (page.cssSrc) {
      const r = transpileCSS(page.cssSrc);
      pCss = r.css;
      warnings.push(...r.warnings.map(w => `[ገጾች/${page.name}#ዘይቤ] ${w}`));
    }
    let pJs = '';
    if (page.jsSrc) {
      const r = transpileJS(page.jsSrc);
      pJs = r.js;
      warnings.push(...r.warnings.map(w => `[ገጾች/${page.name}#ትእዛዝ] ${w}`));
    }

    const pageLinks = [linkTag];
    if (pCss.trim()) {
      fs.writeFileSync(path.join(outDir, `${page.name}.css`), pCss, 'utf8');
      pageLinks.push(`<link rel="stylesheet" href="${page.name}.css">`);
      builtFiles.push(`${page.name}.css`);
    }
    const pageScripts = [scriptTags];
    if (pJs.trim()) {
      fs.writeFileSync(path.join(outDir, `${page.name}.js`), pJs, 'utf8');
      pageScripts.push(`<script src="${page.name}.js"></script>`);
      builtFiles.push(`${page.name}.js`);
    }

    writePageHtml(
      outDir,
      `${page.name}.html`,
      pHtml,
      pageLinks.filter(Boolean).join('\n') || null,
      pageScripts.filter(Boolean).join('\n') || null
    );
    builtFiles.push(`${page.name}.html`);
  }

  console.log(`✓ Built ${outDir}/ (${builtFiles.join(', ')})`);
  console.log(`  Upload this whole folder to any static host — Vercel, Netlify, GitHub Pages, etc.`);
  reportWarnings(warnings);
}

function reportWarnings(warnings) {
  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log('  - ' + w));
  }
}

function hasExtraPages(input) {
  if (!fs.existsSync(input) || !fs.statSync(input).isDirectory()) return false;
  const pagesDir = path.join(input, 'ገጾች');
  return fs.existsSync(pagesDir) && fs.statSync(pagesDir).isDirectory()
    && fs.readdirSync(pagesDir).some(f => f.endsWith('.ድር'));
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
    console.error('Add a ገጾች/ folder for extra pages — see the top of lib/build.js for the layout.');
    process.exit(1);
  }
  const multiPage = hasExtraPages(input);
  if (!split && multiPage) {
    console.log('Multiple pages found in ገጾች/ — building as a folder of files instead of one combined file.');
  }
  if (split || multiPage) buildSplit(input, out);
  else buildCombined(input, out);
}

module.exports = { buildCombined, buildSplit };
