# ድርኛ (Diregna) — Developer Guide

This is the internals document — how the system actually works under the hood, how to set up and run it locally, and how to extend it. Everything in here was run for real while writing this guide, including a real bug that was found, fixed, and regression-tested in the process (§5) — that section is a genuine worked example, not a hypothetical.

---

## 1. Local Development — What You Actually Need

**Short answer: any plain text editor, plus Node.js for the parts that need it.**

There is no build step, no bundler, no `npm install` required for the core project (one optional dev-only test uses `jsdom`, noted below). This isn't a simplification for teaching purposes — it's really just plain JavaScript files.

| What you're doing | What you need |
|---|---|
| Editing `lib/*.js`, `playground/*.js`, `.ወብ` files | Any editor with UTF-8 support — VS Code, Notepad++, Sublime, vim, literally Notepad. None of these files need special tooling to *edit*; Amharic is just Unicode text. |
| Running the transpiler tests | Node.js (any recent LTS version) — no packages to install, the tests only `require()` the project's own files. |
| Using the CLI (`lib/build.js`) | Node.js — same as above. |
| Running/testing the playground | Any browser. Literally double-click `playground/index.html`. No server. |
| Running `scripts/sync-playground.js` | Node.js. |

**VS Code specifically**, since it's the most common choice: it handles Amharic text natively (font rendering, cursor movement, search — all fine out of the box). What it does *not* do is syntax-highlight `.ወብ` files specially — they'll show up as plain text, since there's no VS Code language extension for Diregna (that's a real, legitimate future project — a `.ወብ` TextMate grammar highlighting the `#ገጽ`/`#ዘይቤ`/`#ትእዛዝ` markers and delegating each section to HTML/CSS/JS highlighting — but it doesn't exist yet, and isn't needed to be productive today).

### Local workflow checklist

For a real change to the engine (not just writing `.ወብ` content):

```bash
# 1. Edit the canonical source
vim lib/js-transpiler.js          # or whatever changed

# 2. Syntax-check it immediately — catches typos before you even test logic
node -c lib/js-transpiler.js

# 3. Run the relevant test(s)
node examples/test-js.js
node examples/test-js-edge.js

# 4. Run the FULL suite — a change to one transpiler can affect combined output
for f in examples/test-*.js; do node "$f" > /tmp/out.log 2>&1 && echo "PASS $f" || (echo "FAIL $f"; cat /tmp/out.log); done

# 5. Sync into the playground (see §3 for why this step exists)
node scripts/sync-playground.js

# 6. Manually reload playground/index.html in a browser and sanity-check it
```

Steps 2–5 above are not a suggested process — they're the exact sequence this guide's own worked example (§5) was built and debugged with, including catching a real bug at step 4 that step 3 alone would have missed.

---

## 2. Repository Layout, and *Why* It's Shaped This Way

```
diregna/
  lib/                    ← canonical source. Edit here, always.
    dictionaries.js        — pure data: every Amharic<->English mapping
    html-transpiler.js     — regex tokenizer over <tags>
    css-transpiler.js      — regex over property: value; declarations
    js-transpiler.js       — line-based block-stack parser
    web-format.js          — splits one .ወብ file into {html, css, js}
    runtime.js             — defines ጻፍ/አሳውቅ/አትም (Node-loadable file)
    build.js                — CLI, wires the above together
  playground/
    index.html              — the live editor UI + wiring logic
    dictionaries.js          ┐
    html-transpiler.js       │ byte-identical copies of the lib/ files,
    css-transpiler.js        │ kept in sync by scripts/sync-playground.js
    js-transpiler.js         │ (see §3 for why they're copies, not the
    web-format.js            ┘ same file)
  scripts/
    sync-playground.js      — the tool that keeps the above copies honest
  examples/
    test-*.js                — automated tests, one file per concern
    የመጀመሪያ-ገጼ/                — a full real 3-file project
  docs/
    DIRENYA_DOCUMENTATION.md — the concept/language-reference doc (for users)
    DEVELOPER_GUIDE.md        — this file (for contributors)
```

Every module in `lib/` follows the same shape on purpose:

```js
(function (root, factory) {
  const mod = factory(...);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.SomeGlobalName = mod;
})(typeof self !== 'undefined' ? self : this, function (...) {
  // ... actual logic ...
  return mod;
});
```

