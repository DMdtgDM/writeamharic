// Mobile/PWA readiness: manifest valid, icons exist, service worker precaches only real files, nothing loads from the internet, welcome + tabs wired.
const fs=require('fs'), path=require('path'); const dir=path.join(__dirname,'..','playground');
let fails=0; const ok=(n,c)=>{ console.log((c?'✓ ':'✗ ')+n); if(!c) fails++; };
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const man=JSON.parse(fs.readFileSync(path.join(dir,'manifest.webmanifest'),'utf8'));
ok('manifest has name, standalone display, start_url', man.name && man.display==='standalone' && man.start_url);
ok('manifest has 192, 512 and maskable icons', ['192x192','512x512'].every(z=>man.icons.some(i=>i.sizes===z)) && man.icons.some(i=>i.purpose==='maskable'));
ok('every manifest icon file exists', man.icons.every(i=>fs.existsSync(path.join(dir,i.src))));
const sw=fs.readFileSync(path.join(dir,'sw.js'),'utf8'); const files=[...sw.matchAll(/'([^']+\.[a-z0-9]+)'/g)].map(m=>m[1]).filter(f=>!/^direnya/.test(f));
ok('service worker precache list is non-trivial', files.length>15);
ok('every precached file exists', files.every(f=>fs.existsSync(path.join(dir,f))) );
ok('every local script/stylesheet in index.html is precached', [...html.matchAll(/<(?:script|link)[^>]*?(?:src|href)="((?:vendor\/)?[\w.-]+\.(?:js|css))"/g)].every(m=>files.includes(m[1])||['style.css','runtime.js','script.js'].includes(m[1])) /* those 3 are names inside the export template, not loaded by the app */);
ok('no script, stylesheet or font loads from the internet', !/(?:src|href)="https?:\/\//.test(html) && !/url\(https?:/.test(html));
ok('viewport-fit, theme-color, manifest, apple icon declared', ['viewport-fit=cover','name="theme-color"','rel="manifest"','apple-touch-icon'].every(t=>html.includes(t)));
ok('mobile tabs + run button + welcome wired', ['id="mobile-tabs"','id="run-fab"','id="welcome-modal"','function mobTab','function showWelcome'].every(t=>html.includes(t)));
ok('service worker registered', html.includes("serviceWorker.register('sw.js')"));
ok('device preview scales to fit the pane (no overflow over the editor)', html.includes('id="preview-stage"') && /function setDevice[\s\S]*?scale\(/.test(html) && html.includes("addEventListener('resize'"));
ok('undo and redo buttons are in the header and wired to the editor', html.includes('id="undo-btn"') && html.includes('id="redo-btn"') && html.includes('function doUndo') && html.includes('function doRedo') && html.includes('historySize()'));
process.exit(fails?1:0);
