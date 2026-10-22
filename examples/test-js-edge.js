const transpileJS = require('../lib/js-transpiler.js');

console.log('=== TEST 1: nested repeat inside if, inside function ===');
const t1 = `
ተግባር አሳይ_ሠንጠረዥ(መጠን)
  ካሆነ መጠን > 0
    ድገም መጠን ጊዜ
      ጻፍ("*")
    ጨርስ
  ጨርስ
ጨርስ
አሳይ_ሠንጠረዥ(3)
`;
const r1 = transpileJS(t1);
console.log(r1.js);
console.log('warnings:', r1.warnings);
eval(`function ጻፍ(x){ process.stdout.write(x); }\n` + r1.js);
console.log('\n');

console.log('=== TEST 2: unmatched ጨርስ should warn, not crash ===');
const t2 = `
ካሆነ እውነት
  ጻፍ("hi")
`;
const r2 = transpileJS(t2);
console.log('warnings:', r2.warnings);

console.log('=== TEST 3: reassigning existing variable should NOT redeclare with let ===');
const t3 = `
ቁጥር = 1
ቁጥር = ቁጥር + 1
ቁጥር = ቁጥር + 1
`;
const r3 = transpileJS(t3);
console.log(r3.js);
