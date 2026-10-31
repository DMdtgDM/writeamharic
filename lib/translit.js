/* ============================================================
   ድርኛ (Direnya) — translit.js
   Phonetic matching for the suggestion helper: a student types the way a word SOUNDS in English letters
   ("sewenet", "tsaf", "kahone") and gets the Amharic word (ሰውነት, ጻፍ, ካሆነ).

   How: every Ethiopic syllable is "consonant + vowel". We compare only the CONSONANTS, in order
   (the "skeleton"), because beginners spell the vowels many different ways:
       ሰውነት → s w n t        "sewenet" → s w n t   ✓        "sewnet" → s w n t   ✓
   The last typed consonant may be unfinished ("s" matches "sh…"). Pure logic — no DOM, works in Node, the browser and React Native.
   ============================================================ */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.DIRENYA_TRANSLIT = mod;
})(typeof self !== 'undefined' ? self : this, function () {

  // [consonant, first code point] — each row is 8 syllables (7 vowel orders + a rare 8th)
  const ROWS = [
    ['h', 0x1200], ['l', 0x1208], ['h', 0x1210], ['m', 0x1218], ['s', 0x1220], ['r', 0x1228], ['s', 0x1230], ['sh', 0x1238],
    ['q', 0x1240], ['q', 0x1248], ['q', 0x1250], ['q', 0x1258], ['b', 0x1260], ['v', 0x1268], ['t', 0x1270], ['ch', 0x1278],
    ['h', 0x1280], ['h', 0x1288], ['n', 0x1290], ['ny', 0x1298], ['', 0x12A0], ['k', 0x12A8], ['k', 0x12B0], ['h', 0x12B8],
    ['k', 0x12C0], ['w', 0x12C8], ['', 0x12D0], ['z', 0x12D8], ['zh', 0x12E0], ['y', 0x12E8], ['d', 0x12F0], ['d', 0x12F8],
    ['j', 0x1300], ['g', 0x1308], ['g', 0x1310], ['g', 0x1318], ['t', 0x1320], ['ch', 0x1328], ['p', 0x1330], ['s', 0x1338],
    ['s', 0x1340], ['f', 0x1348], ['p', 0x1350],
  ];
  const VOWELS = ['e', 'u', 'i', 'a', 'e', '', 'o', 'wa'];     // the 7 "orders" (sixth order = no vowel)
  const TABLE = {};                                            // char -> { c: consonant, v: vowel }
  ROWS.forEach(([c, start]) => { for (let k = 0; k < 8; k++) TABLE[String.fromCharCode(start + k)] = { c, v: c === '' && k === 0 ? 'a' : VOWELS[k] }; });

  const isEthiopic = (ch) => ch >= '\u1200' && ch <= '\u137F';

  // Ethiopic text -> consonant tokens, e.g. "ሰውነት" -> ["s","w","n","t"]. Also reports whether the word starts with a vowel letter (አ, ዐ rows).
  function skeleton(word) {
    const tokens = []; let vowelStart = false, first = true;
    for (const ch of word) {
      const t = TABLE[ch]; if (!t) continue;
      if (t.c === '') { if (first) vowelStart = true; } else tokens.push(t.c);
      first = false;
    }
    return { tokens, vowelStart };
  }
  // Rough Latin spelling of an Ethiopic word: ሰውነት -> "sewnet". Used only to rank closer matches first.
  function romanize(word) {
    let out = '';
    for (const ch of word) { const t = TABLE[ch]; if (t) out += t.c + t.v; else if (/[\w-]/.test(ch)) out += ch; }
    return out;
  }
  // Latin letters as typed -> consonant tokens ("sewenet" -> s,w,n,t; "tsaf" -> t,s,f ... ). `ts` is read as ጽ/ፅ-like "s" start too.
  function typedTokens(typed) {
    const s = typed.toLowerCase().replace(/[^a-z']/g, ''); const tokens = []; let i = 0; const first = /^[aeiou]/.test(s);
    while (i < s.length) {
      const two = s.slice(i, i + 2), one = s[i];
      if (two === 'sh' || two === 'ch' || two === 'zh' || two === 'ny') { tokens.push(two); i += 2; continue; }
      if (two === 'ts') { tokens.push('s'); i += 2; continue; }                 // "tsaf" = ጻፍ (ጸ is an "s" letter)
      if (two === 'kh' || two === 'th' || two === 'ph') { tokens.push(two[0] === 'k' ? 'h' : two[0]); i += 2; continue; }
      if ('aeiou\''.includes(one)) { i++; continue; }                            // vowels are ignored on purpose
      tokens.push(one === 'x' ? 'h' : one === 'c' ? 'ch' : one === 'q' ? 'q' : one); i++;
    }
    return { tokens, vowelStart: first };
  }
  const norm = (tok) => (tok === 'q' ? 'k' : tok);                             // ቀ is spoken "qe" but nearly everyone types "ke"
  // Does the Latin text the student typed so far fit the START of this Amharic word?
  function matchesLatin(typed, word) {
    const t = typedTokens(typed); if (!t.tokens.length && !t.vowelStart) return false;
    const w = skeleton(word);
    if (!t.tokens.length) return w.vowelStart;                                  // typed only a vowel: words that start with a vowel letter
    if (t.tokens.length > w.tokens.length) return false;
    for (let i = 0; i < t.tokens.length; i++) {
      const a = norm(t.tokens[i]), b = norm(w.tokens[i]), last = i === t.tokens.length - 1;
      if (last ? !b.startsWith(a) : a !== b) return false;
    }
    return true;
  }
  // 0 = best. Lets "sew" put ሰውነት above ሰን.
  function rank(typed, word) {
    const r = romanize(word), low = typed.toLowerCase();
    if (r.startsWith(low)) return 0;
    const t = typedTokens(typed), w = skeleton(word);
    return t.tokens.length === w.tokens.length ? 1 : 2;
  }
  return { skeleton, romanize, typedTokens, matchesLatin, rank };
});
