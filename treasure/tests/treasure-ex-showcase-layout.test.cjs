'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const practice=read('index.html');
const challenge=read('challenge/index.html');
const shared=read('style.css');
const archivedChallengeJs=read('challenge/app.js');

test('practice-only prize cards preserve full-width EX and A/B/C row',()=>{
  const pg=practice.slice(practice.indexOf('<div class="prize-grid">'),practice.indexOf('<details class="ordinary-drawer"'));
  assert.ok(pg.indexOf('prize-ex ultimate-prize-card')>=0);
  assert.ok(pg.indexOf('prize-ex ultimate-prize-card')<pg.indexOf('prize-a'));
  assert.equal((pg.match(/<article class="prize-card prize-/g)||[]).length,4);
  assert.match(shared,/\.prize-grid>\.ultimate-prize-card,/);
  assert.match(shared,/grid-column:1\/-1;/);
  assert.match(shared,/\.prize-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(shared,/@media\(max-width:510px\)[\s\S]*?\.prize-grid>\.ultimate-prize-card/);
});
test('EX practice image, rate, points and C rate are preserved; honorary titles removed',()=>{
  assert.match(practice,/class="prize-art ultimate-prize-art"[^>]*>\s*<img[^>]+prize-ex\.gif/);
  assert.match(practice,/id="ultimateRate">0\.0000324%/);
  assert.match(practice,/data-score-type="EX">＋350,000 分/);
  assert.match(practice,/0\.00015<small>%<\/small>/);
  for(const name of ['prize-a.png','prize-b.png','prize-c.png'])assert.ok(practice.includes(name),name);
  for(const name of ['prizeEXChampion','prizeEXDiscoverer','prizeCChampion'])assert.ok(!practice.includes('id="'+name+'"'));
  assert.match(practice,/style\.css\?v=1\.6\.3/);
});
test('challenge route is a notice and cannot execute archived challenge JS',()=>{
  assert.match(challenge,/正式挑戰暫停開放/);
  assert.match(challenge,/href="\.\.\//);
  assert.ok(!challenge.includes('src="./app.js'));
  assert.ok(!challenge.includes('src="../auth.js'));
  assert.ok(!challenge.includes('id="challengeOpen"'));
  assert.match(archivedChallengeJs,/api\('reveal'/);
});
