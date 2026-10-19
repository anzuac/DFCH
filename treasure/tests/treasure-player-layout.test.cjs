'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const html=read('index.html'),css=read('style.css'),js=read('app.js');
test('reward grid constrains viewport to exactly five visible rows per device size',()=>{
 assert.match(css,/grid-auto-rows:var\(--loot-cell-height\)/);
 assert.match(css,/max-height:calc\(var\(--loot-cell-height\)\*5 \+ var\(--loot-cell-gap\)\*4\)/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/--loot-cell-height:56px;--loot-cell-gap:6px/);
 assert.match(html,/id="lootGrid"[^>]+tabindex="0"/);
 assert.ok(!js.includes('MAX_ORDINARY_TILES'));
 assert.ok(!js.includes("ordinary[0].remove()"));
});
test('player panel and disabled Top 3 placeholder contain no fake live ranking data',()=>{
 for(const id of ['playerNickname','bestNormal','bestSpecial','bestJackpots'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/世界幸運榜 · TOP 3/);
 assert.match(html,/尚未連接排行榜/);
 assert.match(html,/此處僅保留世界前三名版位/);
 assert.ok(!js.includes('fetch('));
 assert.match(js,/recordPersonalBest\(stage\)/);
 assert.match(js,/sanitizeProfile/);
});
