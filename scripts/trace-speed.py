import struct
from capstone import *
from pathlib import Path
import os
b=Path(os.environ.get('DFCH_IL2CPP_PATH', 'research/lib/arm64-v8a/libil2cpp.so')).read_bytes()
ph=struct.unpack_from('<Q',b,32)[0]
ss=[struct.unpack_from('<II6Q',b,ph+i*56) for i in range(struct.unpack_from('<H',b,56)[0])]
def rd(a,n):
 for t,f,o,v,p,s,ms,al in ss:
  if v<=a<v+s:return b[o+a-v:o+a-v+n]
 return b''
md=Cs(CS_ARCH_ARM64,CS_MODE_ARM)
def dump(a,n):
 for i in md.disasm(rd(a,n),a): print(hex(i.address),i.mnemonic,i.op_str)
def refs(target):
 for t,f,o,v,p,s,ms,al in ss:
  if t!=1 or not f&1:continue
  for pos in range(o,min(o+s,len(b))-4,4):
   w=struct.unpack_from('<I',b,pos)[0]
   if w>>26 in (0x25,0x5):
    im=w&0x3ffffff
    if im&0x2000000:im-=0x4000000
    if v+pos-o+im*4==target:print('REF',hex(v+pos-o));dump(v+pos-o-48,120)
if __name__=='__main__':
 import sys
 if sys.argv[1]=='refs':refs(int(sys.argv[2],16))
 else:dump(int(sys.argv[1],16),int(sys.argv[2],0))
