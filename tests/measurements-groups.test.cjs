const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
test('dimension and angle values are computed while free text is preserved and escaped',()=>{
  const {MI}=runtime(); const e=new MI.Engine({objects:[{id:'d',type:'dimension',x1:0,y1:0,x2:3,y2:4},{id:'a',type:'angle',vertices:[{x:1,y:0},{x:0,y:0},{x:0,y:1}],angleMark:'right'}]});
  assert.equal(MI.MeasurementGeometry.value(e.get('d')),5); assert.equal(MI.MeasurementGeometry.value(e.get('a')),90);
  assert.match(e.renderSVG(),/90°/);assert.match(e.renderSVG(),/data-right-angle/);
  e.update('d',{measurementMode:'text',measurementText:'<maat>'});assert.match(e.renderSVG(),/&lt;maat&gt;/);
  assert.deepEqual(plain(new MI.Engine(e.toJSON()).toJSON()),plain(e.toJSON()));
  assert.throws(()=>e.update('a',{vertices:[{x:0,y:0},{x:0,y:0},{x:0,y:1}]}));
});
test('group resolver applies one vector and excludes every selected object',()=>{
  const {MI}=runtime();const e=new MI.Engine({objects:[{id:'p',type:'point',x:0,y:0},{id:'l',type:'line',x1:2,y1:0,x2:3,y2:0}]},{showGrid:true});
  const r=MI.InteractionResolver.translateGroup(e,e.model.all(),{x:.99,y:1.01});
  e.updateMany(r.patches);assert.equal(e.get('p').x,1);assert.equal(e.get('l').x1,3);assert.equal(e.get('l').x2,4);
  const before=plain(e.toJSON());assert.throws(()=>e.updateMany([{id:'p',patch:{x:4}},{id:'l',patch:{x2:NaN}}]));assert.deepEqual(plain(e.toJSON()),before);
});
test('batch duplication generates unique IDs and retains nested styles and measurements',()=>{
  const {MI}=runtime();const e=new MI.Engine({objects:[{id:'d',type:'dimension',x1:0,y1:0,x2:1,y2:0,locked:true,style:{extra:{keep:true}}}]});
  const copies=e.duplicateMany(['d'],{x:1,y:1});assert.notEqual(copies[0].id,'d');assert.equal(copies[0].locked,false);assert.equal(copies[0].style.extra.keep,true);
  assert.equal(copies[0].x1,1);assert.equal(e.get('d').x1,0);assert.equal(e.get('d').locked,true);
});

test('angle coordinate strings normalize without freezing or aliasing input extensions',()=>{
  const {MI}=runtime(); const input={id:'a',type:'angle',vertices:[{x:'1',y:'0',extra:{keep:1}},{x:'0',y:'0'},{x:'0',y:'1'}]};
  const e=new MI.Engine({objects:[input]});assert.equal(typeof e.get('a').vertices[0].x,'number');assert.equal(e.get('a').angleMark,'arc');
  assert.equal(Object.isFrozen(input.vertices[0].extra),false);input.vertices[0].extra.keep=2;assert.equal(e.get('a').vertices[0].extra.keep,1);
  assert.throws(()=>e.update('a',{angleMark:'right',vertices:[{x:1,y:0},{x:0,y:0},{x:1,y:1}]}));
  e.update('a',{vertices:[{x:1,y:0},{x:0,y:0},{x:-1,y:0}]});assert.equal(MI.MeasurementGeometry.value(e.get('a')),180);assert.doesNotMatch(e.renderSVG(),/NaN|Infinity/);
});
