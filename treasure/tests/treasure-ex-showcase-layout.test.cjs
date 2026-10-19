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
const local=read('challenge/style.css');
const app=read('challenge/app.js');

test('EX is visually first, full width, and the only first-row card in both modes',()=>{
  const pg=practice.slice(practice.indexOf('<div class="prize-grid">'),practice.indexOf('<details class="ordinary-drawer"'));
  const cg=challenge.slice(challenge.indexOf('<div class="challenge-prize-grid">'),challenge.indexOf('<p class="challenge-note"'));
  assert.ok(pg.indexOf('prize-ex ultimate-prize-card')>=0);
  assert.ok(pg.indexOf('prize-ex ultimate-prize-card')<pg.indexOf('prize-a'));
  assert.ok(cg.indexOf('rare-ex ultimate-prize-card')>=0);
  assert.ok(cg.indexOf('rare-ex ultimate-prize-card')<cg.indexOf('rare-a'));
  assert.equal((pg.match(/<article class="prize-card prize-/g)||[]).length,4);
  assert.equal((cg.match(/class="challenge-prize rare-/g)||[]).length,4);
  assert.match(shared,/\.prize-grid>\.ultimate-prize-card,/);
  assert.match(shared,/\.challenge-prize-grid>\.ultimate-prize-card\{/);
  assert.match(shared,/grid-column:1\/-1;/);
  assert.match(local,/\.challenge-prize-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test('both EX hero cards display media on left, ranking and discovery details on right',()=>{
  assert.match(practice,/class="prize-art ultimate-prize-art"[^>]*>\s*<img[^>]+prize-ex\.gif/);
  assert.match(challenge,/class="ultimate-prize-art"><img[^>]+prize-ex\.gif/);
  for(const [html,labels] of [
    [practice,['ultimateRate','prizeEXName','prizeEXChampion','prizeEXDiscoverer']],
    [challenge,['exRate','exPrizeName','exChampion','exDiscoverer']]
  ]){
    assert.ok(html.includes('class="ultimate-prize-info"')||html.includes('class="prize-details ultimate-prize-info"'));
    for(const id of labels)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'missing or duplicate '+id);
  }
  assert.match(challenge,/class="ultimate-prize-points">＋350,000 分/);
  assert.match(challenge,/id="exRate">\?\?\?<\/strong>/);
  assert.match(app,/\$\('exRate'\)\.textContent=data\.ultimate\?\.unlocked\?'0\.0000324%':'\?\?\?'/);
  assert.match(shared,/\.ultimate-prize-card \.ultimate-prize-art/);
  assert.match(shared,/@media\(max-width:510px\)[\s\S]*?\.prize-grid>\.ultimate-prize-card/);
});

test('A/B/C remain side by side, and client artwork, scores, and honor IDs are unchanged',()=>{
  for(const name of ['prize-a.png','prize-b.png','prize-c.png']){
    assert.ok(practice.includes(name));
    assert.ok(challenge.includes(name));
  }
  for(const [id,type] of [['prizeCChampion','C'],['prizeEXChampion','EX']]){
    assert.ok(practice.includes('id="'+id+'"'),type+' leaderboard label');
  }
  assert.match(shared,/\.prize-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(local,/@media\(max-width:510px\)[\s\S]*?\.challenge-prize-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(practice,/style\.css\?v=1\.6\.1/);
  assert.match(challenge,/\.\.\/style\.css\?v=1\.6\.1/);
  assert.match(challenge,/style\.css\?v=1\.1\.2/);
  assert.match(challenge,/app\.js\?v=1\.1\.2/);
});
