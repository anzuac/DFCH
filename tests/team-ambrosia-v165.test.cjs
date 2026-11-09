'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'team/js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'team/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'team/css/style.css'),'utf8');
const i18n=fs.readFileSync(path.join(root,'team/js/i18n.js'),'utf8');
const start=app.indexOf('function buildCalcData(){'),end=app.indexOf('function showSkillRows(',start);
const computeSource=app.slice(start,end);
const rulesStart=app.indexOf('const EXTRA_CHEST_SKILL_RATES='),rulesEnd=app.indexOf('const EXTRA_CHEST_OFFLINE=',rulesStart);
const rulesSource=app.slice(rulesStart,rulesEnd);
function calc(up,owned){
 const context={base:3,crown:false,stone:false,ring:0,eventMultiplier:1,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30,windAshEnabled:false,windSoldiers:0};
 const make=new Function('calcSettings','pickedTracked','ominousEffect','truncToOneDecimal',
 'const SKILL_RATES={}; const canonicalSkillName=x=>x;\n'+rulesSource+computeSource+'return buildCalcData();');
 return make(context,()=>[{name:'古代魔法的知識',up,ambrosiaOwned:owned,owner:'瑪露希爾'}],()=>({applied:0}),n=>Math.trunc((n+1e-10)*10)/10);
}
test('the Holy Staff adds five percentage points, never a multiplier',()=>{
 assert.equal(calc(false,false).specialBossTotal,10);
 assert.equal(calc(false,true).specialBossTotal,15);
 assert.equal(calc(true,false).specialBossTotal,15);
 assert.equal(calc(true,true).specialBossTotal,20);
});
test('ownership toggle is limited to Marcille and committed with the slot only on Save',()=>{
 assert.match(app,/ambrosia=v==='marcille'&&key==='古代魔法的知識'/);
 assert.match(app,/data-ambrosia aria-pressed/);
 assert.match(app,/ambrosiaOwned:!draft\.skills\[key\]\?\.ambrosiaOwned/);
 assert.match(app,/ambrosiaOwned:h\?\.slug==='marcille'/);
 assert.match(app,/draft\.skills\[key\]=\{\.\.\.draft\.skills\[key\],selected:isOther/);
 assert.match(app,/slots\[current\]=draft\.type\?draft:blank\(\);persist\(\)/);
 assert.match(app,/const blank=\(\)=>\(\{type:'',hero:'',skills:\{\}\}\)/);
});
test('edit modal uses accessible button and existing mobile layout',()=>{
 assert.match(html,/v1\.6\.8<\/span>/);
 assert.match(html,/app\.js\?v=1\.6\.8/);
 assert.match(css,/\.ambrosia-toggle:focus-visible/);
 const dict=new Function('return ('+i18n.slice(i18n.indexOf('const entries={')+'const entries='.length,i18n.indexOf(';\nconst langs='))+')')();
 for(const key of ['聖杖「安布洛西雅」','已持有'])assert.equal(dict[key].length,6);
});
