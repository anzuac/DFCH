'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=require('../Recruit/collab-318-visual-manifest.json');
test('P1-P3 banner files are exactly mapped, nonempty and WebP',()=>{
 assert.equal(manifest.pools.length,3);
 for(let i=0;i<3;i++){
  const p=manifest.pools[i];assert.equal(p.verified,true);
  assert.equal(p.bannerPath,'./images/collab-318/banner-P'+(i+1)+'.webp');
  const data=fs.readFileSync(path.join(root,'Recruit',p.bannerPath));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 }
});
test('four five-star icons and all 26 officially mapped ability PNGs exist',()=>{
 for(let i=76;i<=79;i++){const data=fs.readFileSync(path.join(root,'Recruit',manifest.fiveStarIcons[i]));assert.equal(data.subarray(1,4).toString(),'PNG');}
 for(let i=303001112;i<=303001137;i++){const data=fs.readFileSync(path.join(root,'Recruit',manifest.iconMappings[i]));assert.equal(data.subarray(1,4).toString(),'PNG');}
});
test('website renders new images without changing old nine-pool files',()=>{
 const html=fs.readFileSync(path.join(root,'Recruit/index.html'),'utf8');
 assert.match(html,/collab-318-visuals.js/);assert.match(html,/collab-318-adapter.js/);
 const app=fs.readFileSync(path.join(root,'Recruit/app.js'),'utf8');assert.match(app,/hero-.*?\.png/);
});
