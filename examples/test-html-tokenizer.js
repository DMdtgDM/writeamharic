const transpileHTML = require('../lib/html-transpiler.js');

// Regression test for swapping the regex-based HTML tokenizer for a real
// character-by-character scanner (see docs §10/§11). The regex version had
// a confirmed bug: any `<`/`>` used as ordinary text — e.g. a math
// comparison like "x<5 and y>10" in a paragraph — got misread as a fake
// tag ("<5>"), producing a confusing "Unknown tag" warning for text that
// was never markup. `<` now only starts a tag when immediately followed by
// a letter (or `/`+letter, or `<!--`), matching how a real HTML tokenizer
// decides where a tag begins.

let allPass = true;
function check(label, condition) {
  console.log((condition ? '✓ ' : '✗ ') + label);
  if (!condition) allPass = false;
}

console.log('=== TEST 1: plain-text math comparison must NOT be read as a tag ===');
{
  const { html, warnings } = transpileHTML('<አንቀጽ>x<5 and y>10</አንቀጽ>');
  console.log(html);
  check('output keeps the literal < and >', html === '<p>x<5 and y>10</p>');
  check('no false "Unknown tag" warning', warnings.length === 0);
}

console.log('\n=== TEST 2: quoted attribute values containing < or > still work ===');
{
  const { html, warnings } = transpileHTML('<ማስገቢያ title="a > b < c">');
  console.log(html);
  check('quoted value with > and < preserved whole', html === '<input title="a > b < c">');
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 3: a genuinely unknown tag still warns (no regression) ===');
{
  const { html, warnings } = transpileHTML('<foobar>hi</foobar>');
  check('tag passed through as-is', html === '<foobar>hi</foobar>');
  check('warns exactly twice (open + close)', warnings.length === 2);
}

console.log('\n=== TEST 4: comments containing < / > are untouched and never warned about ===');
{
  const { html, warnings } = transpileHTML('<!-- a < b and c > d --><አንቀጽ>ok</አንቀጽ>');
  check('comment passed through verbatim', html === '<!-- a < b and c > d --><p>ok</p>');
  check('no warnings', warnings.length === 0);
}

console.log('\n=== TEST 5: nested real markup, attributes, and self-closing tags all unaffected ===');
{
  const src = '<ሰነድ><ራስ><አርእስት>ት</አርእስት></ራስ><ሰውነት><ስዕል ምንጭ="x.jpg" መግለጫ="ሀ" /></ሰውነት></ሰነድ>';
  const { html, warnings } = transpileHTML(src);
  console.log(html);
  check('nested tags + self-closing tag with attrs all translate correctly',
    html === '<html><head><title>ት</title></head><body><img src="x.jpg" alt="ሀ" /></body></html>');
  check('no warnings', warnings.length === 0);
}

console.log('\n' + (allPass ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'));
