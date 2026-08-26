/* ============================================================
   ድርኛ (Direnya) — JS mini-DSL transpiler
   -------------------------------------------------------------
   IMPORTANT DESIGN NOTE (read this before extending the dict):
   JavaScript identifiers can legally be Amharic/Ethiopic letters
   ( let ስም = 5; function ጻፍ(x){} both run as-is in every modern
   JS engine — no translation needed for variable/function NAMES.
   So this transpiler only has to translate STRUCTURE keywords
   (if/else/repeat/foreach/function/end) from the Amharic block
   syntax (Ruby-style, closed with ጨርስ) into real JS braces.
   Everything else — names, numbers, operators, strings — passes
   straight through untouched.
   ============================================================ */
(function (root, factory) {
  const mod = factory(typeof require === 'function' ? require('./dictionaries.js') : root.DIRENYA);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.transpileJS = mod;
})(typeof self !== 'undefined' ? self : this, function (DICT) {

  // Build "either the Amharic word or its Latin alias" for each keyword,
  // e.g. kw('ካሆነ') -> "(?:ካሆነ|kahone)". Falls back to just the Amharic
  // word if no alias is registered (keeps this safe if the dictionary
  // entry is ever removed rather than crashing on undefined).
  function kw(amharic) {
    const alias = DICT.JS_KEYWORD_ALIASES && DICT.JS_KEYWORD_ALIASES[amharic];
    return alias ? `(?:${amharic}|${alias})` : amharic;
  }

  const RE = {
    comment:  /^\s*#(.*)$/,
    ifLine:      new RegExp(`^(\\s*)${kw('ካሆነ')}\\s+(.+?)\\s*$`),
    elseIfLine:  new RegExp(`^(\\s*)${kw('ወይም')}\\s+(.+?)\\s*$`),
    elseLine:    new RegExp(`^(\\s*)${kw('ካልሆነ')}\\s*$`),
    repeatLine:  new RegExp(`^(\\s*)${kw('ድገም')}\\s+(.+?)\\s+${kw('ጊዜ')}\\s*$`),
    foreachLine: new RegExp(`^(\\s*)${kw('እያንዳንዱ')}\\s+(\\S+)\\s+${kw('በ')}\\s+(.+?)\\s*$`),
    funcLine:    new RegExp(`^(\\s*)${kw('ተግባር')}\\s+(\\S+)\\s*\\(([^)]*)\\)\\s*$`),
    endLine:     new RegExp(`^(\\s*)${kw('ጨርስ')}\\s*$`),
    returnLine:  new RegExp(`^(\\s*)${kw('መልስ')}(\\s+.+?)?\\s*$`),
    assignLine: /^(\s*)([A-Za-z_$\u1200-\u137F][A-Za-z0-9_$\u1200-\u137F]*)\s=(?!=)\s*(.+?)\s*$/,
  };

  function transpileJS(source) {
    const lines = source.split('\n');
    const out = [];
    const blockStack = [];      // tracks which kind of block each open brace closes
    const declared = new Set(); // simple flat scope: fine for short teaching programs
    let loopCounter = 0;
    const warnings = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      let m;

      if ((m = raw.match(RE.comment))) { out.push(`${m[1] !== undefined ? '' : ''}//${m[1]}`); continue; }
      if (raw.trim() === '') { out.push(''); continue; }

      if ((m = RE.ifLine.exec(raw))) {
        out.push(`${m[1]}if (${translateLiterals(m[2])}) {`); blockStack.push('if'); continue;
      }
      if ((m = RE.elseIfLine.exec(raw))) {
        out.push(`${m[1]}} else if (${translateLiterals(m[2])}) {`); continue; // stays same block kind, no stack change
      }
      if ((m = RE.elseLine.exec(raw))) {
        out.push(`${m[1]}} else {`); continue; // stays same block kind
      }
      if ((m = RE.repeatLine.exec(raw))) {
        const iv = `__ድገም${loopCounter++}`;
        out.push(`${m[1]}for (let ${iv} = 0; ${iv} < (${translateLiterals(m[2])}); ${iv}++) {`);
        blockStack.push('repeat'); continue;
      }
      if ((m = RE.foreachLine.exec(raw))) {
        out.push(`${m[1]}for (const ${m[2]} of ${translateLiterals(m[3])}) {`);
        blockStack.push('foreach'); continue;
      }
      if ((m = RE.funcLine.exec(raw))) {
        out.push(`${m[1]}function ${m[2]}(${m[3]}) {`);
        blockStack.push('function'); continue;
      }
      if ((m = RE.endLine.exec(raw))) {
        if (blockStack.length === 0) {
          warnings.push(`Line ${i + 1}: "ጨርስ" with no matching block to close.`);
        } else {
          blockStack.pop();
        }
        out.push(`${m[1]}}`); continue;
      }
      if ((m = RE.returnLine.exec(raw))) {
        out.push(`${m[1]}return${m[2] ? translateLiterals(m[2]) : ''};`); continue;
      }
      if ((m = RE.assignLine.exec(raw))) {
        const [, indent, name, rhs] = m;
        // `var` (not `let`) is deliberate: `let`/`const` are block-scoped in
        // real JS, so a variable first assigned inside a ካሆነ/ካልሆነ branch
        // would vanish right after the closing ጨርስ — a genuine crash
        // (`ReferenceError: X is not defined`) that beginners hit on their
        // very first if/else, with no visible reason why. `var` is
        // function-scoped, matching what a beginner actually expects:
        // "a variable I made is still there after the if-block ends."
        const decl = declared.has(name) ? '' : (declared.add(name), 'var ');
        out.push(`${indent}${decl}${name} = ${translateLiterals(rhs)};`);
        continue;
      }

      // passthrough: plain statement / expression / already-valid JS line
      let line = translateLiterals(raw);
      const trimmed = line.trim();
      if (trimmed && !/[{};]\s*$/.test(trimmed)) line = line.replace(/\s*$/, ';');
      out.push(line);
    }

    if (blockStack.length > 0) {
      warnings.push(`${blockStack.length} block(s) not closed with "ጨርስ" — missing end keyword(s).`);
    }

    return { js: out.join('\n'), warnings };
  }

  // Replace whole-word literal keywords (true/false, Amharic or Latin)
  // without touching identifiers that merely contain the same substring.
  function translateLiterals(line) {
    const trueAlias = DICT.JS_KEYWORD_ALIASES['እውነት'];   // 'ewnet'
    const falseAlias = DICT.JS_KEYWORD_ALIASES['ሐሰት'];   // 'hasete'
    let out = line
      .replace(ethiopicBoundaryRe('እውነት'), 'true')
      .replace(ethiopicBoundaryRe('ሐሰት'), 'false');
    if (trueAlias)  out = out.replace(new RegExp(`\\b${trueAlias}\\b`, 'g'), 'true');
    if (falseAlias) out = out.replace(new RegExp(`\\b${falseAlias}\\b`, 'g'), 'false');
    return out;
  }
  function ethiopicBoundaryRe(word) {
    // Ethiopic letters aren't in \w, so build an explicit boundary:
    // not preceded/followed by another Ethiopic letter. (Latin aliases
    // use plain \b instead, above — \b already works correctly for ASCII.)
    return new RegExp(`(?<![\\u1200-\\u137F])${word}(?![\\u1200-\\u137F])`, 'g');
  }

  return transpileJS;
});
