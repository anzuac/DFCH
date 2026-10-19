'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const site=read('treasure/index.html');
const js=read('treasure/app.js');
const build=read('scripts/build-heroes-pages.cjs');
const maintenance=read('treasure/challenge/index.html');

test('practice-only mode excludes all client-side login and leaderboard network activity',()=>{
  assert.match(site,/本頁為純本機練習/);
  assert.match(site,/id="openOnce"/);
  assert.match(site,/id="skipAnimation"/);
  assert.match(site,/id="statPracticePoints"/);
  assert.match(site,/id="ultimateRate">0\.0000324%/);
  assert.doesNotMatch(site,/src="\.\/auth\.js|id="treasureLogin"|id="rankTotal"|id="prizeCChampion"|href="\.\/challenge\/"/);
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|api\/treasure\/|challenge\/public/);
  assert.match(js,/E\.createOpening\(MINIMUM,Math\.random\)/);
  assert.match(js,/E\.addStats\(stats,stage\)/);
  assert.match(js,/localStorage/);
});
test('direct challenge link is static maintenance, no API script or authenticated controls',()=>{
  assert.match(maintenance,/正式挑戰暫停開放/);
  assert.match(maintenance,/href="\.\.\//);
  assert.doesNotMatch(maintenance,/<script|treasureLogin|challengeOpen|rankTotal|rankBest/);
});
test('the Pages build removes live Treasure auth and game scripts and rejects all API paths',()=>{
  const section=build.slice(build.indexOf('const treasureSiteFiles='),build.indexOf('for(const relativePath of treasureSiteFiles)'));
  assert.ok(section.includes("'treasure/index.html'"));
  assert.ok(section.includes("'treasure/challenge/index.html'"));
  assert.ok(!section.includes("'treasure/auth.js'"));
  assert.ok(!section.includes("'treasure/challenge/app.js'"));
  assert.ok(!section.includes("'treasure/challenge/style.css'"));
  const worker=build.slice(build.indexOf('// Freeze ALL Treasure endpoints'),build.indexOf('// Having a real 404 page'));
  assert.ok(worker.includes('path.startsWith("/api/treasure/")'));
  assert.ok(worker.includes('status:410'));
  assert.ok(worker.includes('"Cache-Control":"no-store"'));
  assert.ok(!worker.includes('handleTreasureChallengeRequest'));
  assert.ok(!worker.includes('handleTreasureRequest'));
  assert.ok(!worker.includes('env.TREASURE_DB'));
  assert.ok(worker.includes('dfchGuideWorker.fetch(request,env,ctx)'));
  assert.ok(!read('cloudflare/home.html').includes('/treasure/'));
});
test('old D1 schema, archived auth and challenge code remain intact for potential rebuilding',()=>{
  assert.match(read('cloudflare/treasure-schema.sql'),/CREATE TABLE IF NOT EXISTS treasure_players/);
  assert.match(read('cloudflare/treasure-schema.sql'),/treasure_ultimate_discovery/);
  assert.match(read('cloudflare/treasure-auth.mjs'),/export async function handleTreasureRequest/);
  assert.match(read('cloudflare/treasure-challenge.mjs'),/export async function handleTreasureChallengeRequest/);
});
