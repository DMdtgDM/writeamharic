const { parseWeb, serializeWeb } = require('../lib/web-format.js');

console.log('=== TEST 1: full file with all three sections ===');
const t1 = `#ገጽ
<ሰነድ>
  <ሰውነት><ርዕስ1>ሰላም</ርዕስ1></ሰውነት>
</ሰነድ>

#ዘይቤ
ራስጌ { ቀለም: ነጭ; }

#ትእዛዝ
# ይህ አስተያየት ነው
ብዛት = 0
`;
const r1 = parseWeb(t1);
console.log('html:', JSON.stringify(r1.html));
console.log('css:', JSON.stringify(r1.css));
console.log('js:', JSON.stringify(r1.js));
console.log('hadExplicitSections:', r1.hadExplicitSections);

console.log('\n=== TEST 2: no section markers at all -> whole file is html ===');
const t2 = `<ሰነድ><ሰውነት><አንቀጽ>ቀላል ገጽ</አንቀጽ></ሰውነት></ሰነድ>`;
const r2 = parseWeb(t2);
console.log('html:', JSON.stringify(r2.html));
console.log('css:', JSON.stringify(r2.css));
console.log('hadExplicitSections:', r2.hadExplicitSections);

console.log('\n=== TEST 3: JS comment "# ገጽ" (with space) must NOT be mistaken for a section marker ===');
const t3 = `#ትእዛዝ
# ገጽ የሚለው እዚህ አስተያየት እንጂ ክፍል መክፈቻ አይደለም
ጻፍ("hi")
`;
const r3 = parseWeb(t3);
console.log('js:', JSON.stringify(r3.js));
console.log(r3.js.includes('# ገጽ የሚለው') ? '✓ correctly kept as comment inside js section' : '✗ FAILED — wrongly treated as a section marker');

console.log('\n=== TEST 4: round-trip serialize -> parse gives back the same content ===');
const original = { html: '<ሰነድ>ሀ</ሰነድ>', css: 'a { b: c; }', js: 'ሀ = 1' };
const serialized = serializeWeb(original);
console.log('--- serialized ---');
console.log(serialized);
const reparsed = parseWeb(serialized);
const roundTripOk = reparsed.html === original.html && reparsed.css === original.css && reparsed.js === original.js;
console.log(roundTripOk ? '✓ round-trip OK' : '✗ round-trip MISMATCH');
if(!roundTripOk) console.log({reparsed, original});
