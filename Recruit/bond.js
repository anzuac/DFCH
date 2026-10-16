/* DFCH Recruit V2.6.0 — APK 3.16.1 affection evolution test module.
 * Five-star character-specific entries decoded from UniqueAffectionRewardOverrideTable.
 * Generic level entries: 6/13/23 normal; 35 HP; 45 attack.
 * Always select from abilities already present in the character's slots.
 * Distinguish an ability's original ID from the evolution reward's 411... ID.
 */
(() => {
  'use strict';
  const specific=Object.freeze({
  "12": {
    "13": 303001005
  },
  "15": {
    "23": 303001003
  },
  "17": {
    "23": 303001017
  },
  "18": {
    "13": 303001014
  },
  "20": {
    "6": 303001018
  },
  "24": {
    "23": 303001026
  },
  "25": {
    "13": 303001029
  },
  "26": {
    "13": 303001031
  },
  "28": {
    "23": 303001038
  },
  "29": {
    "13": 303001039
  },
  "30": {
    "6": 303000317
  },
  "31": {
    "6": 303000317
  },
  "35": {
    "6": 303001048
  },
  "36": {
    "6": 303000508
  },
  "37": {
    "23": 303001053
  },
  "38": {
    "23": 303001051
  },
  "40": {
    "6": 303001066
  },
  "41": {
    "23": 303001068
  },
  "42": {
    "13": 303001070
  },
  "48": {
    "23": 303001079
  },
  "49": {
    "23": 303001081
  },
  "50": {
    "23": 303001083
  },
  "55": {
    "23": 303001104
  },
  "56": {
    "13": 303001106
  },
  "57": {
    "13": 303001108
  },
  "61": {
    "23": 303001051
  },
  "62": {
    "23": 303001148
  },
  "63": {
    "13": 303001150
  }
});
  const generalLevels=[6,13,23];
  const attackIds=new Set([303000119,303000127]);
  const hpIds=new Set([303000123,303000131]);
  function eligible(skill){
    // Recruit/app.js role labels are assigned by the APK 3.16.1 ability choose-group.
    // The native collector checks groups 1/4 and excludes character-fixed templates.
    // Free skills are the non-template group-1 candidates; empty and required slots
    // as well as attack / HP buffs never enter general evolution.
    return skill && Number.isInteger(skill.id) && skill.role==='自由';
  }
  function decide(skills,star,heroId,rng=Math.random){
    if(!Array.isArray(skills)||star===6)return [];
    const events=[],available=[];
    skills.forEach((s,i)=>{if(eligible(s))available.push(i)});
    const fixed=specific[String(heroId)]||{};
    for(const level of generalLevels){
      const target=+fixed[level];
      if(target){
        const index=skills.findIndex(s=>s&&s.id===target);
        if(index>=0)events.push({level,slot:index,kind:'specific',id:target,source:'固定能力指定'});
      }else if(available.length){
        const r=Number(rng());const picked=Math.max(0,Math.min(available.length-1,Math.floor((Number.isFinite(r)?r:0)*available.length)));
        const index=available.splice(picked,1)[0];
        events.push({level,slot:index,kind:'normal',id:skills[index].id,source:'均勻隨機'});
      }
    }
    const hp=skills.findIndex(s=>s&&s.id!==null&&(s.role==='HP 增益'||hpIds.has(s.id)));
    if(hp>=0)events.push({level:35,slot:hp,kind:'hp',id:skills[hp].id,source:'固定類型'});
    const attack=skills.findIndex(s=>s&&s.id!==null&&(s.role==='攻擊增益'||attackIds.has(s.id)));
    if(attack>=0)events.push({level:45,slot:attack,kind:'attack',id:skills[attack].id,source:'固定類型'});
    return events.sort((a,b)=>a.level-b.level);
  }
  function sixEvents(doc,skills){
    if(!doc||!Array.isArray(doc.skills)||!Array.isArray(skills))return [];
    return doc.skills.slice(0,skills.length).flatMap((skill,i)=>{
      const level=Number(skill.evolveAt);
      if(!Number.isInteger(level)||level<1||level>50||skills[i]?.id===null)return [];
      const type=attackIds.has(skills[i]?.id)?'attack':hpIds.has(skills[i]?.id)?'hp':'specific';
      return [{level,slot:i,kind:type,id:skills[i]?.id,source:'六星固定模板',evolvedName:skill.evolvedName||''}];
    }).sort((a,b)=>a.level-b.level);
  }
  function decorate(skills,events,level){
    const cap=Math.max(0,Math.min(50,Number(level)||0));
    const picked=Array.isArray(events)?events.filter(e=>e&&e.level<=cap):[];
    return skills.map((s,i)=>{
      const event=picked.find(e=>e.slot===i);
      return {...s,bond:event||null};
    });
  }
  window.DFCHRecruitBond=Object.freeze({version:'2.6.0',specific,levels:generalLevels,decide,sixEvents,decorate,eligible});
})();
