# Run from the workspace containing project_sources/ and DFCH/.
# Dependencies: UnityPy (Python). Uploaded APK/ZIP files remain outside git.
import zipfile
import UnityPy
from pathlib import Path
for archive,member in [('project_sources/06-net.room6.horizon.apk','assets/bin/Data/Managed/Metadata/global-metadata.dat'),('project_sources/07-assets.zip','assets/bin/Data/datapack.unity3d')]:
 with zipfile.ZipFile(archive) as z:
  target=Path('research')/member;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(member))
needed={76122,76123,76124,76125,76121,76120,76126,76127,76119,76103,76141,76137,76143,76196,76099,76117,76118,76112,76085,76138,76836,76838,76839,76840,76192,76081,76135,76109,76131}
env=UnityPy.load('research/assets/bin/Data/datapack.unity3d')
for obj in env.objects:
 if obj.type.name=='MonoBehaviour' and obj.path_id in needed:
  Path(f'research/mb-{obj.path_id}.bin').write_bytes(obj.get_raw_data())
import struct,json
from pathlib import Path
M=Path('research/assets/bin/Data/Managed/Metadata/global-metadata.dat').read_bytes()
def st(n):return M[892080+n:M.index(b'\0',892080+n)].decode()
types={}
for ti in range(21551):
 v=struct.unpack_from('<22I',M,14263744+ti*88);types[st(v[0])]=(ti,v)
def fields(name):
 ti,v=types[name];out=[]
 for j in range(v[8],v[8]+(v[17]&65535)):
  a=struct.unpack_from('<3I',M,11885000+j*12);out.append((st(a[0]),a[1]))
 return out
class R:
 def __init__(self,b):self.b=b;self.p=28;self.name=self.string()
 def align(self):self.p=(self.p+3)//4*4
 def read(self,f):v=struct.unpack_from('<'+f,self.b,self.p)[0];self.p+=struct.calcsize(f);return v
 def string(self):
  n=self.read('i');assert 0<=n<10000000,(self.p,n)
  s=self.b[self.p:self.p+n].decode();self.p+=n;self.align();return s
 def val(self,t):
  if t==43358:return self.string()
  if t==27036:v=bool(self.read('?'));self.align();return v
  if t==42409:return self.read('f')
  if t==46687:return [self.read('f'),self.read('f')]
  if t==30085:return self.read('d')
  if t==35422:return self.read('q')
  arrays={23983:35390,24269:42409,23828:35390,23807:35390,23998:'q',23762:'d',24330:43358,23562:35390,23678:35390,24325:35390}
  if t in arrays:
   n=self.read('i');assert 0<=n<100000
   return [self.read(arrays[t]) if arrays[t] in ('d','q') else self.val(arrays[t]) for _ in range(n)]
  return self.read('i')
 def table(self,name):
  n=self.read('i');schema=(fields('ExpeditionEventSampleMaster') if name=='ExpeditionEventSampleTemplateMaster' else [])+fields(name);rows=[{k:self.val(t) for k,t in schema} for _ in range(n)]
  assert self.p==len(self.b),(self.name,self.p,len(self.b));return rows