This is a minimal UMD (Universal Module Definition) wrapper. It's what lets the *exact same file* be `require()`'d in Node (for the CLI and tests) and loaded as a plain `<script src="...">` in a browser (for the playground) with zero changes. This pattern is the single biggest reason the codebase stayed small — there's no separate "browser build" step or bundler; the same six files just work in both places.

---

## 3. The `lib/` vs `playground/` Duplication — A Deliberate Tradeoff, Not an Oversight

**The constraint:** `playground/index.html` is designed to be opened directly via `file://`, with no server — that's the whole point (§4 of the user-facing doc). But browsers block `fetch()` of local sibling files under `file://` for security reasons (CORS). So the playground can't dynamically `fetch('../lib/html-transpiler.js')` at runtime.

**The solution:** five of the six `lib/` files (everything except `build.js`, which is Node/CLI-only, and `runtime.js`, see below) are copied byte-for-byte into `playground/` and loaded as plain sibling `<script src="dictionaries.js">` tags — which `file://` *does* allow, since it's a normal same-directory script load, not a `fetch()` call.

**The cost:** two copies of five files that must be kept identical. **The mitigation:** `scripts/sync-playground.js` (built in this session specifically because this was a real, demonstrated risk — see §5) — run it after any change to a `lib/` module, it diffs and overwrites the `playground/` copies and tells you exactly what changed.

**The one piece that *can't* be solved by copying a file:** `lib/runtime.js`'s content is also needed *inside* generated output (both the live preview's `<iframe srcdoc>` and the downloadable ZIP's `runtime.js`), which means it has to exist as a JavaScript **string**, not just a loadable file — you can't `<script src="runtime.js">` your way into a string you're about to hand to `zip.file(...)`. So `playground/index.html` defines a `RUNTIME_JS` template-literal constant near the top of its inline script, hand-typed to match `lib/runtime.js`'s behavior. This is the one place `sync-playground.js` can only warn about (it does a shallow "same three function names present" check), not fix automatically — see the tool's own comments for the exact reasoning.

**A concrete finding from this exact session:** before this guide was written, there were *three* independent copies of the runtime shim: `lib/runtime.js`, the `RUNTIME_JS` constant, and a second separately hand-typed string literal inside `downloadForHosting()` used only for the ZIP export's `runtime.js`. That third copy was pure accumulated risk with zero benefit — it was found, and collapsed down to reuse the same `RUNTIME_JS` constant for both the live preview and the ZIP export. Two copies of the truth is an accepted, documented tradeoff; three was just a bug waiting to happen the next time someone added a new built-in function and only updated one of the three places.

---

## 4. Internals — How Each Transpiler Actually Works

### 4.1 `html-transpiler.js` — regex tag tokenizer

Core regex:
```js
const TAG_RE = /<\/?([^\s/>]+)((?:\s+[^\s=/>]+(?:=(?:"[^"]*"|'[^']*'|[^\s/>]+))?)*)\s*(\/?)>/g;
```
This matches one whole tag at a time — opening, closing, or self-closing — capturing the tag name, the raw attribute string, and whether it self-closes. `source.replace(TAG_RE, ...)` walks the string tag-by-tag; everything *between* tags (the actual text content, including any Amharic sentence) is never touched, because the regex only matches inside `< >`.

For each matched tag, a second regex (`ATTR_RE`) walks the captured attribute string token-by-token, translating only the attribute *name* via the `ATTRS` dictionary and leaving the value exactly as written.

**Why not a real DOM parser:** deliberate simplicity/robustness tradeoff, documented honestly in the user-facing doc (§10 there) — this approach handles well-formed markup correctly (verified against real nested examples) but isn't bulletproof against pathological input (e.g., a literal `>` inside an unquoted attribute value). The fix path if this ever becomes a real problem: swap `TAG_RE`/`ATTR_RE` for a small library like `parse5` behind the exact same `transpileHTML(source) → {html, warnings}` function signature — nothing downstream (the CLI, the playground) would need to change, because they only depend on that signature.

### 4.2 `css-transpiler.js` — declaration tokenizer

Simpler than HTML: one regex matches `property: value;` triples:
```js
const DECL_RE = /([^\s{};:]+)\s*:\s*([^;{}]+);/g;
```
Selectors (`.some-class { ... }`) are untouched entirely — the regex only ever matches *inside* a declaration block, never the selector itself, which is why user-chosen class/id names never risk accidental translation.

