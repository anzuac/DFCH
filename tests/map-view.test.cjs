const assert=require('node:assert/strict');
class Element {
  constructor(){this.children=[];this.textContent='';this.handlers={};}
  append(...items){this.children.push(...items);}
  appendChild(item){this.append(item);return item;}
  replaceChildren(){this.children=[];}
  insertRow(){const row=new Element();this.append(row);return row;}
  insertCell(){return this.insertRow();}
  createTHead(){return this.insertRow();}
  createTBody(){return this.insertRow();}
  addEventListener(type,fn){this.handlers[type]=fn;}
  text(){return this.textContent+this.children.map(c=>c.text()).join('\n');}
}
const ids=Object.fromEntries(['mapSelect','mapExplored100','mapDataTables','mapDataDetails','mapDataTitle','mapDataSummary','mapExplorationSummary'].map(id=>[id,new Element()]));
ids.mapSelect.value='stage_1';ids.mapExplored100.checked=false;
global.document={getElementById:id=>ids[id],createElement:()=>new Element()};
global.window={};require('../expedition-rules.js');require('../map-data.js');require('../map-view.js');
assert.equal(window.DFCHMapConfig.completionRate,0);
assert.ok(ids.mapDataTables.text().includes('羈絆道具：米維克威茲 外緣部'));
for (const name of ['琥珀色的蜂蜜','獵人的煙斗葉','發光蘑菇']) assert.ok(ids.mapDataTables.text().includes(name));
assert.ok(ids.mapDataTables.text().includes('16.326531%'));
assert.equal((ids.mapDataTables.text().match(/尚未達標/g)||[]).length,15);
assert.ok(ids.mapDataTables.text().includes('角色生命低於 90%'));
assert.ok(!/requiredAbilities|GemBonusRate|100150|303000704|ItemDrop/.test(ids.mapDataTables.text()));
ids.mapExplored100.checked=true;ids.mapExplored100.handlers.change();
assert.equal(window.DFCHMapConfig.completionRate,100);
assert.equal((ids.mapDataTables.text().match(/探索完成：排除/g)||[]).length,3);
assert.ok(ids.mapDataTables.text().includes('鑽石增益區域獎勵'));
assert.equal((ids.mapDataTables.text().match(/尚未達標/g)||[]).length,0);
assert.ok(ids.mapExplorationSummary.text().includes('15 項'));
ids.mapSelect.value='stage_2';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('水鳥的羽毛'));
assert.ok(ids.mapDataSummary.text().includes('1800 秒'));
assert.ok(ids.mapDataTables.text().includes('海姆達爾的手環'));
ids.mapSelect.value='stage_3';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('毒霧陷阱'));
assert.ok(ids.mapDataTables.text().includes('禁斷的永環石'));
ids.mapSelect.value='stage_4';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('物理陷阱'));
assert.ok(ids.mapDataSummary.text().includes('5400 秒'));
ids.mapSelect.value='stage_5';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('冥府的漂流木'));
assert.ok(ids.mapDataSummary.text().includes('7200 秒'));
ids.mapSelect.value='stage_6';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('強力物理陷阱'));
assert.ok(ids.mapDataSummary.text().includes('10800 秒'));
ids.mapSelect.value='stage_hard';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('火焰陷阱'));
assert.ok(ids.mapDataSummary.text().includes('32400 秒'));
ids.mapSelect.value='stage_atli';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,false);
assert.ok(ids.mapDataTables.text().includes('解鎖決戰魔王遠征地點'));
assert.ok(ids.mapDataSummary.text().includes('21600 秒'));
ids.mapSelect.value='stage_uw';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,true);
assert.equal(ids.mapDataDetails.hidden,true);
console.log('Chinese map view and 100% exploration toggle checks passed');
