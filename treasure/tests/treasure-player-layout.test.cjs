'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');const html=read('index.html'),css=read('style.css'),js=read('app.js');
test('scrollable reward grid retains exactly five visible rows per breakpoint',()=>{
 assert.match(css,/grid-auto-rows:var\(--loot-cell-height\)/);
 assert.match(css,/max-height:calc\(var\(--loot-cell-height\)\*5 \+ var\(--loot-cell-gap\)\*4\)/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/--loot-cell-height:56px;--loot-cell-gap:6px/);
 assert.match(html,/id="lootGrid"[^>]+tabindex="0"/);
 assert.ok(!js.includes('ordinary[0].remove()'));
});
test('three jackpots and all five tier weights are visible, local profile and ranking are removed',()=>{
 for(const term of ['大獎 A','大獎 B','大獎 C','0.00007','99.98493%','tier-n','tier-r','tier-sr','tier-ssr','tier-ur'])assert.ok(html.includes(term),term);
 for(const term of ['PLAYER PANEL','playerNickname','bestJackpots','world-preview','世界幸運榜','特殊續開'])assert.ok(!html.includes(term),term);
 for(const term of ['statC','statN','statR','statSR','statSSR','statUR'])assert.ok(html.includes('id="'+term+'"'),term);
});