The color-word substitution (`ቀይ` → `red`) is scoped to a `COLOR_PROPS` allowlist (`color`, `background-color`, etc.) specifically so a color word never gets substituted if it happened to appear as part of some unrelated value — the substitution only fires when the *property* on that line is color-related, checked after the property name is already resolved.

### 4.3 `js-transpiler.js` — the interesting one: line-based block-stack parsing

This is the only transpiler with real state. It processes the source **line by line**, maintaining:
- `out[]` — the accumulated output lines
- `blockStack[]` — a stack tracking which kind of block (`if`/`repeat`/`foreach`/`function`) each currently-open `ጨርስ` will close
- `declared` (a `Set`) — which variable names have already been assigned once, to decide whether an assignment needs a `let` prefix
- `loopCounter` — used to generate unique loop-counter variable names (`__ድገም0`, `__ድገም1`, ...) so nested `ድገም` loops never collide

**The core insight that makes this small (§2 of the user doc):** Amharic identifiers are valid JavaScript identifiers natively (verified directly: `let ስም = 'ሰላም'` just runs in Node/Chrome/Firefox/Safari, no translation needed). So this file only ever translates *structural* keywords — it never touches a variable or function name.

**Trace through a real nested example**, line by line, to see the algorithm concretely:

```
ካሆነ እውነት              →  RE.ifLine matches. Push "if" onto blockStack (now: [if]).
                          Emit: if (true) {
  ድገም 2 ጊዜ            →  RE.repeatLine matches. Push "repeat" (now: [if, repeat]).
                          Emit: for (let __ድገም0 = 0; __ድገም0 < (2); __ድገም0++) {
    ጻፍ("ውስጥ")          →  No structural match — passthrough line, semicolon added.
  ጨርስ                  →  RE.endLine matches. Pop blockStack (now: [if]). Emit: }
ወይም ሐሰት               →  RE.elseIfLine matches. NO stack change (still [if] —
                          an else-if doesn't open a new block, it continues the
                          same if/else chain). Emit: } else if (false) {
  ጻፍ("ሁለተኛ")          →  passthrough
ጨርስ                    →  RE.endLine matches. Pop blockStack (now: []). Emit: }
```
At the end, if `blockStack` isn't empty, a warning is emitted (`"N block(s) not closed with ጨርስ"`) — this is what lets a half-finished program in the playground fail with a clear message instead of producing silently broken JavaScript.

**Literal translation (`እውነት`/`ሐሰት` → `true`/`false`)** happens via a *separate* pass, `translateLiterals()`, called explicitly wherever a captured expression might contain them — condition text in `ካሆነ`/`ወይም`/`ድገም`/`እያንዳንዱ`, the right-hand side of an assignment, a `መልስ` expression, and generic passthrough lines. This being a separate, explicitly-invoked pass (rather than a blanket find-and-replace over the whole file) is exactly what caused the real bug in §5 below — it's easy to add a new place that captures an expression and forget to route it through this function.

### 4.4 `web-format.js` — section splitting

A single regex checks each line for an exact section marker:
```js
const SECTION_RE = /^#(ገጽ|ዘይቤ|ትእዛዝ)\s*$/;
```
Anchored to the *whole trimmed line* (`^...$`), which is precisely what keeps a JS-DSL comment like `# ገጽ የሚለው...` (which always has a space after the `#` and more text after the keyword) from ever being mistaken for a section marker — the regex only matches a line that is *exactly* `#ገጽ` and nothing else. This was tested directly (`test-web-format.js`, Test 3).

### 4.5 `build.js` — orchestration

`loadSource(input)` figures out whether `input` is a `.ወብ` file (via `parseWeb`) or a project folder (three separate file reads), and normalizes both into the same `{htmlSrc, cssSrc, jsSrc}` shape. `transpileAll(...)` runs the three transpilers over that shape uniformly, regardless of which input form was used. `buildCombined` and `buildSplit` both consume the same `transpileAll` output — they only differ in how they assemble the final file(s), sharing the `injectIntoHead`/`injectBeforeBodyClose` helpers (§4.6).

### 4.6 `injectIntoHead` / `injectBeforeBodyClose` — the head-less-page fix

