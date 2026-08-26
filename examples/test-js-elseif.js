const transpileJS = require('../lib/js-transpiler.js');

function run(js, runtimeFn) {
  const lines = [];
  const capture = (x) => lines.push(x);
  eval(`(function(ጻፍ){ ${js} })`)(capture);
  return lines;
}

console.log('=== TEST 1: three-way else-if grade chain (real ወይም feature) ===');
{
  const src = `
ውጤት = 55
ካሆነ ውጤት >= 90
  ጻፍ("ሀ")
ወይም ውጤት >= 70
  ጻፍ("ለ")
ወይም ውጤት >= 50
  ጻፍ("ሐ")
ካልሆነ
  ጻፍ("ውድቅ")
ጨርስ
`;
  const { js, warnings } = transpileJS(src);
  const out = run(js);
  console.log('output:', out, 'warnings:', warnings);
  console.log(out.length === 1 && out[0] === 'ሐ' ? '✓ correct branch (55 -> ሐ)' : '✗ FAILED');
}

console.log('\n=== TEST 2: true/false literal inside a ካሆነ condition (regression — this was broken) ===');
{
  const { js } = transpileJS('ካሆነ እውነት\n  ጻፍ("hi")\nጨርስ');
  console.log(js);
  console.log(js.includes('if (true)') ? '✓ እውነት translated inside condition' : '✗ FAILED — still emits raw እውነት');
}

console.log('\n=== TEST 3: true/false inside repeat / foreach / return (same regression class) ===');
{
  const r1 = transpileJS('ድገም እውነት ጊዜ\n  ጻፍ("x")\nጨርስ'); // silly but exercises the path
  console.log('repeat:', r1.js.includes('< (true)') ? '✓' : '✗ FAILED', '—', r1.js.replace(/\n/g, ' '));

  const r2 = transpileJS('ተግባር ፈ()\n  መልስ ሐሰት\nጨርስ');
  console.log('return:', r2.js.includes('return false;') ? '✓' : '✗ FAILED', '—', r2.js.replace(/\n/g, ' '));
}

console.log('\n=== TEST 4: else-if nested with a loop inside one branch (block-stack still correct) ===');
{
  const src = `
ካሆነ እውነት
  ድገም 2 ጊዜ
    ጻፍ("ውስጥ")
  ጨርስ
ወይም ሐሰት
  ጻፍ("ሁለተኛ")
ጨርስ
`;
  const { js, warnings } = transpileJS(src);
  const out = run(js);
  console.log('output:', out, 'warnings:', warnings);
  console.log(out.length === 2 && out.every(x => x === 'ውስጥ') ? '✓ correct nesting behavior' : '✗ FAILED');
}
