# ድርኛ (Direnya) — An Amharic Language for Building Websites

**A complete design document, working implementation, and teaching guide.**
Everything described here has been built and tested — not just planned. Code samples in this document are real, running code, copied from the actual working project.

---

## 1. What This Is, In One Sentence

**ድርኛ (Direnya)** lets someone write a real, working website — structure, style, and interactivity — entirely in Amharic, using words like `<ራስጌ>` instead of `<header>` and `ካሆነ` instead of `if`, which a small program then translates into the real HTML/CSS/JavaScript that every browser on Earth already understands.

Nothing new is invented at the browser level. Amharic goes in, standard HTML/CSS/JS comes out. This is the single most important design decision in this whole project, so it's worth explaining why before anything else.

---

## 2. The Core Idea: Translation, Not a New Browser

There are two fundamentally different ways to make "a website builder in Amharic":

| Approach | What it means | Verdict |
|---|---|---|
| **A. Build a new browser/engine** that natively understands Amharic markup | Reimplement HTML parsing, CSS layout (the box model, flexbox, rendering), and a JS engine — from scratch, in Amharic | **Do not do this.** This is a multi-year, multi-person effort (browser engines are some of the most complex software that exists). It would only run in your own custom app, not the web. |
| **B. Translate Amharic source into real HTML/CSS/JS** (a *transpiler*) | Kids write in Amharic; a small program converts it to the exact same code a professional web developer would write; a normal browser runs that | **This is what Direnya does.** A transpiler for a fixed vocabulary is a weekend-to-a-few-weeks project, not a multi-year one — and the output runs on every device that already has a browser, with zero extra software installed. |

**Approach B is what every real "localized programming language" project actually does**, including the ones that inspired this design:

- **Hedy** (hedy.org) — a gradually-complex programming language, built specifically for teaching kids, that supports dozens of natural languages including Arabic, and transpiles a simplified syntax down to real Python. Its "translate keywords, keep the underlying language real" philosophy is the direct model for Direnya's JS layer.
- **Qalb** (Arabic) and **ChhotiSi** (Hindi) — esoteric/teaching languages that translate Arabic/Hindi keywords into a real interpreter's syntax.
- **Scratch** — sidesteps the text-translation problem entirely by using visual blocks (Scratch is localized into Amharic-adjacent languages via block *labels*, not by reinventing the engine). Worth knowing about as an alternative/complement for younger kids — see §11.
- Ruby's creator (Matz) originally used Japanese keywords in early prototypes before settling on English for the public release — a reminder that this idea (native-language keywords over a real engine) is old and well-trodden, not experimental.

**One technical fact makes the JavaScript layer of this project dramatically simpler than it would otherwise be, and it's worth stating plainly because it shapes everything downstream:**

> Modern JavaScript **already allows Amharic (Ethiopic-script) letters as variable and function names.** This is not a Direnya feature — it's a basic property of the JavaScript language specification (identifiers can be any Unicode "letter" character). It was verified directly for this project:
> ```js
> let ስም = 'ሰላም';
> function ጻፍ(x){ console.log('WROTE:', x); }
> ጻፍ(ስም);
> // → WROTE: ሰላም
> ```
> This runs, unmodified, in Node.js, Chrome, Firefox, and Safari today.

Because of this, Direnya's JavaScript layer does **not** need to translate variable names, function names, or most of the language. It only needs to translate the small set of *structural* keywords (`if`, `else`, a loop, a function definition, `end`) that aren't valid Amharic-as-JS on their own. Everything else — arithmetic, strings, comparisons, calling functions — is just... already Amharic, because JS lets it be. This single fact is why the JS transpiler in this project is ~140 lines instead of a few thousand.

---

## 3. Architecture: The Full Pipeline

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   ገጽ.ድር          │   │   ዘይቤ.ድር         │   │   ትእዛዝ.ድር        │
│  (Amharic HTML)  │   │  (Amharic CSS)   │   │  (Amharic JS)    │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ html-transpiler  │   │  css-transpiler  │   │  js-transpiler   │
│  .js             │   │  .js             │   │  .js             │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   real HTML      │   │   real CSS       │   │   real JS         │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         └──────────────────────┴───────────────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │  one standalone .html     │
                   │  file — inline <style>    │
                   │  and <script>             │
                   └──────────────────────────┘
                                 │
                                 ▼
                     opens in ANY browser,
                    can be hosted ANYWHERE
