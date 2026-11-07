'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../Recruit/collab-318-bond-official.js');
test('four five-star special overrides match 3.18 source',()=>{
 assert.deepEqual(B.fiveStarOverrides.map(x=>[x.id,x.level,x.abilityId,x.rewardId]),[
 [76,13,303001131,411001131],[77,23,303001133,411001133],[78,23,303001135,411001135],[79,13,303001136,411001136]]);
});
test('five six-star heroes have seven source milestones and Lv30 story gate',()=>{
 for(const id of [71,72,73,74,75]){const m=B.milestones(id);assert.deepEqual(m.map(x=>x.level),[5,10,20,25,30,35,45]);assert.equal(B.unlock(id).storyConditionIndex,5);}
});
test('six-star evolution never automatically grants Lv30 unlock slot',()=>{
 for(const id of [71,72,73,74,75]){
  const skills=B.milestones(id).filter(x=>x.level!==30).map(x=>({id:x.abilityId,role:'固定'}));
  const events=B.events(id,skills);assert.equal(events.length,6);
  assert.equal(events.some(x=>x.id===B.unlock(id).abilityId),false);
 }
});
