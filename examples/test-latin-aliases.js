const transpileJS = require('../lib/js-transpiler.js');

let failures = 0;
function check(name, condition){
  console.log((condition ? '✓' : '✗ FAILED') + ' ' + name);
  if(!condition) failures++;
}
function runAndCapture(js){
  const lines = [];
  eval(`(function(ጻፍ){ ${js} })`)((x) => lines.push(x));
  return lines;
}

console.log('=== TEST 1: a program written ENTIRELY in Latin aliases ===');
{
  const src = `
score = 55
kahone score >= 90
  ጻፍ("A")
weyim score >= 70
  ጻፍ("B")
weyim score >= 50
  ጻፍ("C")
kalhone
  ጻፍ("F")
chers
`;
  const { js, warnings } = transpileJS(src);
  console.log(js);
  const out = runAndCapture(js);
  check('correct branch taken (55 -> C)', out.length === 1 && out[0] === 'C');
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 2: mixed Amharic + Latin in the SAME program (should work seamlessly) ===');
{
  const src = `
ብዛት = 0
digem 3 ጊዜ
  ብዛት = ብዛት + 1
ጨርስ
ጻፍ(ብዛት)
`;
  const { js, warnings } = transpileJS(src);
  const out = runAndCapture(js);
  check('mixed repeat/ጊዜ works, counts to 3', out.length === 1 && out[0] === 3);
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 3: Latin true/false ===');
{
  const { js } = transpileJS('kahone ewnet\n  ጻፍ("hi")\nchers');
  check('ewnet -> true', js.includes('if (true)'));
}
{
  const { js } = transpileJS('x = hasete');
  check('hasete -> false (in assignment)', js.includes('= false'));
}

console.log('\n=== TEST 4: CRITICAL — a variable name starting with a keyword prefix must NOT falsely trigger ===');
{
  // "kahonemore" starts with "kahone" but is a distinct identifier — must be a plain assignment, not an if-statement
  const { js, warnings } = transpileJS('kahonemore = 5');
  check('kahonemore = 5 stays a plain assignment, not "if"', js.includes('var kahonemore = 5;') && !js.includes('if ('));
}
{
  // same idea with ጨርስ/chers
  const { js } = transpileJS('chersstuff = 1');
  check('chersstuff = 1 stays a plain assignment, not "}"', js.includes('var chersstuff = 1;') && !js.trim().startsWith('}'));
}
{
  // a real-world plausible case: Latin variable literally named "be" (foreach's alias) used standalone
  const { js, warnings } = transpileJS('be = 10\nጻፍ(be)');
  console.log('be-as-variable output:', JSON.stringify(js));
  // This IS a known, documented tradeoff (see dictionaries.js comment) — "be" alone as a variable
  // name collides with the foreach-"in" alias. We check it does NOT silently corrupt in a confusing
  // way (foreach requires a very specific 3-part pattern, so a bare "be = 10" assignment line should
  // still fall through correctly since foreachLine requires "እያንዳንዱ/eyandandu ... be ..." shape).
  check('bare "be = 10" still assigns correctly (foreachLine pattern does not match a plain assignment)', js.includes('var be = 10;'));
}

console.log('\n=== TEST 5: Latin function/variable names work natively (no dictionary needed — already valid JS) ===');
{
  const src = `
tegbar add(a, b)
  mels a + b
chers
result = add(4, 5)
ጻፍ(result)
`;
  const { js } = transpileJS(src);
  const out = runAndCapture(js);
  check('Latin function name + Latin params work end to end (4+5=9)', out.length === 1 && out[0] === 9);
}

console.log('\n' + (failures === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
