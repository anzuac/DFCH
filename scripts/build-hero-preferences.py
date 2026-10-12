"""Run after extract-map-tables.py from the workspace containing DFCH/ and research/."""
import json,struct,hashlib
from pathlib import Path
import UnityPy
root=Path('DFCH');tables=Path('research/tables')
metadata=Path('research/assets/bin/Data/Managed/Metadata/global-metadata.dat').read_bytes()
def string(i):return metadata[892080+i:metadata.index(b'\0',892080+i)].decode()
types={}
for i in range(21551):
 row=struct.unpack_from('<22I',metadata,14263744+i*88);types[string(row[0])]=row
def fields(name):
 row=types[name];out=[]
 for i in range(row[8],row[8]+(row[17]&65535)):
  key,kind,_=struct.unpack_from('<3I',metadata,11885000+i*12);out.append((string(key),kind))
 return out
class Reader:
 def __init__(self,data):self.data=data;self.pos=28;self.name=self.text()
 def read(self,fmt):v=struct.unpack_from('<'+fmt,self.data,self.pos)[0];self.pos+=struct.calcsize(fmt);return v
 def align(self):self.pos=(self.pos+3)//4*4
 def text(self):
  size=self.read('i');assert 0<=size<1000000
  result=self.data[self.pos:self.pos+size].decode();self.pos+=size;self.align();return result
 def value(self,kind):
  if kind==43358:return self.text()
  if kind==27036:v=bool(self.read('?'));self.align();return v
  if kind==42409:return self.read('f')
  if kind==46687:return [self.read('f'),self.read('f')]
  if kind in [23983,23562,24269,24330]:
   n=self.read('i');assert 0<=n<10000
   return [self.text() if kind==24330 else self.read('f' if kind==24269 else 'i') for _ in range(n)]
  return self.read('i')
env=UnityPy.load('research/assets/bin/Data/datapack.unity3d')
raw=next(o.get_raw_data() for o in env.objects if o.path_id==76187 and o.type.name=='MonoBehaviour')
r=Reader(raw);assert r.name=='UniquePlayerParamTable';count=r.read('i')
schema=fields('ParamMasterBase')+fields('PlayerParamMasterBase')+fields('UniquePlayerParamMaster')[:-1]
heroes=[{k:r.value(t) for k,t in schema} for _ in range(count)];assert r.pos==len(raw)
loc={r['key']:r for name in ['localize_master','localize_master2'] for r in json.loads((tables/(name+'.json')).read_text())}
def label(key):
 row=loc[key];lang='zh_tw' if row['zh_tw'].strip() else 'ja';assert row[lang].strip(),key
 return row[lang],lang
items=json.loads((tables/'UniqueSoldierInheritanceStatusTable.json').read_text())
# GetPresentPreference checks common/exception first, then loved, then favorite.
def preference(hero,item):
 if item['commonPreference']:
  for field,value in [('exceptionLovedUniqueIndices',3),('exceptionFavoriteUniqueIndices',2),('exceptionNormalUniqueIndices',1)]:
   if hero['index'] in item[field]:return value
  return item['commonPreference']
 if item['rewardId'] in hero['lovedInheritanceIds']:return 3
 if item['rewardId'] in hero['favoriteInheritanceIds']:return 2
 return 1
# This source has no exception lists, so no unverified priority assumption is used.
assert not any(item[field] for item in items for field in ['exceptionLovedUniqueIndices','exceptionFavoriteUniqueIndices','exceptionNormalUniqueIndices'])
six=[h for h in heroes if h['rarity']==5];assert len(six)==23
out=[]
for h in six:
 name,lang=label('unique-chara-name-'+h['key']);title,title_lang=label('nick-name-'+h['key'])
 for id in h['lovedInheritanceIds']+h['favoriteInheritanceIds']:assert id==0 or any(i['rewardId']==id for i in items)
 out.append({'index':h['index'],'key':h['key'],'name':name,'title':title,'nameLanguage':lang,'titleLanguage':title_lang,'loved': [i['rewardId'] for i in items if preference(h,i)==3],'favorite':[i['rewardId'] for i in items if preference(h,i)==2]})
