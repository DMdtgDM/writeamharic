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

  const { TAGS, CSS_PROPS, CSS_COLOR_VALUES } = DICT;
  const COLOR_PROPS = new Set(['color', 'background-color', 'border-color', 'outline-color']);

  // Matches everything up to (not including) the next `{` — i.e. one
  // selector list, comma-separated, possibly compound/descendant.
  const SELECTOR_BLOCK_RE = /([^{}]+)\{/g;

  // A bare tag name gets translated ONLY in "tag position" — at the
  // start of a compound selector, or right after whitespace/, />+~
  // (a combinator). Never touches .class / #id / :pseudo / [attr] —
  // those aren't preceded by one of those separators, so they never
  // match here at all. This exists because HTML tag names ARE
  // translated (ራስጌ -> header), so a selector still written as the
  // Amharic tag word would silently match nothing — a real, confirmed
  // bug (ራስጌ{}/ግርጌ{}/ሰውነት{} and descendant selectors like
  // ".ማስያ-ረድፍ ማስገቢያ" all did nothing).
  const SELECTOR_TAG_RE = /(^|[\s,>+~])([A-Za-z_$][\w-]*|[\u1200-\u137F][\u1200-\u137F0-9_-]*)/g;
  function translateSelectorTags(selectorText) {
    return selectorText.replace(SELECTOR_TAG_RE, (full, sep, word) => {
      const real = TAGS[word];
      return real ? sep + real : full;
    });
  }

  // ---- General CSS keyword VALUES (not just colors) -> real CSS keyword ----
  // Unlike CSS_COLOR_VALUES (only checked on color-ish properties), these
  // apply to ANY property's value — "auto", "none", "block" etc. mean the
  // same keyword no matter which property they're the value of. Only
  // matched when the value is EXACTLY this word (whole value, trimmed) —
  // never inside a quoted string or multi-word value like a font stack —
  // so it's safe the same way CSS_COLOR_VALUES already is.
  const CSS_VALUE_WORDS = {
    "ራስ-ሰር": "auto", "ras-ser": "auto",
    "ምንም": "none", "minim": "none",
    "ክፍል-ደረጃ": "block", "kifil-dereja": "block",
    "መስመር-ደረጃ": "inline", "mesmer-dereja": "inline",
    "ተለዋዋጭ": "flex", "telewawach": "flex",
    "ፍርግርግ": "grid", "firgrig": "grid",
    "ፍጹም": "absolute", "fitsum": "absolute",
    "አንጻራዊ": "relative", "anitsarawi": "relative",
    "ቋሚ": "fixed", "kwami": "fixed",
    "ተለጣፊ": "sticky", "teletafi": "sticky",
    "ድምቅ": "bold", "dimk": "bold",
    "መደበኛ": "normal", "medebegna": "normal",
    "ሰያፍ-ፊደል": "italic", "seyaf-fidel": "italic",
    "መሃል": "center", "mehal": "center",
    "የተመጠነ": "justify", "yetemetene": "justify",
    "ትልቅ-ሆሄ": "uppercase", "tilik-hohe": "uppercase",
    "ትንሽ-ሆሄ": "lowercase", "tinish-hohe": "lowercase",
    "ጠንካራ-መስመር": "solid", "tenkara-mesmer": "solid",
    "የተሰበረ-መስመር": "dashed", "yeteseber-mesmer": "dashed",
    "ነጠብጣብ": "dotted", "netebtab": "dotted",
    "ተደብቆ": "hidden", "tedebko": "hidden",
    "ይታያል": "visible", "yitayal": "visible",
    "ጠቋሚ-እጅ": "pointer", "tekwami-ej": "pointer",
    "የተከለከለ": "not-allowed", "yetekelekele": "not-allowed",

    // ---- added: more commonly-needed keyword values ----
    "ስር-መስመር": "underline", "sir-mesmer": "underline",
    "ላይ-መስመር": "overline", "lay-mesmer": "overline",
    "አቋራጭ-መስመር": "line-through", "akwarach-mesmer": "line-through",
    "ያለ-መጠቅለል": "nowrap", "yale-metekelel": "nowrap",
    "እንዳለ": "pre", "endale": "pre",
    "እንዳለ-መጠቅለል": "pre-wrap", "endale-metekelel": "pre-wrap",
    "ቃል-ትልቅ": "capitalize", "kal-tilik": "capitalize",
    "ሙሉ-ሽፋን": "cover", "mulu-shifan": "cover",
    "ገደብ-ውስጥ": "contain", "gedeb-wist": "contain",
    "ሙላ": "fill", "mula": "fill",
    "ጅምር": "flex-start", "jimir": "flex-start",
    "መጨረሻ": "flex-end", "mecheresha": "flex-end",
    "ዘርጋ": "stretch", "zeriga": "stretch",
    "መሰረት-መስመር": "baseline", "meseret-mesmer": "baseline",
    "መካከል-ክፍተት": "space-between", "mekakel-kifitet": "space-between",
    "ዙሪያ-ክፍተት": "space-around", "zuriya-kifitet": "space-around",
    "አትድገም": "no-repeat", "atdigem": "no-repeat",
    "ድገም": "repeat", "digem": "repeat",
    "ሸብልል": "scroll", "shebilil": "scroll",
    "ተሰብስብ": "collapse", "tesebseb": "collapse",
    "ተገልብጦ-ጠቅልል": "wrap-reverse", "tegelibto-tekelil": "wrap-reverse",
  };

  function transpileCSS(source) {
    const warnings = [];

    // Protect comments FIRST, before either translation pass touches
    // anything — this fixes a real bug: a bare Amharic tag word inside a
    // /* ... */ comment (e.g. "/* styles for ራስጌ section */") used to get
    // silently mistranslated by the selector-tag pass, and a commented-out
    // declaration (e.g. "/* ቀለም: ሰማያዊ; */") used to get translated by the
    // property/value pass too — comments are supposed to be completely
    // opaque to the transpiler, same as in real CSS. Swapped back in at
    // the very end, byte-for-byte, once both passes are done.
    const comments = [];
    let working = source.replace(/\/\*[\s\S]*?\*\//g, (m) => {
      const token = `\u0000CMT${comments.length}\u0000`;
      comments.push(m);
      return token;
    });

    // Pass 1: translate bare Amharic tag-name selectors (ራስጌ -> header),
    // leaving .class/#id/:pseudo/[attr] selectors completely untouched.
    working = working.replace(SELECTOR_BLOCK_RE, (full, selectorText) =>
      translateSelectorTags(selectorText) + '{'
    );

    // Pass 2: translate property names and values inside each block.
    const DECL_RE = /([^\s{};:]+)\s*:\s*([^;{}]+);/g;
    let result = working.replace(DECL_RE, (full, rawProp, rawValue, offset) => {
      const prop = rawProp.trim();
      const realProp = CSS_PROPS[prop] || prop;
      if (!CSS_PROPS[prop] && !prop.startsWith('--') && !isKnownCssProp(realProp)) {   // --custom-properties are valid CSS, not typos
        warnings.push(`Unknown property "${prop}" near character ${offset} — passed through as-is.`);
      }
      let value = rawValue.trim();
      if (COLOR_PROPS.has(realProp) && CSS_COLOR_VALUES[value]) {
        value = CSS_COLOR_VALUES[value];
      } else if (CSS_VALUE_WORDS[value]) {
        value = CSS_VALUE_WORDS[value];
      }
      return `${realProp}: ${value};`;
    });

    // Restore comments exactly as written — untouched by either pass above.
    result = result.replace(/\u0000CMT(\d+)\u0000/g, (m, idx) => comments[Number(idx)]);
    return { css: result, warnings };
  }

  // Kept in sync with every real property CSS_PROPS can produce, PLUS
  // the properties this tool supports only by literal-English passthrough
  // (never had an Amharic word). This is what decides whether typing the
  // literal English name directly (skipping the Amharic word entirely)
  // gets a false "Unknown property" warning — it used to be a small,
  // stale, hand-maintained list (28 entries) that drifted behind
  // CSS_PROPS (45+), so real supported properties like min-height would
  // warn as "unknown" whenever someone wrote the English word directly,
  // even though the SAME property worked with zero warnings via its
  // Amharic word. Built from CSS_PROPS so it can never drift again.
  const KNOWN_CSS_PROPS = new Set(Object.values(CSS_PROPS).concat([
    // real CSS written directly in English — valid, just no Amharic word (yet)
    'flex', 'flex-basis', 'flex-flow', 'place-items', 'place-content', 'justify-items', 'justify-self', 'row-gap', 'column-gap', 'grid-gap',
    'grid-column', 'grid-row', 'grid-area', 'grid-auto-flow', 'grid-auto-rows', 'grid-auto-columns', 'aspect-ratio', 'inset', 'overflow-x', 'overflow-y',
    'text-overflow', 'word-break', 'word-spacing', 'text-indent', 'text-decoration-color', 'pointer-events', 'user-select', 'object-position',
    'mix-blend-mode', 'clip-path', 'backdrop-filter', 'background-clip', 'background-attachment', 'animation-delay', 'animation-name',
    'animation-iteration-count', 'animation-timing-function', 'animation-fill-mode', 'animation-direction', 'transition-duration', 'transition-property',
    'transition-delay', 'transition-timing-function', 'transform-origin', 'will-change', 'list-style-type', 'caret-color', 'accent-color', 'appearance',
    'outline-offset', 'border-collapse', 'border-spacing', 'border-style', 'table-layout', 'column-count', 'columns', 'font-variant', 'fill', 'stroke',
    'padding-inline', 'margin-inline', 'scroll-snap-type', 'scroll-margin-top', 'text-wrap', 'hyphens'
  ]));
  function isKnownCssProp(p) { return KNOWN_CSS_PROPS.has(p.toLowerCase()); }

  return transpileCSS;
});
