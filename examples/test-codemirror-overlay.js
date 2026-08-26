// Extracted verbatim from playground/index.html's defineDirenyaJSMode()
// to unit-test the actual matching algorithm without needing real CodeMirror
// rendering (which jsdom cannot do — see examples/test-codemirror-overlay.js
// comments for why that had to be tested differently).

const KEYWORDS = ['ካሆነ','ካልሆነ','ወይም','ድገም','ጊዜ','እያንዳንዱ','በ','ተግባር','ጨርስ','መልስ','እውነት','ሐሰት',
                   'kahone','kalhone','weyim','digem','gize','eyandandu','be','tegbar','chers','mels','ewnet','hasete'];
const BUILTINS = ['ጻፍ','አሳውቅ','አትም','ንጥል_በመለያ','ንጥሎች_በመደብ','ጽሑፍ_አስቀምጥ','ጽሑፍ_አግኝ',
                   'ስልት_አስቀምጥ','መደብ_ጨምር','መደብ_አስወግድ','መደብ_ቀያይር','ዋጋ_አግኝ','ዋጋ_አስቀምጥ','ስማ',
                   'tsaf','asawek','atim','nitil_bemeleya','nitiloch_bemedeb','tsihuf_askemt','tsihuf_agn',
                   'silt_askemt','medeb_chemr','medeb_aswegd','medeb_keyayir','waga_agn','waga_askemt','sima'];
const ETHIOPIC = /[\u1200-\u137F]/;
const IDENT_CHAR = /[A-Za-z0-9_$\u1200-\u137F]/;

function isBoundary(str, pos){
  if(pos < 0 || pos >= str.length) return true;
  return !IDENT_CHAR.test(str[pos]);
}

// Simplified stand-in for CodeMirror's stream object, just enough to drive matchWordList
function makeStream(str){
  return { string: str, pos: 0, next(){ this.pos++; } };
}
function matchWordList(stream, words, className){
  const rest = stream.string.slice(stream.pos);
  for(const w of words){
    if(rest.startsWith(w) && isBoundary(stream.string, stream.pos - 1) && isBoundary(stream.string, stream.pos + w.length)){
      stream.pos += w.length;
      return className;
    }
  }
  return null;
}

// Tokenize a whole line the way the real overlay's token() function does, one call per position
function tokenizeLine(line){
  const stream = makeStream(line);
  const tokens = [];
  while(stream.pos < line.length){
    const start = stream.pos;
    let cls = matchWordList(stream, KEYWORDS, 'keyword') || matchWordList(stream, BUILTINS, 'builtin');
    if(!cls){ stream.next(); continue; }
    tokens.push({ text: line.slice(start, stream.pos), cls });
  }
  return tokens;
}

let failures = 0;
function check(name, condition){
  console.log((condition ? '✓' : '✗ FAILED') + ' ' + name);
  if(!condition) failures++;
}

console.log('=== TEST 1: basic keyword recognized on its own ===');
{
  const tokens = tokenizeLine('ካሆነ እውነት');
  check('ካሆነ tagged as keyword', tokens.some(t => t.text === 'ካሆነ' && t.cls === 'keyword'));
  check('እውነት tagged as keyword', tokens.some(t => t.text === 'እውነት' && t.cls === 'keyword'));
}

console.log('\n=== TEST 2: builtin function name recognized ===');
{
  const tokens = tokenizeLine('ጻፍ("hi")');
  check('ጻፍ tagged as builtin', tokens.some(t => t.text === 'ጻፍ' && t.cls === 'builtin'));
}

console.log('\n=== TEST 3: keyword-as-substring inside a longer identifier must NOT match ===');
{
  // ጨርስ is a keyword; a variable literally named ጨርስ_ቁጥር should not have "ጨርስ" pulled out as a false match
  const tokens = tokenizeLine('ጨርስ_ቁጥር = 5');
  const wrongMatch = tokens.some(t => t.text === 'ጨርስ');
  check('ጨርስ NOT falsely matched inside ጨርስ_ቁጥር', !wrongMatch);
}

console.log('\n=== TEST 4: keyword at very start and very end of line (boundary edge cases) ===');
{
  const tokens = tokenizeLine('ጨርስ');
  check('keyword alone on a line still matches (both boundaries are string edges)', tokens.some(t => t.text === 'ጨርስ' && t.cls === 'keyword'));
}

console.log('\n=== TEST 5: new ወይም (else-if) keyword specifically, since it was added most recently ===');
{
  const tokens = tokenizeLine('ወይም ውጤት >= 70');
  check('ወይም tagged as keyword', tokens.some(t => t.text === 'ወይም' && t.cls === 'keyword'));
}

console.log('\n=== TEST 6: new DOM builtin names specifically ===');
{
  const tokens = tokenizeLine('እቃ = ንጥል_በመለያ("ውጤት")');
  check('ንጥል_በመለያ tagged as builtin', tokens.some(t => t.text === 'ንጥል_በመለያ' && t.cls === 'builtin'));
  check('እቃ (a plain variable name) NOT wrongly tagged', !tokens.some(t => t.text === 'እቃ'));
}
{
  const tokens = tokenizeLine('መደብ_ጨምር(እቃ, "ደምቆ")');
  check('መደብ_ጨምር tagged as builtin (contains ጨ but must match the FULL builtin name, not stop early)', tokens.some(t => t.text === 'መደብ_ጨምር' && t.cls === 'builtin'));
}

console.log('\n=== TEST 3b: same bug class with digit and dollar-sign boundaries (regression coverage) ===');
{
  const t1 = tokenizeLine('ጨርስ1 = 5'); // digit right after the keyword text
  check('ጨርስ NOT falsely matched inside ጨርስ1', !t1.some(t => t.text === 'ጨርስ'));
  const t2 = tokenizeLine('ጨርስ$x = 5'); // dollar sign right after
  check('ጨርስ NOT falsely matched inside ጨርስ$x', !t2.some(t => t.text === 'ጨርስ'));
}

console.log('\n=== TEST 7: Latin aliases highlight the same way as their Amharic originals ===');
{
  const tokens = tokenizeLine('kahone ewnet');
  check('kahone tagged as keyword', tokens.some(t => t.text === 'kahone' && t.cls === 'keyword'));
  check('ewnet tagged as keyword', tokens.some(t => t.text === 'ewnet' && t.cls === 'keyword'));
}
{
  const tokens = tokenizeLine('nitil_bemeleya("box")');
  check('nitil_bemeleya tagged as builtin', tokens.some(t => t.text === 'nitil_bemeleya' && t.cls === 'builtin'));
}

console.log('\n=== TEST 8: same collision-safety class, now in Latin — a variable name with a keyword prefix must not falsely match ===');
{
  const tokens = tokenizeLine('chersstuff = 1');
  check('chers NOT falsely matched inside chersstuff', !tokens.some(t => t.text === 'chers'));
}

console.log('\n' + (failures === 0 ? `✓ ALL CHECKS PASSED` : `✗ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
