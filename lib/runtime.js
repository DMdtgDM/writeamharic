/* ============================================================
   ድርኛ (Direnya) — browser runtime
   Defines the built-in Amharic functions available to any
   transpiled ትእዛዝ (script) program running on a page.
   Include this BEFORE the transpiled <script> in the output HTML.
   ============================================================ */
function ጻፍ(እሴት) {
  // Prints to the page. Looks for an element with id="ውጤት"
  // (meaning "result/output"); falls back to document.body.
  var target = document.getElementById('ውጤት') || document.body;
  var line = document.createElement('div');
  line.textContent = እሴት;
  target.appendChild(line);
}
function አሳውቅ(እሴት) {
  // Shows a popup alert box.
  window.alert(እሴት);
}
function አትም(እሴት) {
  // Logs to the browser console (for debugging, not visible on page).
  console.log(እሴት);
}

/* ---------- DOM access & control ----------
   These let a program reach into and change the page it's running on —
   not just write new content at the end, but find an existing element
   and read or change it. Element/class-name VALUES (e.g. "ውጤት") are
   never translated — only tag/attribute NAMES are (see html-transpiler.js)
   — so the id you write in ገጽ.ድር is exactly the string you pass here. */

function በመለያ(መለያ) {
  // "element by id" — document.getElementById
  return document.getElementById(መለያ);
}
function በመደብ(መደብ) {
  // "elements by class" — returns a real array (not a live HTMLCollection),
  // so ድገም/እያንዳንዱ loops over it behave predictably.
  return Array.from(document.getElementsByClassName(መደብ));
}
// ንጥል_በመለያ / ንጥሎች_በመደብ — the original, longer names, kept as working
// aliases so any lesson or project written before the shorter በመለያ/በመደብ
// names existed keeps working unchanged.
var ንጥል_በመለያ = በመለያ;
var ንጥሎች_በመደብ = በመደብ;

function ጽሑፍ_አስቀምጥ(እቃ, ጽሑፍ) {
  // "set text" — replaces an element's visible text.
  if (እቃ) እቃ.textContent = ጽሑፍ;
}

function ጽሑፍ_አ(እቃ, ጽሑፍ) {
  // "set text" — replaces an element's visible text.
  if (እቃ) እቃ.textContent = ጽሑፍ;
}

function ጽሑፍ_አግኝ(እቃ) {
  // "get text" — reads an element's visible text.
  return እቃ ? እቃ.textContent : '';
}

function ስልት_አስቀምጥ(እቃ, ንብረት, ዋጋ) {
  // "set style" — e.g. ስልት_አስቀምጥ(እቃ, "color", "red")
  // ንብረት (property) is a plain CSS property name in camelCase JS form
  // (e.g. "backgroundColor"), written as-is — not translated, same
  // reasoning as attribute VALUES elsewhere: it's data, not vocabulary.
  if (እቃ) እቃ.style[ንብረት] = ዋጋ;
}

function ስልት_አ(እቃ, ንብረት, ዋጋ) {
  // "set style" — e.g. ስልት_አስቀምጥ(እቃ, "color", "red")
  // ንብረት (property) is a plain CSS property name in camelCase JS form
  // (e.g. "backgroundColor"), written as-is — not translated, same
  // reasoning as attribute VALUES elsewhere: it's data, not vocabulary.
  if (እቃ) እቃ.style[ንብረት] = ዋጋ;
}

function መደብ_ጨምር(እቃ, መደብ) {
  // "add class"
  if (እቃ) እቃ.classList.add(መደብ);
}
function መደብ_አስወግድ(እቃ, መደብ) {
  // "remove class"
  if (እቃ) እቃ.classList.remove(መደብ);
}
function መደብ_ቀያይር(እቃ, መደብ) {
  // "toggle class"
  if (እቃ) እቃ.classList.toggle(መደብ);
}

function መደብ_ቀ(እቃ, መደብ) {
  // "toggle class"
  if (እቃ) እቃ.classList.toggle(መደብ);
}

function ዋጋ_አግኝ(እቃ) {
  // "get value" — reads a form field's current value (input/select/textarea).
  return እቃ ? እቃ.value : undefined;
}
function ዋጋ_አስቀምጥ(እቃ, ዋጋ) {
  // "set value" — writes a form field's value.
  if (እቃ) እቃ.value = ዋጋ;
}

var ክስተት_ስሞች = {
  "ጠቅታ": "click",
  "ግቤት": "input",
  "ለውጥ": "change",
  "ማስረከብ": "submit",
  "ጭነት": "load",
  "ቁልፍ-ጭነት": "keydown",
  "ቁልፍ-ጭ": "keydown",
  "ቁልፍ-ልቀት": "keyup",
  "ቁልፍ-ል": "keyup",
};

function ስማ(እቃ, ክስተት, ተግባር) {
  // "listen" — addEventListener, for anything beyond the ሲነካ (onclick)
  // attribute — e.g. ስማ(ማስገቢያ, "ግቤት", ተግባር) for live typing.
  // ክስተት (event name) can be the Amharic word above, OR the plain
  // English string ("click"/"input"/"change"...) if you prefer — both
  // work, since real DOM event names are never actually renamed.
  var እውነተኛ_ክስተት = ክስተት_ስሞች[ክስተት] || ክስተት;
  if (እቃ) እቃ.addEventListener(እውነተኛ_ክስተት, ተግባር);
}

