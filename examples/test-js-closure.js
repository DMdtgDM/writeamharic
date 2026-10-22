// Tests: an outer-scope variable reassigned inside a function must update
// THAT variable via closure, not silently shadow it with a fresh,
// uninitialized local (the ብዛት/NaN bug — see js-transpiler.js's
// assignLine comment for the full story). Also checks the new warning
// for inline "ተግባር(...)" callbacks, which previously failed silently.
const transpileJS = require('../lib/js-transpiler.js');

function check(desc, cond) {
  console.log((cond ? '✓ ' : '✗ ') + desc);
  if (!cond) process.exitCode = 1;
}

// 1. The exact shape of the bundled counter example.
const counterSrc = `ብዛት = 0

ተግባር ሰላም_በል()
  ብዛት = ብዛት + 1
  ጻፍ(ብዛት)
ጨርስ

ሰላም_በል()
ሰላም_በል()
ሰላም_በል()
`;
const counterOut = transpileJS(counterSrc);
check('no stray "var" reshadowing the outer counter inside the function',
  !/function ሰላም_በል\(\) \{\s*var ብዛት/.test(counterOut.js));

// Actually execute it and check the counter really counts up (not NaN).
const seen = [];
function ጻፍ(v) { seen.push(v); }
// eslint-disable-next-line no-eval
eval(counterOut.js.replace(/^function ጻፍ.*$/m, ''));
check('counter increments 1,2,3 (not NaN,NaN,NaN)', seen.join(',') === '1,2,3');

// 2. A genuinely new local inside a function must still get `var` (the
// original bug this scoping design was fixing must stay fixed).
const localSrc = `ተግባር ካሬ(ቁ)
  ውጤት = ቁ * ቁ
  መልስ ውጤት
ጨርስ
`;
const localOut = transpileJS(localSrc);
check('a genuinely new local still gets var', /var ውጤት = ቁ \* ቁ;/.test(localOut.js));

// 3. Sibling functions can each declare their own local of the same name
// without colliding (the case the original design comment describes).
const siblingSrc = `ተግባር አንድ()
  ጊዜያዊ = 1
  መልስ ጊዜያዊ
ጨርስ

ተግባር ሁለት()
  ጊዜያዊ = 2
  መልስ ጊዜያዊ
ጨርስ
`;
const siblingOut = transpileJS(siblingSrc);
check('sibling functions each get their own local (both declared with var)',
  (siblingOut.js.match(/var ጊዜያዊ/g) || []).length === 2);

// 4. Inline anonymous callback now WORKS: ተግባር() at line end, closed by ጨርስ).
const inlineSrc = `አዝራር = በመለያ("ማጫወቻ")
ስማ(አዝራር, "ጠቅታ", ተግባር()
  ጻፍ("ተጫንክ!")
ጨርስ)
`;
const inlineOut = transpileJS(inlineSrc);
check('inline callback: no warnings', inlineOut.warnings.length === 0);
check('inline callback: valid JS', (()=>{ try { new Function(inlineOut.js); return true; } catch(e){ return false; } })());
check('inline callback: closes with });', /\}\);\s*$/.test(inlineOut.js.trim()));
check('one-line ተግባር() callback still warns', transpileJS('ስማ(አ, "ጠቅታ", ተግባር() ጻፍ(1) ጨርስ)').warnings.length > 0);

// 5. The documented working alternative (named function passed by
// reference) still produces zero warnings.
const namedSrc = `ተግባር በጠቅታ_ስራ()
  ጻፍ("ተጫንክ!")
ጨርስ

አዝራር = በመለያ("ማጫወቻ")
ስማ(አዝራር, "ጠቅታ", በጠቅታ_ስራ)
`;
const namedOut = transpileJS(namedSrc);
check('named-function-by-reference pattern still has zero warnings', namedOut.warnings.length === 0);

console.log(process.exitCode ? '\nFAILED' : '\nAll test-js-closure checks passed.');
