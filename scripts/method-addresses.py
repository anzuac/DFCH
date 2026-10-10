"""Resolve this build's metadata methods through ELF RELA, including abstract gaps."""
import struct, os
from pathlib import Path
M=Path(os.environ.get('DFCH_METADATA_PATH','research/assets/bin/Data/Managed/Metadata/global-metadata.dat')).read_bytes()
B=Path(os.environ.get('DFCH_IL2CPP_PATH','research/lib/arm64-v8a/libil2cpp.so')).read_bytes()
def st(i):return M[892080+i:M.index(b'\0',892080+i)].decode()
anchor=B.find(struct.pack('<Q',0x34b6178))
base=struct.unpack_from('<Q',B,anchor-16)[0]-31900*8
rel={}
sh=struct.unpack_from('<Q',B,40)[0]
for i in range(struct.unpack_from('<H',B,60)[0]):
 s=struct.unpack_from('<II4QII2Q',B,sh+i*64)
 if s[1]==4:
  for off,info,val in struct.iter_unpack('<QQq',B[s[4]:s[4]+s[5]]):
   if info==1027:rel[off]=val
def addr(j):return rel.get(base+j*8,0)
def method(j):
 v=struct.unpack_from('<9I',M,3959024+j*36)
 t=struct.unpack_from('<22I',M,14263744+v[1]*88)
 return st(t[0])+'.'+st(v[0])
if __name__=='__main__':
 import sys
 for j in map(int,sys.argv[1:]):print(j,hex(addr(j)),method(j))
