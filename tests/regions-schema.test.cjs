const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
const setup=()=>runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI;
const ref=objectId=>({objectId}),axis=axis=>({kind:'axis',frame:'cartesian',axis});
const base=()=>({objects:[
 {id:'P',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]},
 {id:'L',type:'line',x1:-2,y1:0,x2:2,y2:0},{id:'M',type:'line',x1:0,y1:-2,x2:0,y2:2},
 {id:'C',type:'circle',cx:0,cy:0,r:2},{id:'A',type:'point',x:2,y:0},{id:'B',type:'point',x:0,y:2}
]});
const textContent=schema=>({schema,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[
 {id:'r1',kind:'text',text:'Straal = ',marks:{bold:true}},
 ...(schema===2?[{id:'m1',kind:'math',source:'r^2',marks:{}}]:schema===3?[{id:'d1',kind:'dynamicValue',binding:{sourceId:'C',property:'radius'},format:{precision:2,unitMode:'document',angleMode:'document',prefix:'',suffix:''},marks:{color:'#cc0000'}}]:[])
]}]});
test('REG-2 construction schema 5 coexists with axes, arms and schema 2 through JSON and semantic replay',()=>{
 const MI=setup();
 for(const [kind,sources,legacySchema] of [
  ['angleDirections',[axis('x'),axis('y')],3],
  ['angleDirections',[{objectId:'L',arm:'end'},{objectId:'M',arm:'end'}],4],
  ['lineBetweenPoints',[ref('A'),ref('B')],2]
 ]){
  const seq=new MI.SemanticSequence(base());seq.execute('construction.create',{toolId:'construct:'+kind,sources});
  const legacy=plain(seq.document);assert.equal(legacy.constructionSchema,legacySchema);
  assert.deepEqual(plain(new MI.Engine(legacy).toJSON()),legacy);
  assert.deepEqual(plain(MI.SemanticSequence.replay(seq.toJSON())),legacy);
  seq.execute('construction.create',{toolId:'construct:polygonRegion',sources:[ref('P')]});
  const saved=plain(seq.document),e=new MI.Engine(saved);assert.equal(saved.version,8);assert.equal(saved.constructionSchema,5);
  assert.deepEqual(plain(e.toJSON()),saved);assert.deepEqual(plain(MI.SemanticSequence.replay(seq.toJSON())),saved);
  for(const constructionSchema of [undefined,null,0,1,2,3,4,6,'5']){
   assert.throws(()=>e.load({...saved,constructionSchema}));assert.deepEqual(plain(e.toJSON()),saved);
   assert.throws(()=>e.model.load({...saved,constructionSchema}));assert.deepEqual(plain(e.toJSON()),saved);
  }
  assert.throws(()=>e.load({...legacy,constructionSchema:5}));assert.deepEqual(plain(e.toJSON()),saved);
 }
});
test('REG-2 version 8 enforces supported and sufficient textSchema atomically while preserving legacy text schemas',()=>{
 const MI=setup();
 for(const schema of [1,2,3]){
  const e=new MI.Engine(base());e.add({id:'T',type:'text',x:0,y:4,textContent:textContent(schema)});
  const legacy=plain(e.toJSON());assert.equal(legacy.version,7);assert.equal(legacy.textSchema,schema);assert.deepEqual(plain(new MI.Engine(legacy).toJSON()),legacy);
  e.construct('polygonRegion',[ref('P')]);e.construct('circleSectorRegion',[ref('C'),ref('A'),ref('B')],undefined,'minor');
  const saved=plain(e.toJSON());assert.equal(saved.version,8);assert.equal(saved.textSchema,schema);assert.deepEqual(plain(new MI.Engine(JSON.parse(JSON.stringify(saved))).toJSON()),saved);
  for(const textSchema of [undefined,null,0,4,-1,1.5,'3',true,{},...Array.from({length:schema-1},(_,i)=>i+1)]){
   for(const target of [e,e.model]){assert.throws(()=>target.load({...saved,textSchema}));assert.deepEqual(plain(e.toJSON()),saved);}
  }
  for(let textSchema=schema;textSchema<=3;textSchema++)assert.deepEqual(plain(new MI.Engine({...saved,textSchema}).toJSON()),saved);
  const seq=new MI.SemanticSequence(saved);seq.execute('object.setGeometry',{id:'C',fields:[{path:'r',value:3}]});
  assert.deepEqual(plain(MI.SemanticSequence.replay(seq.toJSON())),plain(seq.document));
  if(schema===3){const loaded=new MI.Engine(seq.document);assert.match(loaded.renderSVG(),/3,00/);assert.deepEqual(plain(loaded.get('T').textContent),saved.objects.find(o=>o.id==='T').textContent);}
 }
 const e=new MI.Engine(base()),legacy=plain(e.toJSON());assert.deepEqual(plain(new MI.Engine(legacy).toJSON()),legacy);
 e.construct('polygonRegion',[ref('P')]);const saved=plain(e.toJSON());assert.equal('textSchema' in saved,false);assert.deepEqual(plain(new MI.Engine(saved).toJSON()),saved);
});
test('REG-2 concave polygon and minor/major segment interiors, boundaries and visibility remain selectable',()=>{
 const MI=setup(),e=new MI.Engine({objects:[{id:'P',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:1},{x:1,y:1},{x:1,y:4},{x:0,y:4}]}]}),r=e.construct('polygonRegion',[ref('P')])[0];
 const select=(engine,p)=>engine.selectAt(p.x,p.y,{transform:new MI.CoordinateTransform(engine.renderer),tolerancePx:.01})?.object.id;
 for(const p of [{x:.5,y:3},{x:3,y:.5},{x:1,y:2},{x:0,y:0}])assert.equal(select(e,p),r.id);
 assert.equal(select(e,{x:2,y:2}),undefined);
 e.update(r.id,{visible:false});assert.notEqual(select(e,{x:.5,y:3}),r.id);e.update(r.id,{visible:true});assert.equal(select(e,{x:.5,y:3}),r.id);
 for(const extent of ['minor','major']){
  const s=new MI.Engine(base()),segment=s.construct('circleSegmentRegion',[ref('C'),ref('A'),ref('B')],undefined,extent)[0];
  // Hide sources to isolate the region's hit contour and selection priority.
  for(const o of s.model.objects)if(o.id!==segment.id)s.update(o.id,{visible:false});
  const inside=extent==='minor'?{x:1.3,y:1.3}:{x:0,y:0},outside=extent==='minor'?{x:0,y:0}:{x:1.3,y:1.3};
  for(const p of [inside,{x:1,y:1},{x:2*Math.SQRT1_2,y:extent==='minor'?2*Math.SQRT1_2:-2*Math.SQRT1_2}])assert.equal(select(s,p),segment.id);
  assert.equal(select(s,outside),undefined);assert.equal(select(s,{x:3,y:3}),undefined);
  s.update(segment.id,{visible:false});assert.equal(select(s,inside),undefined);
 }
});
