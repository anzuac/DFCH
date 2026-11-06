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
  assert.match(get('heroes.html'),/sixstar-abilities\.js\?v=1\.4\.0/);
  assert.match(get('heroes.html'),/sixstar-abilities\.css\?v=1\.1\.0/);
});
