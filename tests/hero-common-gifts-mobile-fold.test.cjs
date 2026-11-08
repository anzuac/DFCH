'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const view=fs.readFileSync(path.join(root,'hero-preferences-view.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
function element(tag,text='',cls=''){
 const listeners={},classes=new Set((cls||'').split(/\s+/).filter(Boolean));
 return {
  tag,textContent:text,className:cls,dataset:{},attrs:{},children:[],id:'',
  classList:{toggle:(name,force)=>{const active=force===undefined?!classes.has(name):Boolean(force);if(active)classes.add(name);else classes.delete(name);return active;},contains:name=>classes.has(name)},
  setAttribute(name,value){this.attrs[name]=String(value);},
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=[...children];},
  addEventListener(type,callback){listeners[type]=callback;},
  click(){if(listeners.click)listeners.click();}
 };
}
test('on small screens, both gift sections default closed and independently toggle',()=>{
 const start=view.indexOf('const commonGiftExpanded=');
 const end=view.indexOf('const panel=',start);
 assert.ok(start>0&&end>start,'gift folding functions found');
 const root=element('div');
 const data={commonFavorite:[1,2,3,4,5,6,7],collabGiftIds:[11,12,13,14,15,16,17,18,19,20,21,22]};
 const titles={zh_tw:{baseHeading:'基礎共同喜愛・7 種',collabHeading:'迷宮飯聯動禮物・12 種'}};
 const create=node=>node;
 const make=new Function('node','chips','data','$','preferenceCopy','lang',view.slice(start,end)+'return {renderCommonGifts,commonGiftExpanded};');
 const api=make(element,ids=>{const list=element('ul');list.ids=ids;return list;},data,id=>id==='heroCommonGifts'?root:null,titles,'zh_tw');
 api.renderCommonGifts();
 assert.equal(root.children.length,3);
 const base=root.children[0],collab=root.children[2];
 assert.deepEqual([base.children[1].attrs['aria-expanded'],collab.children[1].attrs['aria-expanded']],['false','false']);
 assert.equal(base.children[2].children[0].ids.length,7);
 assert.equal(collab.children[2].children[0].ids.length,12);
 assert.equal(base.children[1].attrs['aria-controls'],base.children[2].id);
 base.children[1].click();
 assert.equal(base.children[1].attrs['aria-expanded'],'true');
 assert.ok(base.classList.contains('is-open'));
 assert.equal(collab.children[1].attrs['aria-expanded'],'false');
 api.renderCommonGifts();
 assert.equal(root.children[0].children[1].attrs['aria-expanded'],'true','state survives rerender');
 root.children[2].children[1].click();
 assert.equal(api.commonGiftExpanded.collab,true);
 root.children[0].children[1].click();
 assert.equal(api.commonGiftExpanded.base,false);
});
test('desktop stays expanded and only mobile gets clickable group headings',()=>{
 assert.match(css,/\.hero-common-gifts \.hero-common-group-toggle\{display:none\}/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/\.hero-common-gifts \.hero-common-group-title\{display:none\}/);
 assert.match(css,/\.hero-common-gifts \.hero-common-group-toggle\{[\s\S]*?display:flex/);
 assert.match(css,/\.hero-common-gifts \.hero-common-group:not\(\.is-open\) \.hero-common-group-content\{display:none\}/);
 assert.match(css,/\.hero-common-gifts \.hero-common-group-toggle:focus-visible/);
});
test('both published page variants load the refreshed styles and fold script',()=>{
 for(const file of ['index.html','heroes.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(html,/styles\.css\?v=2\.4\.13/);
  assert.match(html,/hero-preferences-view\.js\?v=2\.9\.6/);
 }
});
