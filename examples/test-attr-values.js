// Tests: HTML attribute VALUES that are translated (currently just
// input `type=`) — exact-match only, never touching free-form text.
const transpileHTML = require('../lib/html-transpiler.js');

function check(desc, cond) {
  console.log((cond ? '✓ ' : '✗ ') + desc);
  if (!cond) process.exitCode = 1;
}

// 1. Amharic value translated
let r = transpileHTML('<ማስገቢያ ዓይነት="ኢሜይል" />');
check('type value ኢሜይል -> email', r.html.includes('type="email"'));

// 2. Latin alias value translated
r = transpileHTML('<ማስገቢያ ዓይነት="password" />');
check('type value password (already English) passes through', r.html.includes('type="password"'));

r = transpileHTML('<ማስገቢያ ዓይነት="kitir" />');
check('type value kitir (Latin alias) -> number', r.html.includes('type="number"'));

// 3. Untranslated attribute (placeholder) never has its value touched
r = transpileHTML('<ማስገቢያ ዓይነት="ጽሑፍ" ጠቋሚ="ኢሜይል ያስገቡ" />');
check('placeholder text left completely alone even though it matches a type-value word',
  r.html.includes('placeholder="ኢሜይል ያስገቡ"') && r.html.includes('type="text"'));

// 4. A value that happens to contain a matching word as a substring, not
// an exact match, is left alone (only whole-value matches translate).
r = transpileHTML('<ማስገቢያ ዓይነት="ቁጥር-ሳጥን" />');
check('non-exact-match value left untouched', r.html.includes('type="ቁጥር-ሳጥን"'));

console.log(process.exitCode ? '\nFAILED' : '\nAll test-attr-values checks passed.');
