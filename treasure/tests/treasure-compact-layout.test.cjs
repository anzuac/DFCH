'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const html=read('index.html'),js=read('app.js'),css=read('style.css');

test('N–UR drawer defaults closed; all five gem assets and weights remain in the DOM',()=>{
  assert.match(html,/<details class="ordinary-drawer" id="ordinaryRewards">/);
  assert.doesNotMatch(html,/<details class="ordinary-drawer" id="ordinaryRewards" open/);
  assert.match(html,/ordinary-summary/);
  assert.match(html,/普通獎勵 N～UR/);
  assert.match(html,/99\.98493%/);
  assert.match(html,/暫訂比例，非官方數據/);
  for(const [type,weight] of [['n',50],['r',30],['sr',15],['ssr',4],['ur',1]]){
    assert.match(html,new RegExp('tier-'+type+'[^>]*>[\\s\\S]*?rarity-'+type+'\\.webp[^>]*>[\\s\\S]*?<strong>'+weight+'</strong>'));
  }
  assert.equal((html.match(/class="tier-gem"/g)||[]).length,5);
  assert.equal((html.match(/class="tier-points"/g)||[]).length,5);
});

test('draw panel is compact; checkbox appears before rate; crossed-out blocks are removed',()=>{
  for(const removed of ['class="retention-bar"','class="chance-interpretation"','id="probPerRun"','class="skip-animation"'])
    assert.ok(!html.includes(removed),removed);
  assert.match(html,/<input type="checkbox" id="skipAnimation">/);
  assert.ok(html.indexOf('id="skipAnimation"')<html.indexOf('class="chance-pill"'));
  assert.match(css,/\.sim-heading-actions/);
  assert.match(css,/\.skip-check input/);
  assert.match(js,/skipButton\.checked=skipAnimation/);
  assert.match(js,/skipButton\.addEventListener\('change'/);
  assert.ok(!js.includes("skipButton.setAttribute('aria-pressed'"));
});

test('score slots are explicit placeholders, never pretend to be scored official draws',()=>{
  assert.equal((html.match(/data-score-type=/g)||[]).length,8);
  assert.equal((html.match(/積分待設定/g)||[]).length,8);
  assert.match(html,/id="lastPoints"[^>]*>本次練習積分：待設定（不計入排行榜）/);
  assert.match(html,/id="openOnce"/);
  assert.match(html,/id="lootGrid"/);
  assert.match(html,/id="stats-heading"/);
  assert.match(js,/E\.createOpening\(MINIMUM,Math\.random\)/);
  assert.match(js,/E\.addStats\(stats,stage\)/);
  assert.ok(!js.includes('fetch('));
});