/* ---------- browser APIs beyond the DOM ----------
   fetch/timers/storage/random — the other things a real page commonly
   needs. Same rule as everywhere else: only the FUNCTION NAME gets an
   Amharic wrapper; whatever you pass in (URLs, keys, values, numbers)
   is data and stays exactly as you write it. */

function አምጣ(አድራሻ, ምርጫዎች) {
  // "fetch/bring" — wraps fetch(url) so ትእዛዝ.ድር code gets a ready-
  // parsed JSON object back instead of two separate .then() steps.
  // Still a normal Promise — use with መልስ/return inside an async
  // function, or with .then(...) directly; both "async"/"await" and
  // ".then" already work as-is, since they're real JS keywords/methods,
  // never translated.
  return fetch(አድራሻ, ምርጫዎች).then(function (ምላሽ) {
    if (!ምላሽ.ok) throw new Error('HTTP ' + ምላሽ.status);
    return ምላሽ.json();
  });
}

function ጠብቅ(ተግባር, ሚሊሰከንድ) {
  // "wait" — setTimeout(fn, ms). Returns the timer id (rarely needed,
  // but matches what setTimeout itself returns, in case a lesson wants
  // to clearTimeout it later).
  return setTimeout(ተግባር, ሚሊሰከንድ);
}

function ቋሚ_አስቀምጥ(ስም, ዋጋ) {
  // "save permanently" — localStorage.setItem. Objects/arrays need
  // ወደ_ጽሁፍ (JSON.stringify) first if you want to store more than
  // a plain string/number. Wrapped in try/catch because a SANDBOXED
  // preview (no real origin) blocks localStorage entirely — on a real
  // deployed page this always works normally; only inside a sandboxed
  // preview does it quietly warn instead of crashing the whole script.
  try { localStorage.setItem(ስም, ዋጋ); }
  catch (ስሕተት) { console.warn('ቋሚ_አስቀምጥ: localStorage not available here —', ስሕተት.message); }
}
function ቋሚ_አግኝ(ስም) {
  // "get permanent" — localStorage.getItem. Returns null if nothing
  // was ever saved under that name, OR if localStorage isn't reachable
  // (see ቋሚ_አስቀምጥ's comment) — same fallback as a normal missing key.
  try { return localStorage.getItem(ስም); }
  catch (ስሕተት) { console.warn('ቋሚ_አግኝ: localStorage not available here —', ስሕተት.message); return null; }
}
function ቋሚ_አጥፋ(ስም) {
  // "erase permanent" — localStorage.removeItem.
  try { localStorage.removeItem(ስም); }
  catch (ስሕተት) { console.warn('ቋሚ_አጥፋ: localStorage not available here —', ስሕተት.message); }
}

function ዘፈቀደ() {
  // "random" — Math.random(), a decimal from 0 up to (not including) 1.
  return Math.random();
}
function ዘፈቀደ_ቁጥር(ከ, እስከ) {
  // "random number" — a whole number from ከ (from) up to and including
  // እስከ (to). E.g. ዘፈቀደ_ቁጥር(1, 6) for a dice roll.
  return Math.floor(Math.random() * (እስከ - ከ + 1)) + ከ;
}

function ወደ_ጽሁፍ(እቃ) {
  // "to text" — JSON.stringify. Needed before ቋሚ_አስቀምጥ if ዋጋ is an
  // array/object rather than a plain string or number.
  return JSON.stringify(እቃ);
}
function ወደ_እቃ(ጽሁፍ) {
  // "to object" — JSON.parse. The inverse of ወደ_ጽሁፍ — turns text
  // (e.g. from ቋሚ_አግኝ or አምጣ's raw text) back into a real value.
  return JSON.parse(ጽሁፍ);
}


/* ---------- Latin aliases ----------
   Same functions, callable without an Amharic keyboard — e.g. tsaf(x)
   does exactly what ጻፍ(x) does, because it IS ጻፍ, just under a second
   name. This list must match dictionaries.js's RUNTIME_ALIASES table —
   that table is the documentation/source of truth for which aliases
   SHOULD exist; these assignments are what actually makes them real. */
var tsaf = ጻፍ;
var asawek = አሳውቅ;
var atim = አትም;
var nitil_bemeleya = በመለያ;
var nitiloch_bemedeb = በመደብ;
var tsihuf_askemt = ጽሑፍ_አስቀምጥ;
var tsihuf_a = ጽሑፍ_አ;
var tsihuf_agn = ጽሑፍ_አግኝ;
var silt_askemt = ስልት_አስቀምጥ;
var silt_a = ስልት_አ;
var medeb_chemr = መደብ_ጨምር;
var medeb_aswegd = መደብ_አስወግድ;
var medeb_keyayir = መደብ_ቀያይር;
var medeb_k = መደብ_ቀ;
var waga_agn = ዋጋ_አግኝ;
var waga_askemt = ዋጋ_አስቀምጥ;
var sima = ስማ;
var amta = አምጣ;
var tebk = ጠብቅ;
var kwami_askemt = ቋሚ_አስቀምጥ;
var kwami_agn = ቋሚ_አግኝ;
var kwami_atfa = ቋሚ_አጥፋ;
var zefekede = ዘፈቀደ;
var zefekede_kutir = ዘፈቀደ_ቁጥር;
var wede_tsihuf = ወደ_ጽሁፍ;
var wede_iqa = ወደ_እቃ;