```

Every box above exists as a real file in the project (see §9 for the full file tree). Three independent translator modules, one per language layer, each small enough to read start to finish in a few minutes — deliberately not one big monolithic parser, so each piece is independently understandable and extendable by a kid who's grown into a teenager who wants to add a word to the dictionary.

---

## 4. Quick Start — See It Work in 60 Seconds

1. Open `playground/index.html` in any web browser (double-click it — no install, no server). Requires internet the first time, to load CodeMirror (syntax highlighting) and the Google Font from CDN — if that fails, the editor falls back to plain text automatically and everything still works.
2. You'll see three tabs — **ገጽ.ድር** (page), **ዘይቤ.ድር** (style), **ትእዛዝ.ድር** (logic) — pre-filled with a working example, with keywords and tags syntax-highlighted.
3. Click **▶ አሳይ (Run)**. The right-hand panel shows the real, live rendered page.
4. Edit any word in the left panel — Amharic or its Latin alias (§5.4) — click Run again, watch it change instantly.
5. Save your work: **💾 አስቀምጥ** saves everything as one real `.ወብ` file (§6.5) you can reopen later with **📂 ክፈት**. When you're ready to publish: **⬇ አንድ HTML** for a single portable file, or **📦 ለሆስቲንግ ዝግጁ** for a real `index.html`/`style.css`/`script.js` set ready to upload to a static host (§6.6).

The moment you download either output, **Direnya's job is done** — the result has no dependency on Direnya at all, it's just HTML/CSS/JS.

---

## 5. Language Reference

### 5.1 Page Structure (`ገጽ.ድር` — Amharic HTML)

**How it works:** you write ordinary HTML *structure* (angle brackets, nesting, attributes) but with Amharic words for tag and attribute names. Everything else — the text content of a paragraph, a URL, a number — is written exactly as normal, since it isn't being translated, only tag/attribute *names* are.

**Structural / layout tags**

| Amharic | Real tag | Meaning |
|---|---|---|
| `ሰነድ` | `html` | the whole document ("document") |
| `ራስ` | `head` | the page's hidden setup section ("head") |
| `አርእስት` | `title` | the browser tab's title |
| `ሰውነት` | `body` | everything visible ("body") |
| `ዘይቤ` | `style` | inline CSS block ("style") |
| `ትእዛዝ` | `script` | inline JS block ("command/instruction") |
| `ራስጌ` | `header` | a header/banner section |
| `ግርጌ` | `footer` | a footer section |
| `ማውጫ` | `nav` | navigation menu ("table of contents") |
| `ዋና` | `main` | the main content area |
| `ምዕራፍ` | `section` | a section ("chapter") |
| `ጽሑፍ` | `article` | a self-contained piece of writing |
| `ጎን` | `aside` | side content |
| `ክፍል` | `div` | a generic block/container ("part") |
| `ንዑስ` | `span` | a generic inline container ("sub-part") |

**Text tags**

| Amharic | Real tag | Meaning |
|---|---|---|
| `ርዕስ1` … `ርዕስ6` | `h1` … `h6` | headings, biggest to smallest ("title") |
| `አንቀጽ` | `p` | a paragraph |
| `ደማቅ` | `strong` | bold/important text |
| `ሰያፍ` | `em` | italic/emphasized text ("slanted") |
| `መስበሪያ` | `br` | a line break |
| `መለያያ` | `hr` | a horizontal divider |

**Links, media, lists**

| Amharic | Real tag | Meaning |
|---|---|---|
| `አገናኝ` | `a` | a link ("connector") |
| `ስዕል` | `img` | an image |
| `ዝርዝር` | `ul` | a bullet list |
| `ቅደም` | `ol` | a numbered list ("sequence") |
| `ንጥል` | `li` | one list item |

**Forms & interaction**

| Amharic | Real tag | Meaning |
|---|---|---|
| `ቅጽ` | `form` | a form |
| `ማስገቢያ` | `input` | a text/number input box |
| `አዝራር` | `button` | a clickable button |
| `ምልክት` | `label` | a form field's label |
| `ምርጫ` / `አማራጭ` | `select` / `option` | a dropdown and its choices |
| `ጽሑፍ-ሳጥን` | `textarea` | a multi-line text box |

**Media & extra structural/text tags**

| Amharic | Real tag | Meaning |
|---|---|---|
| `ቪዲዮ` | `video` | a video player |
| `ድምጽ` | `audio` | an audio player |
| `ክፈፍ` | `iframe` | an embedded frame |
| `ስእል-ማቀፊያ` / `ስእል-መግለጫ` | `figure` / `figcaption` | an image with a caption |
| `ጥቅስ` | `blockquote` | a quoted block |
| `ኮድ` | `code` | inline code |
| `አስቀድሞ-የተቀረጸ` | `pre` | preformatted text (keeps spacing) |
| `ትንሽ` | `small` | fine print |
| `ምልክት-ማድረጊያ` | `mark` | highlighted text |

**Tables**

| Amharic | Real tag |
|---|---|
| `ሰንጠረዥ` | `table` |
| `ረድፍ` | `tr` (row) |
| `አምድ` | `td` (cell) |
| `ራስ-አምድ` | `th` (header cell) |

**Attributes** (go inside a tag, e.g. `<አዝራር መደብ="ዋና-አዝራር">`)

| Amharic | Real attribute | Meaning |
|---|---|---|
| `መደብ` | `class` | style category |
| `መለያ` | `id` | unique identifier |
| `ስልት` | `style` | inline styling |
| `አድራሻ` | `href` | link destination ("address") |
| `ምንጭ` | `src` | image/media source |
| `መግለጫ` | `alt` | image description |
| `ዓይነት` | `type` | input type |
| `ዋጋ` | `value` | a field's value |
| `ጠቋሚ` | `placeholder` | greyed-out hint text |
| `ስም` | `name` | form field name |
| `ግዴታ` | `required` | field must be filled |
| `ዝግ` | `disabled` | field is turned off |
| `ሲነካ` | `onclick` | runs code when clicked |
| `ሲቀየር` | `onchange` | runs code when changed |
| `ራስ-አጫውት` / `ቁጥጥሮች` / `ደጋግሞ-አጫውት` / `ድምጸ-ከል` | `autoplay` / `controls` / `loop` / `muted` | video/audio playback attributes |
| `ተመርጦ` | `checked` | checkbox/radio is pre-selected |
| `ዝቅተኛ` / `ከፍተኛ-ገደብ` / `ደረጃ` | `min` / `max` / `step` | numeric input constraints |
| `ለ` | `for` | connects a `ምልክት` (label) to a field's id |
| `አምድ-ዝርጋታ` / `ረድፍ-ዝርጋታ` | `colspan` / `rowspan` | table cell spanning |

**Worked example** (real output, copied from `examples/test-html.js`):

Input:
```html
<ሰነድ>
  <ራስ>
    <አርእስት>የእኔ ገጽ</አርእስት>
  </ራስ>
  <ሰውነት>
    <ራስጌ>
      <ርዕስ1>ሰላም ልጆች!</ርዕስ1>
    </ራስጌ>
    <ዋና>
      <አንቀጽ መደብ="መግቢያ">ይህ የመጀመሪያ ገጼ ነው።</አንቀጽ>
      <ዝርዝር>
        <ንጥል>ፖም</ንጥል>
        <ንጥል>ሙዝ</ንጥል>
      </ዝርዝር>
      <አገናኝ አድራሻ="https://simplexer.et">ሲምፕሌክሰርን ጎብኝ</አገናኝ>
      <ስዕል ምንጭ="lion.jpg" መግለጫ="አንበሳ" />
    </ዋና>
  </ሰውነት>
