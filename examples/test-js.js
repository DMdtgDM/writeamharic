const transpileJS = require('../lib/js-transpiler.js');

const source = `
# ቀላል ግሪቲንግ ፕሮግራም
ስም = "ሰላም"
ዕድሜ = 15

ካሆነ ዕድሜ >= 13
  ጻፍ("ጎረምሳ ነህ")
ካልሆነ
  ጻፍ("ገና ልጅ ነህ")
ጨርስ

ድገም 3 ጊዜ
  ጻፍ("ሰላም!")
ጨርስ

ፍራፍሬዎች = ["ፖም", "ሙዝ", "ብርቱካን"]
እያንዳንዱ ፍሬ በ ፍራፍሬዎች
  ጻፍ(ፍሬ)
ጨርስ

ተግባር ደምር(አ, ለ)
  መልስ አ + ለ
ጨርስ

ውጤት = ደምር(4, 5)
ጻፍ(ውጤት)

ትክክል = እውነት
ስህተት = ሐሰት
`;

const { js, warnings } = transpileJS(source);
console.log('--- OUTPUT JS ---');
console.log(js);
console.log('--- WARNINGS ---');
console.log(warnings.length ? warnings.join('\n') : '(none)');

console.log('\n--- ACTUALLY RUNNING THE OUTPUT (with ጻፍ shimmed to console.log) ---');
const runtime = `function ጻፍ(x){ console.log('>>', x); }\n`;
eval(runtime + js);