used={id for h in out for id in h['loved']+h['favorite']}
common=[i['rewardId'] for i in items if all(preference(h,i)==2 for h in six)]
source={'heroes':[{'index':h['index'],'key':h['key'],'rarity':h['rarity'],'lovedInheritanceIds':h['lovedInheritanceIds'],'favoriteInheritanceIds':h['favoriteInheritanceIds']} for h in six], 'items':[{k:i[k] for k in ['rewardId','key','commonPreference','exceptionLovedUniqueIndices','exceptionFavoriteUniqueIndices','exceptionNormalUniqueIndices']} for i in items]}
data={'gameVersion':'3.16.0','commonFavorite':common,'items':[{'id':i['rewardId'],'name':label('r-name-'+i['key'])[0]} for i in items if i['rewardId'] in used],'heroes':out}
# Official localization columns; screenshot-confirmed Traditional Chinese overrides.
languages={'zh_tw':'繁體中文','zh_cn':'简体中文','ja':'日本語','en':'English','ko':'한국어','th':'ไทย','vi':'Tiếng Việt'}
overrides={'freya':('弗雷雅','探求不滅之愛的黑色女神'),'frigg':('芙麗嘉','凝視羈絆的白色女神')}
data['languages']=languages
for hero in data['heroes']:
 hero['translations']={lang:{'name':loc['unique-chara-name-'+hero['key']][lang].strip(),'title':loc['nick-name-'+hero['key']][lang].strip()} for lang in languages}
 if hero['key'] in overrides:
  name,title=overrides[hero['key']];hero.update(name=name,title=title,nameLanguage='zh_tw',titleLanguage='zh_tw')
  hero['translations']['zh_tw']={'name':name,'title':title}
for item in data['items']:
 key=next(i['key'] for i in items if i['rewardId']==item['id'])
 item['translations']={lang:loc['r-name-'+key][lang].strip() for lang in languages}
# Versioned gift additions verified separately from the base hero table.
for supplement in json.loads((root/'data/hero-gift-supplements.json').read_text()):
 item=supplement['item'];raw_item=supplement['source']
 assert raw_item['commonPreference']==2 and not any(raw_item[k] for k in ['exceptionNormalUniqueIndices','exceptionFavoriteUniqueIndices','exceptionLovedUniqueIndices'])
 if item['id'] not in {i['id'] for i in data['items']}:data['items'].append(item)
 if item['id'] not in data['commonFavorite']:data['commonFavorite'].append(item['id'])
 for hero in data['heroes']:
  if item['id'] not in hero['favorite']:hero['favorite'].append(item['id'])
 if item['id'] not in {i['rewardId'] for i in source['items']}:source['items'].append(raw_item)
 data['giftSupplementVersion']=supplement['gameVersion']
# Card source metadata is independent of gift preferences.
acquisition=json.loads((root/'data/hero-acquisition.json').read_text())
for hero in data['heroes']:
 hero['acquisition']=acquisition['heroes'].get(str(hero['index']),{})
data['acquisitionVersion']=acquisition['gameVersion']
data['bondGains']=json.loads((root/'data/hero-bond-gains.json').read_text())
(root/'data/hero-preferences.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(root/'hero-preferences-data.js').write_text('window.DFCHHeroPreferences = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
source['evidence']={'tablePathId':76187,'tableSha256':hashlib.sha256(raw).hexdigest(),'tableRows':count,'metadataSha256':hashlib.sha256(metadata).hexdigest(),'rarityValue':5,'commonPreferenceMethod':'0x2e7dccc','assignmentMethod':'0x2d3e894','getPreferenceMethod':'0x2dcf66c','sixStarRandomFill':False}
(root/'docs/evidence/hero-preferences-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
print(len(out),'six-star heroes;',len(data['items']),'items;',len(common),'common favorites;',sum(h['nameLanguage']!='zh_tw' for h in out),'Japanese name fallbacks')