</ሰነድ>
```

Output (exactly what the transpiler actually produced):
```html
<html>
  <head>
    <title>የእኔ ገጽ</title>
  </head>
  <body>
    <header>
      <h1>ሰላም ልጆች!</h1>
    </header>
    <main>
      <p class="መግቢያ">ይህ የመጀመሪያ ገጼ ነው።</p>
      <ul>
        <li>ፖም</li>
        <li>ሙዝ</li>
      </ul>
      <a href="https://simplexer.et">ሲምፕሌክሰርን ጎብኝ</a>
      <img src="lion.jpg" alt="አንበሳ" />
    </main>
  </body>
</html>
```

Notice: the **text content** (`ሰላም ልጆች!`, `ፖም`, the class name `መግቢያ`) is never touched — only tag names (`ራስጌ`→`header`) and attribute names (`መደብ`→`class`) get translated. This is deliberate: kids should never have to wonder "is my sentence about to get mistranslated" — only the small fixed vocabulary of structural words is ever touched.

---

### 5.2 Styling (`ዘይቤ.ድር` — Amharic CSS)

**How it works:** exactly like real CSS — `selector { property: value; }` — except property *names* are Amharic. Selectors (`.መደብ-ስም`, tag names) are never translated, because they're names the author chose, not a fixed vocabulary.

| Amharic | Real property |
|---|---|
| `ቀለም` | `color` |
| `የጀርባ-ቀለም` | `background-color` |
| `ጀርባ` | `background` |
| `የፊደል-መጠን` | `font-size` |
| `የፊደል-ክብደት` | `font-weight` |
| `የፊደል-ዓይነት` | `font-family` |
| `የጽሑፍ-አሰላለፍ` | `text-align` |
| `ኅዳግ` | `margin` |
| `ኅዳግ-ላይ` / `ኅዳግ-ታች` / `ኅዳግ-ግራ` / `ኅዳግ-ቀኝ` | `margin-top` / `-bottom` / `-left` / `-right` |
| `ውስጠ-ክፍተት` | `padding` |
| `ውስጠ-ክፍተት-ላይ` / `-ታች` / `-ግራ` / `-ቀኝ` | `padding-top` / `-bottom` / `-left` / `-right` |
| `ድንበር` | `border` |
| `የድንበር-ክብነት` | `border-radius` |
| `ስፋት` / `ቁመት` | `width` / `height` |
| `ከፍተኛ-ስፋት` / `ከፍተኛ-ቁመት` | `max-width` / `max-height` |
| `ዝቅተኛ-ስፋት` / `ዝቅተኛ-ቁመት` | `min-width` / `min-height` |
| `አሳይ` | `display` |
| `አቀማመጥ` | `position` |
| `ላይ` / `ግራ` / `ቀኝ` / `ታች` | `top` / `left` / `right` / `bottom` |
| `የፍሰት-አቅጣጫ` | `flex-direction` |
| `ይዘት-አሰላለፍ` | `justify-content` |
| `ንጥሎች-አሰላለፍ` | `align-items` |
| `ክፍተት` | `gap` |
| `ጠቋሚ-ቅርጽ` | `cursor` |
| `ግልጽነት` | `opacity` |
| `ጥላ` | `box-shadow` |
| `ትርፍ-ይዘት` | `overflow` |
| `መሸጋገሪያ` | `transition` |
| `ቅርጽ-ለውጥ` | `transform` |
| `የፊደል-ክፍተት` | `letter-spacing` |

**Bonus — Amharic color words** (only substituted for `color`/`background-color`/etc., so they never collide with unrelated text elsewhere):

| Amharic | Color |
|---|---|
| `ቀይ` | red |
| `ሰማያዊ` | blue |
| `አረንጓዴ` | green |
| `ቢጫ` | yellow |
| `ጥቁር` | black |
| `ነጭ` | white |
| `ብርቱካናማ` | orange |
| `ግራጫ` | gray |

**Worked example** (real output):

Input:
```css
.ራስጌ {
  የጀርባ-ቀለም: ሰማያዊ;
  ቀለም: ነጭ;
  ውስጠ-ክፍተት: 20px;
  የጽሑፍ-አሰላለፍ: center;
}
```
Output:
```css
.ራስጌ {
  background-color: blue;
  color: white;
  padding: 20px;
  text-align: center;
}
```

---

### 5.3 Logic (`ትእዛዝ.ድር` — Amharic JavaScript)

Recall §2: variable and function **names** don't need translation — Amharic is already valid JavaScript. So this layer only translates *block structure*. Blocks are closed with `ጨርስ` ("finish/end") for every kind of block — no curly braces, no indentation-sensitivity, which keeps it forgiving for a first-time typist.

| Amharic | Translates to | Example |
|---|---|---|
| `ካሆነ <condition>` | `if (<condition>) {` | `ካሆነ ዕድሜ >= 13` |
| `ካልሆነ` | `} else {` | |
| `ወይም <condition>` | `} else if (<condition>) {` | `ወይም ውጤት >= 70` |
| `ድገም <n> ጊዜ` | a loop that repeats n times | `ድገም 3 ጊዜ` |
| `እያንዳንዱ <item> በ <list>` | a loop over each item in a list | `እያንዳንዱ ፍሬ በ ፍራፍሬዎች` |
| `ተግባር <name>(<params>)` | `function <name>(<params>) {` | `ተግባር ደምር(አ, ለ)` |
| `ጨርስ` | `}` | closes any of the above |
| `መልስ <value>` | `return <value>;` | `መልስ አ + ለ` |
| `እውነት` / `ሐሰት` | `true` / `false` | |
| `<name> = <value>` | auto-adds `let` the *first* time a name is used, plain assignment after | `ብዛት = 0` then later `ብዛት = ብዛት + 1` |

**Built-in functions** (defined once in `runtime.js`, available in every program):

| Amharic | Does |
|---|---|
| `ጻፍ(እሴት)` | writes a value onto the visible page ("write") |
| `አሳውቅ(እሴት)` | shows a popup alert box ("announce") |
| `አትም(እሴት)` | logs to the developer console, for debugging ("print") |
| `ንጥል_በመለያ(መለያ)` | finds an element by its id — `document.getElementById` |
| `ንጥሎች_በመደብ(መደብ)` | finds all elements with a class, as a real array |
| `ጽሑፍ_አስቀምጥ(እቃ, ጽሑፍ)` | sets an element's visible text |
| `ጽሑፍ_አግኝ(እቃ)` | reads an element's visible text |
| `ስልት_አስቀምጥ(እቃ, ንብረት, ዋጋ)` | sets one CSS style property directly, e.g. `ስልት_አስቀምጥ(ሳጥን, "color", "red")` |
| `መደብ_ጨምር(እቃ, መደብ)` / `_አስወግድ` / `_ቀያይር` | add / remove / toggle a CSS class |
| `ዋጋ_አግኝ(እቃ)` / `ዋጋ_አስቀምጥ(እቃ, ዋጋ)` | read / write a form field's value |
| `ስማ(እቃ, ክስተት, ተግባር)` | listens for any event (`"click"`, `"input"`, `"change"`, ...) — for interaction beyond the `ሲነካ` attribute |

The DOM functions above are what let a program reach into and change a page it's already showing — not just print new content at the end. A minimal real example, actually executed and verified (not hand-typed output):

```
ተግባር ሰላም_በል()
  ሳጥን = ንጥል_በመለያ("ስም-ሳጥን")
  ስም = ዋጋ_አግኝ(ሳጥን)
  መልእክት = ንጥል_በመለያ("መልእክት")
  ጽሑፍ_አስቀምጥ(መልእክት, "ሰላም፣ " + ስም + "!")
ጨርስ
```
Paired with an `<ማስገቢያ መለያ="ስም-ሳጥን">` and an empty `<ክፍል መለያ="መልእክት">`, clicking a button wired to `ሰላም_በል()` reads whatever the user typed and writes a greeting into the empty box — verified end-to-end with a real DOM: typing "ሰላም" and clicking produced exactly `ሰላም፣ ሰላም!` in the target element.

---

### 5.4 Typing Without an Amharic Keyboard — Latin Aliases

Every tag, attribute, CSS property, color word, JS structural keyword, and built-in function name has a second, Latin-spelled alias that does exactly the same thing. This exists because writing Amharic requires an Ethiopic keyboard layout, which most computers don't have configured — the alias removes that barrier for the *code's structure*, even though the *content* you write (sentences, labels) still needs real Amharic input.

```html
<rese><ariest>My Page</ariest></rese>
<sewenet>
  <rasge><ries1>ሰላም</ries1></rasge>
</sewenet>
```
is identical to writing `<ራስ><አርእስት>...` — same for JS:
```
kahone score >= 90
  tsaf("A")
weyim score >= 70
  tsaf("B")
kalhone
  tsaf("F")
chers
```
transpiles and runs exactly the same as the all-Amharic version. **You can mix both freely in the same file** — this was tested directly, including a program that used `digem` (Latin) for a loop and `ጊዜ` (Amharic) for the "times" that follows it, in the same line.

A full table of aliases is in the Code Reference companion document (every dictionary entry is listed there with both spellings). A few of the most-used ones:

| Amharic | Latin | Amharic | Latin |
|---|---|---|---|
| `ራስ` | `ras` / `rese` | `ካሆነ` | `kahone` |
| `ሰውነት` | `sewenet` | `ካልሆነ` | `kalhone` |
| `ክፍል` | `kifil` | `ወይም` | `weyim` |
| `አዝራር` | `azrar` | `ድገም` | `digem` |
| `ቀለም` | `kelem` | `ጨርስ` | `chers` |
| `ኅዳግ` | `hidag` | `እውነት` / `ሐሰት` | `ewnet` / `hasete` |

**What this does *not* solve:** typing actual Amharic sentences — the text a visitor will read — still needs a real Amharic keyboard, an on-screen picker, or copy-pasting from somewhere else. This feature only removes the keyboard barrier from the language's fixed *vocabulary* (the ~150 words that mean something structurally); it was never meant to, and doesn't, translate free-form content. A general Amharic transliteration input method (type "selam" anywhere and have it become ሰላም as you type) is a real, different, and considerably bigger project — worth doing eventually, not attempted here.

**A real collision risk this surfaced, and how it's avoided:** a Latin variable name a student chooses could start with a keyword's letters — e.g. naming something `kahonemore`. This does **not** get wrongly treated as the `kahone`/`ካሆነ` keyword: every block-keyword pattern requires the keyword to be immediately followed by whitespace (or, for `ጨርስ`/`chers`, immediately followed by the end of the line), so `kahonemore` fails that match and falls through as a plain identifier — verified directly with that exact input.

 (real input → real, actually-executed output — this exact program was run with Node and produced this exact console output, not a mockup):

Input:
```
ስም = "ሰላም"
ዕድሜ = 15

ካሆነ ዕድሜ >= 13
  ጻፍ("ጎረምሳ ነህ")
ካልሆነ
  ጻፍ("ገና ልጅ ነህ")
ጨርስ

ተግባር ደምር(አ, ለ)
  መልስ አ + ለ
ጨርስ

ውጤት = ደምር(4, 5)
ጻፍ(ውጤት)
```

Transpiled to (real JavaScript, unmodified from the actual transpiler output):
```js
let ስም = "ሰላም";
let ዕድሜ = 15;

if (ዕድሜ >= 13) {
  ጻፍ("ጎረምሳ ነህ");
} else {
  ጻፍ("ገና ልጅ ነህ");
}

function ደምር(አ, ለ) {
  return አ + ለ;
}

let ውጤት = ደምር(4, 5);
ጻፍ(ውጤት);
```

When actually executed:
```
>> ጎረምሳ ነህ
>> 9
```

Both lines are correct: age 15 is ≥ 13, and `ደምር(4,5)` = 9.

**A safety feature that was deliberately built in and tested:** if a student forgets `ጨርስ`, the transpiler doesn't crash or produce broken silent output — it still generates the closing brace (so a half-finished program in the playground doesn't leave the preview in a weird state) but returns a clear warning: *`"1 block(s) not closed with ጨርስ — missing end keyword(s)."`* This is shown to the student directly in the playground's warning panel. Same for an unmatched `ጨርስ` with nothing open to close.

---

## 6. Full Worked Example: A Student's First Project

This is a real, complete, three-file project (`examples/የመጀመሪያ-ገጼ/`) that was actually built with the CLI (`node lib/build.js`) and produces a fully working page — a header, a styled button, and a click counter.

**`ገጽ.ድር`:**
```html
<ሰነድ>
  <ራስ><አርእስት>የእኔ የመጀመሪያ ገጽ</አርእስት></ራስ>
  <ሰውነት>
    <ራስጌ><ርዕስ1>ሰላም! ስሜ ሰላም ነው።</ርዕስ1></ራስጌ>
    <ዋና>
      <አንቀጽ>እኔ በሲምፕሌክሰር የመጀመሪያ ገጼን እየገነባሁ ነው።</አንቀጽ>
      <ርዕስ2>የምወዳቸው ፍራፍሬዎች</ርዕስ2>
      <ዝርዝር>
        <ንጥል>ማንጎ</ንጥል>
        <ንጥል>ፓፓያ</ንጥል>
        <ንጥል>ሙዝ</ንጥል>
      </ዝርዝር>
      <አዝራር መደብ="ዋና-አዝራር" ሲነካ="ሰላም_በል()">ጫነኝ!</አዝራር>
      <ክፍል መለያ="ውጤት"></ክፍል>
    </ዋና>
  </ሰውነት>
</ሰነድ>
```

**`ዘይቤ.ድር`:**
```css
ራስጌ {
  የጀርባ-ቀለም: ሰማያዊ;
  ቀለም: ነጭ;
  ውስጠ-ክፍተት: 24px;
  የጽሑፍ-አሰላለፍ: center;
}
.ዋና-አዝራር {
  የጀርባ-ቀለም: ብርቱካናማ;
  ቀለም: ነጭ;
  ድንበር: none;
  የድንበር-ክብነት: 8px;
  ውስጠ-ክፍተት: 12px 20px;
  ጠቋሚ-ቅርጽ: pointer;
}
```

**`ትእዛዝ.ድር`:**
```
ብዛት = 0

ተግባር ሰላም_በል()
  ብዛት = ብዛት + 1
  ካሆነ ብዛት == 1
    ጻፍ("ሰላም! ይህን አዝራር ተጭነሃል።")
  ካልሆነ
    ጻፍ("ደግመህ ተጫንከው! ጠቅላላ ብዛት: " + ብዛት)
  ጨርስ
ጨርስ
```

**Building it:**
```bash
node lib/build.js examples/የመጀመሪያ-ገጼ output.html
```
This actually ran, with output:
```
✓ Built output.html
```
No warnings — meaning every tag, attribute, property, and keyword used was recognized, and every block was properly closed. `output.html` is a single, complete, standalone file — CSS and JS inlined — that can be opened directly, no server needed.

---

## 6.5 The `.ወብ` File Format — One Real File, Own Extension

Everything in §6 was a three-file project folder. For a single quick project — which is most of what a beginner writes — there's also a **one-file format with its own extension, `.ወብ`**, so a project is a real, single, nameable, sendable file, the way a `.py` or `.docx` is.

**Format:** one file, three optional sections, each started by a line that is *exactly* `#ገጽ`, `#ዘይቤ`, or `#ትእዛዝ` (no space after `#` — that's what keeps a section marker from ever being confused with a `#`-comment inside the JS section, which always has a space after the `#`, e.g. `# ማስታወሻ`). A file with no section markers at all is treated as pure `ገጽ` (HTML) — so the very first, simplest file a beginner ever saves, with nothing in it but markup, needs no ceremony at all.

```
#ገጽ
<ሰነድ>
  <ሰውነት><ርዕስ1>ሰላም</ርዕስ1></ሰውነት>
</ሰነድ>

#ዘይቤ
ራስጌ { ቀለም: ነጭ; }

#ትእዛዝ
ብዛት = 0
```

This is implemented in `lib/web-format.js` (`parseWeb` / `serializeWeb`), tested for: the full three-section case, the no-markers-defaults-to-HTML case, the comment-vs-marker disambiguation case above, and a full serialize→parse round trip — all four pass.

**In the playground:** the header now has real file operations, not just Run/Download:
- **📂 ክፈት (Open .ወብ)** — pick a `.ወብ` file from your computer, it loads into the three tabs.
- **💾 አስቀምጥ (Save .ወብ)** — saves your current three tabs back out as one real `.ወብ` file. This is the "save my project" button — the file this produces is exactly what Open reads back in, verified by an automated round-trip test through the actual live playground (not just the underlying library).
- **📦 ለሆስቲንግ ዝግጁ (ZIP)** — see §6.6.

## 6.6 Exporting for Real Hosting — Separate `.html`/`.css`/`.js` Files

The original single-file Download (`⬇ አንድ HTML`) inlines everything into one `.html` — great for "email it to someone" or "open it locally," not what you want to **upload to a static host**, where separate `index.html` / `style.css` / `script.js` files are the normal shape of a real site.

**📦 ለሆስቲንግ ዝግጁ (ZIP)** produces exactly that: `index.html` (linking to the other two with real `<link>`/`<script src>` tags, not inlining them), `style.css`, `script.js`, and `runtime.js` (the small shim that defines `ጻፍ`/`አሳውቅ`/`አትም`). Unzip it, upload the whole folder to Vercel/Netlify/GitHub Pages/anywhere — it's a normal static site at that point, with zero remaining dependency on Direnya.

The same two output shapes are available from the command line via `lib/build.js`, which now accepts either a `.ወብ` file or a project folder as input:

```bash
# one combined file (same as playground's plain Download)
node lib/build.js my-project.ወብ output.html

# separate, upload-ready files (same as playground's ZIP button)
node lib/build.js my-project.ወብ output-folder --split
```

**A real bug this surfaced, and how it was fixed:** the first version of both the CLI and the playground's export logic assumed every page had an explicit `ራስ` (head) section to inject `<style>`/`<link>` into. A page written *without* one — which is completely normal for a beginner's very first file — produced a dangling, unmatched `</head>` tag with no opening `<head>`. This was caught by testing the export against a deliberately head-less `.ወብ` file (not just the happy path), and fixed by adding proper fallback logic: if there's no `</head>` but there is an `<html>` tag, a real `<head>...</head>` is constructed right after it; if there's neither, the block is prepended/appended as a best-effort fallback. Re-tested against both the broken case and the original working example afterward to confirm the fix didn't regress the normal case.

## 7. Using It — Two Ways

### 7.1 The Playground (recommended for kids / first-time use)

Open `playground/index.html`. Three tabs, one Run button, one Download button. Nothing to install. This is the primary teaching tool — see §8 for a lesson plan built around it.

### 7.2 The Command-Line Build Tool (for a real multi-file project / older students)

For a student who's outgrown the playground and wants a proper project folder (e.g. to put under version control, or to later extend with more pages):

```
my-project/
  ገጽ.ድር      ← required
  ዘይቤ.ድር     ← optional
  ትእዛዝ.ድር    ← optional
```

```bash
node lib/build.js my-project my-project/output.html
```

Both paths run through the exact same three transpiler modules — the playground just runs them live in the browser instead of via Node, using the identical `lib/*.js` files (they're written to work in both environments unmodified — see the isomorphic module pattern at the top of each file).

---

## 8. Teaching Curriculum — A First Course for Kids

A suggested four-lesson arc, each buildable entirely inside the playground, each ending with something the student can show off:

**Lesson 1 — My First Page** *(structure only)*
Teach `ሰነድ`, `ራስ`, `አርእስት`, `ሰውነት`, `ርዕስ1`, `አንቀጽ`. Goal: a page with a heading and one sentence about themselves. No CSS, no JS — get the win of "I made a real webpage" fast.

**Lesson 2 — Making It Pretty** *(styling)*
Teach `ዘይቤ.ድር`, `ቀለም`, `የጀርባ-ቀለም`, `ውስጠ-ክፍተት`, and the Amharic color words. Goal: style yesterday's page — a colored header, spaced-out paragraphs. This is usually the most immediately satisfying lesson for a beginner of any age.

**Lesson 3 — Lists and Links**
Teach `ዝርዝር`/`ንጥል`, `አገናኝ`, `ስዕል`. Goal: a page listing favorite things (foods, games, places) with at least one link and one image.

**Lesson 4 — Making It Do Something**
Teach `ትእዛዝ.ድር`, `አዝራር`/`ሲነካ`, `ጻፍ()`. Goal: a button that reacts when clicked — a compliment generator, a counter, a simple quiz question with an if/else check.

After Lesson 4, a student has touched every layer of the pipeline and can, in principle, read this entire document's Language Reference (§5) as just filling in more vocabulary on a system they already understand structurally.

**Note on younger kids (roughly under 9–10):** consider Scratch *first*, and treat Direnya as the "graduation" step once a kid is comfortable with sequential instructions and wants to see real code and a real, hostable webpage. This mirrors what MIT's own research and Hedy's design explicitly recommend — block-based tools remove syntax-error frustration for the very newest learners; text-based tools become more motivating once a learner wants their work to look and feel like "real programming." Forcing a 7-year-old straight into typed syntax (Amharic or not) fights the tool against the age group rather than for it.

---

## 9. Where Everything Lives (Project Structure)

```
direnya/
  lib/
    dictionaries.js        ← every Amharic<->real-word mapping (+ Latin aliases), single source of truth
    html-transpiler.js     ← translates ገጽ.ድር → real HTML
    css-transpiler.js      ← translates ዘይቤ.ድር → real CSS
    js-transpiler.js       ← translates ትእዛዝ.ድር → real JS (Amharic AND Latin keywords, §5.4)
    runtime.js             ← defines all 14 built-in functions + their Latin aliases (§5.3, §5.4)
    web-format.js           ← parses/serializes the .ወብ single-file format
    build.js                ← CLI: .ወብ file OR folder → one .html, or --split for upload-ready files
  scripts/
    sync-playground.js      ← dev tool: keeps playground/'s copies of the lib/ modules honest
  playground/
    index.html             ← the live in-browser editor — CodeMirror highlighting, Open/Save .ወብ,
                               hosting-ready ZIP export, DOM-builtins-aware starter example
    (+ copies of the five lib/*.js modules, so it needs no server — kept in sync by scripts/)
  examples/
    test-html.js, test-css.js, test-js.js, test-js-edge.js, test-js-elseif.js,
    test-web-format.js, test-hosting-export.js, test-dom-builtins.js,
    test-codemirror-overlay.js, test-latin-aliases.js
                            ← automated tests, all passing (see §10)
    የመጀመሪያ-ገጼ/             ← the full worked example from §6
  docs/
    DIRENYA_DOCUMENTATION.md  ← this file
    DEVELOPER_GUIDE.md         ← internals, local dev setup, worked extension examples
```

Every file above was created and actually executed as part of building this document — nothing here is a stub or a plan.

---

## 10. Honest Assessment — What's Simplified, and What Would Break

This section exists because a design document that only lists strengths isn't trustworthy. Here's where corners were deliberately cut for the MVP, and what happens at the edges.

**Scoping is intentionally narrow — and that's correct for now.**
About 55 HTML tags/attributes, ~25 CSS properties, and 9 JS structural keywords are covered. This is enough for the entire teaching curriculum in §8 and for genuinely useful static pages. It is **not** enough for arbitrary modern web development (no `grid`, no `async`, no classes/`this`, no modules). That's fine — the goal is a first-language teaching tool with a real, honest ceiling, not a full web-dev framework. When a student outgrows it, they've also outgrown the "training wheels" framing entirely and are ready for real HTML/CSS/JS with English keywords — which, not coincidentally, is now nearly identical to what they already know, since the underlying language never changed.

**The HTML transpiler is regex-based, not a real parser.**
This was a deliberate simplicity-over-robustness tradeoff, and it has a real limit: it assumes reasonably well-formed, simple tag/attribute syntax. It will **not** correctly handle deeply pathological input — e.g. a `>` character inside an unquoted attribute value, or malformed/unclosed tags in complex combinations. For the MVP's audience (kids typing straightforward markup) this is a non-issue in practice, and it was tested against realistic nested markup successfully (§5.1). If this becomes a real problem later, the fix is swapping the regex tokenizer for a proper small parser (e.g. using a library like `parse5`) behind the exact same `transpileHTML(source) → {html, warnings}` interface — nothing downstream would need to change.

**The JS "variable scope" is intentionally flattened.**
`js-transpiler.js` tracks "have I seen this name before" with one flat `Set` for the whole file, not real per-function scoping. This means: if a student picks the *same* variable name inside two different `ተግባር` blocks, the second occurrence won't get its own `let` — it'll just be treated as reassignment, which is silently wrong if they intended two separate local variables. This was tested and confirmed to work fine for the flat, short teaching programs in the curriculum (functions with clearly distinct variable names), but is a known correctness gap for more advanced use. This is the single highest-priority item in the roadmap below.

**No error line-highlighting yet.**
Warnings report a line number in a monospace text message, not a red squiggle in the editor. Fine for an MVP; a real syntax-highlighting code editor (CodeMirror or Monaco) is the natural upgrade — see roadmap.

**Attribute value translation is deliberately *not* done.**
E.g. `<ማስገቢያ ዓይነት="text">` — the word `text` here is a real HTML input type and is left as English on purpose, because translating enum-like values (`text`, `email`, `checkbox`...) would require a much bigger dictionary of *value* vocabularies per attribute, with real risk of ambiguity (is this string a value to translate, or the student's own data?). This is a real limitation students will hit as soon as they try to build an actual form — worth flagging clearly in Lesson 4+ rather than pretending it doesn't exist.

---

## 11. Roadmap

**Immediate next technical priorities** (in priority order, based on §10):
1. Real per-function variable scoping in the JS transpiler (currently flat) — still the highest-priority known gap.
2. Swap the HTML regex tokenizer for a real lightweight parser once content gets more complex than the teaching curriculum needs.
3. ~~Syntax highlighting in the playground editor~~ — **done.** CodeMirror, with a custom overlay mode for both Amharic and Latin keywords, falling back to plain text if offline.
4. A `.ወብ` syntax file for VS Code (highlighting `#ገጽ`/`#ዘይቤ`/`#ትእዛዝ` markers and delegating to HTML/CSS/JS highlighting inside each section) — doesn't exist yet; the playground's own editor is the only place `.ወብ` content currently gets highlighted.

**Feature roadmap:**
- **Phase 2 — richer JS:** ~~more control flow (`ወይም` for elif-style chains)~~ — **done.** Still open: arrays/list built-ins with Amharic method names, more math helpers.
- ~~DOM access & control~~ — **done.** 11 built-ins (§5.3) for finding elements, reading/writing text and values, styling, classes, and event listeners — this is what turns a page from "write once" into genuinely interactive.
- ~~Typing without an Amharic keyboard~~ — **done** for the language's own vocabulary (§5.4). Explicitly still open: a general Amharic transliteration input method for free-form *content* text — a materially bigger, different project, not attempted here.
- **Phase 3 — one-click real publishing:** §6.6 covers "download a real, upload-ready set of files" — that part is done. What's still missing is the *upload* itself: a logged-in student clicking "አሳትም" (Publish) and getting a real hosted URL immediately — e.g. `student-name.direnya.et` — with no separate trip to Vercel/Netlify. That needs simple static file storage behind it (this reuses the exact same Supabase Storage + static hosting pattern already specified in the Simplexer platform's own SRS, §14 of that document — same infrastructure, no new backend paradigm needed).
- **Phase 4 — Simplexer integration:** ship this as a new **Interest Track course** ("የድር ገጽ አሠራር በአማርኛ" — "Building Webpages in Amharic") inside the existing Simplexer platform (see the separate Simplexer SRS), using the playground as an embedded lesson type alongside video/text lessons — the natural home for this project, per your original framing.

**Explicitly out of scope, on purpose:** a full Amharic programming language for general-purpose (non-web) programming; a from-scratch rendering engine; support for the entire modern HTML/CSS/JS surface area; a general Amharic transliteration typing system. All would trade a working, honest teaching tool today for a much bigger, likely-unfinished project.

---

## 12. Test Results (Proof, Not Claims)

Every one of the following was actually executed against the real code in this project, not simulated or described from memory:

| Test | What it checks | Result |
|---|---|---|
| `examples/test-html.js` | Nested tags, attributes, self-closing tags | ✓ Pass — correct HTML output |
| `examples/test-css.js` | Property translation, color-word substitution | ✓ Pass — correct CSS output |
| `examples/test-js.js` | if/else, repeat, foreach, functions, return — **then actually executed the output JS** | ✓ Pass — correct runtime behavior (`ጎረምሳ ነህ`, `9`, etc.) |
| `examples/test-js-edge.js` | 3-level nesting, unmatched-block warning, no-redeclare-on-reassign | ✓ Pass on all three |
| `examples/test-js-elseif.js` | Else-if chaining, plus a real regression bug found while building it (true/false literals inside conditions were never translated) | ✓ Pass — bug found, fixed, and covered by 6 permanent checks |
| `examples/test-web-format.js` | `.ወብ` full round-trip, no-marker default, comment-vs-section-marker disambiguation | ✓ Pass on all four |
| `examples/test-hosting-export.js` | Separate-file export produces correctly linked, non-inlined HTML/CSS/JS | ✓ Pass |
| `examples/test-dom-builtins.js` (via `jsdom`) | A real interactive program (live character counter) — transpiled, then executed against a real DOM with real dispatched events | ✓ Pass on all 5 checks |
| `examples/test-codemirror-overlay.js` | The syntax-highlighting tokenizer's keyword-matching logic, including a real collision bug found and fixed (boundary check didn't account for `_`/digits) | ✓ Pass on all 15 checks |
| `examples/test-latin-aliases.js` | Pure-Latin programs, mixed Amharic+Latin in one file, and the critical collision-safety case (`kahonemore` must not falsely match `kahone`) | ✓ Pass on all 8 checks |
| `lib/build.js` on `examples/የመጀመሪያ-ገጼ/` | Full three-file project → one standalone HTML file, and (`--split`) → separate upload-ready files | ✓ Pass — zero warnings on both output modes |


---

## 13. Naming Note

"ድርኛ" (Direnya) combines **ድር** (*dir* — "web," as in ድር-ገጽ, "web-page") with the **-ኛ** suffix pattern used for "one who does/makes" — read loosely as "web-maker" or "the web, in [our] own language." Two alternates considered, in case this name doesn't stick with the people you test it on: **ገጽኛ** (Getsenya — "page-maker") and **ኢትዮ-ድር** (Ethio-Dir — more literal, less elegant). Worth testing all three on an actual group of kids before locking one in — naming is cheap to change now and expensive to change after it's on a certificate or a URL.
