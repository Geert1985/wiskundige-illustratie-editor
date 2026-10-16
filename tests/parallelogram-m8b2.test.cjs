const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

function setup(){const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js','editor-history.js']).MI,e=new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:1,y:2},{id:'B',type:'point',x:5,y:2}]});return {MI,e};}
function close(actual,expected,tol=1e-10){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}
function create(e,angle=Math.PI/3){return e.construct('parallelogramBySideAngle',[{objectId:'A'},{objectId:'B'}],undefined,undefined,{sideLength:3,signedAngle:angle})[0];}

test('new dynamic parallelograms atomically store exactly the three approved visible measures',()=>{
 const {MI,e}=setup(),app={engine:e,selectedId:null,selectedIds:[],services:{}},history=new MI.EditorHistory(app),before=history.capture(),p=create(e),keys=MI.MeasurementGeometry.measurementKeys(p),config=MI.MeasurementGeometry.measurementSettings(p.measurements,p);history.record(before);
 assert.deepEqual(Object.keys(config.values),plain(keys));assert.deepEqual(plain(keys.filter(k=>config.values[k].visible)),['side:0','side:3','angle:0']);
 const svg=e.renderSVG(),angleDoc=e.model.meta.angleMeasurement;assert.equal((svg.match(/data-measurement-kind=/g)||[]).length,3);assert.equal(MI.MeasurementGeometry.measurementLabel(p,'side:0',config,MI.MeasurementUnits.defaults,angleDoc),'Zijde AB: 4,00 cm');assert.equal(MI.MeasurementGeometry.measurementLabel(p,'side:3',config,MI.MeasurementUnits.defaults,angleDoc),'Zijde DA: 3,00 cm');assert.equal(MI.MeasurementGeometry.measurementLabel(p,'angle:0',config,MI.MeasurementUnits.defaults,angleDoc),'Binnenhoek A: 60,00°');for(const label of ['Zijde AB: 4,00 cm','Zijde DA: 3,00 cm','Binnenhoek A: 60,00°'])assert.ok(svg.includes(label),`SVG label ontbreekt: ${label}`);assert.equal(e.toJSON().version,10);assert.equal(e.toJSON().measurementSchema,1);assert.equal(e.toJSON().constructionSchema,8);
 assert.ok(p.id);assert.equal(history.entries.length,1);assert.equal(history.undo(),true);assert.equal(e.get(p.id),null);assert.equal(history.redo(),true);assert.deepEqual(plain(e.get(p.id).measurements),plain(p.measurements));
});

test('parallelogram measurements use polygon geometry for signed angles and rotated baselines',()=>{
 const {MI,e}=setup(),p=create(e,-Math.PI/3),m=key=>MI.MeasurementGeometry.measurementValue(p,key),v=p.vertices;
 close(m('side:0'),4);close(m('side:1'),3);close(m('side:2'),4);close(m('side:3'),3);close(m('perimeter'),14);close(m('area'),6*Math.sqrt(3));
 close(m('angle:0'),60);close(m('angle:1'),120);close(m('angle:2'),60);close(m('angle:3'),120);assert.ok(v[2].y<v[1].y);
 e.update('B',{x:4,y:6});const rotated=e.get(p.id),w=rotated.vertices;close(MI.MeasurementGeometry.measurementValue(rotated,'side:0'),Math.hypot(3,4));close(MI.MeasurementGeometry.measurementValue(rotated,'side:3'),3);close(MI.MeasurementGeometry.measurementValue(rotated,'area'),15*Math.sqrt(3)/2);close(MI.MeasurementGeometry.measurementValue(rotated,'angle:0'),60);assert.equal(w.length,4);
});

test('parameter command changes length and signed angle atomically with one undo and redo',()=>{
 const {MI,e}=setup(),p=create(e),commands=MI.AuthorCommands(e),app={engine:e,selectedId:p.id,selectedIds:[p.id],services:{}},history=new MI.EditorHistory(app),beforeStep=history.capture(),run=(op,payload)=>commands.execute(commands.createCommand(op,payload));
 run('construction.setParallelogramParameters',{id:p.id,sideLength:5,signedAngle:-Math.PI/2});history.record(beforeStep);assert.equal(history.entries.length,1);assert.equal(e.get(p.id).construction.sideLength,5);assert.equal(e.get(p.id).construction.signedAngle,-Math.PI/2);close(MI.MeasurementGeometry.measurementValue(e.get(p.id),'area'),20);
 assert.equal(history.undo(),true);assert.equal(e.get(p.id).construction.sideLength,3);assert.equal(e.get(p.id).construction.signedAngle,Math.PI/3);assert.equal(history.redo(),true);assert.equal(e.get(p.id).construction.sideLength,5);
 const before=plain(e.toJSON());assert.throws(()=>run('construction.setParallelogramParameters',{id:p.id,sideLength:-1}));assert.deepEqual(plain(e.toJSON()),before);
});

test('saved individual measures, free text and offsets survive geometry updates and JSON roundtrip',()=>{
 const {MI,e}=setup(),p=create(e),settings=MI.MeasurementGeometry.measurementSettings(p.measurements,p);settings.values['side:0']={...settings.values['side:0'],visible:false,precision:4,mode:'text',text:'AB = α',dx:.4,dy:-.2};e.update(p.id,{measurements:settings});e.update('B',{x:7,y:2});
 const loaded=new MI.Engine(e.toJSON()),copy=loaded.get(p.id),saved=copy.measurements.values['side:0'];assert.equal(saved.visible,false);assert.equal(saved.precision,4);assert.equal(saved.mode,'text');assert.equal(saved.text,'AB = α');assert.equal(saved.dx,.4);assert.equal(saved.dy,-.2);close(MI.MeasurementGeometry.measurementValue(copy,'side:0'),6);
});

test('invalid linked geometry exposes no stale measures and recovers labels with stable keys',()=>{
 const {MI,e}=setup(),p=create(e);e.update('B',{x:1,y:2});const invalid=e.get(p.id);assert.equal(invalid.constructionValid,false);assert.equal('vertices'in invalid,false);for(const key of MI.MeasurementGeometry.measurementKeys(invalid))assert.equal(MI.MeasurementGeometry.measurementValue(invalid,key),null);assert.doesNotMatch(e.renderSVG(),/data-measurement-kind=/);e.update('B',{x:5,y:2});const recovered=e.get(p.id);assert.equal(recovered.constructionValid,true);assert.deepEqual(MI.MeasurementGeometry.measurementKeys(recovered),MI.MeasurementGeometry.measurementKeys(invalid));assert.equal((e.renderSVG().match(/data-measurement-kind=/g)||[]).length,3);
});

test('measurement options remain independent on duplicated detached polygon snapshots',()=>{
 const {MI,e}=setup(),p=create(e),copy=e.duplicateMany([p.id],{x:1,y:1})[0];e.detachConstructions([p.id]);
 assert.deepEqual(plain(copy.measurements),plain(p.measurements));assert.deepEqual(plain(e.get(p.id).measurements),plain(p.measurements));assert.equal(e.get(p.id).construction,undefined);assert.equal(copy.construction,undefined);
});

test('restricted measurement settings require the existing object property grant and fail atomically',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI,{fixture}=require('./permission-fixtures.cjs'),author=new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]}),p=author.construct('parallelogramBySideAngle',[{objectId:'A'},{objectId:'B'}],undefined,undefined,{sideLength:3,signedAngle:Math.PI/3})[0],doc=plain(author.toJSON()),rules={A:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:['construct:parallelogramBySideAngle']},B:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:['construct:parallelogramBySideAngle']},[p.id]:{read:true,display:true,selectCanvas:true,selectList:true,propertyFields:['name']}},f=fixture('course',{parameters:{},initialObjectRules:rules});f.initialDocument=doc;const {session,owner}=MI.RuntimeSession.create(f),before=plain(owner.inspect().document),object=session.engine.get(p.id),changed=plain(object.measurements);changed.values['side:0'].visible=false;
 assert.throws(()=>session.execute(session.createCommand('object.setProperties',{ids:[p.id],fields:[{path:'measurements',value:changed}]})),error=>error.code==='PERMISSION_DENIED');assert.deepEqual(plain(owner.inspect().document),before);assert.equal(session.engine.get(p.id).measurements.values['side:0'].visible,true);assert.throws(()=>session.execute(session.createCommand('construction.setParallelogramParameters',{id:p.id,sideLength:4})),error=>error.code==='MODE_DENIED');
});

