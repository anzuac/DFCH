'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'team/index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'team/js/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'team/css/style.css'),'utf8');
test('official verified six-star ability image paths and inclusion in the card filter',()=>{
 assert.match(app,/'潮騷的加護':'\.\.\/Bond30\/assets\/icons\/303001033\.png'/);
 assert.match(app,/'古代魔法的知識':'\.\.\/Recruit\/images\/collab-318\/303001115\.png'/);
 assert.match(app,/key==='潮騷的加護'\|\|key==='古代魔法的知識'/);
 assert.match(app,/getSkills\(h\)\.filter\(x=>tracked\(x.name\)\)/);
});
test('mobile footer is compact, read-only, and updates from the same calculated values',()=>{
 assert.match(html,/id="mobileRateBar"/);
 for(const key of ['guard','greed','special'])assert.match(html,new RegExp('data-mobile-rate="'+key+'"'));
 assert.match(app,/guard:pct\(d\.total\),greed:'\+'\+pct\(d\.greedSum\),special:'\+'\+pct\(d\.specialBossTotal\)/);
 assert.match(app,/updateMobileRateBar\(d\)/);
 assert.match(css,/\.mobile-rate-bar\{display:none\}/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/position:fixed;left:0;right:0;bottom:env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/body\.hero-party-public\{padding-bottom:calc\(52px \+ env\(safe-area-inset-bottom,0px\)\)\}/);
});
test('existing calculations and settings stay unchanged',()=>{
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const greedSum=greed\.reduce/);
 assert.match(app,/const specialBossTotal=specialBoss\.reduce/);
 assert.match(app,/const windAshRate=calcSettings\.windAshEnabled\?/);
});
