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
  const rolls=[0,0.00011,0.0001502,0.999,0.99];let i=0;
  const result=challengeGenerate(()=>rolls[i++]);
  assert.equal(JSON.stringify(result),JSON.stringify(['A','B','C','UR']));
  assert.equal(challengeScore(result),103550);
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
});
test('no challenge URL appears on the Cloudflare homepage',()=>{
  const home=fs.readFileSync(path.join(repo,'cloudflare/home.html'),'utf8');
  assert.ok(!home.includes('/treasure/challenge/'));
});
