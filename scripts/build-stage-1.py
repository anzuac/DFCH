import json,hashlib
from pathlib import Path
load=lambda n:json.loads(Path('research/tables/'+n+'.json').read_text())
master=next(r for r in load('ExpeditionDungeonTable') if r['dungeonId']==1001)
samples=[r for r in load('ExpeditionEventSampleTable') if r['limitedDungeonId'] in [-1,1001]]
templates=[r for r in load('ExpeditionEventSampleTemplateTable') if r['limitedDungeonId'] in [-1,1001]]
ids={r['logEventId'] for r in samples+templates};seq=[r for r in load('ExpeditionEventSequenceTable') if r['logEventId'] in ids]
completion=[r for r in load('ExpeditionCompletionRateRewardTable') if r['expeditionDungeonId']==1001]
groups=set(master['basicItemDropSampleGroupIds']+master['bossDropSampleGroupIds']+[master['basicBattleDropSampleGroupId']])-{0}
groups|={int(r['args'][0]) for r in seq if r['functionType'] in [7,9]}
groups|={r['referenceId'] for r in completion if r['rewardType']==5}
zoneDungeons=[r for r in load('ExpeditionDungeonTable') if r['dungeonId']==9901]
groups|={g for d in zoneDungeons for g in d['basicItemDropSampleGroupIds'] if g>0}
drops=[r for r in load('ExpeditionDropItemSampleTable') if r['dropItemSampleGroupId'] in groups]
monsterGroups={master['basicBattleMonsterGroupId'],master['bossBattleGroupId']}|{r['referenceId'] for r in completion if r['rewardType']==3}
monsters=[r for r in load('ExpeditionMonsterSampleTable') if r['battleEventId'] in monsterGroups]
flags=[r for r in load('ExpeditionFlagUnlockEventSampleTable') if r['flagUnlockEventSampleGroupId'] in master['basicFlagUnlockSampleGroupIds']]
effectIDs={r['dropEffectGroupId'] for r in drops+flags};effects=[r for r in load('ExpeditionDropEffectSampleTable') if r['dropEffectGroupId'] in effectIDs]
rewardIDs={r['rewardId'] for r in drops}|set(master['limitedRewardIds']);rewardMasters=[]
for n in ['CurrencyTable','MaterialTable','EquipTable','ArtifactTable','OtherRewardTable','ChestSampleTable','PotionTable','UniqueSoldierInheritanceStatusTable']:
 rewardMasters += [{**r,'sourceTable':n} for r in load(n) if r['rewardId'] in rewardIDs]
local={r['key']:r['zh_tw'] for n in ['localize_master','localize_master2','localize_monster','localize_expedition'] for r in load(n)}
for r in rewardMasters:r['name']=local.get('r-name-'+r['key']) or local.get(r.get('chestNameKey','')) or r['key']
byid={r['rewardId']:r for r in rewardMasters}
for r in drops:r['rewardName']='無掉落' if r['rewardId']==-1 else byid.get(r['rewardId'],{}).get('name',str(r['rewardId']))
monsterIDs={r['monsterId'] for r in monsters};monsterNames=[]
for r in load('MonsterParamTable'):
 if r['index'] in monsterIDs:
  monsterNames.append({k:r[k] for k in ['index','key','isBoss','isSecret']})
  monsterNames[-1]['name']=local.get('monster-name-'+r['key']) or local.get('chara-name-'+r['key']) or r['key']
