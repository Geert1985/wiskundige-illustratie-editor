const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {runtime,plain}=require('./helpers.cjs');
const html=fs.readFileSync(path.join(__dirname,'../editor.html'),'utf8');
test('A2 catalog has one universal entry and no legacy path buttons for any catalog consumer',()=>{
 const ids=[...html.matchAll(/data-tool="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.filter(id=>id==='construct:pointOnObject').length,1);
 for(const kind of ['pointOnSegment','pointOnCircle','pointOnEllipse'])assert.ok(!ids.includes('construct:'+kind));
 for(const text of ['Punt op lijnstuk</span>','Punt op cirkel</span>','Punt op ellips</span>'])assert.ok(!html.includes(text));
 const MI=runtime(['model.js','renderer.js','index.js','editor.js']).MI,catalog=MI.ToolCatalog.create({categories:[{id:'manifest',label:'Manifest',entries:ids.filter(id=>id!=='select').map(id=>({id,label:id,status:'implemented',commandToolId:id.startsWith('construct:')?id:'create:'+id,lifecycle:id.startsWith('construct:')?'single':'repeat',interactionAdapter:id==='point'?'point':id==='text'?'text':id.startsWith('construct:')?'construction':id==='triangle'||id==='polygon'||id==='angle'||id==='rightAngle'?'polygon':'draw'}))}],splits:[]});
 for(const surface of ['sidebar','fullscreen'])assert.equal(catalog.list(surface)[0].entries.filter(entry=>/^construct:pointOn/.test(entry.id)).length,1);
 assert.equal(MI.ToolInstructions.describe('construct:pointOnObject',{mode:'construction',sources:[]}).total,2);
});
test('A2 universal dispatch still supports four carriers and concrete legacy recipes roundtrip',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','editor.js']).MI,e=new MI.Engine({version:9,ellipseSchema:1,objects:[{id:'L',type:'line',x1:0,y1:0,x2:8,y2:0},{id:'P',type:'polygon',vertices:[{x:20,y:0},{x:24,y:0},{x:24,y:3},{x:20,y:3}]},{id:'C',type:'circle',cx:40,cy:0,r:2},{id:'E',type:'ellipse',cx:60,cy:0,a:2,b:1,rotation:0}]});
 const app=Object.create(MI.EditorApp.prototype);app.engine=e;app.runtime=null;app.tool='construct:pointOnObject';app.transform=()=>({mathToScreen:p=>({x:p.x*100,y:p.y*100})});
 for(const [query,id,kind] of [[{x:2,y:0},'L','pointOnSegment'],[{x:24,y:1},'P','pointOnSegment'],[{x:42,y:0},'C','pointOnCircle'],[{x:62,y:0},'E','pointOnEllipse']]){
  const hit=app.pointOnObjectCandidates(query)[0];assert.ok(hit,id);assert.equal(hit.kind,kind);assert.equal(hit.ref.objectId,id);const p=e.construct(kind,[hit.ref],.25)[0];assert.equal(p.construction.kind,kind);
 }
 const saved=plain(e.toJSON()),loaded=new MI.Engine(saved);assert.deepEqual(plain(loaded.toJSON()),saved);assert.ok(!JSON.stringify(saved).includes('pointOnObject'));assert.throws(()=>MI.ConstructionService.contract('pointOnObject'));
 assert.equal(loaded.model.objects.filter(o=>o.construction?.kind==='pointOnSegment').length,2);assert.equal(loaded.model.objects.filter(o=>o.construction?.kind==='pointOnCircle').length,1);assert.equal(loaded.model.objects.filter(o=>o.construction?.kind==='pointOnEllipse').length,1);
});
