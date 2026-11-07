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
test('all P1-P3 fixed abilities have explicit icon files or original legacy icon mappings',()=>{
 const legacy=fs.readFileSync(path.join(root,'Bond30/js/data.js'),'utf8');
 const JSONdata=JSON.parse(legacy.slice(legacy.indexOf('window.DFCH_DATA=')+17).replace(/;\\s*$/,''));
 const extra=Object.keys(manifest.iconMappings);
 const icons=new Set([...Object.keys(JSONdata.images),...extra]);
 const five=require('../Recruit/collab-318-hero-templates.json');
 for(const hero of five.fiveStar)for(const id of hero.fixed)assert.ok(icons.has(String(id)),String(id));
 const adapter=fs.readFileSync(path.join(root,'Recruit/collab-318-adapter.js'),'utf8');
 const found=adapter.match(/,fixed=(\\{.*?\\});\\nconst keys=/s);
 assert.ok(found,'embedded six-star fixed templates are present');
 const fixed=JSON.parse(found[1]);
 for(const abilities of Object.values(fixed))for(const id of abilities)assert.ok(icons.has(String(id)),String(id));
});

test('website renders new images without changing old nine-pool files',()=>{
 const html=fs.readFileSync(path.join(root,'Recruit/index.html'),'utf8');
 assert.match(html,/collab-318-visuals.js/);assert.match(html,/collab-318-adapter.js/);
 const app=fs.readFileSync(path.join(root,'Recruit/app.js'),'utf8');assert.match(app,/hero-.*?\.png/);
});
