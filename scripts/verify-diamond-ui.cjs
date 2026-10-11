const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {JSDOM}=require(process.env.DFCH_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[\s\S]*?<\/script>/g,'');
const dom=new JSDOM(html,{url:'https://dfch.test/',runScripts:'outside-only'}),w=dom.window;
let tasks=new Map(),taskId=0,calls=0,values=[];
w.setTimeout=fn=>{tasks.set(++taskId,fn);return taskId;};w.clearTimeout=id=>tasks.delete(id);
w.crypto.getRandomValues=a=>{calls++;a[0]=values.length?values.shift():0;return a;};
const tick=()=>{const [id,fn]=tasks.entries().next().value??[];assert.ok(fn,'expected scheduled animation');tasks.delete(id);fn();};
const drain=()=>{for(let i=0;tasks.size&&i<200;i++)tick();assert.equal(tasks.size,0,'must stop scheduling');};
for(const name of ['diamond-draw.js','diamond-view.js'])w.eval(fs.readFileSync(path.join(root,name),'utf8'));
const $=id=>w.document.getElementById(id),history=()=>JSON.parse(w.localStorage.getItem('DFCH.diamond.history.v1'));

assert.equal($('diamondDialog'),null);assert.equal($('diamondStart').closest('.tab-panel').id,'tab-diamond');assert.equal($('diamondStop').hidden,true);
$('diamondEye').checked=true;$('diamondEye').dispatchEvent(new w.Event('change'));values=[40];$('diamondStart').click();assert.match($('diamondResult').textContent,/100/);assert.equal(calls,1);assert.equal(tasks.size,0);assert.equal(history().length,1);
$('diamondRouletteTab').click();values=[0,500];const before=calls;$('diamondStart').click();assert.equal(calls,before+2);
const selected=()=>[...$('diamondWheel').children].findIndex(e=>e.classList.contains('selected'));
assert.equal(selected(),0);tick();assert.equal(selected(),1);tick();assert.equal(selected(),2);tick();assert.equal(selected(),3);assert.equal(calls,before+2);
$('diamondStop').click();drain();assert.equal(selected(),2);assert.match($('diamondResult').textContent,/鑽石 ×15/);assert.equal(calls,before+2);const length=history().length;$('diamondStop').click();assert.equal(history().length,length);
// Larger individual rewards and accumulated diamonds must never satisfy the exact target.
assert.equal($('diamondTarget').value,'diamond:7777');values=[990,644,990,644,600,944];const autoCalls=calls;$('diamondAutoStart').click();drain();assert.equal(calls-autoCalls,6);assert.match($('diamondAutoStatus').textContent,/已抽中目標/);assert.match($('diamondAutoStatus').textContent,/已抽 3 次/);assert.equal(history()[0].quantity,7777);
// The same reward in another tier counts too.
values=[940,894];$('diamondAutoStart').click();drain();assert.match($('diamondAutoStatus').textContent,/已抽 1 次/);assert.equal(history()[0].tierName,'夢幻');
// Target options track the selected pool; equal quantity but a different item is not a match.
$('diamondHorn').checked=true;$('diamondHorn').dispatchEvent(new w.Event('change'));assert.ok(!$('diamondTarget').querySelector('option[value="redChest:1"]'));assert.ok($('diamondTarget').querySelector('option[value="goldChest:100"]'));
$('diamondTarget').value='thornChest:10';values=[990,949,940,899];$('diamondAutoStart').click();drain();assert.match($('diamondAutoStatus').textContent,/已抽 2 次/);assert.equal(history()[0].kind,'thornChest');assert.equal(history()[0].quantity,10);
$('diamondTarget').value='missing:7';const invalid=calls;$('diamondAutoStart').click();assert.equal(calls,invalid);assert.equal(tasks.size,0);
$('diamondTarget').value='diamond:7777';values=[];$('diamondAutoStart').click();tick();assert.ok(tasks.size>0);assert.equal($('diamondTarget').disabled,true);const stoppedCalls=calls;$('diamondStop').click();assert.equal(tasks.size,0);assert.equal(calls,stoppedCalls);assert.match($('diamondAutoStatus').textContent,/已停止/);
$('diamondAutoStart').click();w.dispatchEvent(new w.CustomEvent('dfch-tab-change',{detail:'stats'}));assert.equal(tasks.size,0);assert.equal($('diamondTarget').disabled,false);
values=[0,500];$('diamondStart').click();const leaveCount=history().length;w.dispatchEvent(new w.CustomEvent('dfch-tab-change',{detail:'stats'}));assert.equal(history().length,Math.min(30,leaveCount+1));assert.equal(history()[0].quantity,20);assert.equal(tasks.size,0);
assert.ok($('diamondProbabilities').textContent.includes('23.9%'));assert.ok($('diamondProbabilities').textContent.includes('黃金寶箱 ×100'));
w.close();console.log('Diamond UI: immediate draw, predetermined sequential reveal, fast exact target across tiers, item identity, pool options, stop and tab-leave passed');
