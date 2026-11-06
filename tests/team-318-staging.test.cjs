'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('team/js/data.js'),app=read('team/js/app.js');
const {HEROES,SKILL_RATES}=new Function(source+'\nreturn {HEROES,SKILL_RATES}')();
const ids=[70,71,72,73,74,75,80,81],slugs=['laios','marcille','chilchack','senshi','izutsumi','falin','mithrun','thistle'];
function section(from,to){const start=app.indexOf(from),end=app.indexOf(to,start);assert.ok(start>=0&&end>start);return app.slice(start,end);}
const parts=[section('function isUpgradeAllowed(slot,skillName){','\nfunction draw(){'),section('function pickedTracked(){','\nconst calcStoreKey='),section('function buildCalcData(){','\nfunction showSkillRows')].join('\n');
const createRuntime=new Function('slots','HEROES','SKILL_RATES','fullData','calcSettings',`
const hero=s=>HEROES.find(h=>h.slug===s.hero);
function getSkills(h){let remote=fullData?.heroes?.find(x=>x.slug===h.slug);return remote?.skills||h.skills||[];}
const ominousEffect=()=>({applied:0});const truncToOneDecimal=x=>Math.trunc((x+1e-10)*10)/10;
${parts}
return {pickedTracked,buildCalcData};
`);
const options={base:3,crown:false,stone:false,ring:0,eventMultiplier:1,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30};
const calc=(slugs,mods={})=>createRuntime(slugs.map(slug=>({type:'six',hero:slug,skills:mods[slug]||{}})),HEROES,SKILL_RATES,null,{...options}).buildCalcData();
test('31 six-stars include all eight collaboration heroes with unique slugs and 11 skills',()=>{
assert.equal(HEROES.length,31);assert.equal(new Set(HEROES.map(h=>h.slug)).size,31);
for(const slug of slugs){const h=HEROES.find(x=>x.slug===slug);assert.ok(h,slug);assert.equal(h.skills.length,11);assert.equal(h.skills.filter(s=>s.unlockAt===30).length,1);assert.equal(h.skills.every(s=>Number.isInteger(s.abilityId)),true);}
});
test('Strong Greed III ability 303001061 contributes 15% without aliasing displayed name',()=>{
const h=HEROES.find(x=>x.slug==='chilchack');assert.equal(h.skills.find(x=>x.abilityId===303001061).name,'強欲Ⅲ');
const res=calc(['chilchack']);assert.equal(res.greedSum,15);assert.equal(res.greed.length,1);assert.equal(res.greed[0].key,'貪欲 III');
});
test('Thistle Greed II evolves to 9% while base is 8%',()=>{
assert.equal(calc(['thistle']).greedSum,8);
assert.equal(calc(['thistle'],{thistle:{'貪欲 II':{up:true}}}).greedSum,9);
});
test('Three new Forbidden Gatekeeper III users contribute 15% each',()=>{
for(const slug of ['marcille','mithrun','thistle']){const r=calc([slug]);assert.equal(r.forbidden.reduce((sum,x)=>sum+x.amount,0),15);assert.equal(r.total,3.4);}
assert.equal(calc(['marcille','mithrun','thistle']).forbidden.reduce((sum,x)=>sum+x.amount,0),45);
});
test('Original rate formulas and browser storage keys remain intact',()=>{
assert.deepEqual(SKILL_RATES['貪欲 III'].levels,[5,7,9,11,13,15]);
for(const key of ['hero-layout-phase1-v1','hero-layout-phase1-v17-calc'])assert.ok(app.includes(key));
});
