const {test}=require('node:test'),assert=require('node:assert/strict');
test('shared views are incremented atomically and unavailable bindings fail gracefully',async()=>{
 const worker=(await import('../cloudflare/guide-worker.mjs')).default,{DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(':memory:');
 const env={GUIDE_STATS:{prepare:sql=>sql,batch:async queries=>queries.map(sql=>({results:db.prepare(sql).all()}))},ASSETS:{fetch:async()=>new Response('asset')}};
 const req=(url='https://dfch.pages.dev/api/guide-views',method='POST')=>new Request(url,{method,headers:{Origin:new URL(url).origin}});
 assert.equal((await (await worker.fetch(req(),env)).json()).views,1);
 assert.equal((await (await worker.fetch(req(),env)).json()).views,2);
 assert.equal((await worker.fetch(req(),{})).status,503);
 assert.equal((await worker.fetch(req(undefined,'GET'),env)).status,405);
 await worker.fetch(req('https://preview.dfch.pages.dev/api/guide-views'),env);
 assert.equal(db.prepare('SELECT views FROM guide_stats').get().views,2);
 assert.equal(await (await worker.fetch(req('https://dfch.pages.dev/heroes'),env)).text(),'asset');db.close();
});
