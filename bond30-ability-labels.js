/* 名稱依 APK 3.16.1 UniqueSoldierAbilityTable 的能力鍵整理，中文皆為暫譯，非官方繁中。 */
(() => {
"use strict";
const keys = Object.create(null);
const add = (id,key) => { keys[id] = key; };
const range = (start,count,base,level=1) => { for(let i=0;i<count;i++)add(start+i,base+"_"+(i+level)); };
[
[303000000,"sp_guard"],[303000001,"sp_reduce"],[303000002,"sp_recovery_1"],
[303000003,"hp_recovery"],[303000004,"long_life_span"],[303000005,"sp_up_1"],
[303000006,"hp_sp_recovery"],[303000007,"sp_recovery_2"],[303000008,"moodmaker_1"]
].forEach(([id,key])=>add(id,key));
const buffBase=[
"atk_up_buf_soldier_unique","atk_up_buf_archer_unique","atk_up_buf_socerer_unique",
"atk_up_buf_all_unique","hp_up_buf_soldier_unique","hp_up_buf_archer_unique",
"hp_up_buf_socerer_unique","hp_up_buf_all_unique"];
for(let level=1;level<=4;level++)for(let i=0;i<8;i++)add(303000100+(level-1)*8+i,buffBase[i]+"_"+level);
add(303000135,"atk_up_buf_all_unique_5");
add(303000139,"hp_up_buf_all_unique_5");
range(303000200,5,"double_attack");
range(303000205,2,"healthy_body");
range(303000209,2,"great_eater");
add(303000251,"armouring");
add(303000300,"iaigiri");
range(303000310,3,"deadly_slash");
add(303000313,"coercion");
range(303000314,2,"ironclad");
add(303000316,"invincible_steel");
add(303000319,"cover_1");
add(303000321,"miles_guardian");
range(303000401,3,"boss_hunter");
range(303000404,3,"headshot");
range(303000407,5,"double_arrow");
range(303000412,4,"range_up");
add(303000416,"prestige_of_divine_archer");
add(303000500,"sp_attack_socerer");
range(303000501,3,"magic_of_annihilation");
add(303000504,"academy_magic");
add(303000505,"academy_magic_advanced");
add(303000506,"magic_guard");
add(303000507,"academy_magic_special_grade");
range(303000509,2,"magic_spread");
add(303000511,"magic_of_annihilation_4");
range(303000600,2,"faith");
range(303000602,2,"unique_tap_atk_up");
add(303000604,"add_food_1");
add(303000607,"forbidden_magic_1");
range(303000700,2,"gem_hunter");
range(303000702,2,"emerald_hunter");
range(303000704,2,"treasure_hunt");
range(303000706,2,"treasure_hunt_advanced");
add(303000708,"treasure_hunt_rare_up");
add(303000709,"boss_drop_up_1");
add(303000710,"treasure_hunt_illusion_up");
add(303000711,"gem_hunter_3");
add(303000712,"emerald_hunter_3");
add(303000713,"treasure_quest");
add(303000714,"treasure_quest_advanced");
range(303000715,2,"event_jewel_hunter");
range(303000718,2,"special_jewel_hunter");
range(303000720,2,"holy_grade_jewel_hunter");
add(303000722,"boss_drop_up_2");
range(303000723,2,"treasure_hunt_special");
range(303000725,2,"holy_night_treasure");
range(303000728,2,"all_jewel_hunter");
range(303000800,3,"book_exp_up");
add(303000803,"quest_master");
add(303000804,"bounty_hunter");
add(303000805,"good_at_business");
add(303000900,"secret_up_1");
range(303000901,2,"warp");
add(303000903,"secret_up_2");
add(303000906,"collector_1");
range(303000913,2,"soldier_cost_type");
add(303000915,"archer_cost_type_1");
add(303000919,"all_cost_type_1");
const zh = {
sp_guard:"SP 防護",sp_reduce:"SP 消耗減少",sp_recovery:"SP 回復",hp_recovery:"HP 回復",
long_life_span:"長壽",sp_up:"SP 上限提升",hp_sp_recovery:"HP 與 SP 回復",moodmaker:"氣氛營造者",
atk_up_buf_soldier_unique:"戰士攻擊增益",atk_up_buf_archer_unique:"弓兵攻擊增益",atk_up_buf_socerer_unique:"魔法師攻擊增益",
atk_up_buf_all_unique:"全體攻擊增益",hp_up_buf_soldier_unique:"戰士 HP 增益",hp_up_buf_archer_unique:"弓兵 HP 增益",
hp_up_buf_socerer_unique:"魔法師 HP 增益",hp_up_buf_all_unique:"全體 HP 增益",
double_attack:"雙重攻擊",healthy_body:"健康體魄",great_eater:"大胃王",armouring:"裝甲",
iaigiri:"居合斬",deadly_slash:"致命斬擊",coercion:"威壓",ironclad:"鐵壁",invincible_steel:"無敵之鋼",
cover:"掩護",miles_guardian:"里程守護者",boss_hunter:"首領獵人",headshot:"要害射擊",
double_arrow:"雙箭",range_up:"射程增加",prestige_of_divine_archer:"神射手威望",
sp_attack_socerer:"法師 SP 攻擊",magic_of_annihilation:"殲滅魔法",academy_magic:"學院魔法",
academy_magic_advanced:"高級學院魔法",academy_magic_special_grade:"特級學院魔法",
magic_guard:"魔法防護",magic_spread:"魔法擴散",faith:"信仰",unique_tap_atk_up:"點擊攻擊提升",
add_food:"糧食增加",forbidden_magic:"禁忌魔法",gem_hunter:"寶石獵人",emerald_hunter:"綠寶石獵人",
treasure_hunt:"尋寶",treasure_hunt_advanced:"高級尋寶",treasure_hunt_rare_up:"稀有尋寶增益",
treasure_hunt_illusion_up:"夢幻尋寶增益",boss_drop_up:"首領掉落增益",treasure_quest:"寶藏委託",
treasure_quest_advanced:"高級寶藏委託",event_jewel_hunter:"活動寶石獵人",special_jewel_hunter:"特殊寶石獵人",
holy_grade_jewel_hunter:"神聖級寶石獵人",holy_night_treasure:"聖夜寶藏",
all_jewel_hunter:"全寶石獵人",treasure_hunt_special:"特殊尋寶",book_exp_up:"圖鑑經驗提升",
quest_master:"委託達人",bounty_hunter:"賞金獵人",good_at_business:"商業高手",
secret_up:"隱藏發現提升",warp:"傳送",collector:"收集家",soldier_cost_type:"戰士成本降低",
archer_cost_type:"弓兵成本降低",all_cost_type:"全體成本降低"
};
const roman=["","I","II","III","IV","V","VI","VII","VIII"];
const labels = Object.create(null);
for (const [id,key] of Object.entries(keys)) {
  const match=key.match(/^(.*)_(\d+)$/);
  const base=match?match[1]:key;
  const suffix=match?" "+(roman[+match[2]]||String(match[2])):"";
  labels[id]=(zh[base]||base.split("_").join(" "))+suffix;
}
window.DFCHBond30AbilityLabels=Object.freeze(labels);
window.DFCHBond30AbilityKeys=Object.freeze(keys);
})();
