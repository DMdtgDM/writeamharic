// The suggestion helper understands words typed by SOUND in Latin letters ("sewenet" -> ሰውነት).
const T = require('../lib/translit.js'), D = require('../lib/dictionaries.js');
let failures = 0; const check = (n, c) => { console.log((c ? '✓ ' : '✗ ') + n); if (!c) failures++; };
const eth = (k) => /[\u1200-\u137F]/.test(k);
const find = (table, q) => Object.keys(table).filter(eth).filter((w) => T.matchesLatin(q, w)).sort((a, b) => T.rank(q, a) - T.rank(q, b) || a.length - b.length);
check('"sew", "sewenet" and "sewnet" all find ሰውነት (body)', ['sew', 'sewenet', 'sewnet'].every((q) => find(D.TAGS, q)[0] === 'ሰውነት'));
check('"azrar" finds አዝራር, "mech" finds መጫኛ', find(D.TAGS, 'azrar')[0] === 'አዝራር' && find(D.TAGS, 'mech')[0] === 'መጫኛ');
check('"adrasha" finds አድራሻ (href) among attributes', find(D.ATTRS, 'adrasha')[0] === 'አድራሻ');
const js = Object.assign({}, D.JS_KEYWORD_ALIASES, D.RUNTIME_ALIASES);
check('"kah" → ካሆነ, "tsaf" → ጻፍ, "dig" → ድገም, "tegbar" → ተግባር, "sima" → ስማ', [['kah', 'ካሆነ'], ['tsaf', 'ጻፍ'], ['dig', 'ድገም'], ['tegbar', 'ተግባር'], ['sima', 'ስማ']].every(([q, w]) => find(js, q)[0] === w));
check('k and q sound the same: "kelem" finds ቀለም', find(D.CSS_PROPS, 'kelem')[0] === 'ቀለም');
check('a single letter lists every word of that sound family', find(D.TAGS, 's').length > 5);
check('the last letter may be unfinished: "s" matches a word that starts with ሸ (sh)', T.matchesLatin('s', 'ሸራ'));
check('wrong spelling finds nothing', find(D.TAGS, 'xyzxyz').length === 0 && !T.matchesLatin('', 'ሰውነት'));
check('a typed vowel only matches words that start with a vowel letter', T.matchesLatin('a', 'አካል') && !T.matchesLatin('a', 'ሰውነት'));
check('romanize gives a readable spelling', T.romanize('ሰውነት') === 'sewnet');
process.exit(failures ? 1 : 0);
