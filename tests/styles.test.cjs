const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
test('opacity covers the whole object including text, circle center and label exactly once',()=>{
  const {MI}=runtime();const e=new MI.Engine({objects:[{id:'t',type:'text',x:0,y:0,text:'Tekst',showLabel:true,style:{fontSize:32,opacity:.25}},{id:'c',type:'circle',cx:1,cy:1,r:1,style:{opacity:0}}]});
  const svg=e.renderSVG();assert.match(svg,/<g[^>]*data-object-id="t"[^>]*opacity="0.25"/);assert.match(svg,/font-size="32"/);assert.match(svg,/<g[^>]*data-object-id="c"[^>]*opacity="0"/);
});
test('style edits preserve geometry, nested extensions and compatible JSON values',()=>{
  const {MI}=runtime();const e=new MI.Engine({objects:[{id:'p',type:'polygon',vertices:[{x:0,y:0},{x:2,y:0},{x:1,y:2}],style:{extension:{keep:true}}}]});
  const vertices=plain(e.get('p').vertices);e.update('p',{style:{strokeWidth:4,dash:'8 5',fill:'#abcdef',opacity:.4}});
  assert.deepEqual(plain(e.get('p').vertices),vertices);assert.equal(e.get('p').style.extension.keep,true);
  assert.deepEqual(plain(new MI.Engine(e.toJSON()).toJSON()),plain(e.toJSON()));
  for(const style of [{strokeWidth:-1},{opacity:1.1},{fontSize:0}]) {const before=plain(e.toJSON());assert.throws(()=>e.update('p',{style}));assert.deepEqual(plain(e.toJSON()),before);}
});
