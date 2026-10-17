'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('team/js/app.js');
const css=read('team/css/style.css');
const i18n=read('team/js/i18n.js');
const html=read('team/index.html');

const start=app.indexOf('\n <section class="statpanel"><h4>貪欲・寶箱加成</h4>');
const end=app.indexOf('\n <section class="statpanel"><h4>技能加成明細</h4>',start);
const view=app.slice(start,end);
const meterStart=app.indexOf('function greedDisplay(value){');
const meterEnd=app.indexOf('function renderStats(){',meterStart);
const pct=n=>n+'%';
const {greedMeter:meter,greedDisplay}=new Function('enc','pct',app.slice(meterStart,meterEnd)+'return {greedMeter,greedDisplay};')(s=>s,pct);
const render=new Function('d','pct','greedMeter','greedDisplay','return '+String.fromCharCode(96)+view+String.fromCharCode(96)+';');

test('Compact four-group card shows no misleading combined drop percentage',()=>{
 const sample={greedSum:15,greedCircuitTotal:40,greedMirrorTotal:15,ominous:{applied:10},greedArtifactTotal:65,greedCombined:80};
 const result=render(sample,pct,meter,greedDisplay);
 assert.match(result,/英靈貪欲<\/span>\s*<strong class="greed-hero-value">\+15%<\/strong>/);
 assert.match(result,/回路組<\/span><strong>\+40%<\/strong>/);
 assert.match(result,/欲望之鏡<\/span><strong>\+15%<\/strong>/);
 assert.match(result,/不祥迴路<\/span><strong>\+10%<\/strong>/);
 assert.equal((result.match(/class="greed-meter greed-meter-/g)||[]).length,4);
 assert.match(result,/style="width:15%"/);
 assert.match(result,/style="width:40%"/);
 assert.doesNotMatch(result,/greedTotal|搭配加成合計|\+80%/);
 assert.doesNotMatch(result,/每滿 100%|80%：|100%：必定|354|355|358|359|AbilityManager/);
});
test('Hero greed displays raw totals with a capped meter and an over-limit hint',()=>{
 assert.deepEqual(greedDisplay(100),{over:false,fill:100});
 assert.deepEqual(greedDisplay(103),{over:true,fill:100});
 assert.match(meter('英靈貪欲',125,'hero'),/style="width:100%"/);
 assert.match(meter('英靈貪欲',125,'hero'),/<strong>\+125%<\/strong>/);
 assert.match(meter('英靈貪欲',0,'hero'),/style="width:0%"/);
 assert.match(meter('回路組',125,'circuit'),/style="width:100%"/);
 const sample={greedSum:103,greedCircuitTotal:40,greedMirrorTotal:15,ominous:{applied:9}};
 const rendered=render(sample,pct,meter,greedDisplay);
 assert.match(rendered,/class="greed-result greed-over-limit"/);
 assert.match(rendered,/class="greed-hero-value">\+103%<\/strong>/);
 assert.match(rendered,/已超過 100% 門檻（超出/);
 assert.match(rendered,/<strong>3%<\/strong>/);
 assert.doesNotMatch(render({...sample,greedSum:100},pct,meter,greedDisplay),/greed-excess-note/);
});
test('Expanded player guide has no internal formulas and ends with in-game disclaimer',()=>{
 assert.match(view,/<details class="greed-more"><summary>詳細說明<\/summary>/);
 assert.match(view,/回路組.*壞掉的回路.*不可思議的回路/);
 assert.match(view,/進度條僅供比較各項寶箱加成/);
 assert.match(view,/<p class="greed-rule-note">實際掉落結果請以遊戲內為準。<\/p>/);
 assert.match(app,/moreWasOpen/);
 assert.doesNotMatch(view,/每滿|換算|抽選公式|AbilityType|100%：/);
 assert.doesNotMatch(html,/每滿 100|每 100%|餘數對應機率/);
});
test('Four theme colors and mobile layout support compact cards',()=>{
 for(const className of ['greed-hero','greed-artifacts','greed-artifact-card','greed-meter-track','greed-meter-fill','greed-more']){
  assert.ok(css.includes('.greed-'+className.replace(/^greed-/,'') )||css.includes('.'+className),'CSS '+className);
 }
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/--party-foreground/);
 assert.match(html,/style\.css\?v=1\.15\.9/);
 assert.match(html,/app\.js\?v=1\.15\.9/);
 assert.match(html,/i18n\.js\?v=1\.15\.9/);
});
test('Seven-language entries cover all new player-facing wording',()=>{
 const s=i18n.slice(i18n.indexOf('const entries={')+'const entries='.length,i18n.indexOf(';\nconst langs='));
 const entries=new Function('return ('+s+')')();
 const keys=['英靈貪欲','已超過 100% 門檻（超出 ','回路組','欲望之鏡','不祥迴路','各組加成',
  '英靈貪欲與神器效果分開顯示，方便查看目前搭配。',
  '「回路組」包含壞掉的回路與不可思議的回路；其他神器分別顯示。',
  '進度條僅供比較各項寶箱加成，不代表單次掉落機率。',
  '實際掉落結果請以遊戲內為準。'];
 for(const key of keys){
  assert.ok(entries[key],'Missing translation: '+key);
  assert.equal(entries[key].length,6,key);
  assert.ok(entries[key].every(Boolean),key);
 }
 assert.equal(entries['每滿 100% 多 1 個寶箱'],undefined);
});
test('Unrelated gatekeeper / greed calculations remain in their established functions',()=>{
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const greedCombined=greedSum\+greedArtifactTotal/);
 assert.match(app,/const greedCircuitTotal=calcSettings\.brokenCircuit\+\(calcSettings\.mysteriousCircuit\?30:0\)/);
});
