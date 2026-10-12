"""Extract exact-key six-star portraits from the supplied 3.16.0 assets.zip."""
import hashlib,json,zipfile
from pathlib import Path
import UnityPy
root=Path(__file__).resolve().parents[1]
archive=root.parent/'project_sources/07-assets.zip'
member='assets/aa/Android/startup_.bundle'
with zipfile.ZipFile(archive) as z: raw=z.read(member)
env=UnityPy.load(raw)
sprites={}
for obj in env.objects:
 if obj.type.name=='Sprite':
  sprite=obj.read();sprites[sprite.m_Name]=(obj.path_id,sprite)
output=root/'assets/heroes';output.mkdir(parents=True,exist_ok=True)
records=[]
for hero in json.loads((root/'data/hero-preferences.json').read_text())['heroes']:
 name='prf_unique_'+hero['key']+'_2d'
 assert name in sprites,name
 path_id,sprite=sprites[name]
 image=sprite.image.convert('RGBA');image.thumbnail((384,384))
 dest=output/(hero['key']+'.webp');image.save(dest,'WEBP',lossless=True)
 with __import__('PIL.Image',fromlist=['Image']).open(dest) as check: check.load()
 records.append({'key':hero['key'],'sprite':name,'pathId':path_id,'size':list(image.size),'file':str(dest.relative_to(root))})
(root/'docs/evidence/hero-images-source.json').write_text(json.dumps({'gameVersion':'3.16.0','bundle':member,'bundleSha256':hashlib.sha256(raw).hexdigest(),'portraits':records},ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(records),'exact-key portraits')
