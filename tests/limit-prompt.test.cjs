const assert=require('node:assert/strict');global.window={};for(const m of ['random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch'])require('../'+m+'.js');
const d=require('../data/stage-1.json'),B=window.DFCHSimulationBatch,opts={seed:42,multiplier:2,stamina:window.DFCHStamina.configure('unlimited'),saved:{daily:500}};
(async()=>{
 let prompts=0,saves=0;const stopped=await B.run(d,opts,{count:10,mode:'continuous',onResult:()=>saves++,onLimit:i=>{prompts++;assert.equal(i.completed,0);return false;}});assert.equal(stopped.completed,0);assert.equal(stopped.stopReason,'diamond-limit');assert.equal(saves,0);assert.equal(prompts,1);
 prompts=0;const continued=await B.run(d,opts,{count:10,mode:'continuous',onLimit:()=>{prompts++;return true;}});assert.equal(continued.completed,10);assert.equal(prompts,1);assert.equal(continued.ordinaryDiamonds,0);
 prompts=0;const saved=[];const crossed=await B.run(d,{...opts,saved:{daily:499}},{count:100,mode:'continuous',onResult:r=>saved.push(r),onLimit:i=>{prompts++;assert.equal(i.completed,1);assert.equal(saved.length,1);assert.ok(i.daily>=500);return false;}});assert.equal(crossed.completed,1);assert.equal(prompts,1);assert.equal(crossed.last,saved[0]);assert.equal(crossed.last.randomCalls,saved[0].randomCalls);
 prompts=0;const independent=await B.run(d,opts,{count:10,mode:'independent',onLimit:()=>{prompts++;return false;}});assert.equal(independent.completed,10);assert.equal(prompts,0);
 prompts=0;await B.run(d,{...opts,saved:{daily:499}},{count:1,mode:'continuous',onLimit:()=>{prompts++;return false;}});assert.equal(prompts,0);
 console.log('Cap prompt: before-start decline, one acceptance per batch, save-before-crossing pause, independent exclusion and no remaining runs passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
