const assert=require('node:assert/strict');global.window={crypto:require('node:crypto').webcrypto};require('../diamond-draw.js');const D=window.DFCHDiamondDraw;
for(let i=0;i<41;i++){const u=(i+.5)/41;assert.equal(D.simple(false,u).quantity,10+i);assert.equal(D.simple(true,u).quantity,(10+i)*2);}
assert.equal(D.simple(false,0).quantity,10);assert.equal(D.simple(false,1-Number.EPSILON).quantity,50);assert.throws(()=>D.simple(false,1),/無效/);
assert.equal(D.pick(D.tiers,0),0);assert.equal(D.pick(D.tiers,.6),1);assert.equal(D.pick(D.tiers,.94),2);assert.equal(D.pick(D.tiers,.99),3);
for(const owned of [false,true])for(let t=0;t<4;t++)assert.equal(Math.round(D.rewards(owned,t).reduce((s,r)=>s+r.weight,0)*10),1000);
assert.equal(D.roulette(false,.1,.9).quantity,30);assert.equal(D.roulette(true,.1,.1).quantity,10);
assert.deepEqual([D.roulette(true,.999,.9995).kind,D.roulette(true,.999,.9995).quantity],['goldChest',100]);
assert.equal(D.roulette(false,.95,.8945).quantity,7777);assert.equal(D.roulette(true,.999,.6485).quantity,9999);
// Verify rejection sampling: the largest uint32 must be retried for 41 outcomes.
let queue=[4294967295,0,40],calls=0;window.crypto={getRandomValues:a=>{a[0]=queue[calls++];return a;}};
assert.equal(D.simple(false).quantity,10);assert.equal(calls,2);assert.equal(D.simple(true).quantity,100);
console.log('Diamond draw: 41 equiprobable outcomes, doubling, two-stage boundaries, horn table, jackpots and unbiased crypto rejection passed');
