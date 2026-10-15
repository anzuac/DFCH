'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('team/js/app.js');
const css=read('team/css/style.css');
const i18n=read('team/js/i18n.js');
const html=read('team/index.html');

test('Greed summary has an accessible expandable conversion explanation',()=>{
 assert.match(app,/<details class="greed-more">\s*<summary>詳細說明<\/summary>/);
 assert.match(app,/每滿 100% 多 1 個寶箱/);
 assert.match(app,/80%：80% 機率額外 1 個/);
 assert.match(app,/100%：必定額外 1 個/);
 assert.match(app,/150%：必定額外 1 個，再有 50% 機率多 1 個/);
 assert.match(app,/200%：必定額外 2 個/);
 assert.match(app,/250%：必定額外 2 個，再有 50% 機率多 1 個/);
 assert.doesNotMatch(app,/不同種類的額外寶箱效果合計僅供搭配比較，不代表單次掉落機率/);
 assert.match(app,/尚未驗證遊戲是否把它們合成同一次掉落判定/);
 assert.match(app,/moreWasOpen/);
});

test('All descriptions have translations in the six other UI languages',()=>{
 const keys=['詳細說明','80%：80% 機率額外 1 個','100%：必定額外 1 個',
  '150%：必定額外 1 個，再有 50% 機率多 1 個','200%：必定額外 2 個',
  '250%：必定額外 2 個，再有 50% 機率多 1 個'];
 for(const key of keys){
  const anchor=JSON.stringify(key)+':';
  const from=i18n.indexOf(anchor);
  assert.ok(from>=0,'Missing localized description: '+key);
  const match=i18n.slice(from+anchor.length).match(/^(\[[^\n]+\]),/);
  assert.ok(match,'Translation array exists for '+key);
  const variants=JSON.parse(match[1]);
  assert.equal(variants.length,6,'Six locale variants for '+key);
  assert.ok(variants.every(Boolean));
 }
});

test('Styles stay responsive and probabilities remain unchanged',()=>{
 assert.match(css,/\.hero-party-public \.greed-more-body/);
 assert.match(css,/\.hero-party-public \.greed-more summary:focus-visible/);
 assert.match(html,/\.\/js\/app\.js\?v=1\.15\.3/);
 assert.match(html,/\.\/js\/i18n\.js\?v=1\.15\.3/);
 assert.match(html,/\.\/css\/style\.css\?v=1\.15\.3/);
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const greedCombined=greedSum\+greedArtifactTotal/);
});
