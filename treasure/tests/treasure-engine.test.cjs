'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

test('configured probabilities are exact and exhaustive', () => {
  assert.equal(E.CONFIG.continueChance, .95);
  assert.equal(E.CONFIG.prizeA, .0001);
  assert.equal(E.CONFIG.prizeB, .00005);
  assert.ok(Math.abs(1 - E.CONFIG.prizeA - E.CONFIG.prizeB - .99985) < 1e-12);
});
test('prize intervals are correctly partitioned', () => {
  assert.equal(E.outcome(() => 0), 'A');
  assert.equal(E.outcome(() => .0000999), 'A');
  assert.equal(E.outcome(() => .0001), 'B');
  assert.equal(E.outcome(() => .0001499), 'B');
  assert.equal(E.outcome(() => .00015), 'ordinary');
  assert.equal(E.outcome(() => .999999), 'ordinary');
});
test('normal opening gives four guaranteed drops and can immediately stop', () => {
  let rolls = 0;
  const draw = E.drawOnce(4, () => { rolls++; return .99; });
  assert.equal(draw.items, 4);
  assert.equal(draw.ordinary, 4);
  assert.equal(draw.continueSuccess, 0);
  assert.equal(draw.continuationChecks, 1);
  assert.equal(rolls, 5); // 4 item rewards + 1 stop check
});
test('11 guaranteed rewards and exact further-continuation behavior', () => {
  let calls = 0;
  // 11 rewards, success, reward 12, success, reward 13, failure
  const sequence = [...Array(11).fill(.5), .1, .5, .9, .5, .99];
  const draw = E.drawOnce(11, () => sequence[calls++]);
  assert.equal(draw.items, 13);
  assert.equal(draw.continueSuccess, 2);
  assert.equal(draw.continuationChecks, 3);
});
test('a single opening may contain both jackpots and rare items stay visible beyond limit', () => {
  let calls = 0;
  const sequence = [.00001, .00011, .5, .5, .99];
  const draw = E.drawOnce(4, () => sequence[calls++], {visibleLimit:1});
  assert.equal(draw.a, 1);
  assert.equal(draw.b, 1);
  assert.equal(draw.ordinary, 2);
  assert.equal(draw.rewards.length, 2);
  assert.deepEqual(draw.rewards.map(x => x.number), [1, 2]);
});
test('theoretical means and win probability are mathematically consistent', () => {
  assert.ok(Math.abs(E.theoreticalAverage(4) - 23) < 1e-11);
  assert.ok(Math.abs(E.theoreticalAverage(11) - 30) < 1e-11);
  const hit = E.theoreticalHitChance(4);
  assert.ok(hit > .003 && hit < .004);
  assert.equal(E.theoreticalHitChance(4, 0), 0);
  assert.equal(E.theoreticalHitChance(4, 1), 1);
});
test('batch aggregates retain exact total identities', () => {
  let randomState = 17;
  const random = () => ((randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0) / 4294967296);
  const {stats, last} = E.simulateBatch(4000,4,random,{captureLast:true});
  assert.equal(stats.runs, 4000);
  assert.equal(stats.items, stats.a + stats.b + stats.ordinary);
  assert.equal(stats.continuationChecks, stats.continueSuccess + stats.runs);
  assert.equal(stats.normalRuns, 4000);
  assert.ok(stats.items / 4000 > 21 && stats.items / 4000 < 25);
  assert.ok(last.items >= 4 && last.rewards.length > 0);
});
