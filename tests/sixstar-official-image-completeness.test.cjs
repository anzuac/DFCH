'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const data=JSON.parse(read('data/sixstar-visible-abilities.json'));

test('All 23 six-star heroes have official pictures for every supported ability',()=>{
  assert.equal(data.heroes.length,23);
  const skills=data.heroes.flatMap(hero=>hero.skills);
  assert.equal(skills.length,253);
  assert.equal(Object.keys(data.icons).length,138);
  assert.equal(new Set(skills.map(skill=>skill.icon)).size,138);
  for(const skill of skills) {
    assert.ok(skill.icon,'Missing picture for '+skill.name);
    assert.ok(Object.hasOwn(data.icons,skill.icon),'Picture lookup missing for '+skill.name);
    const image=data.icons[skill.icon];
    assert.ok(
      image.startsWith('data:image/png;base64,') ||
      /^https:\/\/api\.github\.com\/repos\/anzuac\/DFCH\/git\/blobs\/[a-f0-9]{40}$/.test(image),
      'Unexpected picture source for '+skill.name
    );
  }
});

test('Every newly supplied inline official image is a nonempty, valid PNG',()=>{
  const inline=Object.values(data.icons).filter(value=>value.startsWith('data:image/png;base64,'));
  assert.ok(inline.length>=52);
  for(const dataURL of inline){
    const bytes=Buffer.from(dataURL.slice('data:image/png;base64,'.length),'base64');
    assert.ok(bytes.length>=100);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.ok(bytes.readUInt32BE(16)>0);
    assert.ok(bytes.readUInt32BE(20)>0);
    assert.ok(bytes.readUInt32BE(16)<=2048);
    assert.ok(bytes.readUInt32BE(20)<=2048);
  }
});

test('Website keeps private original names and numeric ability IDs out of public view',()=>{
  const serialized=JSON.stringify(data);
  assert.doesNotMatch(serialized,/sab_[a-z]/);
  assert.doesNotMatch(serialized,/\b30300\d{4}\b/);
  for(const h of data.heroes)for(const skill of h.skills){
    assert.ok(skill.levelEffects.every(effect=>typeof effect==='string'&&effect.trim()!==''));
  }
});

test('Both sites load the refreshed 23-hero picture data and Cloudflare publishes it',()=>{
  assert.match(read('sixstar-abilities.js'),/sixstar-visible-abilities\.json\?v=1\.3\.0/);
  for(const entry of ['index.html','heroes.html'])
    assert.match(read(entry),/sixstar-abilities\.js\?v=1\.4\.0/);
  const manifest=read('scripts/build-heroes-pages.cjs');
  assert.match(manifest,/'data\/sixstar-visible-abilities\.json'/);
  assert.match(manifest,/'sixstar-abilities\.js'/);
  assert.match(manifest,/'sixstar-abilities\.css'/);
});
