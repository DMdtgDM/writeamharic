/* ============================================================
   ድርኛ (Direnya) — HTML transpiler
   Translates Amharic tag/attribute names to real HTML.

   Approach: a small hand-written tokenizer (character-by-character
   scan), not a regex pass over the whole source. This exists to fix
   a real, confirmed bug in the old regex approach: any `<`/`>` used
   as literal text (e.g. a student writing a math comparison like
   "x<5 and y>10" in a paragraph) used to get misread as a fake tag
   ("<5>"), producing a confusing "Unknown tag" warning for text that
   was never meant to be markup at all.

   The fix: `<` only starts a tag when immediately followed by a
   letter (Amharic tag names start with an Ethiopic letter, same as
   real HTML tag names start with an ASCII letter) or `/`+letter for
   a closing tag, or `<!--` for a comment. Anything else — a bare `<`
   or `>` in running text — is left completely alone, exactly like a
   real HTML parser would treat it.

   Same external contract as before: transpileHTML(source) -> {html,
   warnings}. Nothing downstream (lib/build.js, playground) needed to
   change — see docs/DIRENYA_DOCUMENTATION.md §10.
   ============================================================ */
(function (root, factory) {
  const mod = factory(typeof require === 'function' ? require('./dictionaries.js') : root.DIRENYA);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.transpileHTML = mod;
})(typeof self !== 'undefined' ? self : this, function (DICT) {

  const { TAGS, ATTRS, ATTR_VALUES } = DICT;

  // A tag name may start with an ASCII or Ethiopic letter — same rule a
  // real HTML5 tokenizer uses (ASCII letter) extended to Ethiopic script,
  // since that's the whole point of this project's tag names.
  function isNameStart(ch) {
    return ch !== undefined && /[A-Za-z\u1200-\u137F]/.test(ch);
  }

  // Matches one attribute inside a tag's attribute string
  const ATTR_RE = /([^\s=/>]+)(=(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?/g;

  function translateAttrs(attrString) {
    let out = '';
    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(attrString)) !== null) {
      const rawName = m[1];
      const hasValue = m[2] !== undefined;
      const value = m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5];
      const realName = ATTRS[rawName] || rawName; // untranslated attrs pass through unchanged
      out += ' ' + realName;
      if (hasValue) {
        // Only a short, fixed list of real attributes (see ATTR_VALUES in
        // dictionaries.js) have enum-like values worth translating — and
        // only on an EXACT match of the whole (trimmed) value, so a
        // student's own text/URLs/numbers are never touched.
        const valueMap = ATTR_VALUES && ATTR_VALUES[realName];
        const trimmedValue = value.trim();
        const realValue = (valueMap && valueMap[trimmedValue] !== undefined) ? valueMap[trimmedValue] : value;
        // keep original quoting style where possible; default to double quotes
        out += `="${realValue}"`;
      }
    }
    return out;
  }

  function transpileHTML(source) {
    const warnings = [];
    let out = '';
    const n = source.length;
    let i = 0;

    while (i < n) {
      if (source[i] !== '<') { out += source[i]; i++; continue; }

      // Comment: passed through completely untouched, never warned about.
      if (source.startsWith('<!--', i)) {
        const end = source.indexOf('-->', i + 4);
        if (end !== -1) {
          out += source.slice(i, end + 3);
          i = end + 3;
          continue;
        }
        // Unterminated comment: fall through and treat '<' as literal text.
      }

      const closing = source[i + 1] === '/';
      const nameStart = closing ? i + 2 : i + 1;
      if (!isNameStart(source[nameStart])) {
        // Doesn't look like a real tag start — literal '<' in running text.
        out += source[i]; i++; continue;
      }

      let j = nameStart;
      while (j < n && !/[\s/>]/.test(source[j])) j++;
      const rawTag = source.slice(nameStart, j);

      // Find the tag's closing '>', respecting quoted attribute values
      // (so a quoted value like title="a > b" doesn't end the tag early —
      // this already worked before and must keep working).
      let k = j, tagEnd = -1;
      while (k < n) {
        const c = source[k];
        if (c === '"' || c === "'") {
          const quote = c;
          k++;
          while (k < n && source[k] !== quote) k++;
          if (k < n) k++; // skip the closing quote
          continue;
        }
        if (c === '>') { tagEnd = k; break; }
        if (c === '<') break; // a new '<' before we ever closed — malformed, bail out
        k++;
      }
      if (tagEnd === -1) {
        // No proper close found — treat this '<' as literal text rather
        // than silently consuming the rest of the document.
        out += source[i]; i++; continue;
      }

      let attrString = source.slice(j, tagEnd);
      let selfClose = false;
      if (/\/\s*$/.test(attrString)) {
        selfClose = true;
        attrString = attrString.replace(/\/\s*$/, '');
      }

      const realTag = TAGS[rawTag] || rawTag;
      if (!TAGS[rawTag] && !isKnownHtmlTag(realTag)) {
        // Not an Amharic tag we know, and not standard HTML either —
        // pass through untouched but warn, so authors get useful feedback.
        warnings.push(`Unknown tag "<${rawTag}>" near character ${i} — passed through as-is.`);
      }

      out += closing ? `</${realTag}>` : `<${realTag}${translateAttrs(attrString)}${selfClose ? ' /' : ''}>`;
      i = tagEnd + 1;
    }

    return { html: out, warnings };
  }

  const KNOWN_HTML_TAGS = new Set([
    'html','head','title','body','style','script','meta','link',
    'header','footer','nav','main','section','article','aside','div','span',
    'h1','h2','h3','h4','h5','h6','p','a','img','strong','em','br','hr',
    'ul','ol','li','form','input','button','label','select','option','textarea',
    'table','tr','td','th','!doctype'
  ]);
  function isKnownHtmlTag(tag) { return KNOWN_HTML_TAGS.has(tag.toLowerCase()); }

  return transpileHTML;
});
