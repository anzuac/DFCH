"""Run the APK's seeded System.Random instructions as an independent oracle.
Requires unicorn, capstone and the original arm64-v8a libil2cpp.so.
Only array allocation and the empty base-object constructor are stubbed.
"""
import json,struct,os
from pathlib import Path
from unicorn import Uc,UC_ARCH_ARM64,UC_MODE_ARM,UC_HOOK_CODE
from unicorn.arm64_const import *
b=Path(os.environ.get('DFCH_IL2CPP_PATH','research/lib/arm64-v8a/libil2cpp.so')).read_bytes()
ph=struct.unpack_from('<Q',b,32)[0]
u=Uc(UC_ARCH_ARM64,UC_MODE_ARM)
for i in range(struct.unpack_from('<H',b,56)[0]):
 t,f,o,v,p,s,ms,al=struct.unpack_from('<II6Q',b,ph+i*56)
 if t!=1:continue
 start=v&~4095;end=(v+ms+4095)&~4095
 u.mem_map(start,end-start);u.mem_write(v,b[o:o+s])
u.mem_map(0x100000000,0x20000)
obj=0x100001000;arr=0x100002000;klass=0x100003000;vtable=0x100004000;stop=0x100005000
write=lambda a,v:u.mem_write(a,struct.pack('<Q',v))
write(obj,vtable);write(vtable+0x178,0x5712fe8);write(vtable+0x180,0)
u.mem_write(0x6cc7d42,b'\1');write(0x68816f8,klass);write(0x687d330,klass)
write(klass,klass);u.mem_write(klass+0xe0,struct.pack('<I',1))
def hook(uc,a,size,data):
 if a==0x2a73be4:
  uc.mem_write(arr,bytes(256));write(arr+0x18,56)
  uc.reg_write(UC_ARM64_REG_X0,arr);uc.reg_write(UC_ARM64_REG_PC,uc.reg_read(UC_ARM64_REG_LR))
 elif a==0x5745868:uc.reg_write(UC_ARM64_REG_PC,uc.reg_read(UC_ARM64_REG_LR))
u.hook_add(UC_HOOK_CODE,hook)
def call(a,*args):
 u.reg_write(UC_ARM64_REG_SP,0x10001f000);u.reg_write(UC_ARM64_REG_LR,stop)
 for j,val in enumerate(args):u.reg_write(UC_ARM64_REG_X0+j,val&0xffffffffffffffff)
 u.emu_start(a,stop,count=100000)
 return u.reg_read(UC_ARM64_REG_X0)&0xffffffff
def double():
 call(0x5712fe8,obj)
 return struct.unpack('<d',struct.pack('<Q',u.reg_read(UC_ARM64_REG_D0)))[0]
rows=[]
for seed in [0,1,-1,42,161803398,2147483647,-2147483648]:
 call(0x5712e38,obj,seed)
 doubles=[double() for _ in range(128)]
 call(0x5712e38,obj,seed)
 ints=[call(0x5713108,obj,lo,hi) for lo,hi in [(0,1),(3,11),(5,5),(-100,100),(-2147483648,2147483647)]]
 ints=[n if n<2147483648 else n-4294967296 for n in ints]
 rows.append(dict(seed=seed,doubles=doubles,integers=ints))
print(json.dumps({'source':'APK arm64 instructions via Unicorn; array allocation and Object ctor stubbed','rows':rows},indent=2))
