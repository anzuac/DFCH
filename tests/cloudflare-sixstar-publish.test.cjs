'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const build=get('scripts/build-heroes-pages.cjs');
function guideManifest(){
  const match=build.match(/const guideFiles\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match,'Cloudflare guide file manifest exists');
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
}
test('Cloudflare Pages copies the 23-hero modal JavaScript, CSS and public data',()=>{
  const manifest=guideManifest();
  for(const asset of [
    'sixstar-abilities.js',
    'sixstar-abilities.css',
    'data/sixstar-visible-abilities.json',
  ]){
    assert.ok(fs.existsSync(path.join(root,asset)),asset+' exists');
    assert.ok(manifest.has(asset),asset+' is copied to dist-heroes');
  }
  assert.match(build,/fs\.mkdirSync\(path\.dirname\(destination\),\s*\{\s*recursive:\s*true\s*\}\)/);
  assert.match(build,/fs\.copyFileSync\(path\.join\(repoRoot,\s*relativePath\),\s*destination\)/);
});
test('Every locally referenced Cloudflare guide script and stylesheet is published',()=>{
  const manifest=guideManifest();
  const html=get('heroes.html');
  const refs=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="\.\/([^"?]+)(?:\?[^"]*)?"/g)].map(x=>x[1]);
  assert.ok(refs.length>=6);
  for(const file of refs)assert.ok(manifest.has(file),file+' is in the Pages whitelist');
  assert.match(get('sixstar-abilities.js'),/\.\/data\/sixstar-visible-abilities\.json/);
  assert.ok(manifest.has('data/sixstar-visible-abilities.json'));
});
test('Cloudflare homepage is built from the guide which includes the 23-hero modal',()=>{
  assert.match(build,/fs\.readFileSync\(path\.join\(repoRoot,'heroes\.html'\),'utf8'\)/);
  assert.match(get('heroes.html'),/sixstar-abilities\.js\?v=1\.5\.1/);
  assert.match(get('heroes.html'),/sixstar-abilities\.css\?v=1\.1\.0/);
});

function teamManifest(){
  const match=build.match(/const teamFiles\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match,'Cloudflare team file manifest exists');
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
}
test('Cloudflare Pages publishes every local team skill PNG used by the lineup',()=>{
  const manifest=teamManifest();
  const app=get('team/js/app.js');
  const localPNGs=[...new Set([...app.matchAll(/['"]\.\/assets\/([a-zA-Z0-9-]+\.png)['"]/g)].map(m=>'team/assets/'+m[1]))];
  assert.ok(localPNGs.length>=5,'Five locally hosted ability icons should be detected');
  for(const asset of ['team/assets/303001033.png','team/assets/303001115.png'])assert.ok(localPNGs.includes(asset),asset+' referenced by app');
  for(const asset of localPNGs){
    assert.ok(fs.existsSync(path.join(root,asset)),asset+' has valid source path');
    assert.ok(manifest.has(asset),asset+' MUST be in Cloudflare publish whitelist');
  }
  assert.match(build,/for \(const relativePath of teamFiles\)/);
});
