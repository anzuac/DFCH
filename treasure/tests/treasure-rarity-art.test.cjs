'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');

test('all N–UR artwork files are real local WebP assets',()=>{
  for(const tier of ['n','r','sr','ssr','ur']){
    const file=path.join(dir,'assets','rarity-'+tier+'.webp');
    const data=fs.readFileSync(file);
    assert.ok(data.length>100,'nonempty '+tier);
    assert.equal(data.toString('ascii',0,4),'RIFF',tier+' RIFF');
    assert.equal(data.toString('ascii',8,12),'WEBP',tier+' WebP');
  }
});
test('weight cards and reveal tiles use the same rarity art without altering draw engine',()=>{
  const html=read('index.html');
  const js=read('app.js');
  const build=fs.readFileSync(path.resolve(dir,'../scripts/build-heroes-pages.cjs'),'utf8');
  for(const tier of ['n','r','sr','ssr','ur']){
    assert.ok(html.includes('src="./assets/rarity-'+tier+'.webp"'),tier+' in weight cards');
    assert.ok(fs.existsSync(path.join(dir,'assets','rarity-'+tier+'.webp')),tier+' on disk');
  }
  assert.equal((html.match(/class="tier-gem"/g)||[]).length,5);
  assert.match(js,/rarityGemFiles=Object\.freeze\(\{N:'n',R:'r',SR:'sr',SSR:'ssr',UR:'ur'\}\)/);
  assert.match(js,/icon\.src='\.\/assets\/rarity-'\+rarityFile\+'\.webp'/);
  assert.match(build,/treasure\/assets\/rarity-'\+tier\+'\.webp'/);
  assert.match(html,/id="lootGrid"/);
  assert.match(html,/id="openOnce"/);
});
