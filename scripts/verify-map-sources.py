"""Run after extract-map-tables.py; compare shipped data to decoded official rows."""
import json,hashlib
from pathlib import Path
root=Path('DFCH');tables=Path('research/tables')
load=lambda name:json.loads((tables/(name+'.json')).read_text())
evidence={}
for stage in [1,2,3,4,5]:
 d=json.loads((root/f'data/stage-{stage}.json').read_text());mid=d['master']['dungeonId']
 assert d['master']==next(r for r in load('ExpeditionDungeonTable') if r['dungeonId']==mid)
 mappings={'eventSamples':'ExpeditionEventSampleTable','conditionalTemplates':'ExpeditionEventSampleTemplateTable','eventSequences':'ExpeditionEventSequenceTable','completionRewards':'ExpeditionCompletionRateRewardTable','dropSamples':'ExpeditionDropItemSampleTable','dropEffects':'ExpeditionDropEffectSampleTable','flagUnlockSamples':'ExpeditionFlagUnlockEventSampleTable','monsterSamples':'ExpeditionMonsterSampleTable'}
 for key,table in mappings.items():
  source=load(table)
  for row in d[key]:assert {k:v for k,v in row.items() if k!='rewardName'} in source,(stage,key,row)
 for key,table,filterkey in [('eventSamples','ExpeditionEventSampleTable','limitedDungeonId'),('conditionalTemplates','ExpeditionEventSampleTemplateTable','limitedDungeonId'),('completionRewards','ExpeditionCompletionRateRewardTable','expeditionDungeonId')]:
  expected=[r for r in load(table) if r[filterkey] in ([-1,mid] if filterkey=='limitedDungeonId' else [mid])];assert d[key]==expected
 for key,table,groupkey in [('dropSamples','ExpeditionDropItemSampleTable','dropItemSampleGroupId'),('monsterSamples','ExpeditionMonsterSampleTable','battleEventId'),('dropEffects','ExpeditionDropEffectSampleTable','dropEffectGroupId')]:
  groups={r[groupkey] for r in d[key]};actual=[{k:v for k,v in r.items() if k!='rewardName'} for r in d[key]];assert actual==[r for r in load(table) if r[groupkey] in groups]
 evidence[f'stage_{stage}']={'dungeonId':mid,'name':d['name'],'sha256':hashlib.sha256((root/f'data/stage-{stage}.json').read_bytes()).hexdigest(),'counts':{k:len(d[k]) for k in mappings},'allIncludedRowsMatchOfficial':True}
for obj in json.loads((root/'docs/evidence/map-source-hashes.json').read_text())['objects']:
 p=Path(f"research/mb-{obj['pathId']}.bin");assert hashlib.sha256(p.read_bytes()).hexdigest()==obj['sha256']
(root/'docs/evidence/stage-5-source-check.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
print('Five maps: official row order, float values, map filters, complete included groups and source object hashes verified')
