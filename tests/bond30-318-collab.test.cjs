'use strict';const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Bond30 adds three 3.18 source pools and four five-star shapeshifters without changing legacy nine pools',()=>{
 const context={window:{}};vm.createContext(context);
 for(const p of ['Bond30/js/data.js','Recruit/collab-318-core.js'])vm.runInContext(read(p),context);
 const before=JSON.stringify(context.window.DFCH_DATA.poolRows),old=Object.keys(context.window.DFCH_DATA.poolNames);
 vm.runInContext(read('Bond30/js/collab-318.js'),context);
 const D=context.window.DFCH_DATA;assert.equal(Object.keys(D.poolNames).length,12);
 assert.deepEqual(Object.keys(D.poolNames).slice(0,9),old);
 for(const k of old)assert.equal(JSON.stringify(D.poolRows[k]),JSON.parse(before)[k]&&JSON.stringify(JSON.parse(before)[k]));
 for(const k of Object.keys(D.poolNames).slice(9))assert.equal(D.poolRows[k].length,87);
 for(const id of [76,77,78,79])assert.equal(D.heroes[id].fixed.length,5);
});
test('Bond30 renders official five-star special bond hint and uses 3.18 eligibility checks',()=>{
 const s=read('Bond30/js/app.js');assert.match(s,/collabAllowed/);assert.match(s,/specificFive\(state.hero\)/);
 const html=read('Bond30/index.html');assert.match(html,/collab-318-bond-official.js/);
});