```js
function injectIntoHead(html, block) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${block}\n</head>`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/(<html[^>]*>)/i, `$1\n<head>\n${block}\n</head>`);
  return block + '\n' + html;
}
```
Three-tier fallback: if there's a real `</head>` to inject before, use it (the common case). If there's no head but there's an `<html>` tag, construct a proper `<head>` right after it. If there's neither (a raw markup fragment with no document wrapper at all), fall back to prepending — not perfectly valid HTML, but browsers auto-wrap fragments anyway, and this is a genuine edge case outside the normal teaching curriculum. This exists because the *original* version of this logic assumed a `</head>` always existed and produced a dangling unmatched closing tag when it didn't — a real bug, caught by testing a deliberately head-less `.ወብ` file rather than only the happy path, fixed, and re-verified against both the broken case and the original working example.

---

## 5. Worked Example: Adding a Real Feature (and Finding a Real Bug Along the Way)

This section documents exactly what was done, in order, to add `ወይም` (else-if) support — as a template for how to extend the language yourself.

**Step 1 — add the pattern.** In `lib/js-transpiler.js`'s `RE` object:
```js
elseIfLine: /^(\s*)ወይም\s+(.+?)\s*$/,
```

**Step 2 — handle it in the transpile loop**, placed before the existing `elseLine` check (order matters when patterns could otherwise overlap — here they can't, since the keywords are different, but checking the more specific/new pattern first is a good habit):
```js
if ((m = RE.elseIfLine.exec(raw))) {
  out.push(`${m[1]}} else if (${m[2]}) {`); continue; // no blockStack change — still the same if/else chain
}
```

**Step 3 — test it, and actually execute the output**, not just eyeball the transpiled text:
```js
const { js } = transpileJS(`
ውጤት = 55
ካሆነ ውጤት >= 90
  ጻፍ("ሀ")
ወይም ውጤት >= 70
  ጻፍ("ለ")
ወይም ውጤት >= 50
  ጻፍ("ሐ")
ካልሆነ
  ጻፍ("ውድቅ")
ጨርስ
`);
eval(`function ጻፍ(x){ console.log('>>', x); }\n` + js);
// → >> ሐ    (correct: 55 falls in the >= 50 branch)
```

**Step 4 — test a harder case: nesting inside one of the new branches**, to make sure `blockStack` still tracks correctly when a loop is nested inside an else-if arm. This one **failed on the first attempt**:
```
ReferenceError: እውነት is not defined
```
The transpiled output looked right structurally (`if (እውነት) { ... } else if (ሐሰት) { ... }`) — but `እውነት`/`ሐሰት` were never translated to `true`/`false` inside the condition at all. Tracing it back: `translateLiterals()` was only ever being called on assignment right-hand-sides and generic passthrough lines — never on the condition text captured by `ifLine`, `elseIfLine`, `repeatLine`, or `foreachLine`, and never on `returnLine`'s expression. This is a bug that predates the `ወይም` feature entirely — `ካሆነ እውነት` alone, with no else-if involved, was already broken; it just happened to get exercised for the first time while testing the new feature's edge cases.

**Step 5 — fix the actual bug**, not just the symptom that surfaced it: every condition-capturing branch was updated to route its captured group through `translateLiterals()` before emitting it — `ifLine`, `elseIfLine`, `repeatLine`, `foreachLine`, and `returnLine`, five call sites in total.

**Step 6 — write permanent regression tests** for both the new feature *and* the bug that was found (`examples/test-js-elseif.js`, four cases) — so this exact class of bug (a new expression-capturing branch forgetting to call `translateLiterals`) gets caught automatically if it happens again, rather than relying on someone manually testing a nested edge case again.

**Step 7 — run the full suite, not just the new test file** — confirms the fix didn't regress anything already working.

**Step 8 — sync the playground** (`node scripts/sync-playground.js`), since `js-transpiler.js` is one of the five files copied there, and re-verify the live playground preview still renders correctly.

Every step above was actually executed, in this order, with real failures and fixes — this isn't a cleaned-up narrative written after the fact.

---

## 6. Second Worked Example: DOM Access, Syntax Highlighting, and Latin Aliases

Three features landed together in one session: DOM-control built-ins (so a program can reach into and change a page it's already showing, not just append to it), real syntax highlighting in the playground, and Latin-spelled aliases for the entire language vocabulary. Each surfaced its own real bug — this section documents all three, because the bug-finding process is the actually useful part to learn from.

### 6.1 DOM builtins — straightforward addition, one real design question

Adding `ንጥል_በመለያ` (getElementById), `ጽሑፍ_አስቀምጥ` (set text), `መደብ_ጨምር` (add class), and eight others to `runtime.js` was mechanical — each is a one-line wrapper around a real DOM API, following the exact pattern `ጻፍ`/`አሳውቅ`/`አትም` already established (§4 of the user doc walks through the naming). No transpiler changes needed, because these are runtime *functions*, not language *syntax* — the whole point of the "Amharic is already valid JS" design (§2 of the user doc) is that adding a callable thing never touches the transpiler, only `runtime.js`.

The one real design question: should `ንጥሎች_በመደብ` (getElementsByClassName) return the DOM's native `HTMLCollection`, or a real Array? Chose Array — specifically `Array.from(document.getElementsByClassName(...))` — because `HTMLCollection` is *live* (it silently updates if the DOM changes while you're iterating it), and a `ድገም`/`እያንዳንዱ` loop over a live collection is a well-known footgun even for experienced developers, let alone a first-time student. This is documented in `runtime.js`'s own comment, not just here — the reasoning should live next to the code it explains.

**Proof it actually works**, not just that it transpiles: `examples/test-dom-builtins.js` builds a real interactive program (a live character counter with a clear button), transpiles it, executes it against a real `jsdom` document, and **dispatches real `input`/`click` events** — then asserts the DOM actually changed (`doc.getElementById('ቆጣሪ').textContent === '11'`), not that the generated JS *looks* plausible.

### 6.2 Syntax highlighting — CodeMirror, and why jsdom couldn't verify it

The playground's three `<textarea>` elements became CodeMirror instances (`CodeMirror.fromTextArea`), with a custom overlay mode (`CodeMirror.defineMode('diregna-js', ...)`) that layers Amharic-keyword coloring on top of CodeMirror's real JavaScript mode — real syntax (strings, numbers, operators) highlights normally underneath; the overlay only adds color to the words that are pattern-matched as Diregna keywords or built-in names.

**A real testing dead end, worth knowing about if you extend this:** `jsdom` cannot verify CodeMirror actually renders tokenized, colored spans — CodeMirror's rendering pipeline depends on real browser layout (`getBoundingClientRect`, line-height measurement for virtual scrolling), which jsdom doesn't implement. Loading the real playground in jsdom confirms CodeMirror *initializes* (three `.CodeMirror` DOM nodes exist) but the actual line content never renders, and calling `setValue()` later crashes on a jsdom-only gap in bidi-text measurement. This is a well-known jsdom limitation, not a Diregna bug — CodeMirror is used in production across huge numbers of real sites.

**The actual fix wasn't to give up on testing it — it was to test the right layer.** `examples/test-codemirror-overlay.js` extracts the tokenizer's matching logic (`matchWordList`/`isBoundary`) verbatim and unit-tests it standalone, with a hand-rolled stand-in for CodeMirror's `stream` object — no rendering required, because the thing that could actually have a bug is the matching algorithm, not CodeMirror's battle-tested rendering code. This is the same principle as §4.1's regex-tokenizer design: test the part you wrote, don't try to re-prove that a mature upstream library works.

**And that standalone test caught a real bug immediately:** `isBoundary` originally only checked for Ethiopic letters, so a hypothetical variable named `ጨርስ_ቁጥር` ("end count" — a plausible name) would have `ጨርስ` wrongly highlighted as a keyword, because `_` isn't an Ethiopic character and the check treated it as a valid boundary. Fixed by matching the *actual* identifier character set already used in `js-transpiler.js`'s `assignLine` regex (`[A-Za-z0-9_$\u1200-\u137F]`) instead of a narrower Ethiopic-only check — the bug was an inconsistency between two places that both needed to agree on "what counts as part of an identifier" and didn't.

### 6.3 Latin aliases — the architecture change, and the collision risk it introduces

Every dictionary entry (`dictionaries.js`) grew a second, Latin-spelled key mapping to the same value — e.g. both `"ራስ"` and `"ras"` map to `"head"`. For `TAGS`/`ATTRS`/`CSS_PROPS`/`CSS_COLOR_VALUES` this required **zero transpiler changes**: `html-transpiler.js` and `css-transpiler.js` already do exact-key dictionary lookups (`TAGS[rawTag] || rawTag`), so an extra key pointing at the same value just works.

The JS structural keywords (`ካሆነ`/`ጨርስ`/etc.) were different — `js-transpiler.js` previously hardcoded each Amharic word directly into a regex literal. Supporting `kahone` alongside `ካሆነ` meant rebuilding each pattern from the dictionary at load time:
```js
function kw(amharic) {
  const alias = DICT.JS_KEYWORD_ALIASES && DICT.JS_KEYWORD_ALIASES[amharic];
  return alias ? `(?:${amharic}|${alias})` : amharic;
}
const RE = {
  ifLine: new RegExp(`^(\\s*)${kw('ካሆነ')}\\s+(.+?)\\s*$`),
  // ...
};
```
This is a genuine architecture shift — from hardcoded literals to dictionary-driven pattern construction — and it's *why* `js-transpiler.js` now does `require('./dictionaries.js')` for more than just the true/false literal lookup it needed before.

**The collision risk this introduces, and why it turned out to be a non-issue:** could a Latin variable name a student picks — say `kahonemore` — get wrongly parsed as the `kahone` keyword? Every block-keyword pattern above requires `\s+` (real whitespace) immediately after the keyword — `^(\s*)(?:ካሆነ|kahone)\s+(.+?)\s*$` demands a space right after `kahone`, and there isn't one in `kahonemore`, so the whole-line match fails and it falls through to `assignLine` as a plain assignment instead. This was verified directly, not just reasoned through: `examples/test-latin-aliases.js` Test 4 transpiles `kahonemore = 5` and `chersstuff = 1` and asserts they become plain `let` assignments, not `if`/`}`.

**A second, smaller bug this same work surfaced:** `scripts/sync-playground.js`'s shallow consistency check (§3) originally verified every runtime function by searching for the literal substring `function ${name}` in both copies of the runtime shim. That check silently broke the moment Latin *aliases* were added to `runtime.js`, because aliases are defined as `var tsaf = ጻፍ;` — a `var` assignment, not a `function` declaration — so the check reported a false mismatch. Fixed by checking for either form: `src.includes('function ' + fn) || src.includes('var ' + fn + ' =')`. Worth remembering: a "shallow check" tool needs updating every time the shape of what it's checking changes, not just when the content does.

---

## 7. Adding a New Dictionary Word (the simpler, more common extension)

Most extensions aren't new language features — they're just missing vocabulary. To add a new HTML tag, say `<ጥያቄ>` for a hypothetical `<question>`-style custom element:

1. Open `lib/dictionaries.js`, add one line to the `TAGS` object: `"ጥያቄ": "question",` (and, if you want a Latin alias too, `"tiyake": "question",` right alongside it — see §6.3 above for why that's free for HTML/CSS but not for JS keywords).
2. Run `node scripts/sync-playground.js` (dictionaries.js is one of the synced files).
3. That's it — `transpileHTML` already picks up any key in `TAGS` automatically; there's no other code that needs to know about individual tag names.

Same pattern for `ATTRS`, `CSS_PROPS`, and `CSS_COLOR_VALUES` — all four are plain lookup objects read generically by their respective transpilers, so adding a word is always a one-line, one-file change. Adding a new *runtime function* (like the DOM builtins in §6.1) is almost as simple: one function in `runtime.js`, one line in `RUNTIME_ALIASES` if you want a Latin name for it too, and — unlike the four lookup tables above — you do need to hand-add the `var latinName = amharicName;` alias line yourself, since (per §3) `runtime.js`'s content can't be auto-synced the way plain data files can.

---

## 8. Testing Conventions

There's no test framework (no Jest, no Mocha) — each `examples/test-*.js` file is a plain Node script that:
1. Calls the function(s) under test with real input.
2. Prints the actual output.
3. Prints a `✓`/`✗` line based on a plain `if` check against the expected result.
4. For the JS transpiler specifically, several tests go one step further and **actually `eval()` the transpiled output**, asserting on real runtime behavior — not just that the generated text looks plausible (this is precisely what caught the bug in §5).

This is a deliberate choice, not a missing dependency: for a project this size, a real dependency (even a test runner) is more maintenance surface than the very simple pattern above, and every test file is short enough to read start-to-finish in under a minute. If the project grows substantially, migrating to a real runner (for parallelism, better diffing output, watch mode) is a reasonable future step — but wasn't worth the complexity yet.

**To add a new test:** copy the shape of any existing `examples/test-*.js` file, `require()` whatever module you're testing, write real input, print real output, assert with `console.log('✓ ...' or '✗ FAILED ...')`. No registration step, no config — `node examples/test-whatever.js` just runs it.
