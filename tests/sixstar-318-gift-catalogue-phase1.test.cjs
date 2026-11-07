'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=require('../data/hero-preferences.json');
const collabIds=[70,71,72,73,74,75,80,81];
const expectedLiked={
  305001028:[71],
  305001029:[71,73],
  305001030:[70],
  305001031:[73,75],
  305001032:[71,73],
  305001033:[70],
  305001034:[72,74],
  305001035:[70,75],
  305001036:[74,75],
  305001037:[72,74],
  305001038:[72,74],
  305001039:[70,71,72,73,74,75]
};
test('native 23 shared gifts are distinct from globally shared 7',()=>{
  assert.equal(data.heroes.length,31);
  assert.deepEqual(data.commonFavorite,[305000020,305000021,305000022,305000023,305000024,305000025,305000026]);
  assert.equal(data.nativeCommonFavorite.length,19);
  assert.equal(data.collabGiftIds.length,12);
  assert.equal(data.collabGiftPreferenceSource.pathId,77043);
  for(const h of data.heroes.filter(h=>!collabIds.includes(h.index)))
    for(const id of data.nativeCommonFavorite)
      assert.ok(h.favorite.includes(id),h.index+' native favorite '+id);
  for(const id of data.collabGiftIds){
    assert.ok(data.nativeCommonFavorite.includes(id));
    assert.equal(data.bondGains.baseValues[id],id===305001039?50:40);
  }
});
test('3.18 official normal-exception list produces exactly 25 liked and 71 normal collaboration pairs',()=>{
  let likedCount=0,normalCount=0;
  for(const [idStr,likedHeroIds] of Object.entries(expectedLiked)){
    const giftId=Number(idStr);
    const exceptions=collabIds.filter(index=>!likedHeroIds.includes(index));
    assert.deepEqual(data.collabGiftExceptionNormal[giftId],exceptions,'source exceptions '+giftId);
    for(const index of collabIds){
      const hero=data.heroes.find(h=>h.index===index),isLiked=likedHeroIds.includes(index);
      assert.equal(hero.favorite.includes(giftId),isLiked,'favorite '+index+' '+giftId);
      assert.ok(!hero.loved.includes(giftId),'not loved '+index+' '+giftId);
      if(isLiked)likedCount++;else normalCount++;
    }
  }
  assert.equal(likedCount,25);assert.equal(normalCount,71);
});
test('the redundant collaboration summary is removed; gift preferences stay in hero cards',()=>{
  const view=fs.readFileSync(path.join(root,'hero-preferences-view.js'),'utf8');
  assert.doesNotMatch(view,/hero-collab-gifts|renderCollabGifts|collabGiftList/);
  assert.match(view,/data\.nativeCommonFavorite\|\|data\.commonFavorite/);
  assert.match(view,/h\.favorite\.filter\(id=>!shared\.has\(id\)\)/);
  const mithrun=data.heroes.find(h=>h.index===80);
  assert.ok(mithrun);
  assert.deepEqual(mithrun.loved,[]);
  assert.deepEqual(mithrun.favorite,data.commonFavorite);
  assert.match(view,/mithrunNote/);
  const untranslated=data.items.find(x=>x.id===305001039);
  assert.equal(untranslated.translations.zh_tw,'');
  assert.equal(untranslated.translations.ja,'ウロボロス鍋');
  for(const p of ['index.html','heroes.html']){
    const html=fs.readFileSync(path.join(root,p),'utf8');
    assert.match(html,/id="heroCommonGifts"/);
    assert.match(html,/hero-preferences-view\.js\?v=2\.9\.2/);
  }
});