ids={76122:'ExpeditionDungeonMaster',76123:'ExpeditionEventSampleMaster',76124:'ExpeditionEventSampleTemplateMaster',76125:'ExpeditionEventSequenceMaster',76121:'ExpeditionDropItemSampleMaster',76120:'ExpeditionDropEffectSampleMaster',76126:'ExpeditionFlagUnlockEventSampleMaster',76127:'ExpeditionMonsterSampleMaster',76119:'ExpeditionCompletionRateRewardMaster'}
Path('research/tables').mkdir(exist_ok=True)
for i,name in ids.items():
 r=R(Path(f'research/mb-{i}.bin').read_bytes());rows=r.table(name);Path('research/tables/'+r.name+'.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(r.name,len(rows),'consumed',r.p)
# enum values from metadata literal defaults
of,sz=struct.unpack_from('<II',M,64);data,_=struct.unpack_from('<II',M,72);defaults={struct.unpack_from('<iii',M,p)[0]:struct.unpack_from('<iii',M,p)[2] for p in range(of,of+sz,12)}
def default_int(pos):
 x=M[pos]
 if x<0x80:u=x
 elif x<0xc0:u=((x&0x3f)<<8)|M[pos+1]
 elif x<0xe0:u=((x&0x1f)<<24)|(M[pos+1]<<16)|(M[pos+2]<<8)|M[pos+3]
 elif x==0xf0:u=struct.unpack_from('<I',M,pos+1)[0]
 elif x==0xfe:return -2147483648
 elif x==0xff:return -1
 else:raise ValueError(hex(x))
 return (u>>1)^-(u&1)
enums={}
for name in ['ExpeditionEventFunctionType','ExpeditionEventConditionType','ExpeditionEventType','RewardType','ExpeditionCompletionRateRewardType']:
 ti,v=types[name];out={}
 for j in range(v[8]+1,v[8]+(v[17]&65535)):
  a=struct.unpack_from('<3I',M,11885000+j*12)
  if j in defaults:out[str(default_int(data+defaults[j]))]=st(a[0])
 enums[name]=out
Path('research/tables/enums.json').write_text(json.dumps(enums,indent=2)+'\n')

# Reward and monster tables: inherited serialized fields precede derived fields.
extra=[(76103,'CurrencyMaster','RewardBase'),(76141,'OtherRewardMaster','RewardBase'),(76137,'MaterialMaster','RewardBase'),(76143,'PotionMaster','RewardBase'),(76196,'UniqueSoldierInheritanceStatusMaster','RewardBase'),(76099,'ChestSampleMaster','RewardBase'),(76117,'ExpeditionBuffEffectMaster',None),(76118,'ExpeditionBuffMaster',None)]
for i,cn,parent in extra:
 r=R(Path(f'research/mb-{i}.bin').read_bytes());c=r.read('i');schema=(fields(parent)[:-3] if parent else [])+fields(cn)
 rows=[{k:r.val(t) for k,t in schema} for _ in range(c)]
 assert r.p==len(r.b),(r.name,r.p,len(r.b))
 Path('research/tables/'+r.name+'.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
for i,cn in [(76112,'EquipMaster'),(76085,'ArtifactMaster'),(76138,'MonsterParamMaster')]:
 r=R(Path(f'research/mb-{i}.bin').read_bytes());c=r.read('i')
 schema=fields('ParamMasterBase')+fields(cn)[:-1] if cn=='MonsterParamMaster' else fields('RewardBase')[:-3]+fields('EquipMaster')[1:]+(fields(cn) if cn=='ArtifactMaster' else [])
 rows=[{k:r.val(t) for k,t in schema} for _ in range(c)]
 assert r.p==len(r.b),(r.name,r.p,len(r.b))
 Path('research/tables/'+r.name+'.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
for i in [76836,76838,76839,76840]:
 r=R(Path(f'research/mb-{i}.bin').read_bytes());r.string();rows=r.table('LocalizationData')
 Path('research/tables/'+r.name+'.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')

schema=[(k,'str' if t==43358 else 'bool' if t==27036 else 'long' if t==35422 else 'int') for k,t in fields('RewardBase')[:-3]+fields('EquipMaster')[1:]]
Path('research/reward-name-schemas.json').write_text(json.dumps(schema))

# Verify the full inheritance chain before reading unique ability levels.
r=R(Path('research/mb-76192.bin').read_bytes());count=r.read('i')
schema=fields('RewardBase')[:-3]+fields('EquipMaster')[1:]+fields('SoldierAbilityMaster')[:-2]+fields('UniqueSoldierAbilityMaster')
rows=[{k:r.val(t) for k,t in schema} for _ in range(count)]
assert r.p==len(r.b),(r.name,r.p,len(r.b))
Path('research/tables/UniqueSoldierAbilityTable-full.json').write_text(json.dumps(rows,ensure_ascii=False))
r=R(Path('research/mb-76081.bin').read_bytes());rows=r.table('AbilityTypeMaster')
Path('research/tables/AbilityTypeMasterTable.json').write_text(json.dumps(rows,ensure_ascii=False))

r=R(Path('research/mb-76135.bin').read_bytes());count=r.read('i')
schema=fields('DungeonMasterBase')[:-1]+fields('MainDungeonMaster')
rows=[{k:r.val(t) for k,t in schema} for _ in range(count)]
assert r.p==len(r.b),(r.name,r.p,len(r.b))
Path('research/tables/MainDungeonTable.json').write_text(json.dumps(rows,ensure_ascii=False))

# Read the requested GameEventMaster's inherited DungeonMasterBase prefix.
# DungeonTable PPtrs select MainDungeonTable and GameEventTable; the nested
# event/shop arrays are outside the expedition reference conversion contract.
registry=R(Path('research/mb-76109.bin').read_bytes());assert registry.name=='DungeonTable'
assert (registry.read('i'),registry.read('q'),registry.read('i'),registry.read('q'))==(0,76135,0,76131)
assert registry.p==len(registry.b)
b=Path('research/mb-76131.bin').read_bytes()
references=[]
for dungeonId,key in [(3,'under_world'),(5,'snow_mountain')]:
 anchor=struct.pack('<ii',dungeonId,len(key))+key.encode()
 pos=b.find(anchor);assert pos>=52 and b.find(anchor,pos+1)==-1
 r=R.__new__(R);r.b=b;r.p=pos;r.name='GameEventTable'
 reference={k:r.val(t) for k,t in fields('DungeonMasterBase')[:-1]}
 assert reference['dungeonId']==dungeonId and reference['key']==key
 assert r.read('i')==dungeonId # next field: GameEventMaster.eventId
 reference['sourceOffset']=pos;references.append(reference)
Path('research/tables/GameEventDungeonReferences.json').write_text(json.dumps(references,ensure_ascii=False))
