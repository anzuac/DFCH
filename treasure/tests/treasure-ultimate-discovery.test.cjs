'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const backend=read('cloudflare/treasure-challenge.mjs');
const engine=require('../engine.js');
const challengeHtml=read('treasure/challenge/index.html');
const practiceHtml=read('treasure/index.html');
const build=read('scripts/build-heroes-pages.cjs');
const branchApi=backend.replace('export async function handleTreasureChallengeRequest','async function handleTreasureChallengeRequest')+
  '\nthis.treasureTests={challengeGenerate,challengeScore};';
const sandbox={Intl,Date,Number,Object,Math,JSON,Uint32Array};
vm.runInNewContext(branchApi,sandbox);
test('identical four-tier jackpot cutoffs in practice and server with 100% total distribution',()=>{
  const thresholds=[0,.000099999,.0001,.000149999,.00015,.00015149999,.0001515,.0001518239,.000151824,.5,.9999999];
  for(const roll of thresholds){
    const practice=engine.outcome(()=>roll);
    const server=sandbox.treasureTests.challengeGenerate(
      (()=>{let i=0;return ()=>++i===1?roll:.99;})()
    )[0];
    assert.equal(server,practice,'same outcome at '+roll);
  }
  assert.equal(engine.POINTS.C,100000);
  assert.equal(engine.POINTS.EX,350000);
  assert.ok(Math.abs((engine.GRAND_TOTAL+engine.ORDINARY_TOTAL)-1)<1e-15);
  assert.equal(sandbox.treasureTests.challengeScore(['A','B','C','EX']),453500);
});
test('EX first-discovery is awarded only on reveal and is immutable',()=>{
  assert.match(backend,/INSERT OR IGNORE INTO treasure_ultimate_discovery/);
  assert.match(backend,/prize_type TEXT PRIMARY KEY CHECK\(prize_type='EX'\)/);
  assert.match(backend,/json_each\(c\.rewards_json\)/);
  assert.match(backend,/j\.value='EX' AND CAST\(j\.key AS INTEGER\)<c\.revealed_count/);
  assert.match(backend,/challengePlayerSnapshot/);
  assert.match(backend,/firstDiscoverer/);
  assert.match(backend,/CHALLENGE_C_END=0\.0001515/);
  assert.match(backend,/CHALLENGE_EX_END=0\.000151824/);
  assert.match(backend,/CHALLENGE_POOL=0\.999848176/);
});
test('EX odds are concealed on screen until server confirms discovery',()=>{
  assert.match(practiceHtml,/<strong id="ultimateRate">\?\?\?<\/strong>/);
  assert.match(challengeHtml,/id="exRate">\?\?\? · \+350,000 分/);
  assert.match(read('treasure/app.js'),/data\.ultimate\?\.unlocked\?'0\.0000324%':'\?\?\?'/);
  assert.match(read('treasure/challenge/app.js'),/data\.ultimate\?\.unlocked\?'0\.0000324%':'\?\?\?'/);
  assert.match(practiceHtml,/id="prizeEXDiscoverer"/);
  assert.match(challengeHtml,/id="exDiscoverer"/);
  assert.match(practiceHtml,/id="prizeCChampion"/);
  assert.match(challengeHtml,/id="cChampion"/);
  assert.match(read('cloudflare/treasure-schema.sql'),/treasure_ultimate_discovery/);
});
test('all four authored images are present and included in Cloudflare build',()=>{
  const mappings={
    'prize-a.png':'Home page picture/icon-abyss_af_900_2.png',
    'prize-b.png':'Home page picture/icon-abyss_af_300_1.png',
    'prize-c.png':'Home page picture/%E7%A6%81%E6%96%B7%E8%A8%8E%E4%BC%90_%E5%85%8D%E8%A8%B1%E7%9A%86%E5%82%B3_%E5%8E%9F%E5%A7%8B%E5%9C%96%E7%A4%BA.png',
    'prize-ex.gif':'Home page picture/144F145D-634B-4E62-93AE-53531CCCA1E8.gif'
  };
  for(const [target,source] of Object.entries(mappings)){
    assert.ok(fs.existsSync(path.join(root,source)),'source file missing: '+source);
    assert.ok(build.includes("'"+target+"':'"+source+"'"),'not published: '+target);
    assert.ok(practiceHtml.includes('./assets/'+target));
    assert.ok(challengeHtml.includes('../assets/'+target));
  }
  assert.ok(!read('cloudflare/home.html').includes('/treasure/'));
});
