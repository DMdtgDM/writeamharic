// WCAG contrast check for every theme in playground/index.html (AA = 4.5:1 for text).
const fs=require('fs'), html=fs.readFileSync(__dirname+'/../playground/index.html','utf8');
const blocks={}; const re=/(:root|body\[data-theme="(\w+)"\])\s*\{([^}]*)\}/g; let m;
while((m=re.exec(html))){ const name=m[2]||'dark'; const vars={}; m[3].replace(/--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g,(_,k,v)=>vars[k]=v); blocks[name]=Object.assign(blocks[name]||{},vars); }
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const ratio=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
const pairs=[['text','bg'],['text','panel'],['muted','bg'],['muted','panel'],['on-secondary','secondary'],['on-primary','primary'],['error','warn-bg'],['cm-tag','bg'],['cm-attribute','bg'],['cm-string','bg'],['cm-number','bg'],['cm-property','bg'],['cm-atom','bg'],['cm-keyword','bg'],['cm-builtin','bg'],['cm-comment','bg']];
let bad=0, themes=Object.keys(blocks);
themes.forEach(t=>{ const v=Object.assign({},blocks.dark,blocks[t]); pairs.forEach(([a,b])=>{ const fa=a[0]==='#'?a:v[a], fb=v[b]; if(!fa||!fb) return; const r=ratio(fa,fb); if(r<4.5){ bad++; console.log(`✗ ${t}: ${a} on ${b} = ${r.toFixed(2)}`); } }); });
// Regression: token colours must outrank CodeMirror's built-in .cm-s-default rules, or themes never recolour the code.
const tokenRules=[...html.matchAll(/^\s*(body \.CodeMirror \.cm-[\w-]+)[^{]*\{[^}]*var\(--cm-/gm)].length;
const weak=[...html.matchAll(/^\s*\.cm-(?:tag|attribute|string|number|comment|property|atom)\s*\{/gm)].length;
if(tokenRules<6||weak){ bad++; console.log(`✗ code token colour rules are too weak (strong: ${tokenRules}, bare .cm-*: ${weak})`); } else console.log('✓ code token colours outrank the CodeMirror default theme');
console.log(bad?`\n${bad} contrast failure(s) across ${themes.length} themes`:`✓ all ${themes.length} themes pass WCAG AA`); process.exit(bad?1:0);
