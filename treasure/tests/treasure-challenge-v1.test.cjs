'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const repo=path.resolve(__dirname,'../..');
const backend=fs.readFileSync(path.join(repo,'cloudflare/treasure-challenge.mjs'),'utf8');
const source=backend.replace('export async function handleTreasureChallengeRequest','async function handleTreasureChallengeRequest')+
  '\nthis.CHALLENGE_TEST={challengeScore,challengeGenerate,challengeTaiwanDay};';
const sandbox={Intl,Date,Number,Object,Math,JSON,Uint32Array};
vm.runInNewContext(source,sandbox);
const {challengeScore,challengeGenerate,challengeTaiwanDay}=sandbox.CHALLENGE_TEST;
test('server-side prize boundaries match unchanged practice-engine jackpot odds',()=>{
  const rolls=[0,0.00011,0.0001502,0.0001516,0.999,0.99];let i=0;
  const result=challengeGenerate(()=>rolls[i++]);
  assert.equal(JSON.stringify(result),JSON.stringify(['A','B','C','EX','UR']));
  assert.equal(challengeScore(result),453550);
});
test('one challenge chest terminates on a failed continuation check',()=>{
  const rolls=[.5,.5,.5,.5,.99];let i=0;
  const result=challengeGenerate(()=>rolls[i++]);
  assert.equal(result.length,4);
  assert.equal(challengeScore(result),4);
});
test('Taipei daily quota switches at local midnight, not UTC midnight',()=>{
  assert.equal(challengeTaiwanDay(new Date('2026-10-19T15:59:59Z')),'2026-10-19');
  assert.equal(challengeTaiwanDay(new Date('2026-10-19T16:00:00Z')),'2026-10-20');
});
test('server selects full reward list but API returns only revealed prefix',()=>{
  assert.match(backend,/WHERE \(SELECT COUNT\(\*\) FROM treasure_challenge_runs/);
  assert.match(backend,/CREATE UNIQUE INDEX IF NOT EXISTS idx_treasure_challenge_active/);
  assert.match(backend,/revealed_count=\?/);
  assert.match(backend,/rewards\.slice\(0,count\)/);
  assert.match(backend,/INSERT OR IGNORE INTO treasure_official_draws/);
  assert.match(backend,/WHERE player_id=\? AND id=\? AND revealed_count=\? AND completed_at IS NULL/);
  assert.match(backend,/url\.hostname!=='dfch\.pages\.dev'/);
  assert.match(backend,/INSERT OR IGNORE INTO treasure_ultimate_discovery/);
  assert.match(backend,/json_each\(c\.rewards_json\)/);
  assert.match(backend,/challengePublicSnapshot/);
  assert.match(backend,/CHALLENGE_POOL=0\.999848176/);
});
test('no challenge URL appears on the Cloudflare homepage',()=>{
  const home=fs.readFileSync(path.join(repo,'cloudflare/home.html'),'utf8');
  assert.ok(!home.includes('/treasure/challenge/'));
});

test('challenge page has separate login, mobile two-column rankings and tap/skip controls',()=>{
  const page=fs.readFileSync(path.join(repo,'treasure/challenge/index.html'),'utf8');
  const js=fs.readFileSync(path.join(repo,'treasure/challenge/app.js'),'utf8');
  const css=fs.readFileSync(path.join(repo,'treasure/challenge/style.css'),'utf8');
  const build=fs.readFileSync(path.join(repo,'scripts/build-heroes-pages.cjs'),'utf8');
  for(const id of ['challengeOpen','challengeGrid','dailyRemaining','rankTotal','rankBest',
    'rankToggle','challengeJackpot','treasureNicknameDialog','treasureLogin']){
    assert.ok(page.includes('id="'+id+'"'),'Missing challenge element '+id);
  }
  assert.match(page,/href="\.\.\/" class="challenge-mode-link"/);
  assert.match(page,/id="challengeSkip"/);
  for(const prize of ['終極瓶子','史詩鏡子','皆傳牌子','終極大獎 EX'])assert.ok(page.includes(prize),prize);
  assert.ok(page.includes('id="exDiscoverer"'));
  assert.ok(page.includes('id="exRate"'));
  assert.ok(page.includes('prize-ex.gif'));
  assert.match(js,/prizeImages=\{A:/);
  assert.ok(!js.includes('holdDelay'));
  assert.ok(!js.includes("addEventListener('pointerdown'"));
  assert.match(js,/skip\.addEventListener\('click',\(\)=>step\(true\)\)/);
  assert.match(js,/open\.addEventListener\('click',\(\)=>step\(false\)\)/);
  assert.match(js,/api\('start',\{requestId:crypto\.randomUUID\(\),fast\}\)/);
  assert.match(js,/api\('reveal',\{id:previous\.id,expectedCount:previous\.revealedCount,fast\}\)/);
  assert.ok(!js.includes('Math.random'));
  assert.ok(!js.includes('setInterval('));
  assert.match(css,/challenge-ranking-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:510px\)/);
  assert.match(build,/treasure\/challenge\/index\.html/);
});
