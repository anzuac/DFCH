'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');

test('fixed A/B/C jackpot probabilities, exact residual, and provisional relative weights',()=>{
  assert.equal(E.CONFIG.continueChance,.95);
  assert.equal(E.CONFIG.prizeA,.0001);
  assert.equal(E.CONFIG.prizeB,.00005);
  assert.equal(E.CONFIG.prizeC,.0000007);
  assert.ok(Math.abs(E.GRAND_TOTAL-.0001507)<1e-15);
  assert.ok(Math.abs(E.ORDINARY_TOTAL-.9998493)<1e-15);
  assert.equal(E.WEIGHT_TOTAL,100);
  assert.deepEqual({...E.CONFIG.ordinaryWeights},{N:50,R:30,SR:15,SSR:4,UR:1});
});
test('jackpots A B C occupy disjoint adjacent intervals',()=>{
  assert.equal(E.outcome(()=>0),'A');
  assert.equal(E.outcome(()=>.000099999),'A');
  assert.equal(E.outcome(()=>.0001),'B');
  assert.equal(E.outcome(()=>.000149999),'B');
  assert.equal(E.outcome(()=>.0001500001),'C');
  assert.equal(E.outcome(()=>.0001506999),'C');
  assert.equal(E.outcome(()=>.0001507),'N');
  assert.throws(()=>E.outcome(()=>1),RangeError);
});
test('normal rarity intervals use the given ratios within residual weight pool',()=>{
  const x=E.GRAND_TOTAL,d=E.ORDINARY_TOTAL;
  assert.equal(E.outcome(()=>x+d*.25),'N');
  assert.equal(E.outcome(()=>x+d*.51),'R');
  assert.equal(E.outcome(()=>x+d*.82),'SR');
  assert.equal(E.outcome(()=>x+d*.96),'SSR');
  assert.equal(E.outcome(()=>x+d*.995),'UR');
  assert.equal(E.outcome(()=>.999999),'UR');
});
test('only standard 4-item mode exists, with 95% continuation until first failure',()=>{
  let calls=0;
  const opening=E.drawOnce(4,()=>{calls++;return .99;});
  assert.equal(opening.items,4);
  assert.equal(opening.ssr,4);
  assert.equal(opening.continuationChecks,1);
  assert.equal(opening.continueSuccess,0);
  assert.equal(calls,5);
  assert.throws(()=>E.drawOnce(11),RangeError);
  assert.throws(()=>E.createOpening(11),RangeError);
});
test('rare C can be obtained in the same chest as A and B',()=>{
  const seq=[.00001,.00011,.0001502,.5,.99];let i=0;
  const result=E.drawOnce(4,()=>seq[i++],{visibleLimit:1});
  assert.equal(result.items,4);
  assert.equal(result.a,1);assert.equal(result.b,1);assert.equal(result.c,1);
  assert.equal(result.ordinary,1);
  assert.deepEqual(result.rewards.map(r=>r.type),['A','B','C']);
});
test('per-chest theoretical mean 23 and jackpot chance includes C',()=>{
  assert.ok(Math.abs(E.theoreticalAverage(4)-23)<1e-10);
  const chance=E.theoreticalHitChance(4);
  assert.ok(chance>.00345&&chance<.00347);
  assert.equal(E.theoreticalHitChance(4,0),0);
  assert.equal(E.theoreticalHitChance(4,1),1);
  assert.throws(()=>E.theoreticalAverage(11),RangeError);
});
test('batch aggregate identities include three jackpots and five ordinary grades',()=>{
  let seed=17;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const {stats,last}=E.simulateBatch(4000,4,random,{captureLast:true});
  assert.equal(stats.runs,4000);
  assert.equal(stats.items,stats.a+stats.b+stats.c+stats.ordinary);
  assert.equal(stats.ordinary,stats.n+stats.r+stats.sr+stats.ssr+stats.ur);
  assert.equal(stats.continuationChecks,stats.continueSuccess+stats.runs);
  assert.ok(stats.items/stats.runs>21 && stats.items/stats.runs<25);
  assert.ok(last.items>=4);
});
