'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const html=read('index.html');
const css=read('style.css');
const app=read('app.js');
const build=fs.readFileSync(path.resolve(__dirname,'../../scripts/build-heroes-pages.cjs'),'utf8');
const auth=read('auth.js'); // historical source remains available for the later PostgreSQL migration

test('practice page never loads Google login scripts or nickname UI',()=>{
  for(const name of ['treasureLogin','treasureSignIn','treasureSignedIn','treasureAccountToggle',
    'treasureNicknameDialog','treasureNicknameForm','treasureLogout'])
    assert.ok(!html.includes('id="'+name+'"'),'login widget still published: '+name);
  assert.ok(!html.includes('src="./auth.js'),'login script still loaded');
  assert.ok(!html.includes('href="./challenge/"'),'challenge mode still available from practice page');
  assert.match(html,/本頁為純本機練習/);
  assert.match(css,/\.practice-only-banner/);
});
test('practice rewards and local scores remain functional without database calls',()=>{
  assert.match(html,/id="openOnce"/);
  assert.match(html,/id="resultPanel"/);
  assert.match(html,/id="stats-heading"/);
  assert.match(html,/id="ultimateRate">0\.0000324%/);
  assert.ok(!app.includes('fetch('));
  assert.ok(!app.includes('challenge/public'));
  assert.match(html,/src="\.\/engine\.js\?v=1\.6\.0"/);
  assert.match(html,/src="\.\/app\.js\?v=1\.6\.3"/);
});
test('historical Google identity handling is retained in the repository but not in deployment',()=>{
  assert.match(auth,/const \{nonce\}=await api\('nonce'\)/);
  assert.match(auth,/await api\('google',\{credential\}\)/);
  assert.match(auth,/await api\('nickname',\{nickname:nicknameInput\.value\}\)/);
  assert.doesNotMatch(build,/'treasure\/auth\.js'/);
  assert.match(build,/status:410/);
});
