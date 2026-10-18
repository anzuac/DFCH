'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const html = readFileSync(join(__dirname,'../index.html'),'utf8');
const js = readFileSync(join(__dirname,'../app.js'),'utf8');
const css = readFileSync(join(__dirname,'../style.css'),'utf8');

test('UI only exposes tap and long-press draw; batch controls removed', () => {
  assert.match(html,/id="openOnce"/);
  assert.match(html,/id="drawControlHint"/);
  for(const forbidden of ['batchCount','openBatch','batchResult','批次模擬']) {
    assert.ok(!html.includes(forbidden),forbidden);
  }
  assert.ok(!js.includes('E.simulateBatch('));
  assert.ok(js.includes('E.drawOnce('));
  assert.ok(js.includes('E.addStats('));
});

test('long press repeats individual draws and releases on mobile interruption', () => {
  assert.match(js,/const HOLD_DELAY_MS = 420/);
  assert.match(js,/const HOLD_REPEAT_MS = 300/);
  assert.match(js,/addEventListener\('pointerdown'/);
  assert.match(js,/addEventListener\('pointerup'/);
  assert.match(js,/addEventListener\('pointercancel'/);
  assert.match(js,/addEventListener\('pointerleave'/);
  assert.match(js,/addEventListener\('visibilitychange'/);
  assert.match(js,/addEventListener\('blur'/);
  assert.match(js,/addEventListener\('contextmenu'/);
  assert.match(js,/suppressClick/);
  assert.match(css,/touch-action:none/);
});

test('world ranking remains unimplemented; local stats still persist', () => {
  assert.match(js,/localStorage/);
  assert.match(js,/persist\(\)/);
  assert.match(html,/不計入世界排行/);
  assert.ok(!js.includes('fetch('));
});
