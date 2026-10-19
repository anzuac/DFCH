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
test('four jackpots and all five tier weights are visible, local profile and ranking are removed',()=>{
 for(const term of ['終極瓶子','史詩鏡子','皆傳牌子','終極大獎','0.00015','99.9848176%','tier-n','tier-r','tier-sr','tier-ssr','tier-ur'])assert.ok(html.includes(term),term);
 for(const term of ['PLAYER PANEL','playerNickname','bestJackpots','world-preview','世界幸運榜','特殊續開'])assert.ok(!html.includes(term),term);
 for(const term of ['statC','statEX','statN','statR','statSR','statSSR','statUR'])assert.ok(html.includes('id="'+term+'"'),term);
});
