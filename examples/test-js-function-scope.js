const transpileJS = require('../lib/js-transpiler.js');

// Regression test for a real bug: variable declarations used to be tracked
// in one flat Set for the whole file, so if two different functions each
// used a variable of the same name, only the FIRST got a real `var` — the
// second silently became an undeclared assignment, which either leaks a
// global (non-strict) or throws (strict). Fixed by giving each function its
// own declared-names scope (see declaredStack in js-transpiler.js).

console.log('=== TEST 1: two functions, same variable name — each must get its own `var` ===');
const src1 = `
ተግባር አንድ()
  ውጤት = 5
  ጻፍ(ውጤት)
ጨርስ

ተግባር ሁለት()
  ውጤት = 10
  ጻፍ(ውጤት)
ጨርስ
`;
const { js: js1, warnings: w1 } = transpileJS(src1);
console.log(js1);
const bothDeclared = (js1.match(/var ውጤት/g) || []).length === 2;
console.log(bothDeclared ? '✓ both functions declare their own `var ውጤት`' : '✗ second function is missing its own `var`');

console.log('\n=== TEST 2: actually run it — the second function must NOT leak a global ===');
const runtime = `function ጻፍ(x){ /* no-op for this check */ }\n`;
(function () {
  'use strict';
  eval(runtime + js1 + '\nአንድ(); ሁለት();');
})();
console.log(typeof globalThis.ውጤት === 'undefined' ? '✓ no global leak (fixed!)' : '✗ ውጤት leaked to the global scope');

console.log('\n=== TEST 3: same variable reused across an if/else INSIDE one function — must still declare only once ===');
const src2 = `
ተግባር ፈትን()
  ብዛት = 0
  ካሆነ ብዛት == 0
    ብዛት = 1
  ካልሆነ
    ብዛት = 2
  ጨርስ
  ጻፍ(ብዛት)
ጨርስ
`;
const { js: js2 } = transpileJS(src2);
console.log(js2);
const declaredOnceInFunction = (js2.match(/var ብዛት/g) || []).length === 1;
console.log(declaredOnceInFunction ? '✓ still only one `var` for reassignment within the same function (no regression)' : '✗ regression: redeclared inside the same function');

console.log('\n=== TEST 4: a variable assigned inside a function, when a same-named variable already exists at top level, updates THAT variable — no implicit shadowing ===');
// This used to assert the opposite (an independent local "shadows" the
// outer one) — which is real JS `var`-hoisting behavior, but is exactly
// what caused the ብዛት/NaN bug in the bundled counter example: a beginner
// writing `ብዛት = ብዛት + 1` inside a click handler expects "the counter I
// already made keeps going up," not "a mysterious second, hidden ብዛት
// exists inside this one function." For a DSL whose whole audience is
// beginners, "a name always means the same variable, once it exists" is
// far less surprising than real var-scoping rules — see the assignLine
// comment in js-transpiler.js for the full story.
const src3 = `
ውጤት = "global"

ተግባር ውስጣዊ()
  ውጤት = "local"
  ጻፍ(ውጤት)
ጨርስ

ውስጣዊ()
ጻፍ(ውጤት)
`;
const { js: js3 } = transpileJS(src3);
console.log(js3);
const topLevelDeclared = /^var ውጤት = "global";/m.test(js3);
const reassignedWithoutRedeclaring = /^\s*ውጤት = "local";/m.test(js3) && !/var ውጤት = "local";/.test(js3);
console.log(topLevelDeclared && reassignedWithoutRedeclaring
  ? '✓ the function updates the SAME top-level ውጤት — no shadow variable created'
  : '✗ regression: a same-named top-level variable is no longer respected inside a function');

console.log('\n' + (bothDeclared && declaredOnceInFunction && topLevelDeclared && reassignedWithoutRedeclaring ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'));
