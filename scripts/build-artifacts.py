"""After extract-map-tables.py; extract v2 artifact inputs from official 3.16.0."""
import json,struct,hashlib
from pathlib import Path
import UnityPy
root=Path('DFCH');tables=Path('research/tables')
load=lambda n:json.loads((tables/(n+'.json')).read_text())
ids=[301009049,301005025,301005015,301009040,301008114,301005007]
loc={r['key']:r.get('zh_tw') or r.get('ja') for name in ['localize_master','localize_master2'] for r in load(name)}
artifacts=[{**next(r for r in load('ArtifactTable') if r['rewardId']==id),'name':loc.get('r-name-'+next(r for r in load('ArtifactTable') if r['rewardId']==id)['key'])} for id in ids]
artifacts[0]['name']='觀緣眼鏡' # existing UI translation; official zh_tw is blank
raw=next(o.get_raw_data() for o in UnityPy.load('research/assets/bin/Data/datapack.unity3d').objects if o.path_id==76116 and o.type.name=='MonoBehaviour')
n=struct.unpack_from('<i',raw,28)[0];p=(32+n+3)//4*4
assert struct.unpack_from('<i',raw,p)[0]==1
id,ability,group=struct.unpack_from('<iii',raw,p+4);assert p+16==len(raw) and ability==10510
rows=[r for r in load('ExpeditionDropItemSampleTable') if r['dropItemSampleGroupId']==group]
rewards=[{**r,'name':loc.get('r-name-'+r['key']),'sourceTable':'UniqueSoldierInheritanceStatusTable'} for r in load('UniqueSoldierInheritanceStatusTable') if r['rewardId'] in {x['rewardId'] for x in rows}]
data={'gameVersion':'3.16.0','artifacts':artifacts,'bossBonus':{'id':id,'requiredAbilityType':ability,'dropItemSampleGroupId':group},'dropSamples':rows,'dropEffects':[r for r in load('ExpeditionDropEffectSampleTable') if r['dropEffectGroupId'] in {x['dropEffectGroupId'] for x in rows}],'rewardMasters':rewards}
(root/'data/artifacts.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(root/'artifact-data.js').write_text('window.DFCHArtifactData = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'docs/evidence/v2-artifact-source.json').write_text(json.dumps({'bossBonusPathId':76116,'sha256':hashlib.sha256(raw).hexdigest(),'artifactIds':ids,'extraDropRows':len(rows)},indent=2)+'\n')
print('Official artifacts:',len(artifacts),'boss bonus rows:',len(rows))
