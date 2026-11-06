'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const m=require('../Recruit/collab-318-visual-manifest.json');
const core=require('../Recruit/collab-318-core.js');
test('official P1-P3 banner assets must be verified before rendering',()=>{
 assert.deepEqual(m.pools.map(p=>p.poolId),[9,10,11]);
 for(let i=0;i<3;i++){
  const p=m.pools[i],official=core.pools[i];
  assert.equal(p.key,official.key);
  assert.deepEqual(p.expectedSixStarIds,official.sixHeroIds);
  assert.deepEqual(p.expectedFiveStarIds,official.rarityHeroGroups[2]);
  if(p.verified){assert.match(p.bannerPath,/^\.\/images\/collab-318\/[\w.-]+\.(png|webp)$/);assert.ok(p.sourceTextureName);}
  else assert.equal(p.bannerPath,null);
 }
});
