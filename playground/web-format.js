/* ============================================================
   ድርኛ (Direnya) — .ወብ single-file format
   -------------------------------------------------------------
   One file, three optional sections, marked with a line that
   starts EXACTLY with #ገጽ / #ዘይቤ / #ትእዛዝ (no space after #,
   so it's never confused with a JS-DSL comment like "# ማስታወሻ",
   which always has a space after the #).

   Example .ወብ file:

     #ገጽ
     <ሰነድ>
       ...
     </ሰነድ>

     #ዘይቤ
     ራስጌ { ቀለም: ነጭ; }

     #ትእዛዝ
     ብዛት = 0

   A file with NO section markers at all is treated as pure ገጽ
   (HTML) — so the simplest possible first file, with nothing in
   it but markup, still works with no ceremony.
   ============================================================ */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.parseWeb = mod.parseWeb; root.serializeWeb = mod.serializeWeb; }
})(typeof self !== 'undefined' ? self : this, function () {

  const SECTION_RE = /^#(ገጽ|ዘይቤ|ትእዛዝ)\s*$/;
  const SECTION_KEY = { 'ገጽ': 'html', 'ዘይቤ': 'css', 'ትእዛዝ': 'js' };

  function parseWeb(source) {
    const lines = source.split('\n');
    const sections = { html: [], css: [], js: [] };
    let current = 'html'; // default target until/ unless a marker is seen
    let sawAnyMarker = false;

    for (const line of lines) {
      const m = SECTION_RE.exec(line.trim());
      if (m) {
        current = SECTION_KEY[m[1]];
        sawAnyMarker = true;
        continue; // the marker line itself isn't content
      }
      sections[current].push(line);
    }

    return {
      html: sections.html.join('\n').trim(),
      css: sections.css.join('\n').trim(),
      js: sections.js.join('\n').trim(),
      hadExplicitSections: sawAnyMarker,
    };
  }

  function serializeWeb({ html, css, js }) {
    const parts = [];
    if (html && html.trim()) parts.push('#ገጽ\n' + html.trim());
    if (css && css.trim()) parts.push('#ዘይቤ\n' + css.trim());
    if (js && js.trim()) parts.push('#ትእዛዝ\n' + js.trim());
    return parts.join('\n\n') + '\n';
  }

  return { parseWeb, serializeWeb };
});
