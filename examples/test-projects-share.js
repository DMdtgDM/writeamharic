// Smoke test: projects, snapshots, share-link round trip, autocomplete word source (jsdom, no CDN).
const {JSDOM}=require('jsdom'), fs=require('fs'), path=require('path');
const dir=path.join(__dirname,'..','playground'); let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
html=html.replace(/<script src="(https?:|vendor\/)[^>]*><\/script>/g,'').replace(/<link[^>]*>/g,'').replace(/<script src="([^"]+)"><\/script>/g,(m,f)=>'<script>'+fs.readFileSync(path.join(dir,f),'utf8')+'</script>');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/play/',pretendToBeVisual:true,beforeParse(w){ Object.assign(w,{CompressionStream,DecompressionStream,TextEncoder,TextDecoder,Response}); w.matchMedia=w.matchMedia||(()=>({matches:false,addEventListener(){}})); w.HTMLIFrameElement.prototype; }});
const w=dom.window; let fails=0; const ok=(n,c)=>{ console.log((c?'✓ ':'✗ ')+n); if(!c) fails++; };
setTimeout(async()=>{
  try{
    w.setSrc('js','ብዛት = 1\nጻፍ(ብዛት)'); w.saveActiveProject();
    ok('active project created', w.projIndex().length===1);
    w.createProject(); ok('second project', w.projIndex().length===2);
    w.setSrc('js','x = 2'); w.saveActiveProject();
    ok('snapshot taken', w.eval("lsGet('direnya-snaps:'+activeId(),[])").length>=1);
    const code=await w.encodeProject(); ok('share code made', /^[zu]/.test(code));
    const back=w.parseProjectFile(await w.decodeProject(code)); ok('share round-trips', back.js.trim()==='x = 2');
    const words=w.direnyaWords('js',{getCursor:()=>({line:0,ch:0}),getLine:()=>''}); ok('autocomplete knows ካሆነ + ደርድር', words.some(e=>e.w==='ካሆነ')&&words.some(e=>e.w==='ደርድር'));
    w.applyTheme('system'); ok('system theme applies', true);
  }catch(e){ console.log('✗ threw',e); fails++; }
  process.exit(fails?1:0);
},400);
