const assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../data/hero-preferences.json'),source=require('../docs/evidence/hero-preferences-source.json');global.window={};require('../hero-preferences-data.js');assert.deepEqual(window.DFCHHeroPreferences,data);
assert.equal(data.heroes.length,23);assert.equal(source.evidence.tableRows,64);assert.equal(data.commonFavorite.length,6);
const names=new Map(data.items.map(r=>[r.id,r.name]));assert.equal(names.size,data.items.length);assert.ok(data.items.every(r=>r.name.trim()));
for(const h of data.heroes){
 const raw=source.heroes.find(r=>r.index===h.index);assert.equal(raw.rarity,5);
 const expected={favorite:[],loved:[]};
 for(const item of source.items){assert.equal(item.exceptionLovedUniqueIndices.length+item.exceptionFavoriteUniqueIndices.length+item.exceptionNormalUniqueIndices.length,0);
  const pref=item.commonPreference||(raw.lovedInheritanceIds.includes(item.rewardId)?3:raw.favoriteInheritanceIds.includes(item.rewardId)?2:1);
  if(pref===3)expected.loved.push(item.rewardId);if(pref===2)expected.favorite.push(item.rewardId);
 }
 assert.deepEqual(h.loved,expected.loved);assert.deepEqual(h.favorite,expected.favorite);assert.ok(h.loved.every(id=>!h.favorite.includes(id)));
 assert.ok([...h.loved,...h.favorite].every(id=>names.has(id)));assert.ok(h.name&&h.title);
}
const idunn=data.heroes.find(h=>h.index===13),water=data.heroes.find(h=>h.index===22);assert.equal(idunn.name,water.name);assert.notEqual(idunn.title,water.title);assert.deepEqual(idunn.loved,[305001003]);assert.deepEqual(water.loved,[305001016]);assert.equal(data.heroes.filter(h=>h.nameLanguage==='ja').length,2);
console.log('Hero preferences: all 23 source mappings, six common favorites, distinct variants, localization and browser data parity passed');
