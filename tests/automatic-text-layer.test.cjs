const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
const setup=()=>runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI;
const text=(value='Tekst')=>({type:'text',x:0,y:0,text:value});
const rich=()=>({schema:3,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p',align:'left',lineHeight:1.25,runs:[{id:'t',kind:'text',text:'Straal ',marks:{bold:true}},{id:'m',kind:'math',source:'x^2',marks:{}},{id:'d',kind:'dynamicValue',binding:{sourceId:'C',property:'radius'},format:{precision:2,unitMode:'document',angleMode:'document',prefix:'',suffix:''},marks:{}}]}]});
const owner=(e,id)=>e.model.layers.find(l=>l.members.includes(id));
const execute=(c,op,p)=>c.execute(c.createCommand(op,p));

test('UI-LAYERS-TEXT-1 routes text centrally and geometry to highest visible ordinary layer',()=>{
 const MI=setup(),e=new MI.Engine({objects:[{id:'C',type:'circle',cx:0,cy:0,r:2},{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:2,y:0}]});
 const old=plain(e.toJSON());assert.equal(e.model.layers.length,0);
 const a=e.add(text()),id=e.model.meta.automaticTextLayerId,layer=e.model.layers.find(l=>l.id===id),base=e.model.layers[0];
 assert.equal(layer.name,'Tekst');assert.deepEqual(plain(base.members),['C','A','B']);
 for(let i=0;i<3;i++)assert.equal(owner(e,e.add(text()).id).id,id);assert.equal(e.model.layers.length,2);
 const shapes=[{type:'point',x:1,y:0},{type:'line',x1:0,y1:0,x2:1,y2:1},{type:'circle',cx:0,cy:0,r:1},{type:'vector',x1:0,y1:0,x2:1,y2:1},{type:'polygon',vertices:[{x:0,y:0},{x:1,y:0},{x:0,y:1}]}];
 for(const shape of shapes)assert.equal(owner(e,e.add(shape).id).id,base.id);
 assert.equal(owner(e,e.construct('midpoint',[{objectId:'A'},{objectId:'B'}])[0].id).id,base.id);
 const measurement=e.construct('area',[{objectId:'C'}])[0];assert.equal(owner(e,measurement.id).id,id);
 const ordinary=e.createLayer('Voorkeur');e.reorderLayers([base.id,ordinary.id,id]);assert.equal(owner(e,e.add(shapes[0]).id).id,ordinary.id);
 e.setLayerVisibility(ordinary.id,false);assert.equal(owner(e,e.add(shapes[0]).id).id,base.id);
 e.renameLayer(id,'Toelichtingen');assert.equal(owner(e,e.add(text()).id).id,id);
 const saved=plain(e.toJSON());assert.equal(saved.layerSchema,1);assert.equal(saved.meta.automaticTextLayerId,id);assert.deepEqual(plain(new MI.Engine(saved).toJSON()),saved);
 assert.deepEqual(plain(e.get('C')),plain(new MI.Engine(old).get('C')));assert.equal(owner(e,a.id).id,id);
});

test('UI-LAYERS-TEXT-1 legacy import, manual text edit, name collisions, copies and deletion',()=>{
 const MI=setup(),e=new MI.Engine({objects:[{id:'old',...text('Oud')}]});assert.equal(e.model.layers.length,0);assert.equal(e.model.meta.automaticTextLayerId,undefined);
 const named=e.createLayer('Tekst');const base=e.model.layers[0];assert.equal(owner(e,'old').id,base.id);
 const t=e.add(text()),id=e.model.meta.automaticTextLayerId;assert.notEqual(id,named.id);
 e.assignLayer([t.id],base.id);e.update(t.id,{text:'Gewijzigd'});assert.equal(owner(e,t.id).id,base.id);
 const copies=e.duplicateMany([t.id]);assert.equal(owner(e,copies[0].id).id,base.id);assert.equal(e.model.layers.length,3);
 e.removeLayer(id);assert.equal(e.model.meta.automaticTextLayerId,undefined);
 const n=e.add(text());assert.notEqual(e.model.meta.automaticTextLayerId,id);assert.equal(owner(e,n.id).id,e.model.meta.automaticTextLayerId);
 const legacy=new MI.Engine({objects:[{id:'a',...text()},{id:'b',type:'point',x:1,y:1}]});legacy.group(['a','b']);legacy.duplicateMany(['a','b']);assert.equal(legacy.model.layers.length,0);
 e.model.clear();assert.equal(e.model.meta.automaticTextLayerId,undefined);assert.equal(e.model.layers.length,0);
});

test('UI-LAYERS-TEXT-1 validation, hidden targets, legacy extensions and failures are atomic',()=>{
 const MI=setup(),e=new MI.Engine({objects:[]}),saved=plain(e.toJSON());
 for(const value of [null,'','missing',4,{}]){assert.throws(()=>e.load({...saved,meta:{automaticTextLayerId:value}}));assert.deepEqual(plain(e.toJSON()),saved);}
 const counter=e.model._nextId;assert.throws(()=>e.add({...text(),x:NaN}));assert.deepEqual(plain(e.toJSON()),saved);assert.equal(e.model._nextId,counter);
 e.add({...text(),id:'layer-1'});const id=e.model.meta.automaticTextLayerId;assert.notEqual(id,'layer-1');
 e.setLayerVisibility(id,false);const hidden=plain(e.toJSON()),next=e.model._nextId;assert.throws(()=>e.add(text()),/tekstlaag is verborgen/);assert.deepEqual(plain(e.toJSON()),hidden);assert.equal(e.model._nextId,next);assert.throws(()=>e.duplicateMany(['layer-1']),/verborgen/);assert.deepEqual(plain(e.toJSON()),hidden);
 e.setLayerVisibility(e.model.layers[0].id,false);assert.throws(()=>e.add({type:'point',x:1,y:1}),/gewone tekenlaag/);
 const opaque=new MI.Engine({objects:[],meta:{},version:2,layers:{legacy:true}}),before=plain(opaque.toJSON());assert.throws(()=>opaque.add(text()),/Legacy laaggegevens/);assert.deepEqual(plain(opaque.toJSON()),before);
});

test('UI-LAYERS-TEXT-1 typed rich commit, edit, replay and runtime permissions',()=>{
 const MI=setup(),e=new MI.Engine({objects:[{id:'C',type:'circle',cx:0,cy:0,r:2}]}),commands=MI.AuthorCommands(e),before=plain(e.toJSON());
 const payload={target:{kind:'new',position:{x:1,y:1}},content:rich()},created=execute(commands,'text.commit',payload).result,id=e.model.meta.automaticTextLayerId;
 assert.equal(owner(e,created.id).id,id);assert.equal(e.model.layers.length,2);assert.equal(e.get(created.id).textContent.paragraphs[0].runs.length,3);
 const sequence=new MI.SemanticSequence(before);sequence.execute('text.commit',payload);assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(e.toJSON()));
 const base=e.model.layers[0];e.assignLayer([created.id],base.id);execute(commands,'text.commit',{target:{kind:'existing',id:created.id},content:rich()});assert.equal(owner(e,created.id).id,base.id);
 const options=require('./permission-fixtures.cjs').fixture();options.policy.schema=2;options.policy.parameters={};options.policy.allowedTools.push('create:text');options.policy.createdObjectRules.text={read:true,display:true,textCapabilities:{content:true,format:true,math:true,references:true}};
 let {session,owner:inspect}=MI.RuntimeSession.create(options),snapshot=plain(inspect.inspect());
 const simple={...rich(),schema:1,paragraphs:[{id:'p',align:'left',lineHeight:1.25,runs:[{id:'r',kind:'text',text:'Nieuw',marks:{}}]}]};
 for(const [op,p] of [['text.commit',{target:payload.target,content:simple}],['object.create',{toolId:'create:text',object:text()}]]){assert.throws(()=>execute(session,op,p),err=>err.code==='MODE_DENIED');assert.deepEqual(plain(inspect.inspect()),snapshot);}
 options.initialDocument=plain(e.toJSON());options.policy.initialObjectRules={C:{},[created.id]:{}};
 ({session,owner:inspect}=MI.RuntimeSession.create(options));const n=execute(session,'text.commit',{target:payload.target,content:simple}).result;assert.ok(inspect.inspect().document.layers.find(l=>l.id===id).members.includes(n.id));
 const exported=execute(session,'document.exportJSON',{}).result;assert.equal(exported.meta.automaticTextLayerId,id);assert.equal(new MI.Engine(exported).model.meta.automaticTextLayerId,id);
 execute(session,'history.undo',{});assert.ok(!inspect.inspect().document.objects.some(o=>o.id===n.id));execute(session,'history.redo',{});assert.ok(inspect.inspect().document.objects.some(o=>o.id===n.id));
});