keys={r[k] for rows in [samples,templates,seq,effects,flags] for r in rows for k in r if ('Key' in k or k=='flavorKey') and isinstance(r[k],str) and r[k]}
localized={k:v for k,v in local.items() if k in keys or k.startswith('expedition-dungeon-') and 'stage_1' in k or k.startswith('expedition-') and any(x in k.lower() for x in keys)}
# Reward IDs follow the aligned key string in serialized RewardBase.
import struct,re
abilityRaw=Path('research/mb-76192.bin').read_bytes()
abilityNames={}
for abilityId in {a for row in templates for a in row['requiredAbilities'] if a}:
 matches=[]
 pos=0
 while True:
  pos=abilityRaw.find(struct.pack('<i',abilityId),pos)
  if pos<0:break
  for q in range(max(0,pos-128),pos-3,4):
   length=struct.unpack_from('<i',abilityRaw,q)[0]
   if 0<length<120 and (q+4+length+3)//4*4==pos:
    key=abilityRaw[q+4:q+4+length].decode('ascii',errors='ignore')
    if re.fullmatch(r'[a-zA-Z0-9_ -]+',key):matches.append((key,q))
  pos+=4
 assert matches and len(set(matches))==1,(abilityId,matches)
 key,q=matches[0]
 # Reuse the checked RewardBase/EquipMaster field decoder for official auto-naming.
 # Schemas are serialized once by the extraction script.
 schemas=json.loads(Path('research/reward-name-schemas.json').read_text())
 rawpos=q
 def val(kind):
  global rawpos
  if kind=='str':
   n=struct.unpack_from('<i',abilityRaw,rawpos)[0];rawpos+=4
   value=abilityRaw[rawpos:rawpos+n].decode();rawpos=(rawpos+n+3)//4*4;return value
  if kind=='bool':value=bool(abilityRaw[rawpos]);rawpos=(rawpos+4)//4*4;return value
  fmt='q' if kind=='long' else 'i';value=struct.unpack_from('<'+fmt,abilityRaw,rawpos)[0];rawpos+=struct.calcsize(fmt);return value
 fieldsForName={k:val(kind) for k,kind in schemas}
 namekey=fieldsForName['baseKey'] or key
 label=local.get('r-name-'+namekey) or {'sab_bountiful_harvest':'大豐收','sab_grand_feast':'盛宴'}.get(namekey)
 assert label,(abilityId,namekey)
 number=fieldsForName['numbering']
 abilityNames[str(abilityId)]=label+(f' {number}' if fieldsForName['autoNaming'] and number>0 else '')
x={'schemaVersion' :1,'gameVersion':'3.16.0','name':local['expedition-dungeon-name-stage_1'],'master':master,'referenceDungeon':next(r for r in load('MainDungeonTable') if r['dungeonId']==master['referenceDungeonId']),'zoneDungeons':zoneDungeons,'collectorMasters':[r for r in load('UniqueSoldierAbilityTable-full') if r['key'] in ['sab_collector_1','sab_collector_2','sab_collector_3']],'affectionAbilityTypes':[r for r in load('AbilityTypeMasterTable') if r['key'] in [10512,10513]],'simulationPolicy':{'combat':'instant-victory','combatDurationSeconds':0,'preserveEncounter':True,'preserveVictoryRewards':True,'skipAttackSpeedAndDamage':True,'eventReplayImplemented':False},'abilityNames':abilityNames,'eventSamples':samples,'conditionalTemplates':templates,'eventSequences':seq,'completionRewards':completion,'dropSamples':drops,'dropEffects':effects,'flagUnlockSamples':flags,'monsterSamples':monsters,'monsterNames':monsterNames,'rewardMasters':rewardMasters,'buffs':load('ExpeditionBuffTable'),'buffEffects':load('ExpeditionBuffEffectTable'),'enums':load('enums'),'localization':localized,'notes':['原始 float32 以可回讀數值保留，weight 不是百分比。','條件式模板只有符合能力、進度與其他條件時才加入；不可全部無條件抽選。','部分事件由官方程式動態生成，不會出現在序列表；完整重播尚未接入。','寶箱內容權重與遠征取得寶箱權重屬於不同抽選階段。']}
Path('DFCH/data').mkdir(exist_ok=True)
s=json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n';Path('DFCH/data/stage-1.json').write_text(s)
Path('DFCH/map-data.js').write_text('window.DFCHMapData = '+s.rstrip()+';\n')
print('bytes',len(s.encode()),'counts',{k:len(x[k]) for k in ['eventSamples','conditionalTemplates','eventSequences','completionRewards','dropSamples','monsterSamples','rewardMasters']})
print('unresolved rewards',rewardIDs-set(byid)-{-1})
for r in monsterNames:print(r)
