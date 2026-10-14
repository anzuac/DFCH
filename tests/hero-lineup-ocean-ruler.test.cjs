'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('team/js/app.js');
const data=read('team/js/data.js');
const official=JSON.parse(read('data/sixstar-visible-abilities.json'));
const {HEROES,SKILL_RATES}=new Function(data+'\nreturn {HEROES,SKILL_RATES};')();
function segment(str,start,end){
 const a=str.indexOf(start),b=str.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Source function exists: '+start);
 return str.slice(a,b);
}
const runtimeSource=[
 segment(app,'function isUpgradeAllowed(slot,skillName){','\nfunction draw(){'),
 segment(app,'function pickedTracked(){','\nconst calcStoreKey='),
 segment(app,'function buildCalcData(){','\nfunction showSkillRows')
].join('\n');
const runtime=new Function('slots','HEROES','SKILL_RATES','fullData','calcSettings',`
 const hero=s=>HEROES.find(h=>h.slug===s.hero);
 function getSkills(h){const remote=fullData?.heroes?.find(x=>x.slug===h.slug);return remote?.skills||h.skills||[];}
 const ominousEffect=()=>({applied:0});
 const truncToOneDecimal=x=>Math.trunc(x*10)/10;
 ${runtimeSource}
 return {pickedTracked,buildCalcData};
`);
function calculate(heroes,fullData){
 const slots=heroes.map(slug=>({type:'six',hero:slug,skills:{}}));
 const calcSettings={base:3,crown:false,stone:false,ring:0,event:false,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30};
 return runtime(slots,HEROES,SKILL_RATES,fullData,calcSettings).buildCalcData();
}
test('Official Ocean Ruler skill is non-evolving 2/4/6/8/10% for both summer heroes',()=>{
 for(const slug of ['akasha_water','valentine_queen_water']){
  const h=official.heroes.find(x=>x.slug===slug);
  assert.ok(h,'Official hero exists: '+slug);
  const s=h.skills.find(x=>x.name==='大海的支配者');
  assert.ok(s,'Official Ocean Ruler skill: '+slug);
  assert.equal(s.baseCap,5);
  assert.equal(s.fullCap,5);
  assert.equal(s.evolveAt,null);
  assert.deepEqual(s.levelEffects.map(x=>Number(x.match(/(\d+)%/)?.[1])),[2,4,6,8,10]);
 }
 assert.deepEqual(SKILL_RATES['大海的支配者'].levels,[2,4,6,8,10]);
 assert.equal(SKILL_RATES['大海的支配者'].kind,'greed');
});
test('Offline and official catalog both count Akasha / Valentine Queen Ocean Ruler as greed',()=>{
 for(const remote of [null,official]){
  assert.equal(calculate(['akasha_water'],remote).greedSum,10);
  assert.equal(calculate(['valentine_queen_water'],remote).greedSum,10);
  assert.equal(calculate(['akasha_water','valentine_queen_water'],remote).greedSum,20);
  assert.equal(calculate(['akasha'],remote).greedSum,0);
 }
});
test('Ocean Ruler does not alter Forbidden Gatekeeper computations',()=>{
 for(const remote of [null,official]){
  assert.equal(calculate(['akasha_water'],remote).total,3.4);
  assert.equal(calculate(['akasha_water','valentine_queen_water'],remote).total,3.4);
  assert.equal(calculate(['valentine_queen_water'],remote).total,3);
 }
});
test('Card, skill picker and release bundle include original Ocean Ruler icon',()=>{
 assert.match(app,/function tracked\(name\).*?name==='大海的支配者'/);
 assert.match(app,/OFFICIAL_SKILL_ICONS=[\s\S]*?'大海的支配者':'\.\/assets\/ocean-ruler\.png'/);
 assert.match(read('scripts/build-heroes-pages.cjs'),/'team\/assets\/ocean-ruler\.png'/);
 assert.ok(fs.existsSync(path.join(root,'team/assets/ocean-ruler.png')));
});
