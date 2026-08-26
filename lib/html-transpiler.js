/* ============================================================
   ድርኛ (Direnya) — HTML transpiler
   Translates Amharic tag/attribute names to real HTML.
   Approach: tokenize on tags with a regex, translate the tag
   name and any Amharic attribute names found on it, leave all
   attribute VALUES and text content completely untouched
   (so Amharic content in a paragraph is just normal text).
   ============================================================ */
(function (root, factory) {
  const mod = factory(typeof require === 'function' ? require('./dictionaries.js') : root.DIRENYA);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.transpileHTML = mod;
})(typeof self !== 'undefined' ? self : this, function (DICT) {

  const { TAGS, ATTRS } = DICT;

  // Matches, in order of priority: an HTML comment (passed through
  // completely untouched — never treated as an unknown tag), OR a real
  // tag: <tagname ...attrs.../>  or  <tagname ...attrs...>  or  </tagname>
  const TAG_RE = /(<!--[\s\S]*?-->)|<\/?([^\s/>]+)((?:\s+[^\s=/>]+(?:=(?:"[^"]*"|'[^']*'|[^\s/>]+))?)*)\s*(\/?)>/g;

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
        // keep original quoting style where possible; default to double quotes
        out += `="${value}"`;
      }
    }
    return out;
  }

  function transpileHTML(source) {
    const warnings = [];
    const result = source.replace(TAG_RE, (full, comment, rawTag, attrString, selfClose, offset) => {
      if (comment !== undefined) return comment; // real HTML comment — untouched, never warned about
      const isClosing = full.startsWith('</');
      const realTag = TAGS[rawTag] || rawTag;
      if (!TAGS[rawTag] && !isKnownHtmlTag(realTag)) {
        // Not an Amharic tag we know, and not standard HTML either —
        // pass through untouched but warn, so authors get useful feedback.
        warnings.push(`Unknown tag "<${rawTag}>" near character ${offset} — passed through as-is.`);
      }
      if (isClosing) return `</${realTag}>`;
      const attrs = translateAttrs(attrString);
      return `<${realTag}${attrs}${selfClose ? ' /' : ''}>`;
    });
    return { html: result, warnings };
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
