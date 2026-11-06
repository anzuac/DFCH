'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('P1-P3 do not mutate any of the original nine Recruit ability eligibility whitelists',()=>{
 const context={window:{}};vm.createContext(context);
 for(const p of ['Bond30/js/data.js','Recruit/config.js'])vm.runInContext(read(p),context);
 const legacyWhitelist=JSON.stringify(context.window.DFCHRecruitConfig.targetPlayerIndexes);
 for(const p of ['Recruit/collab-318-core.js','Recruit/collab-318-adapter.js'])vm.runInContext(read(p),context);
 assert.equal(JSON.stringify(context.window.DFCHRecruitConfig.targetPlayerIndexes),legacyWhitelist);
 assert.deepEqual(Array.from(context.window.DFCHRecruitCollab318.byId.get(303000604).targetPlayers),[1,3,4,7,28,29,31,40,41,76,77,78,79]);
});
test('new collaboration pity uses reference index 9 across P1-P3; old 9 pool values remain independent',()=>{
 const s=read('Recruit/app.js'),stats=read('Recruit/stats.js');
 assert.match(s,/state.pool>=9\?9:state.pool/);assert.match(stats,/pool>=9\?9:pool/);
 assert.match(read('Recruit/target-draw.js'),/Official five-star variant sprite pending/);
});