const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/hero-preferences.json'),'utf8'));
test('3.18.0 bond gifts preserve 23 native shared favorites while documenting collaboration exceptions',()=>{
  assert.equal(data.heroes.length,31);
  assert.deepEqual(data.commonFavorite.slice(0,7),[305000020,305000021,305000022,305000023,305000024,305000025,305000026]);
  assert.equal(data.commonFavorite.length,7);assert.equal(data.nativeCommonFavorite.length,19);
  for(let id=305001028;id<=305001039;id++)assert.ok(data.nativeCommonFavorite.includes(id));
  assert.equal(data.items.length,46);
  assert.equal(new Set(data.items.map(x=>x.id)).size,44);
  for(let id=305001028;id<=305001039;id++){
    const item=data.items.find(x=>x.id===id);
    assert.ok(item,'Missing 3.18.0 gift '+id);
    assert.ok(item.name&&item.translations.ja,'Missing gift name '+id);
    assert.ok(fs.statSync(path.join(root,'assets/gifts/'+id+'-upright.png')).size>0,'Missing image '+id);
  }
});
test('browser gift data mirrors the JSON without changing the 23 original heroes',()=>{
  const ctx={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'hero-preferences-data.js'),'utf8'),ctx);
  assert.equal(JSON.stringify(ctx.window.DFCHHeroPreferences),JSON.stringify(data));
});
