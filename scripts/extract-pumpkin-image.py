"""Extract the 3.16.1 pumpkin gift icon from the supplied assets archive."""
import zipfile
from pathlib import Path
import UnityPy
from PIL import Image
root=Path(__file__).resolve().parents[1]
with zipfile.ZipFile(root.parent/'project_sources/09-assets-1-.zip') as archive:
 env=UnityPy.load(archive.read('assets/bin/Data/datapack.unity3d'))
for obj in env.objects:
 if obj.type.name!='Sprite':continue
 sprite=obj.read()
 if sprite.m_Name!='icon-i_affection_pumpkin_pie':continue
 image=sprite.image.convert('RGBA');image.thumbnail((96,96))
 dest=root/'assets/gifts/305000026.webp';dest.parent.mkdir(parents=True,exist_ok=True)
 image.save(dest,'WEBP',lossless=True)
 with Image.open(dest) as check:check.load()
 break
else:raise RuntimeError('Missing exact pumpkin gift sprite')
