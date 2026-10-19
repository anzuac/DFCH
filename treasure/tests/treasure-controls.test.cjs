'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');const html=read('index.html'),js=read('app.js'),css=read('style.css');
test('single opening mode, tap/hold and optional skip only',()=>{
 for(const id of ['openOnce','skipAnimation','liveDropProgress','resultPanel'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const forbidden of ['特殊續開','batchCount','openBatch','mode-option','playerNickname','bestNormal','bestSpecial','世界幸運榜']) {
  assert.ok(!html.includes(forbidden),'Unexpected UI '+forbidden);
 }
 assert.match(js,/E.createOpening\(MINIMUM,Math.random\)/);
 assert.match(js,/E.addStats\(stats,stage\)/);
 assert.ok(!js.includes('E.simulateBatch('));
 assert.match(css,/touch-action:none/);
});
test('hold is sequential per full chest and stops after pointer release',()=>{
 assert.match(js,/const HOLD_DELAY_MS=420/);
 assert.match(js,/const REVEAL_INTERVAL_MS=105/);
 assert.match(js,/nextChestTimer=setTimeout/);
 assert.ok(!js.includes('setInterval('));
 for(const ev of ['pointerdown','pointerleave','visibilitychange','blur','contextmenu'])assert.ok(js.includes("addEventListener('"+ev+"'"),ev);
 for(const ev of ['pointerup','pointercancel'])assert.ok(js.includes("'"+ev+"'"),ev);
 assert.match(js,/finishAnimationImmediately/);
 assert.ok(!js.includes('fetch('));
});
