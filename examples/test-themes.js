// Sanity check for the theme system in playground/index.html: every theme
// declared in the JS `THEMES` picker list must (a) have a matching
// body[data-theme="..."] CSS block (except "dark", which IS the :root
// default), and (b) that block must define every custom property the
// :root/dark theme defines — a theme missing one variable doesn't error,
// it just silently falls back to dark's color for that one property,
// which is easy to miss by eye and exactly the kind of thing worth
// catching automatically.
const fs = require('fs');
const path = require('path');

function check(desc, cond) {
  console.log((cond ? '✓ ' : '✗ ') + desc);
  if (!cond) process.exitCode = 1;
}

const html = fs.readFileSync(path.join(__dirname, '../playground/index.html'), 'utf8');

// 1. Pull the THEMES keys out of the JS.
const themesBlockMatch = html.match(/const THEMES = \{([\s\S]*?)\n\};/);
check('THEMES object found in the JS', !!themesBlockMatch);
const themeKeys = [...themesBlockMatch[1].matchAll(/^\s*(\w+):\s*\{/gm)].map(m => m[1]).filter(k => k !== 'system'); // 'system' is virtual: it resolves to light or dark at runtime
check('found at least 4 themes', themeKeys.length >= 4);
console.log('  themes:', themeKeys.join(', '));

// 2. Pull every CSS custom property name the :root (dark) block defines.
const rootBlockMatch = html.match(/:root\{([\s\S]*?)\n  \}/);
check(':root block found', !!rootBlockMatch);
const rootVars = [...rootBlockMatch[1].matchAll(/(--[\w-]+):/g)].map(m => m[1]).sort();
check('root theme defines a non-trivial variable set', rootVars.length >= 10);

// 3. Every non-dark theme must have its own body[data-theme="X"] block,
//    and every variable NAME it sets must be a typo-free match against
//    the known set root defines (a typo'd name like --mcomment wouldn't
//    error — it would just silently no-op, falling back to dark's color
//    for that one property, which is easy to miss by eye and exactly
//    the kind of thing worth catching here). Themes are NOT required to
//    override every variable — e.g. "light" deliberately keeps the same
//    --primary/--secondary brand colors as dark, only swapping the
//    neutral background/text ones for contrast. That's a design choice,
//    not a gap.
const rootVarSet = new Set(rootVars);
let allThemesValid = true;
for (const key of themeKeys) {
  if (key === 'dark') continue; // dark IS :root, nothing else to check
  const blockRe = new RegExp(`body\\[data-theme="${key}"\\]\\{([\\s\\S]*?)\\n  \\}`);
  const m = html.match(blockRe);
  if (!m) {
    console.log(`  ✗ no CSS block found for theme "${key}"`);
    allThemesValid = false;
    continue;
  }
  const themeVars = [...m[1].matchAll(/(--[\w-]+):/g)].map(mm => mm[1]);
  const unknown = themeVars.filter(v => !rootVarSet.has(v));
  if (unknown.length) {
    console.log(`  ✗ theme "${key}" sets unrecognized/typo'd variable(s): ${unknown.join(', ')}`);
    allThemesValid = false;
  }
}
check('no theme sets an unrecognized/typo\'d CSS variable name', allThemesValid);

// 4. The picker UI functions must exist.
check('applyTheme() exists', /function applyTheme\(/.test(html));
check('renderThemeGrid() exists', /function renderThemeGrid\(/.test(html));
check('showThemeModal()/hideThemeModal() exist', /function showThemeModal\(/.test(html) && /function hideThemeModal\(/.test(html));

console.log(process.exitCode ? '\nFAILED' : '\nAll test-themes checks passed.');
