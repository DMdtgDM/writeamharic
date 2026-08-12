/* ============================================================
   ድርኛ (Diregna) — browser runtime
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