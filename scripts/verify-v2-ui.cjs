const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{JSDOM}=require(process.env.DFCH_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
function boot(storage={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://dfch.test/',runScripts:'outside-only'}),w=dom.window;
 for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
 w.confirm=()=>true;return dom;
}
const dom=boot(),w=dom.window,$=id=>w.document.getElementById(id),change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
const A=w.DFCHArtifacts,C=w.DFCHAccount;
assert.equal($('accountArtifacts').children.length,6);
const ids=[...w.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
assert.ok($('accountSettings').compareDocumentPosition($('mapSelect'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
C.setRate('stage_1',37.123456);assert.equal(Number($('mapExplorationRate').value),37.123456);C.assertValid();
$('allMapsExplored').click();assert.equal(C.rate('stage_1'),100);assert.equal($('mapExplorationRate').disabled,true);
change('mapSelect','stage_2');assert.equal(C.rate('stage_2'),100);$('allMapsExplored').click();assert.equal(C.rate('stage_1'),37.123456);
const telescope=w.document.querySelector(`[data-account-artifact="${A.ids.telescope}"]`);telescope.value='3';telescope.dispatchEvent(new w.Event('change'));
change('mapSelect','stage_1');assert.equal(C.snapshot().owned[A.ids.telescope],3);
change('dropPoolMode','boss');$('dropPoolMode').dispatchEvent(new w.Event('input'));
C.setOwned(A.ids.seed,1);assert.match($('dropStateRows').textContent,/長壽的幻酒/);C.setOwned(A.ids.seed,0);assert.doesNotMatch($('dropStateRows').textContent,/長壽的幻酒/);
change('mapExplorationRate','101');assert.throws(()=>C.assertValid(),/探索率/);change('mapExplorationRate','25');C.assertValid();
const wait=async()=>{for(let i=0;i<2000&&$('simulateBtn').disabled;i++)await new Promise(r=>setTimeout(r,2));assert.equal($('simulateBtn').disabled,false,$('simulateMessage').textContent);};
(async()=>{
 const before=JSON.stringify(C.snapshot());$('simulateOnceBtn').click();await wait();assert.equal(JSON.stringify(C.snapshot()),before);
 change('simulationMode','continuous');$('simulateOnceBtn').click();await wait();assert.equal(C.rate('stage_1'),w.DFCHLastSimulation.last.completionRate);
 const persisted=w.localStorage.getItem(C.KEY),again=boot({[C.KEY]:persisted});assert.equal(JSON.stringify(again.window.DFCHAccount.snapshot()),JSON.stringify(C.snapshot()));again.window.close();
 $('resetAllRecords').click();assert.equal(w.localStorage.getItem(C.KEY),persisted);
 const corrupt=boot({[C.KEY]:'{bad'});assert.throws(()=>corrupt.window.DFCHAccount.assertValid(),/無法讀取/);assert.equal(corrupt.window.localStorage.getItem(C.KEY),'{bad');corrupt.window.close();
 console.log('V2 UI: top-level artifacts, unique IDs, cross-map ownership, exploration override, dynamic preview, validation, independent/continuous persistence and reset isolation passed');w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
