// NOTE: needs `jsdom` (npm install jsdom --no-save) and a local static
// server for playground/ so the page's own <script src="dictionaries.js">
// etc. actually load (jsdom won't fetch relative URLs without one) — run:
//   (self-contained: the test starts its own static server)
// before this test. CodeMirror itself still won't render in jsdom (see
// test-dom-builtins.js's note on that), so this exercises the plain-
// textarea fallback path — the same code path every function already has
// to support for offline use, so it's a faithful test of the real logic,
// not a reimplementation of it.
const { JSDOM } = require('jsdom');
const http = require('http'), fs = require('fs'), path = require('path');
// Self-contained: serve playground/ ourselves. CodeMirror is bundled locally now, so hide it here
// to keep this test exercising the plain-textarea fallback (jsdom has no layout engine for CodeMirror).
function startServer(){
  const root = path.join(__dirname, '..', 'playground');
  const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json' };
  return new Promise(res => { const srv = http.createServer((req, rsp) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if(/vendor[\/](codemirror|xml|css|javascript|overlay|show-hint)/.test(f) || !f.startsWith(root) || !fs.existsSync(f)){ rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); rsp.end(fs.readFileSync(f));
  }).listen(0, () => res(srv)); });
}

let failures = 0;
function check(name, condition){
  console.log((condition ? '✓' : '✗ FAILED') + ' ' + name);
  if(!condition) failures++;
}

async function main(){
  const srv = await startServer();
  const dom = await JSDOM.fromURL('http://localhost:' + srv.address().port + '/index.html', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true
  });
  const win = dom.window, doc = win.document;
  await new Promise(r => setTimeout(r, 800)); // let async init settle

  check('page loaded and fell back to plain textareas (no CodeMirror in jsdom)',
    typeof win.CodeMirror === 'undefined');

  console.log('\n=== toggleLineComment on the JS tab ===');
  const jsTa = doc.getElementById('src-js');
  jsTa.value = 'ጻፍ("ሰላም")';
  jsTa.focus();
  jsTa.selectionStart = 0; jsTa.selectionEnd = jsTa.value.length;
  win.toggleLineComment('js');
  check('line got commented out with "# "', jsTa.value === '# ጻፍ("ሰላም")');
  jsTa.selectionStart = 0; jsTa.selectionEnd = jsTa.value.length;
  win.toggleLineComment('js');
  check('toggling again uncomments back to the original line', jsTa.value === 'ጻፍ("ሰላም")');

  console.log('\n=== toggleBlockComment on the CSS tab ===');
  const cssTa = doc.getElementById('src-css');
  cssTa.value = 'ቀለም: ቀይ;';
  cssTa.focus();
  cssTa.selectionStart = 0; cssTa.selectionEnd = 0; // no selection -> whole current line
  win.toggleBlockComment('css', '/*', '*/');
  check('CSS line wrapped in /* */', cssTa.value === '/* ቀለም: ቀይ; */');
  cssTa.selectionStart = 0; cssTa.selectionEnd = cssTa.value.length;
  win.toggleBlockComment('css', '/*', '*/');
  check('toggling again unwraps back to the original', cssTa.value === 'ቀለም: ቀይ;');

  console.log('\n=== toggleBlockComment on the HTML tab ===');
  const htmlTa = doc.getElementById('src-html');
  htmlTa.value = '<አንቀጽ>ሰላም</አንቀጽ>';
  htmlTa.focus();
  htmlTa.selectionStart = 0; htmlTa.selectionEnd = 0;
  win.toggleBlockComment('html', '<!--', '-->');
  check('HTML line wrapped in <!-- -->', htmlTa.value === '<!-- <አንቀጽ>ሰላም</አንቀጽ> -->');

  console.log('\n=== Alt+1/2/3 switches tabs ===');
  win.switchToTab('css');
  check('switchToTab("css") activates the CSS tab', doc.querySelector('.tab[data-tab="css"]').classList.contains('active'));
  win.switchToTab('html');
  check('switchToTab("html") activates the HTML tab back', doc.querySelector('.tab[data-tab="html"]').classList.contains('active'));

  console.log('\n=== Ctrl+S / Ctrl+O are intercepted (preventDefault called, no browser dialog) ===');
  let sPrevented = false;
  const sEvent = new win.KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });
  doc.dispatchEvent(sEvent);
  check('Ctrl+S event was preventDefault-ed', sEvent.defaultPrevented);

  console.log('\n=== ⌨ shortcuts modal opens and closes ===');
  win.showShortcutsModal();
  check('modal is visible after showShortcutsModal()', doc.getElementById('shortcuts-modal').classList.contains('show'));
  win.hideShortcutsModal();
  check('modal is hidden after hideShortcutsModal()', !doc.getElementById('shortcuts-modal').classList.contains('show'));

  console.log('\n=== error-handling safety net: a build error shows a friendly message, keeps last preview ===');
  const originalTranspileHTML = win.transpileHTML;
  win.transpileHTML = () => { throw new Error('simulated transpiler crash'); };
  await win.runProgram();
  const wBox = doc.getElementById('warnings');
  check('warnings box shows the friendly build-failed message', wBox.innerHTML.includes('build failed'));
  check('warnings box is marked visible', wBox.classList.contains('show'));
  win.transpileHTML = originalTranspileHTML;

  console.log('\n' + (failures === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
