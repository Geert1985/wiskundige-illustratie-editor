const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {runtime}=require('./helpers.cjs');
test('alias context plans exclude vectors and dimensions and retain explicit polygon edges',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','editor.js']).MI,app=Object.create(MI.EditorApp.prototype);app.toolAllowed=()=>true;app.runtime=null;
 for(const type of ['vector','dimension','straight','ray','point'])assert.equal(app.pointOnObjectPlans({id:'S',type,x1:0,y1:0,x2:2,y2:0,x:0,y:0}).length,0,type);
 assert.equal(app.pointOnObjectPlans({id:'L',type:'line',x1:0,y1:0,x2:2,y2:0})[0].concreteKind,'pointOnSegment');
 const polygon={id:'P',type:'polygon',vertices:[{x:0,y:0},{x:2,y:0},{x:0,y:2}]},ref={objectId:'P',part:'edge',index:1};assert.equal(app.pointOnObjectPlans(polygon).length,0);assert.equal(app.pointOnObjectPlans(polygon,ref)[0].sources[0].index,1);
});
test('polygon highlight uses SVG coordinates independently of viewport screen offsets',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','editor.js']).MI,app=Object.create(MI.EditorApp.prototype),attrs={},svg={querySelector:()=>null,appendChild:()=>{}},source={id:'P',type:'polygon',vertices:[{x:1,y:2},{x:3,y:4},{x:0,y:0}]};
 app.nodes={canvas:{querySelector:()=>svg}};app.document={createElementNS:()=>({setAttribute:(k,v)=>attrs[k]=v})};app.engine={get:()=>source,renderer:{renderPreview:()=>'',mapX:x=>10*x,mapY:y=>100-10*y}};app.interaction={sources:[{objectId:'P',part:'edge',index:0}]};app.transform=()=>{throw Error('Screen transform must not be used for SVG coordinates');};app.renderPointPlacementPreview();assert.equal(attrs.x1,10);assert.equal(attrs.y1,80);assert.equal(attrs.x2,30);assert.equal(attrs.y2,60);
});
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'editor.html'),'utf8'),editor=fs.readFileSync(path.join(root,'editor.js'),'utf8'),service=fs.readFileSync(path.join(root,'construction-service.js'),'utf8');
test('universal point is a UI adapter and dispatches only to existing concrete path recipes',()=>{
 assert.match(html,/data-tool="construct:pointOnObject"[^>]*>[\s\S]*?Punt op object/);
 assert.match(editor,/tool==='construct:pointOnObject'\)return \['pointOnSegment','pointOnCircle','pointOnEllipse'\]/);
 assert.match(editor,/const recipeTool='construct:'\+kind/);
 assert.match(editor,/toolId:recipeTool,sources:state\.sources,parameter/);
 assert.match(editor,/this\.toolAllowed\(toolId\)/);
 assert.match(editor,/sourceTools\.includes\(toolId\)/);
 assert.match(editor,/sourceCaps\.read\|\|!sourceCaps\.display\|\|!sourceCaps\.sourceTools\.includes\(recipeTool\)/);
 assert.match(editor,/canReveal=!this\.runtime\|\|caps\.read&&caps\.display&&source\.visible!==false&&this\.engine\.isDisplayed\(source\.id\)/);
 assert.doesNotMatch(service,/pointOnObject/);
 for(const recipe of ['pointOnSegment','pointOnCircle','pointOnEllipse'])assert.match(service,new RegExp('"?'+recipe+'"?'));
});
test('shared alias projection preserves concrete parameter domains and the exact polygon edge',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','editor.js']).MI,e=new MI.Engine({version:9,ellipseSchema:1,objects:[
  {id:'L',type:'line',x1:0,y1:0,x2:8,y2:0},
  {id:'P',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]},
  {id:'C',type:'circle',cx:2,cy:3,r:5},
  {id:'E',type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:.2}
 ]}),app=Object.create(MI.EditorApp.prototype),transform={mathToScreen:p=>({x:p.x*100,y:p.y*100})};
 app.engine=e;app.transform=()=>transform;
 const clamped=app.projectPath('pointOnSegment',e.get('P'),{objectId:'P',part:'edge',index:1},{x:4.05,y:3.02});
 assert.equal(clamped.valid,true);assert.equal(clamped.parameter,1);assert.deepEqual(JSON.parse(JSON.stringify(clamped.sourceRef)),{objectId:'P',part:'edge',index:1});assert.equal(clamped.point.x,4);assert.equal(clamped.point.y,3);
 const circle=app.projectPath('pointOnCircle',e.get('C'),{objectId:'C'},{x:2,y:8});assert.equal(circle.valid,true);assert.ok(Math.abs(circle.parameter-.25)<1e-12);assert.ok(Math.abs(circle.point.x-2)<1e-12);assert.ok(Math.abs(circle.point.y-8)<1e-12);
 const ellipsePoint=MI.EllipseGeometry.fromDefinition(e.get('E')).geometry.pointAt(.25),ellipse=app.projectPath('pointOnEllipse',e.get('E'),{objectId:'E'},ellipsePoint);assert.equal(ellipse.valid,true);assert.ok(Math.abs(ellipse.parameter-.25)<1e-12);assert.ok(Math.hypot(ellipse.point.x-ellipsePoint.x,ellipse.point.y-ellipsePoint.y)<1e-10);
});
