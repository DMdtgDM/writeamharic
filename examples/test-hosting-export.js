const transpileHTML = require('../lib/html-transpiler.js');
const transpileCSS = require('../lib/css-transpiler.js');
const transpileJS = require('../lib/js-transpiler.js');

const htmlSrc = `<ሰነድ><ራስ><አርእስት>ፈተና</አርእስት></ራስ><ሰውነት><አንቀጽ>ሰላም</አንቀጽ></ሰውነት></ሰነድ>`;
const cssSrc = `ሰውነት { ቀለም: ቀይ; }`;
const jsSrc = `ጻፍ("hi")`;

const { html } = transpileHTML(htmlSrc);
const { css } = transpileCSS(cssSrc);
const { js } = transpileJS(jsSrc);

let outHtml = html;
const headLinks = css.trim() ? `<link rel="stylesheet" href="style.css">\n</head>` : '</head>';
outHtml = /<\/head>/i.test(outHtml) ? outHtml.replace(/<\/head>/i, headLinks) : headLinks + outHtml;
const bodyScripts = js.trim() ? `<script src="runtime.js"></script>\n<script src="script.js"></script>\n</body>` : '</body>';
outHtml = /<\/body>/i.test(outHtml) ? outHtml.replace(/<\/body>/i, bodyScripts) : outHtml + bodyScripts;
if (!/<!doctype/i.test(outHtml)) outHtml = '<!DOCTYPE html>\n' + outHtml;

console.log('--- generated index.html ---');
console.log(outHtml);
console.log('--- generated style.css ---');
console.log(css);
console.log('--- generated script.js ---');
console.log(js);

const checks = [
  ['links style.css', outHtml.includes('<link rel="stylesheet" href="style.css">')],
  ['links runtime.js before script.js', outHtml.indexOf('runtime.js') < outHtml.indexOf('script.js')],
  ['has doctype', outHtml.startsWith('<!DOCTYPE html>')],
  ['no inline <style> leaked in (should be linked, not inlined)', !outHtml.includes('<style>')],
  ['no inline transpiled JS leaked into html (should be in script.js only)', !outHtml.includes('ጻፍ(')],
];
console.log('\n--- checks ---');
checks.forEach(([name, pass]) => console.log((pass ? '✓ ' : '✗ ') + name));
