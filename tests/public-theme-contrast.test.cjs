'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('team/css/style.css');
const shared=read('public-display.css');
const start=css.indexOf('/* v1.15.1: Semantic contrast palette');
assert.ok(start>0,'theme-contrast CSS must exist');
const palette=css.slice(start);
const luma=h=>[0,2,4].reduce((sum,i,k)=>{
  let x=parseInt(h.slice(1+i,3+i),16)/255;
  x=x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
  return sum+x*[.2126,.7152,.0722][k];
},0);
const contrast=(a,b)=>{const x=luma(a),y=luma(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const rules={
  dark:{selector:'.hero-party-public',surface:'#1c2638',tile:'#26344c'},
  light:{selector:'html[data-guide-theme="light"] .hero-party-public',surface:'#ffffff',tile:'#e5edf2'},
  blue:{selector:'html[data-guide-theme="blue"] .hero-party-public',surface:'#10253d',tile:'#163452'},
  green:{selector:'html[data-guide-theme="green"] .hero-party-public',surface:'#1b3025',tile:'#284535'},
};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function vars(selector){
 const re=new RegExp(esc(selector)+'\\s*\\{([^}]+)\\}');
 const match=palette.match(re);
 assert.ok(match,'Theme missing: '+selector);
 return Object.fromEntries([...match[1].matchAll(/(--party-[\\w-]+)\\s*:\\s*(#[\\da-fA-F]{6})/g)].map(v=>[v[1],v[2]]));
}
test('All public lineup themes maintain WCAG AA body and status contrast',()=>{
 for(const [name,def] of Object.entries(rules)){
  const p=vars(def.selector);
  for(const [field,ground] of [
   ['--party-foreground',def.surface],['--party-secondary',def.surface],
   ['--party-accent',def.surface],['--party-gold',def.surface],
   ['--party-positive',def.surface],['--party-warning',def.surface],
   ['--party-foreground',def.tile],
   ['--party-skill-text',p['--party-skill-bg']],
   ['--party-artifact-text',p['--party-artifact-bg']],
   ['--party-cap-ok-text',p['--party-cap-ok-bg']],
   ['--party-cap-warn-text',p['--party-cap-warn-bg']]
  ]){
   assert.ok(p[field]&&ground,'Missing colors for '+name+' '+field);
   assert.ok(contrast(p[field],ground)>=4.5,name+' '+field+' has weak contrast');
  }
 }
});
test('Light theme buttons and labels stay readable across public tools',()=>{
 assert.ok(contrast('#ffffff','#896016')>=4.5);
 assert.ok(contrast('#ffffff','#197e72')>=4.5);
 assert.match(shared,/\.bond30-public \.button\.primary/);
 assert.match(shared,/\.bond30-public \.button\.accent/);
 assert.match(shared,/\.public-diamond :is\(\.diamond-result,#diamondAutoStatus\)/);
 assert.match(palette,/\.hero-party-public \.skilltile\.is-up/);
 assert.match(palette,/\.hero-party-public \.artifact-line select\.cap-exceeded/);
});
test('Every published entrypoint opts in to the updated shared theme stylesheet',()=>{
 for(const p of ['heroes.html','Bond30/index.html','team/index.html','scripts/build-heroes-pages.cjs'])
  assert.match(read(p),/public-display\.css\?v=1\.0\.2/,p);
 assert.match(read('team/index.html'),/\.\/css\/style\.css\?v=1\.15\.1/);
});
