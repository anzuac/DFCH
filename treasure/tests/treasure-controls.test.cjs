'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const html = readFileSync(join(__dirname,'../index.html'),'utf8');
const js = readFileSync(join(__dirname,'../app.js'),'utf8');
const css = readFileSync(join(__dirname,'../style.css'),'utf8');

test('only tap/hold actions and independent skip animation button are exposed', () => {
  for(const id of ['openOnce','drawControlHint','skipAnimation','liveDropProgress','resultPanel'])
    assert.ok(html.includes('id="'+id+'"'), id);
  for(const forbidden of ['batchCount','openBatch','batchResult','批次模擬'])
    assert.ok(!html.includes(forbidden),forbidden);
  assert.ok(!js.includes('E.simulateBatch('));
  assert.ok(js.includes('E.createOpening('));
  assert.ok(js.includes('E.addStats('));
});

test('long press repeats only after previous full chest, cancels safely', () => {
  assert.match(js,/const HOLD_DELAY_MS = 420/);
  assert.match(js,/const REVEAL_INTERVAL_MS = 105/);
  assert.match(js,/function advanceOpening\(/);
  assert.match(js,/nextChestTimer = setTimeout/);
  assert.ok(!js.includes('setInterval('), 'no fixed interval can overlap chests');
  for(const evt of ["pointerdown","pointerup","pointercancel","pointerleave","visibilitychange","blur","contextmenu"])
    assert.ok(js.includes("addEventListener('"+evt+"'"),evt);
  assert.match(js,/finishAnimationImmediately/);
  assert.match(js,/if \(activeOpening \|\| holdActive \|\| activePointer !== null\) return/);
  assert.match(css,/touch-action:none/);
});

test('finished chests only persist once; leaderboard still not enabled',()=>{
  assert.match(js,/E.addStats\(stats, stage\)/);
  assert.match(js,/function finishOpening\(stage\)/);
  assert.match(js,/function updatePartial\(stage\)/);
  assert.match(js,/skipAnimation = !skipAnimation/);
  assert.match(js,/if \(skipAnimation && activeOpening\) finishAnimationImmediately\(\)/);
  assert.match(html,/不計入世界排行/);
  assert.ok(!js.includes('fetch('));
});
