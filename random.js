(() => {
  const MAX=2147483647;
  function seedFromStoredCryptoInt(encoded) {
    const bits=BigInt.asUintN(64,BigInt(encoded));
    return Number(BigInt.asIntN(32,(bits&0xffffffffn)^(bits>>32n)));
  }
  class OfficialRandom {
    constructor(seed) {
      if(!Number.isInteger(seed)||seed<-2147483648||seed>MAX)throw new RangeError('種子須為有號 32 位整數');
      this.seed=seed;this.calls=0;this.inext=0;this.inextp=21;
      this.values=new Int32Array(56);
      let mj=(161803398-(seed===-2147483648?MAX:Math.abs(seed)))|0,mk=1;
      this.values[55]=mj;
      let ii=0;
      for(let i=1;i<55;i++) {
        ii=(ii+21)%55;this.values[ii]=mk;
        mk=(mj-mk)|0;if(mk<0)mk=(mk+MAX)|0;
        mj=this.values[ii];
      }
      for(let k=0;k<4;k++)for(let i=1;i<56;i++) {
        let v=(this.values[i]-this.values[1+(i+30)%55])|0;
        if(v<0)v=(v+MAX)|0;this.values[i]=v;
      }
    }
    internalSample() {
      this.calls++;
      if(++this.inext>=56)this.inext=1;
      if(++this.inextp>=56)this.inextp=1;
      let value=(this.values[this.inext]-this.values[this.inextp])|0;
      if(value===MAX)value--;
      if(value<0)value=(value+MAX)|0;
      this.values[this.inext]=value;return value;
    }
    nextDouble() {return this.internalSample()*4.656612875245797e-10;}
    next(min,max) {
      if(arguments.length===0)return this.internalSample();
      if(arguments.length===1){max=min;min=0;}
      if(!Number.isInteger(min)||!Number.isInteger(max)||min<-2147483648||max>MAX||max<min)throw new RangeError('整數抽選範圍無效');
      const range=max-min;
      let sample;
      if(range>MAX) {
        let value=this.internalSample();
        if(this.internalSample()%2===0)value=-value;
        sample=(value+2147483646)/4294967293;
      } else sample=this.nextDouble();
      return (Math.trunc(sample*range)+min)|0;
    }
  }
  window.DFCHRandom=Object.freeze({OfficialRandom,seedFromStoredCryptoInt});
})();
