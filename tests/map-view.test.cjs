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
global.window={};require('../map-data.js');require('../map-view.js');
assert.equal(window.DFCHMapConfig.completionRate,0);
assert.equal((ids.mapDataTables.text().match(/尚未達標/g)||[]).length,15);
assert.ok(ids.mapDataTables.text().includes('角色生命低於 90%'));
assert.ok(!/requiredAbilities|GemBonusRate|100150|303000704|ItemDrop/.test(ids.mapDataTables.text()));
ids.mapExplored100.checked=true;ids.mapExplored100.handlers.change();
assert.equal(window.DFCHMapConfig.completionRate,100);
assert.equal((ids.mapDataTables.text().match(/尚未達標/g)||[]).length,0);
assert.ok(ids.mapExplorationSummary.text().includes('15 項'));
ids.mapSelect.value='stage_2';ids.mapSelect.handlers.change();
assert.equal(ids.mapExplored100.disabled,true);
assert.equal(ids.mapDataDetails.hidden,true);
console.log('Chinese map view and 100% exploration toggle checks passed');
