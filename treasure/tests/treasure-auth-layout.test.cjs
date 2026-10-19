'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const html=read('index.html');
const css=read('style.css');
const auth=read('auth.js');

test('account entry is in header rather than a large middle-of-page card',()=>{
  const header=html.slice(html.indexOf('<div class="topline">'),html.indexOf('<header class="masthead">'));
  for(const id of ['treasureLogin','treasureSignIn','treasureSignedIn','treasureAccountToggle','treasureAccountMenu','treasurePlayerName','treasureLogout']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' should be unique');
    assert.ok(header.includes('id="'+id+'"'),id+' should be in the masthead area');
  }
  assert.ok(!html.includes('treasure-auth-panel'),'old embedded login panel should be removed');
  assert.ok(css.includes('.treasure-account-menu'),'account menu has local styles');
  assert.ok(css.includes('@media(max-width:510px)'),'compact mobile header styles exist');
});

test('first-login nickname dialog remains separate from practice simulator',()=>{
  for(const id of ['treasureNicknameDialog','treasureNicknameForm','treasureNicknameInput','treasureNicknameSave','treasureNicknameLogout','treasureNicknameStatus']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
  assert.match(html,/<dialog id="treasureNicknameDialog"[^>]*aria-labelledby=/);
  assert.match(auth,/nicknameDialog\.showModal\(\)/);
  assert.match(auth,/nicknameDialog\.addEventListener\('cancel',event=>event\.preventDefault\(\)\)/);
  assert.match(auth,/if \(!player\.nickname\) openNicknameDialog\(\)/);
  assert.match(auth,/await api\('nickname',\{nickname:nicknameInput\.value\}\)/);
  assert.match(auth,/await api\('logout',\{\}\)/);
  assert.match(html,/id="openOnce"/);
  assert.match(html,/id="resultPanel"/);
  assert.match(html,/id="stats-heading"/);
  assert.ok(html.indexOf('id="resultPanel"')<html.indexOf('id="stats-heading"'));
  assert.match(html,/href="\.\/challenge\/"/);
});

test('Google nonce flow, backend identity and existing draw script are preserved',()=>{
  assert.match(auth,/const \{nonce\}=await api\('nonce'\)/);
  assert.match(auth,/client_id:clientId,nonce,auto_select:false/);
  assert.match(auth,/await api\('google',\{credential\}\)/);
  assert.match(auth,/const existing=await api\('me'\)/);
  assert.match(html,/src="\.\/engine\.js\?v=1\.6\.0"/);
  assert.match(html,/src="\.\/app\.js\?v=1\.6\.0"/);
  assert.ok(!auth.includes('official_draws'));
});
