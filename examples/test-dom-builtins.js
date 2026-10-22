// NOTE: unlike every other file in examples/, this test needs `jsdom` —
// it's the only test that needs a real DOM to click/type into (the DOM
// builtins in lib/runtime.js don't do anything meaningful without one).
// Run `npm install jsdom --no-save` first if this fails with MODULE_NOT_FOUND.
const { JSDOM } = require('jsdom');
const transpileHTML = require('../lib/html-transpiler.js');
const transpileJS = require('../lib/js-transpiler.js');
const fs = require('fs');
const path = require('path');

let failures = 0;
function check(name, condition){
  console.log((condition ? '✓' : '✗ FAILED') + ' ' + name);
  if(!condition) failures++;
}

// A realistic small program: a live character counter on a text field,
// exercising ንጥል_በመለያ, ስማ, ዋጋ_አግኝ, ጽሑፍ_አስቀምጥ, ስልት_አስቀምጥ, and መደብ_ጨምር together.
const htmlSrc = `
<ሰነድ><ሰውነት>
  <ማስገቢያ መለያ="ግቤት" ዓይነት="text">
  <ክፍል መለያ="ቆጣሪ">0</ክፍል>
  <አዝራር መለያ="ማጥፊያ">አጥፋ</አዝራር>
</ሰውነት></ሰነድ>
`;

const jsSrc = `
ግቤት = ንጥል_በመለያ("ግቤት")
ቆጣሪ = ንጥል_በመለያ("ቆጣሪ")
ማጥፊያ = ንጥል_በመለያ("ማጥፊያ")

ተግባር ሲተይብ()
  ጽሁፍ = ዋጋ_አግኝ(ግቤት)
  ርዝመት = ጽሁፍ.length
  ጽሑፍ_አስቀምጥ(ቆጣሪ, ርዝመት)
  ካሆነ ርዝመት > 10
    መደብ_ጨምር(ቆጣሪ, "ረጅም")
  ጨርስ
ጨርስ

ስማ(ግቤት, "input", ሲተይብ)

ተግባር አጥፋ()
  ዋጋ_አስቀምጥ(ግቤት, "")
  ጽሑፍ_አስቀምጥ(ቆጣሪ, "0")
  መደብ_አስወግድ(ቆጣሪ, "ረጅም")
ጨርስ

ስማ(ማጥፊያ, "click", አጥፋ)
`;

const { html } = transpileHTML(htmlSrc);
const { js, warnings } = transpileJS(jsSrc);
console.log('--- transpiled JS ---');
console.log(js);
check('no transpile warnings', warnings.length === 0);

const runtimeSrc = fs.readFileSync(path.join(__dirname, '../lib/runtime.js'), 'utf8');
const fullHtml = html.replace('</body>', `<script>${runtimeSrc}\n${js}</script></body>`);

const dom = new JSDOM(fullHtml, { runScripts: 'dangerously' });
const doc = dom.window.document;

console.log('\n=== simulating real user typing "hello world" into the field ===');
const input = doc.getElementById('ግቤት');
input.value = 'hello world'; // 11 chars
input.dispatchEvent(new dom.window.Event('input'));

check('counter shows correct length (11)', doc.getElementById('ቆጣሪ').textContent === '11');
check('ረጅም class added since length > 10', doc.getElementById('ቆጣሪ').classList.contains('ረጅም'));

console.log('\n=== simulating clicking the clear button ===');
doc.getElementById('ማጥፊያ').dispatchEvent(new dom.window.Event('click'));

check('input value cleared', input.value === '');
check('counter reset to 0', doc.getElementById('ቆጣሪ').textContent === '0');
check('ረጅም class removed', !doc.getElementById('ቆጣሪ').classList.contains('ረጅም'));

console.log('\n' + (failures === 0 ? '✓ ALL CHECKS PASSED — DOM builtins work end-to-end, through real event dispatch' : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
