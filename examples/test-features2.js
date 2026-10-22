// Templates all build + run, block problems carry line numbers, runtime errors map back to the right source line.
const {JSDOM}=require('jsdom'), fs=require('fs'), path=require('path');
const dir=path.join(__dirname,'..','playground'); let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
html=html.replace(/<script src="(https?:|vendor\/)[^>]*><\/script>/g,'').replace(/<link[^>]*>/g,'').replace(/<script src="([^"]+)"><\/script>/g,(m,f)=>'<script>'+fs.readFileSync(path.join(dir,f),'utf8')+'</script>');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/play/',pretendToBeVisual:true,beforeParse(w){ Object.assign(w,{CompressionStream,DecompressionStream,TextEncoder,TextDecoder,Response}); w.matchMedia=w.matchMedia||(()=>({matches:false,addEventListener(){}})); }});
const w=dom.window; let fails=0; const ok=(n,c)=>{ console.log((c?'✓ ':'✗ ')+n); if(!c) fails++; };
const run=(code)=>new Promise(res=>{ const d=new JSDOM(code,{runScripts:'dangerously',pretendToBeVisual:true}); const got=[]; d.window.addEventListener('message',e=>got.push(e.data)); setTimeout(()=>res({d,got}),150); });
setTimeout(async()=>{
  try{
    const T=w.eval('TEMPLATES'), CSS=w.eval('TEMPLATE_CSS');
    for(let i=0;i<T.length;i++){
      w.eval(`loadState({pages:{[HOME_PAGE]:${JSON.stringify(T[i].html)}},css:${JSON.stringify(CSS)},js:${JSON.stringify(T[i].js)}})`);
      const {fullHtml,warnings}=w.eval('buildFullHtmlForPage(HOME_PAGE,true)');
      const {d,got}=await run(fullHtml); const doc=d.window.document;
      ok(`template ${i+1} builds with no warnings`, warnings.length===0);
      ok(`template ${i+1} runs with no runtime error`, got.filter(g=>g&&g.type==='direnya-error').length===0);
      if(i===0){ doc.getElementById('ጨምር-አዝራር').click(); doc.getElementById('ጨምር-አዝራር').click(); ok('counter counts clicks', doc.getElementById('ቁጥር').textContent==='2'); ok('CSS tag selector translated', /button/.test(w.eval('transpileCSS(TEMPLATE_CSS).css'))); }
      if(i===1){ doc.getElementById('ስም-ሳጥን').value='አበበ'; doc.getElementById('ሰላም-አዝራር').click(); ok('greeting works', doc.getElementById('ሰላምታ').textContent==='ሰላም፣ አበበ!'); }
      if(i===2){ doc.getElementById('አዲስ-ሥራ').value='ማጥናት'; doc.getElementById('ጨምር-አዝራር').click(); ok('todo adds an item', doc.querySelectorAll('li').length===1); }
      if(i===3){ doc.getElementById('መልስ-ሀ').click(); ok('quiz right answer', /ትክክል/.test(doc.getElementById('ውጤት').textContent)); }
    }
    // runtime error -> source line
    w.eval(`loadState({pages:{[HOME_PAGE]:'<ሰነድ><ሰውነት></ሰውነት></ሰነድ>'},css:'',js:'ጻፍ(1)\\n\\nx = ያልተፈጠረ + 1'})`);
    const r=w.eval('buildFullHtmlForPage(HOME_PAGE,true)'); const marker=w.eval('userJsMarkerLine');
    const {got}=await run(r.fullHtml); const err=got.find(g=>g&&g.type==='direnya-error');
    ok('runtime error is reported', !!err);
    ok('error maps to source line 3', err && (err.line-Number(err.base))===3);
    ok('Amharic explanation for undefined variable', /አልተፈጠረም/.test(w.eval(`explainError(${JSON.stringify(err?err.message:'')})`)));
    // unclosed block squiggle data
    ok('unclosed block reported with its line', w.eval(`transpileJS('ካሆነ እውነት\\n  ጻፍ(1)').problems[0].line`)===1);
    // non-preview export has no error reporter
    ok('download build has no parent.postMessage reporter', !w.eval('buildFullHtmlForPage(HOME_PAGE).fullHtml').includes('direnya-error'));
  }catch(e){ console.log('✗ threw',e); fails++; }
  process.exit(fails?1:0);
},500);
