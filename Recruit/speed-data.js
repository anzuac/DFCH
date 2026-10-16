/* DFCH Recruit V2.0.0 — APK 3.16.1 WalkSpd initial level (status index 2).
 * Extracted from UniquePlayerParamTable; fixedSixIds from UniqueSoldierTemplateTable.
 * First-release simulation intentionally uses Normal humanType only for random heroes;
 * Rare, OldSoldier, Genius and ability 731 are deliberately not generated here.
 * This module does not modify hero rarity, pool or skill probabilities.
 */
(() => {
  'use strict';
  const initialLevels = Object.freeze([22.799999,14.8,35.400002,13.7,21.700001,23.9,12.5,15.9,13.1,19.4,18.200001,54.799999,37.900002,58.200001,17.700001,64,31.9,41.099998,39.5,43.400002,64,24.4,53.700001,65.099998,14.5,15.4,52.5,40,52.799999,37.099998,21.299999,26.4,55.599998,44.700001,39,47.400002,19.5,38.599998,53.200001,45.5,32.599998,55.700001,27.299999,69.5,60.200001,48,37,57.799999,19.5,39.5,28,55,60,60,52,52,39.5,57.799999,60,60,65,56.5,35,40]);
  const fixedSixIds = new Set([13,16,19,21,22,23,27,32,33,34,39,43,44,45,46,47,51,52,53,54,58,59,60]);
  const f32 = Math.fround;
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const gradeLabels = ['G','F','E','D']; // Four labels independently cross-checked with APK/screenshots.
  function drawNormal(rng=Math.random) {
    const u1=clamp(Number(rng()),0,1-Number.EPSILON);
    const u2=clamp(Number(rng()),0,1-Number.EPSILON);
    return Math.sqrt(-2*Math.log(1-u1))*Math.cos(2*Math.PI*u2);
  }
  function valueFromLevel(level) {
    const L=f32(clamp(Number(level),0,99.9));
    return L<80 ? f32(f32(0.05)+f32(f32(0.00875)*L)):
      f32(f32(0.75)+f32(f32(0.0035175872035324574)*f32(L-80)));
  }
  function generate(heroIndex,star,rng=Math.random) {
    const index=Number(heroIndex);
    if(!Number.isInteger(index)||index<0||index>=initialLevels.length)return null;
    const base=f32(initialLevels[index]);
    const fixed=star===6 && fixedSixIds.has(index);
    // ChooseInitialLevel uses a standard-normal offset with clamp on its result.
    // V2.0.0: Normal humanType, no +4/+11 special-type bonuses.
    const width=f32(clamp(f32(8-f32(f32(base*4)/70)),1,8));
    const level=fixed?base:f32(clamp(f32(base+f32(f32(drawNormal(rng))*width)),0,99.9));
    const speed=valueFromLevel(level);
    const gradeIndex=Math.min(9,Math.max(0,Math.floor(level/10)));
    return {
      level, speed, display:speed.toFixed(3)+' km/s', gradeIndex,
      grade:gradeLabels[gradeIndex]||null,
      fixed, mode:fixed?'六星固定初始值':'普通類型隨機初始值'
    };
  }
  window.DFCHRecruitSpeed = Object.freeze({version:'2.0.0',initialLevels,fixedSixIds:Object.freeze([...fixedSixIds]),valueFromLevel,generate});
})();
