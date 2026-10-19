'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const auth=read('cloudflare/treasure-auth.mjs');
const build=read('scripts/build-heroes-pages.cjs');
const markup=read('treasure/index.html');

function fakeDb(){
  return {prepare(sql) {
    return {first:async()=>null};
  }};
}
function loadWorker(){
  const context=vm.createContext({
    Response,Headers,URL,TextEncoder,TextDecoder,AbortSignal,crypto:require('node:crypto').webcrypto,
    atob,btoa,fetch:async()=>{throw Error('unexpected outbound request')}
  });
  vm.runInContext(auth.replace('export async function handleTreasureRequest','async function handleTreasureRequest')
    +'\nglobalThis.testHandler=handleTreasureRequest;',context);
  return context.testHandler;
}
test('returns a disabled login configuration when Cloudflare bindings are not yet ready',async()=>{
  const handle=loadWorker();
  const url='https://dfch.pages.dev/api/treasure/auth/config';
  const request=new Request(url);
  const disabled=await handle(request,{TREASURE_DB:fakeDb()});
  assert.equal(disabled.status,200);
  const info=await disabled.json();
  assert.equal(info.enabled,false);
  assert.equal(info.clientId,null);
  assert.equal(info.officialDrawsEnabled,false);
  assert.equal(disabled.headers.get('Cache-Control'),'no-store');
});
test('ready login config only discloses public client ID, never secrets',async()=>{
  const handle=loadWorker();
  const r=await handle(new Request('https://dfch.pages.dev/api/treasure/auth/config'),
    {TREASURE_DB:fakeDb(),GOOGLE_CLIENT_ID:'example.apps.googleusercontent.com'});
  assert.equal((await r.json()).clientId,'example.apps.googleusercontent.com');
});
test('official score API stays disabled and no source path overwrites guide views',async()=>{
  const handle=loadWorker();
  const r=await handle(new Request('https://dfch.pages.dev/api/treasure/draw'),{});
  assert.equal(r.status,501);
  assert.match(build,/guide-worker\.mjs/);
  assert.match(build,/dfchGuideWorker\.fetch/);
  assert.match(build,/api\/guide-views/);
  assert.match(build,/api\/treasure\/\*/);
  assert.ok(!auth.includes('GUIDE_STATS'));
});
test('static standalone page is added to Cloudflare build without activating live scores',()=>{
  assert.match(build,/treasureSiteFiles=/);
  assert.match(build,/treasure\/auth\.js/);
  assert.match(markup,/id="treasureLogin"/);
  assert.match(markup,/id="treasureLogin"[^>]+hidden/);
  assert.match(markup,/src="\.\/auth\.js\?v=1\.5\.0"/);
  assert.match(read('treasure/auth.js'),/window\.location\.hostname !== 'dfch\.pages\.dev'/);
});
test('SQL schema is safe for repeated initialization and reserves official-score tables',()=>{
  const sql=read('cloudflare/treasure-schema.sql');
  for(const table of ['treasure_players','treasure_sessions','treasure_player_scores','treasure_official_draws'])
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS '+table));
  assert.ok(!/DROP TABLE|DELETE FROM/i.test(sql));
  assert.match(auth,/__Host-dfch_treasure_session/);
  assert.match(auth,/crypto\.subtle\.verify/);
  assert.match(auth,/SameSite=Lax/);
});