test('restricted parallelogram projection and exports fail closed when a source is hidden or ungranted',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI,{fixture}=require('./permission-fixtures.cjs'),author=new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]}),p=author.construct('parallelogramBySideAngle',[{objectId:'A'},{objectId:'B'}],undefined,undefined,{sideLength:3,signedAngle:Math.PI/3})[0],doc=plain(author.toJSON());
 for(const sourceRule of [{read:false},{display:false},{sourceTools:[]}]){
  const rules={A:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:['construct:parallelogramBySideAngle']},B:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:['construct:parallelogramBySideAngle']},[p.id]:{read:true,display:true,selectCanvas:true,selectList:true}};
  // The loop varies the inaccessible source B, while keeping the result readable.
  rules[p.id]={read:true,display:true,selectCanvas:true,selectList:true};rules.B={...rules.B,...sourceRule};
  const f=fixture('course',{parameters:{},initialObjectRules:rules});f.initialDocument=doc;const {session}=MI.RuntimeSession.create(f);
  assert.equal(session.engine.get(p.id),null);assert.equal(session.getObjectCapabilities(p.id).read,false);assert.doesNotMatch(session.engine.renderSVG(),new RegExp(`data-object-id="${p.id}"`));
  assert.throws(()=>session.engine.toJSON(),error=>error.code==='PERMISSION_DENIED');
 }
});
