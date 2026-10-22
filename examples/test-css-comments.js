const transpileCSS = require('../lib/css-transpiler.js');

// Regression test: /* ... */ comments must be completely opaque to the
// transpiler, same as in real CSS. Two real bugs existed before this fix:
//   1. A bare Amharic tag word inside a comment before a selector (e.g.
//      "/* styles for ራስጌ section */") got mistranslated by the
//      selector-tag pass, changing the comment's own text.
//   2. A commented-out declaration (e.g. "/* ቀለም: ሰማያዊ; */") got
//      translated by the property/value pass, even though it's inside a
//      comment and should never be touched.
// Fixed by extracting every comment into a placeholder before either pass
// runs, then restoring the original comment text byte-for-byte at the end.

let allPass = true;
function check(label, condition) {
  console.log((condition ? '✓ ' : '✗ ') + label);
  if (!condition) allPass = false;
}

console.log('=== TEST 1: a tag-like word inside a comment must NOT be translated ===');
{
  const { css, warnings } = transpileCSS('/* styles for ራስጌ section */\nራስጌ { ቀለም: ነጭ; }');
  console.log(css);
  check('comment text kept exactly as written (ራስጌ, not "header")',
    css.includes('/* styles for ራስጌ section */'));
  check('the real selector outside the comment is still translated',
    css.includes('header {'));
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 2: a commented-out declaration must NOT be translated ===');
{
  const { css } = transpileCSS('.ሀ {\n  /* ቀለም: ሰማያዊ; -- old value */\n  ቀለም: ቀይ;\n}');
  console.log(css);
  check('commented-out line kept as original Amharic, untouched',
    css.includes('/* ቀለም: ሰማያዊ; -- old value */'));
  check('the real, active declaration right after it is still translated',
    css.includes('color: red;'));
}

console.log('\n=== TEST 3: a colon/semicolon inside a comment must not confuse the parser ===');
{
  const { css, warnings } = transpileCSS('.ሀ { ቀለም: ቀይ; /* note: important; really */ }');
  console.log(css);
  check('comment with colon+semicolon preserved verbatim',
    css.includes('/* note: important; really */'));
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 4: multiple comments in one file all round-trip byte-for-byte ===');
{
  const { css } = transpileCSS('/* a */ .ሀ { ቀለም: ቀይ; /* b */ } /* c */');
  console.log(css);
  check('all three comments preserved in order', css === '/* a */ .ሀ { color: red; /* b */ } /* c */');
}

console.log('\n' + (allPass ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'));
