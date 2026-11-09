'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const app=read('team/js/app.js'),data=read('team/js/data.js');
const html=read('team/index.html'),css=read('team/css/style.css');
const rates=data.slice(data.indexOf('const SKILL_RATES='),data.indexOf('const OFFLINE_TRACKED='));
const calcSource=app.slice(app.indexOf('function buildCalcData(){'),app.indexOf('function showSkillRows('));
const calculate=new Function('settings','skills',
 rates+"const calcSettings=settings;const pickedTracked=()=>skills;const EXTRA_CHEST_SKILL_RATES={};const canonicalSkillName=x=>x;"+
 "const ominousEffect=()=>({applied:0});const truncToOneDecimal=n=>Math.trunc((n+1e-10)*10)/10;"+
 calcSource+"return buildCalcData();");
const settings={base:3,abyssBase:1,crown:true,stone:true,abyssCrown:true,ring:0,eventMultiplier:1,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30,windAshEnabled:false,windSoldiers:0};
test('new abyss calculation uses shared bonuses and Freya 1212 exactly once',()=>{
 const a=calculate(settings,[]);
 assert.equal(a.total,6.6);
 assert.equal(a.abyssTotal,4.4);
 assert.equal(a.abyssArtifactFactor,4.4);
 assert.equal(a.abyssSpecific,0);
 const base=calculate(settings,[{name:'深淵世界的解放者',owner:'弗雷雅',up:false}]);
 assert.equal(base.total,7.2);
 assert.equal(base.abyssSpecific,5);
 assert.equal(base.abyssTotal,5);
 const evolved=calculate(settings,[{name:'深淵世界的解放者',owner:'弗雷雅',up:true}]);
 assert.equal(evolved.abyssSpecific,7);
 assert.equal(evolved.abyssTotal,5.2);
 const ring=calculate({...settings,ring:3},[{name:'深淵世界的解放者',up:false}]);
 assert.equal(ring.abyssTotal,5.2);
 assert.equal(ring.total,7.4);
 const campaign=calculate({...settings,eventMultiplier:1.5},[{name:'深淵世界的解放者',up:false}]);
 assert.equal(campaign.abyssTotal,7.5);
 assert.equal(campaign.total,10.8);
 const noCrown=calculate({...settings,abyssCrown:false},[]);
 assert.equal(noCrown.abyssTotal,2.2);
 assert.equal(noCrown.total,6.6);
});
test('mobile inputs and PC right-side inputs edit shared persisted settings',()=>{
 for(const id of ['mobileGuardBaseInput','mobileAbyssBaseInput','abyssCrownToggle'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(app,/\['mobileGuardBaseInput','base'\],\['mobileAbyssBaseInput','abyssBase'\]/);
 assert.match(app,/\['baseInput','base'\],\['abyssBaseInput','abyssBase'\]/);
 assert.match(app,/calcSettings\[key\]=n;saveCalcSettings\(\);renderStats\(\)/);
 assert.match(app,/calcSettings\.abyssCrown=v\.abyssCrown===true/);
 assert.match(app,/const calcStoreKey='hero-layout-phase1-v17-calc'/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/\.hero-party-public \.boss-config-desktop\{display:none\}/);
 for(const item of ['artifact-guard','artifact-abyss','artifact-mobile-common','artifact-greed'])assert.ok(html.includes(item));
});
test('dual Boss tabs drive same enlarged rate panel and preserve original other stats',()=>{
 assert.match(app,/let activeBossTab='guard'/);
 assert.match(app,/function gameRateMarkup\(d,forPopup=false,kind='guard'\)/);
 assert.match(app,/gameRateMarkup\(buildCalcData\(\),true,activeBossTab\)/);
 assert.match(app,/data-boss-tab="guard"/);
 assert.match(app,/data-boss-tab="abyss"/);
 assert.match(app,/aria-controls="bossRatePanel"/);
 assert.match(app,/const abyssTotal=abyssBeforeEventTruncated\*eventFactor/);
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const specialBossTotal=specialBoss\.reduce/);
 assert.match(app,/const greedSum=greed\.reduce/);
 assert.match(app,/initMobileRateBarVisibility\(\);initArtifactSettings\(\);draw\(\)/);
});
test('mobile fixed footer has four rates and hides beside full stats',()=>{
 for(const key of ['guard','abyss','greed','special'])assert.ok(html.includes('data-mobile-rate="'+key+'"'));
 assert.match(app,/abyss:pct\(d\.abyssTotal\)/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.mobile-rate-bar\.is-context-hidden\{display:none\}/);
 assert.match(html,/v1\.6\.10<\/span>/);
 assert.match(html,/app\.js\?v=1\.6\.9/);
 assert.match(html,/style\.css\?v=1\.6\.9/);
});
