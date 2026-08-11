/* ============================================================
   ድርኛ (Direnya) — CSS transpiler
   Translates Amharic property names to real CSS properties.
   Selectors (.መደብ-ስም, #መለያ-ስም) are NOT translated — they are
   author-chosen identifiers, same as in real CSS.
   Amharic color words (ቀይ, ሰማያዊ, ...) are translated only when
   they appear as the value of a color-ish property, so they
   never collide with unrelated text.
   ============================================================ */
(function (root, factory) {
  const mod = factory(typeof require === 'function' ? require('./dictionaries.js') : root.DIRENYA);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.transpileCSS = mod;
})(typeof self !== 'undefined' ? self : this, function (DICT) {

  const { CSS_PROPS, CSS_COLOR_VALUES } = DICT;
  const COLOR_PROPS = new Set(['color', 'background-color', 'border-color', 'outline-color']);

  // Matches one declaration: <property> : <value> ;
  const DECL_RE = /([^\s{};:]+)\s*:\s*([^;{}]+);/g;

  function transpileCSS(source) {
    const warnings = [];
    const result = source.replace(DECL_RE, (full, rawProp, rawValue, offset) => {
      const prop = rawProp.trim();
      const realProp = CSS_PROPS[prop] || prop;
      if (!CSS_PROPS[prop] && !isKnownCssProp(realProp)) {
        warnings.push(`Unknown property "${prop}" near character ${offset} — passed through as-is.`);
      }
      let value = rawValue.trim();
      if (COLOR_PROPS.has(realProp) && CSS_COLOR_VALUES[value]) {
        value = CSS_COLOR_VALUES[value];
      }
      return `${realProp}: ${value};`;
    });
    return { css: result, warnings };
  }

  const KNOWN_CSS_PROPS = new Set([
    'color','background-color','background','font-size','font-weight','font-family',
    'text-align','margin','padding','border','border-radius','width','height',
    'max-width','max-height','display','position','top','left','right','bottom',
    'flex-direction','justify-content','align-items','gap','cursor','opacity',
    'z-index','box-shadow','text-decoration','line-height'
  ]);
  function isKnownCssProp(p) { return KNOWN_CSS_PROPS.has(p.toLowerCase()); }

  return transpileCSS;
});
