/* Linked constructions: validated references, acyclic resolution and recoverable degeneracy. */
(function(global){
 const MI=global.FZI.MathIllustration;
 const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const failure=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
 const isAxis=ref=>!!ref&&ref.kind==='axis';
 function validateAxis(ref){if(!ref||Object.keys(ref).some(k=>!['kind','frame','axis'].includes(k))||ref.kind!=='axis'||ref.frame!=='cartesian'||!['x','y'].includes(ref.axis))throw Error('Ongeldige asreferentie.');return {...ref};}
 const axisReferences=Object.freeze(['x','y'].map(axis=>Object.freeze({kind:'axis',frame:'cartesian',axis})));
 function axisLine(ref){validateAxis(ref);return {type:'straight',x1:0,y1:0,x2:ref.axis==='x'?1:0,y2:ref.axis==='y'?1:0};}
 const sourceObject=(ref,objects)=>isAxis(ref)?axisLine(ref):objects.get(ref.objectId);
 const axisRoles=Object.freeze({angleDirections:[0,1],lineCircleIntersection:[0],lineEllipseIntersection:[0],lineIntersection:[0,1],parallel:[0],perpendicular:[0]});
 const supportsAxis=(kind,index)=>Object.prototype.hasOwnProperty.call(axisRoles,kind)&&(index==null||axisRoles[kind].includes(index));
 MI.AxisReferences=Object.freeze({isAxis,validate:validateAxis,references:axisReferences,line:axisLine,supports:supportsAxis});
 const recipes={anglePoints:['angle',['point','point','point']],angleDirections:['angle',['line','line']],angleXAxis:['angle',['line']],circleByCenterPoint:['circle',['point','point']],circleCircleIntersection:['point',['circle','circle']],lineCircleIntersection:['point',['line','circle']],lineEllipseIntersection:['point',['line','ellipse']],lineIntersection:['point',['line','line']],lineBetweenPoints:['line',['point','point']],rayOrigin:['point',['ray']],pointOnSegment:['point',['segment']],pointOnCircle:['point',['circle']],pointOnEllipse:['point',['ellipse']],distributedPointOnCircle:['point',['circle']],perimeter:['text',['figure']],area:['text',['figure']],midpoint:['point',['point','point']],centroid:['point',['triangle']],circumcenter:['point',['triangle']],orthocenter:['point',['triangle']],incenter:['point',['triangle']],incircle:['circle',['triangle']],eulerLine:['straight',['triangle']],ninePointCircle:['circle',['triangle']],triangleFromPoints:['polygon',['point','point','point']],parallelogramBySideAngle:['polygon',['point','point']],polygonRegion:['region',['polygon']],circleSectorRegion:['region',['circle','point','point']],circleSegmentRegion:['region',['circle','point','point']],perpendicular:['straight',['line','point']],parallel:['straight',['line','point']],perpendicularBisector:['straight',['point','point']],bisector:['ray',['point','point','point']],tangent:['straight',['circle','point']],ellipseByFociAndSum:['ellipse',['point','point']],ellipseByFociAndPoint:['ellipse',['point','point','point']]};
 const fields={angle:['vertices'],circle:['cx','cy','r'],line:['x1','y1','x2','y2'],point:['x','y'],polygon:['vertices'],region:[],text:['x','y','text'],straight:['x1','y1','x2','y2'],ray:['x1','y1','x2','y2'],ellipse:['cx','cy','a','b','rotation','c','e','ellipseArea','ellipseBounds']};
 const definitions=freeze(Object.fromEntries(Object.entries(recipes).map(([kind,[resultType,sourceRoles]])=>[kind,{kind,resultType,sourceRoles,branches:['tangent','lineCircleIntersection','lineEllipseIntersection','circleCircleIntersection'].includes(kind)?[0,1]:[],computedFields:resultType==='region'?['regionGeometry','regionArea','regionStatus']:kind==='ellipseByFociAndSum'?fields.ellipse:fields[resultType]}])));
 const kinds=Object.fromEntries(Object.entries(definitions).map(([kind,d])=>[kind,d.sourceRoles.length]));
 function contract(kind){if(!Object.prototype.hasOwnProperty.call(definitions,kind))failure('INVALID_CONSTRUCTION_KIND','Onbekende constructie.');return definitions[kind];}
 function polygonVertexCount(object){if(Array.isArray(object.vertices))return object.vertices.length;if(object.type==='polygon'&&object.constructionValid===false){if(object.construction?.kind==='parallelogramBySideAngle')return 4;if(object.construction?.kind==='triangleFromPoints')return 3;}return 0;}
 function polygonPartExists(object,part,index){const count=polygonVertexCount(object);return count>0&&Number.isInteger(index)&&index>=0&&index<count&&object.type==='polygon'&&(part==='vertex'||part==='edge');}
 function accepts(object,ref,role){
  if(role==='triangle')return ref.part==null&&ref.index==null&&object.type==='polygon'&&Array.isArray(object.vertices)&&object.vertices.length===3;
  if(role==='polygon')return ref.part==null&&ref.index==null&&object.type==='polygon';
  if(role==='ellipse')return ref.part==null&&ref.index==null&&object.type==='ellipse';
  if(role==='ray')return ref.part==null&&ref.index==null&&object.type==='ray';
  if(role==='segment')return (ref.part==='edge'&&polygonPartExists(object,'edge',ref.index))||(ref.part==null&&ref.index==null&&['line','vector','dimension'].includes(object.type));
  if(ref.index!=null&&!['vertex','edge'].includes(ref.part))return false;
  if(role==='point'){if(ref.part==null)return object.type==='point';if(['start','end'].includes(ref.part))return MI.LinearGeometry.isLinear(object);return ref.part==='vertex'&&(polygonPartExists(object,'vertex',ref.index)||object.type==='angle'&&Array.isArray(object.vertices)&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length);}
  if(role==='line'){if(ref.part==null)return MI.LinearGeometry.isLinear(object);return ref.part==='edge'&&polygonPartExists(object,'edge',ref.index);}
  return ref.part==null&&(role==='circle'?object.type==='circle':['circle','polygon'].includes(object.type));
 }
 const pathKind=kind=>['pointOnSegment','pointOnCircle','pointOnEllipse'].includes(kind);
 const schema2=kind=>MI.AngleMeasurements.isLinked(kind)||pathKind(kind)||['ellipseByFociAndSum','ellipseByFociAndPoint','distributedPointOnCircle','lineBetweenPoints','rayOrigin','lineIntersection','lineCircleIntersection','lineEllipseIntersection','circleCircleIntersection','circleByCenterPoint','centroid','circumcenter','orthocenter','incenter','incircle','eulerLine','ninePointCircle','triangleFromPoints','parallelogramBySideAngle'].includes(kind);
 function normaliseParameter(kind,value=0){if(!pathKind(kind)){if(value!==0)failure('INVALID_PARAMETER','Deze constructie heeft geen padparameter.');return undefined;}if(typeof value!=='number'||!Number.isFinite(value))failure('INVALID_PARAMETER','De padpositie moet eindig zijn.');if(kind==='pointOnSegment')return Math.max(0,Math.min(1,value));const t=value%1;return t<0?t+1:t===0?0:t;}
 function referencesForRole(o,role,kind){const refs=referenceOptions(o),candidates=role==='segment'?refs.line.filter(ref=>accepts(o,ref,'segment')):refs[role]||[];return kind==='triangleFromPoints'?candidates.filter(ref=>role==='point'&&o.type==='point'&&ref.part==null&&ref.index==null):candidates;}
 // Contextual construction matching is owned by the construction service,
 // rather than by a radial UI whitelist of object.type strings. A newly
 // supported object becomes discoverable as soon as its role references and
 // an implemented tool are registered in the normal service/catalog.
 const contextualWorkflows=Object.freeze({
  // Separate creation transaction; cannot be created through construction.create.
  distributedPointOnCircle:'external',
  // The current pointer workflow must capture directed arm orientation.
  angleDirections:'directed-arms',
  parallelogramBySideAngle:'side-angle-placement'
 });
 const contextualCompletes=Object.freeze({
  // A segment's two explicitly named endpoints supply a single meaningful
  // pair of point roles; arbitrary polygon vertex pairs are ambiguous.
  midpoint:'endpoints',
  perpendicularBisector:'endpoints'
 });
 function contextualPlans(o,kind,partRef=null){
  if(!o||typeof o.id!=='string'||!o.id)return [];
  const d=contract(kind);
  if(contextualWorkflows[kind]&&contextualWorkflows[kind]!=='side-angle-placement')return [];
  const plans=[];
  if(partRef?.part==='edge'&&o.type==='polygon'&&o.constructionValid!==false&&Array.isArray(o.vertices)&&Number.isInteger(partRef.index)&&partRef.index>=0&&partRef.index<o.vertices.length){const edge={objectId:o.id,part:'edge',index:partRef.index},a={objectId:o.id,part:'vertex',index:partRef.index},b={objectId:o.id,part:'vertex',index:(partRef.index+1)%o.vertices.length};if(['midpoint','perpendicularBisector'].includes(kind))return [Object.freeze({key:'edge:'+partRef.index,mode:'complete',sourceIndex:0,sources:Object.freeze([a,b])})];if(kind==='pointOnSegment')return [Object.freeze({key:'edge:'+partRef.index,mode:'placement',sourceIndex:0,sources:Object.freeze([edge])})];if(['parallel','perpendicular','lineIntersection','lineCircleIntersection','lineEllipseIntersection'].includes(kind))return [Object.freeze({key:'edge:'+partRef.index,mode:'prefill',sourceIndex:0,sources:Object.freeze([edge])})];return [];}
  const pointRoles=d.sourceRoles.length===2&&d.sourceRoles.every(r=>r==='point');
  if(pointRoles&&contextualCompletes[kind]==='endpoints'&&o.type==='line'){
   const refs=referenceOptions(o).point||[];
   const start=refs.find(ref=>ref.objectId===o.id&&ref.part==='start');
   const end=refs.find(ref=>ref.objectId===o.id&&ref.part==='end');
   if(start&&end)plans.push(Object.freeze({
    key:'endpoints',mode:'complete',sourceIndex:0,
    sources:Object.freeze([{...start},{...end}])
   }));
  }
  for(let index=0;index<d.sourceRoles.length;index++){
   if(kind==='ellipseByFociAndPoint'&&index===2)continue;
   const role=d.sourceRoles[index];
   const ref=referencesForRole(o,role,kind).find(ref=>
    ref.objectId===o.id&&ref.part==null&&ref.index==null);
   if(!ref)continue;
   // Parameter-bearing linked points require a placement click. Other
   // single-role constructs are complete as soon as their source is known.
   const mode=pathKind(kind)||contextualWorkflows[kind]==='side-angle-placement'?'placement':
    d.sourceRoles.length===1?'complete':'prefill';
   if(mode==='placement'&&index!==0)continue;
   plans.push(Object.freeze({
    key:'whole:'+index,mode,sourceIndex:index,
    sources:Object.freeze([{...ref}])
   }));
  }
  return Object.freeze(plans);
 }
 function projectParameter(kind,o,ref,p,map){if(kind==='pointOnCircle')return normaliseParameter(kind,Math.atan2(p.y-o.cy,p.x-o.cx)/(2*Math.PI));if(kind==='pointOnEllipse'){const nearest=MI.EllipseGeometry.nearest(o,p,map);if(!nearest)failure('INVALID_PARAMETER','De ellipspositie kan niet worden berekend.');return normaliseParameter(kind,nearest.parameter);}const l=line(o,ref),dx=l.x2-l.x1,dy=l.y2-l.y1,n=dx*dx+dy*dy;return normaliseParameter(kind,n?((p.x-l.x1)*dx+(p.y-l.y1)*dy)/n:0);}
 function validateReferences(c,objects){validate(c);const d=contract(c.kind);if(c.kind==='triangleFromPoints'&&new Set(c.sources.map(ref=>ref.objectId)).size!==3)failure('INVALID_REFERENCE','Kies drie verschillende punten.');c.sources.forEach((ref,i)=>{if(isAxis(ref)){validateAxis(ref);if(d.sourceRoles[i]!=='line'||!supportsAxis(c.kind,i))failure('INVALID_REFERENCE','Dit gereedschap ondersteunt geen asbron voor deze bronrol.');return;}const o=objects.get(ref.objectId);if(!o)failure('MISSING_REFERENCE','Constructiebron ontbreekt: '+ref.objectId);if(c.kind==='triangleFromPoints'&&(ref.part!=null||ref.index!=null||o.type!=='point'))failure('INVALID_REFERENCE','Deze driehoekconstructie vereist drie bestaande Punt-objecten.');if(ref.arm!=null&&(c.kind!=='angleDirections'||!(ref.part==='edge'||['line','straight','dimension'].includes(o.type))))failure('INVALID_REFERENCE','Deze bron ondersteunt geen hoekarm.');if(!accepts(o,ref,d.sourceRoles[i]))failure('INVALID_REFERENCE','Deze bron of dit onderdeel past niet bij de constructie.');});}
 function referenceOptions(o){const refs={point:[],line:[],circle:[],ellipse:[],figure:[],polygon:[]};if(!o)return freeze(refs);const whole={objectId:o.id};if(o.type==='point')refs.point.push(whole);if(MI.LinearGeometry.isLinear(o)){refs.point.push({objectId:o.id,part:'start'},{objectId:o.id,part:'end'});refs.line.push(whole);if(o.type==='ray')refs.ray=[whole];}if(['polygon','angle'].includes(o.type))o.vertices.forEach((p,index)=>{refs.point.push({objectId:o.id,part:'vertex',index});if(o.type==='polygon')refs.line.push({objectId:o.id,part:'edge',index});});if(o.type==='circle')refs.circle.push(whole);if(o.type==='ellipse')refs.ellipse.push(whole);if(o.type==='polygon')refs.polygon.push(whole);if(['circle','polygon'].includes(o.type))refs.figure.push(whole);if(accepts(o,whole,'triangle'))refs.triangle=[whole];return freeze(refs);}
 function validateUpdate(objects,current,patch){
  if(current.construction&&Object.prototype.hasOwnProperty.call(patch,'construction')&&!patch.construction)failure('CONSTRUCTION_LINK_MANAGED','Gebruik Constructie losmaken om de koppeling te verwijderen.');
  if(current.construction)for(const key of contract(current.construction.kind).computedFields)if(key in patch&&JSON.stringify(patch[key])!==JSON.stringify(current[key]))failure('COMPUTED_FIELD','Deze waarde wordt berekend. Maak de constructie eerst los om ze vrij te bewerken.');
  if(current.vertices&&Array.isArray(patch.vertices)&&patch.vertices.length!==current.vertices.length&&objects.some(o=>o.construction?.sources.some((ref,index)=>ref.objectId===current.id&&(['vertex','edge'].includes(ref.part)||(!ref.part&&contract(o.construction.kind).sourceRoles[index]==='triangle')))))failure('TOPOLOGY_REFERENCED','Dit object heeft gekoppelde hoekpunten of driehoeksconstructies; het aantal hoekpunten kan niet worden gewijzigd.');
 }
 function lineIntersection(c,source){
  const lines=source.map((o,i)=>({...line(o,c.sources[i]),type:c.sources[i].part==='edge'?'line':o.type}));
  const [a,b]=lines,ax=a.x2-a.x1,ay=a.y2-a.y1,bx=b.x2-b.x1,by=b.y2-b.y1,al=Math.hypot(ax,ay),bl=Math.hypot(bx,by);
  const invalid=reasonCode=>({geometry:null,reasonCode});if(al<=1e-9||bl<=1e-9)return invalid('DEGENERATE_DIRECTION');
  const ux=ax/al,uy=ay/al,vx=bx/bl,vy=by/bl,cross=ux*vy-uy*vx,qx=b.x1-a.x1,qy=b.y1-a.y1;
  if(Math.abs(cross)<=1e-12)return invalid(Math.abs(qx*uy-qy*ux)<=1e-9?'COINCIDENT_LINES':'PARALLEL_LINES');
  const distance=(qx*vy-qy*vx)/cross,other=(qx*uy-qy*ux)/cross;
  if(!MI.LinearGeometry.accepts(a,distance/al)||!MI.LinearGeometry.accepts(b,other/bl))return invalid('OUTSIDE_DOMAINS');
  return {geometry:{type:'point',x:a.x1+distance*ux,y:a.y1+distance*uy},reasonCode:'VALID'};
 }
 function lineCircleIntersection(c,source){
  const l={...line(source[0],c.sources[0]),type:c.sources[0].part==='edge'?'line':source[0].type},circle=source[1],dx=l.x2-l.x1,dy=l.y2-l.y1,len=Math.hypot(dx,dy),invalid=reasonCode=>({geometry:null,reasonCode});
  if(circle.r<=0)return invalid('ZERO_RADIUS');if(len<=1e-9)return invalid('DEGENERATE_DIRECTION');
  const ux=dx/len,uy=dy/len,qx=circle.cx-l.x1,qy=circle.cy-l.y1,along=qx*ux+qy*uy,distance=Math.abs(qx*uy-qy*ux),r=circle.r,tolerance=1e-9*Math.max(1,r,distance);
  if(distance>r+tolerance)return invalid('NO_REAL_INTERSECTION');
  const tangent=Math.abs(distance-r)<=tolerance;if(tangent&&c.branch===1)return invalid('MERGED_INTERSECTION');
  const offset=tangent?0:Math.sqrt(Math.max(0,(r-distance)*(r+distance))),position=along+(c.branch===1?offset:-offset);
  if(!MI.LinearGeometry.accepts(l,position/len))return invalid('OUTSIDE_DOMAINS');
  return {geometry:{type:'point',x:l.x1+position*ux,y:l.y1+position*uy},reasonCode:'VALID'};
 }
 function lineEllipseIntersection(c,source){
  const invalid=reasonCode=>({geometry:null,reasonCode}),l={...line(source[0],c.sources[0]),type:c.sources[0].part==='edge'?'line':source[0].type},resolved=MI.EllipseGeometry.fromDefinition(source[1]);
  if(resolved.reasonCode!=='VALID')return invalid(resolved.reasonCode==='COORDINATE_LIMIT'?resolved.reasonCode:'SOURCE_INVALID');
  const g=resolved.geometry,dx=l.x2-l.x1,dy=l.y2-l.y1,len=Math.hypot(dx,dy);
  if(![l.x1,l.y1,l.x2,l.y2,len].every(Number.isFinite))return invalid('NON_FINITE_RESULT');
  if(len<=1e-9)return invalid('DEGENERATE_DIRECTION');
  const ux=dx/len,uy=dy/len,rx=l.x1-g.center.x,ry=l.y1-g.center.y;
  // Work in the translated, normalized ellipse frame. A common scale keeps
  // the quadratic coefficients bounded even for large offsets and thin axes.
  const qx=((rx*g.u.x+ry*g.u.y)/g.a),qy=((rx*g.v.x+ry*g.v.y)/g.b),vx=((ux*g.u.x+uy*g.u.y)/g.a),vy=((ux*g.v.x+uy*g.v.y)/g.b);
  if(![qx,qy,vx,vy].every(Number.isFinite))return invalid('NUMERIC_UNRESOLVED');
  const scale=Math.max(1,Math.abs(qx),Math.abs(qy),Math.abs(vx),Math.abs(vy)),Qx=qx/scale,Qy=qy/scale,Vx=vx/scale,Vy=vy/scale,inverseScale=1/scale,radiusSquared=inverseScale*inverseScale;
  if(radiusSquared===0)return invalid('NUMERIC_UNRESOLVED');
  const A=Vx*Vx+Vy*Vy,B=2*(Qx*Vx+Qy*Vy),C=Qx*Qx+Qy*Qy-radiusSquared;
  if(!(A>0)||![A,B,C].every(Number.isFinite))return invalid('NUMERIC_UNRESOLVED');
  const bb=B*B,fourAC=4*A*C,discriminant=bb-fourAC,errorBound=64*Number.EPSILON*(Math.abs(bb)+Math.abs(fourAC));
  if(!Number.isFinite(discriminant)||!Number.isFinite(errorBound))return invalid('NUMERIC_UNRESOLVED');
  if(discriminant < -errorBound)return invalid('NO_REAL_INTERSECTION');
  if(discriminant!==0&&Math.abs(discriminant)<=errorBound)return invalid('NUMERIC_UNRESOLVED');
  if(discriminant<0)return invalid('NO_REAL_INTERSECTION');
  const tangent=discriminant===0;
  if(tangent&&c.branch===1)return invalid('MERGED_INTERSECTION');
  let roots;
  if(tangent)roots=[-B/(2*A)];
  else {const root=Math.sqrt(discriminant),stable=-.5*(B+(B<0?-root:root));if(stable===0)roots=[(-B-root)/(2*A),(-B+root)/(2*A)];else roots=[stable/A,C/stable].sort((a,b)=>a-b);}
  const s=roots[c.branch===1?1:0];if(!Number.isFinite(s))return invalid('NUMERIC_UNRESOLVED');
  const x=l.x1+ux*s,y=l.y1+uy*s,p={x,y};
  if(!Number.isFinite(x)||!Number.isFinite(y))return invalid('NON_FINITE_RESULT');
  if(Math.abs(x)>1e12||Math.abs(y)>1e12)return invalid('COORDINATE_LIMIT');
  if(!MI.LinearGeometry.accepts(l,s/len))return invalid('OUTSIDE_DOMAINS');
  const ex=((x-g.center.x)*g.u.x+(y-g.center.y)*g.u.y)/g.a,ey=((x-g.center.x)*g.v.x+(y-g.center.y)*g.v.y)/g.b,residual=ex*ex+ey*ey-1;
  // Include the representational uncertainty of subtracting a large translated
  // center from a thin ellipse, but fail closed when that uncertainty is too wide.
  const residualBound=512*Number.EPSILON*(1+Math.abs(ex*ex)+Math.abs(ey*ey))+8*Number.EPSILON*((Math.abs(x)+Math.abs(g.center.x))/g.a+(Math.abs(y)+Math.abs(g.center.y))/g.b);
  if(residualBound>1e-3)return invalid('NUMERIC_UNRESOLVED');
  const lineResidual=Math.abs((x-l.x1)*uy-(y-l.y1)*ux),lineBound=64*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(y),Math.abs(l.x1),Math.abs(l.y1),Math.abs(s));
  if(![ex,ey,residual,lineResidual].every(Number.isFinite)||Math.abs(residual)>residualBound||lineResidual>lineBound)return invalid('NUMERIC_UNRESOLVED');
  return {geometry:{type:'point',x,y},reasonCode:'VALID'};
 }
 function circleCircleIntersection(c,source){
  const [a,b]=source,dx=b.cx-a.cx,dy=b.cy-a.cy,d=Math.hypot(dx,dy),r=a.r,s=b.r,invalid=reasonCode=>({geometry:null,reasonCode}),tolerance=1e-9*Math.max(1,r,s,d);
  if(r<=0||s<=0)return invalid('ZERO_RADIUS');
  if(d<=1e-9)return invalid(Math.abs(r-s)<=tolerance?'COINCIDENT_CIRCLES':'CONCENTRIC_CIRCLES');
  if(d>r+s+tolerance)return invalid('SEPARATE_CIRCLES');
  if(d<Math.abs(r-s)-tolerance)return invalid('CONTAINED_CIRCLES');
  const tangent=Math.abs(d-r-s)<=tolerance||Math.abs(d-Math.abs(r-s))<=tolerance;
  if(tangent&&c.branch===1)return invalid('MERGED_INTERSECTION');
  const scale=Math.max(r,s,d),rn=r/scale,sn=s/scale,dn=d/scale,along=(dn*dn+(rn-sn)*(rn+sn))/(2*dn),heightSquared=rn*rn-along*along;
  if(!tangent&&heightSquared<0)return invalid('CONTAINED_CIRCLES');
  const h=tangent?0:scale*Math.sqrt(Math.max(0,heightSquared)),offset=along*scale,ux=dx/d,uy=dy/d,sign=c.branch===1?-1:1;
  return {geometry:{type:'point',x:a.cx+offset*ux-sign*h*uy,y:a.cy+offset*uy+sign*h*ux},reasonCode:'VALID'};
 }
 const TRIANGLE_CENTER_KINDS=new Set(['centroid','circumcenter','orthocenter']);
 const TRIANGLE_M6B_KINDS=new Set(['incenter','incircle','eulerLine','ninePointCircle']);
 const TRIANGLE_DEGENERACY_LIMIT=1e-12,INVARIANT_ULPS=128;
 function triangleShapeStatus(vertices){
  if(!Array.isArray(vertices)||vertices.length!==3)return 'INVALID_REFERENCE';
  if(vertices.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return 'NON_FINITE_RESULT';
  const [a,b,c]=vertices,abx=b.x-a.x,aby=b.y-a.y,acx=c.x-a.x,acy=c.y-a.y;
  const scale=Math.max(Math.hypot(abx,aby),Math.hypot(acx,acy),Math.hypot(c.x-b.x,c.y-b.y));
  if(!Number.isFinite(scale))return 'NON_FINITE_RESULT';
  if(scale===0)return 'DEGENERATE_TRIANGLE';
  const determinant=(abx/scale)*(acy/scale)-(aby/scale)*(acx/scale);
  if(!Number.isFinite(determinant))return 'NON_FINITE_RESULT';
  return Math.abs(determinant)<=TRIANGLE_DEGENERACY_LIMIT?'DEGENERATE_TRIANGLE':null;
 }
 function triangleInvariantStatus(u,v,g,o,h){
  if([u,v,g,o,h].some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return 'NON_FINITE_RESULT';
  const epsilon=INVARIANT_ULPS*Number.EPSILON;
  const close=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=epsilon*Math.max(1,Math.abs(x),Math.abs(y));
  const dot=(x,y)=>x.x*y.x+x.y*y.y,norm=p=>Math.hypot(p.x,p.y);
  const oa=norm(o),ob=norm({x:o.x-u.x,y:o.y-u.y}),oc=norm({x:o.x-v.x,y:o.y-v.y});
  const altitudeResidual=(from,edge)=>Math.abs(dot(from,edge))/Math.max(1,norm(from)*norm(edge));
  const hA={x:h.x,y:h.y},hB={x:h.x-u.x,y:h.y-u.y},hC={x:h.x-v.x,y:h.y-v.y};
  const residuals=[oa,ob,oc,altitudeResidual(hA,{x:v.x-u.x,y:v.y-u.y}),altitudeResidual(hB,v),altitudeResidual(hC,u)];
  if(!residuals.every(Number.isFinite))return 'NON_FINITE_RESULT';
  if(!close(oa,ob)||!close(oa,oc)||residuals.slice(3).some(value=>value>epsilon)||!close(g.x,u.x/3+v.x/3)||!close(g.y,u.y/3+v.y/3)||!close(h.x,3*g.x-2*o.x)||!close(h.y,3*g.y-2*o.y))return 'INVARIANT_FAILURE';
  return null;
 }
 function triangleCenter(c,triangle){
  const vertices=triangle?.vertices;
  if(triangle?.type!=='polygon'||!Array.isArray(vertices)||vertices.length!==3)return {geometry:null,reasonCode:'INVALID_REFERENCE'};
  const shapeStatus=triangleShapeStatus(vertices);if(shapeStatus)return {geometry:null,reasonCode:shapeStatus};
  const [a,b,d]=vertices,abx=b.x-a.x,aby=b.y-a.y,acx=d.x-a.x,acy=d.y-a.y;
  const s=Math.max(Math.hypot(abx,aby),Math.hypot(acx,acy),Math.hypot(d.x-b.x,d.y-b.y));
  if(!Number.isFinite(s))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  if(s===0)return {geometry:null,reasonCode:'DEGENERATE_TRIANGLE'};
  const u={x:abx/s,y:aby/s},v={x:acx/s,y:acy/s},q=u.x*v.y-u.y*v.x;
  if(!Number.isFinite(q))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  const uu=u.x*u.x+u.y*u.y,vv=v.x*v.x+v.y*v.y;
  const o={x:(uu*v.y-vv*u.y)/(2*q),y:(u.x*vv-v.x*uu)/(2*q)};
  const g={x:(u.x+v.x)/3,y:(u.y+v.y)/3};
  const h={x:u.x+v.x-2*o.x,y:u.y+v.y-2*o.y};
  const local=c.kind==='centroid'?g:c.kind==='circumcenter'?o:h;
  const point={type:'point',x:a.x+s*local.x,y:a.y+s*local.y};
  if(![o.x,o.y,g.x,g.y,h.x,h.y,point.x,point.y].every(Number.isFinite))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  if(Math.abs(point.x)>1e12||Math.abs(point.y)>1e12)return {geometry:null,reasonCode:'COORDINATE_LIMIT'};
  const invariantStatus=triangleInvariantStatus(u,v,g,o,h);
  if(invariantStatus)return {geometry:null,reasonCode:invariantStatus};
  return {geometry:point,reasonCode:'VALID'};
 }
 function triangleM6b(c,triangle){
  const vertices=triangle?.vertices;
  if(triangle?.type!=='polygon'||!Array.isArray(vertices)||vertices.length!==3)return {geometry:null,reasonCode:'INVALID_REFERENCE'};
  const shapeStatus=triangleShapeStatus(vertices);if(shapeStatus)return {geometry:null,reasonCode:shapeStatus};
  const [a,b,d]=vertices,abx=b.x-a.x,aby=b.y-a.y,acx=d.x-a.x,acy=d.y-a.y;
  const s=Math.max(Math.hypot(abx,aby),Math.hypot(acx,acy),Math.hypot(d.x-b.x,d.y-b.y));
  if(!Number.isFinite(s))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  if(s===0)return {geometry:null,reasonCode:'DEGENERATE_TRIANGLE'};
  const u={x:abx/s,y:aby/s},v={x:acx/s,y:acy/s},q=u.x*v.y-u.y*v.x;
  if(!Number.isFinite(q))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  const uu=u.x*u.x+u.y*u.y,vv=v.x*v.x+v.y*v.y,o={x:(uu*v.y-vv*u.y)/(2*q),y:(u.x*vv-v.x*uu)/(2*q)},g={x:(u.x+v.x)/3,y:(u.y+v.y)/3},h={x:u.x+v.x-2*o.x,y:u.y+v.y-2*o.y};
  if(![o.x,o.y,g.x,g.y,h.x,h.y].every(Number.isFinite))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  const world=local=>({x:a.x+s*local.x,y:a.y+s*local.y}),norm=p=>Math.hypot(p.x,p.y),epsilon=INVARIANT_ULPS*Number.EPSILON;
  if(c.kind==='incenter'||c.kind==='incircle'){
   const sideA=Math.hypot(v.x-u.x,v.y-u.y),sideB=norm(v),sideC=norm(u),perimeter=sideA+sideB+sideC;
   if(!Number.isFinite(perimeter)||perimeter===0)return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
   const incenterLocal={x:(sideB*u.x+sideC*v.x)/perimeter,y:(sideB*u.y+sideC*v.y)/perimeter},inradiusLocal=Math.abs(q)/perimeter,i=world(incenterLocal),radius=s*inradiusLocal;
   if(![i.x,i.y,radius].every(Number.isFinite)||radius<=0)return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
   const cross=(p,r)=>p.x*r.y-p.y*r.x,bc={x:v.x-u.x,y:v.y-u.y},distances=[Math.abs(cross(u,incenterLocal))/norm(u),Math.abs(cross(bc,{x:incenterLocal.x-u.x,y:incenterLocal.y-u.y}))/norm(bc),Math.abs(cross(v,incenterLocal))/norm(v)];
   if(!distances.every(Number.isFinite))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
   if(distances.some(value=>Math.abs(value-inradiusLocal)>epsilon*Math.max(1,value,inradiusLocal)))return {geometry:null,reasonCode:'INVARIANT_FAILURE'};
   return c.kind==='incenter'?{geometry:{type:'point',...i},reasonCode:'VALID'}:{geometry:{type:'circle',cx:i.x,cy:i.y,r:radius},reasonCode:'VALID'};
  }
  if(c.kind==='eulerLine'){
   const direction={x:h.x-o.x,y:h.y-o.y},length=norm(direction),centerScale=Math.max(1,norm(o),norm(h));
   if(!Number.isFinite(length))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
   // At an equilateral triangle O=H and there is no unique Euler line. Treat
   // center separations below binary64 resolution as the same undefined case.
   if(length<=epsilon*centerScale)return {geometry:null,reasonCode:'UNDEFINED_EULER_LINE'};
   const start=world(o),end=world(h);
   if(start.x===end.x&&start.y===end.y)return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
   return {geometry:{type:'straight',x1:start.x,y1:start.y,x2:end.x,y2:end.y},reasonCode:'VALID'};
  }
  const nineCenter={x:(o.x+h.x)/2,y:(o.y+h.y)/2},nineRadius=norm(o)/2,midpoints=[{x:u.x/2,y:u.y/2},{x:v.x/2,y:v.y/2},{x:(u.x+v.x)/2,y:(u.y+v.y)/2}],radii=midpoints.map(point=>norm({x:point.x-nineCenter.x,y:point.y-nineCenter.y}));
  if(!Number.isFinite(nineRadius)||nineRadius<=0||!radii.every(Number.isFinite))return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  if(radii.some(value=>Math.abs(value-nineRadius)>epsilon*Math.max(1,value,nineRadius)))return {geometry:null,reasonCode:'INVARIANT_FAILURE'};
  const center=world(nineCenter),radiusWorld=s*nineRadius;
  if(![center.x,center.y,radiusWorld].every(Number.isFinite)||radiusWorld<=0)return {geometry:null,reasonCode:'NON_FINITE_RESULT'};
  return {geometry:{type:'circle',cx:center.x,cy:center.y,r:radiusWorld},reasonCode:'VALID'};
 }
 function triangleFromPoints(c,source){const vertices=c.sources.map((ref,index)=>point(source[index],ref));return {geometry:{type:'polygon',vertices},reasonCode:triangleShapeStatus(vertices)||'VALID'};}
 function parallelogramResult(c,source){const invalid=reasonCode=>({geometry:null,reasonCode});try{validate(c);}catch(_){return invalid('INVALID_PARAMETERS');}if(source.some(o=>o?.type!=='point'||o.construction&&o.constructionValid===false))return invalid('SOURCE_INVALID');const [a,b]=source,vx=b.x-a.x,vy=b.y-a.y,ab=Math.hypot(vx,vy);if(!Number.isFinite(ab))return invalid('NON_FINITE_RESULT');if(ab<=1e-9)return invalid('COINCIDENT_POINTS');const sideLength=c.sideLengthMode==='matchAB'?ab:c.sideLength,ux=vx/ab,uy=vy/ab,co=Math.cos(c.signedAngle),si=Math.sin(c.signedAngle),wx=sideLength*(co*ux-si*uy),wy=sideLength*(si*ux+co*uy),d={x:a.x+wx,y:a.y+wy},cc={x:b.x+wx,y:b.y+wy},vertices=[{x:a.x,y:a.y},{x:b.x,y:b.y},cc,d];if(vertices.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return invalid('NON_FINITE_RESULT');if(vertices.some(p=>Math.abs(p.x)>1e12||Math.abs(p.y)>1e12))return invalid('COORDINATE_LIMIT');try{MI.PolygonGeometry.validate(vertices);}catch(_){return invalid('DEGENERATE_PARALLELOGRAM');}return {geometry:{type:'polygon',vertices},reasonCode:'VALID'};}
 function parallelogramShape(object){if(!object||object.type!=='polygon'||object.construction?.kind!=='parallelogramBySideAngle'||object.constructionValid===false||!Array.isArray(object.vertices)||object.vertices.length!==4)return null;const v=object.vertices,lengths=v.map((p,i)=>Math.hypot(v[(i+1)%4].x-p.x,v[(i+1)%4].y-p.y)),scale=Math.max(1,...lengths),rhombus=Math.max(...lengths)-Math.min(...lengths)<=1e-9*scale,ab={x:v[1].x-v[0].x,y:v[1].y-v[0].y},ad={x:v[3].x-v[0].x,y:v[3].y-v[0].y},right=Math.abs(ab.x*ad.x+ab.y*ad.y)<=1e-9*Math.max(1,Math.hypot(ab.x,ab.y)*Math.hypot(ad.x,ad.y));return rhombus?(right?'Vierkant':'Ruit'):(right?'Rechthoek':'Parallellogram');}
 function evaluate(c,objects,distributions,geometryCache){
  validateReferences(c,objects);const source=c.sources.map(ref=>sourceObject(ref,objects)),regionKind=['polygonRegion','circleSectorRegion','circleSegmentRegion'].includes(c.kind);if(source.some(o=>o.construction&&o.constructionValid===false))return {valid:false,reasonCode:'SOURCE_INVALID',geometry:regionKind?{type:'region',regionGeometry:null,regionArea:null,regionStatus:'SOURCE_INVALID'}:null};
  if(c.kind==='parallelogramBySideAngle'){const result=parallelogramResult(c,source);return {valid:result.reasonCode==='VALID',reasonCode:result.reasonCode,geometry:result.geometry};}
  const regionResult=regionKind?MI.RegionGeometry.resolve(c,source):null;
  const ellipseResult=['ellipseByFociAndSum','ellipseByFociAndPoint'].includes(c.kind)?MI.EllipseGeometry.resolve(c,source):null;
  const triangleResult=TRIANGLE_CENTER_KINDS.has(c.kind)?triangleCenter(c,source[0]):TRIANGLE_M6B_KINDS.has(c.kind)?triangleM6b(c,source[0]):c.kind==='triangleFromPoints'?triangleFromPoints(c,source):null;
  if(regionKind)return {valid:regionResult.reasonCode==='VALID',reasonCode:regionResult.reasonCode,geometry:{type:'region',regionGeometry:regionResult.geometry,regionArea:regionResult.area,regionStatus:regionResult.reasonCode}};
  if(ellipseResult){const g=ellipseResult.geometry;return {valid:ellipseResult.reasonCode==='VALID',reasonCode:ellipseResult.reasonCode,geometry:g?{type:'ellipse',cx:g.center.x,cy:g.center.y,a:g.a,b:g.b,rotation:g.rotation,c:g.c,e:g.e,ellipseArea:ellipseResult.area,ellipseBounds:g.bounds}:null};}
  const geometry=triangleResult?triangleResult.geometry:calculate(c,objects,distributions,geometryCache);let reasonCode=triangleResult?.reasonCode||'VALID';
  if(!geometry){if(reasonCode==='VALID')reasonCode=MI.AngleMeasurements.isLinked(c.kind)?(c.kind==='anglePoints'?'DEGENERATE_ARM':source.some((o,i)=>{const l=line(o,c.sources[i]);return Math.hypot(l.x2-l.x1,l.y2-l.y1)<=1e-9;})?'DEGENERATE_DIRECTION':'COORDINATE_LIMIT'):c.kind==='circleCircleIntersection'?circleCircleIntersection(c,source).reasonCode:c.kind==='lineCircleIntersection'?lineCircleIntersection(c,source).reasonCode:c.kind==='lineEllipseIntersection'?lineEllipseIntersection(c,source).reasonCode:c.kind==='lineIntersection'?lineIntersection(c,source).reasonCode:['perpendicularBisector','lineBetweenPoints','pointOnSegment','circleByCenterPoint'].includes(c.kind)?'COINCIDENT_POINTS':c.kind==='pointOnCircle'?'ZERO_RADIUS':['parallel','perpendicular'].includes(c.kind)?'DEGENERATE_DIRECTION':c.kind==='bisector'?'DEGENERATE_ARM':c.kind==='tangent'?(source[0].r<=0?'ZERO_RADIUS':'POINT_INSIDE_CIRCLE'):'NON_FINITE_RESULT';}
  else for(const [key,value] of Object.entries(geometry))if(['x','y','x1','y1','x2','y2','cx','cy','r'].includes(key)){if(!Number.isFinite(value)){reasonCode='NON_FINITE_RESULT';break;}if(Math.abs(value)>1e12){reasonCode='COORDINATE_LIMIT';break;}}
  return {valid:reasonCode==='VALID',reasonCode,geometry:reasonCode==='VALID'||c.kind==='triangleFromPoints'?geometry:null};
 }
 function describe(objects,id,distributions=[]){const o=objects.find(o=>o.id===id);if(!o)return null;const linked=!!o.construction,result=linked?evaluate(o.construction,new Map(objects.map(o=>[o.id,o])),new Map(distributions.map(d=>[d.id,d]))):{valid:true,reasonCode:'FREE'};return freeze({id,mode:linked?'linked':'free',kind:linked?o.construction.kind:null,...(linked&&contract(o.construction.kind).branches.length?{branch:o.construction.branch??0}:{}),valid:result.valid,reasonCode:result.reasonCode,geometryEditable:!linked&&!o.locked,canDetach:linked&&result.valid&&!o.locked,computedFields:linked?contract(o.construction.kind).computedFields.slice():[],sources:linked?o.construction.sources.map(r=>isAxis(r)?validateAxis(r):({objectId:r.objectId,...(r.part!=null?{part:r.part}:{}),...(r.index!=null?{index:r.index}:{}),...(r.arm!=null?{arm:r.arm}:{})})):[],dependents:objects.filter(child=>child.construction?.sources.some(r=>r.objectId===id)).map(child=>child.id)});}
 function validateLegacy(c){if(!c||!Object.prototype.hasOwnProperty.call(kinds,c.kind)||!Array.isArray(c.sources)||c.sources.length!==kinds[c.kind])throw Error('Ongeldige constructie.');if(pathKind(c.kind)&&(typeof c.parameter!=='number'||!Number.isFinite(c.parameter)||c.parameter<0||c.parameter>1||(c.kind!=='pointOnSegment'&&c.parameter===1)))failure('INVALID_PARAMETER','Ongeldige opgeslagen padpositie.');if(c.kind==='pointOnEllipse'&&(Object.keys(c).some(k=>!['kind','sources','parameter'].includes(k))||Object.keys(c.sources[0]||{}).length!==1||typeof c.sources[0].objectId!=='string'))failure('INVALID_REFERENCE','Een ellipspunt vereist uitsluitend één volledige ellipsbron.');if(c.kind==='ellipseByFociAndSum'&&(Object.keys(c).some(k=>!['kind','sources','sumDistance'].includes(k))||typeof c.sumDistance!=='number'||!Number.isFinite(c.sumDistance)||c.sumDistance<=0))failure('INVALID_SUM','Een ellips vereist een positieve eindige afstandsom.');if(c.kind==='ellipseByFociAndPoint'&&(Object.keys(c).some(k=>!['kind','sources'].includes(k))||c.sources.some(s=>!s||Object.keys(s).length!==1||typeof s.objectId!=='string')))failure('INVALID_REFERENCE','Een ellips met besturingspunt vereist drie volledige puntbronnen en geen opgeslagen geometrie.');const roles=contract(c.kind).sourceRoles;for(let i=0;i<c.sources.length;i++){const s=c.sources[i];if(s?.arm!=null&&(c.kind!=='angleDirections'||!['start','end'].includes(s.arm)))throw Error('Ongeldige hoekarm.');if(isAxis(s)){validateAxis(s);if(roles[i]!=='line'||!supportsAxis(c.kind,i))throw Error('Dit gereedschap ondersteunt geen asbron voor deze bronrol.');continue;}if(!s||['kind','frame','axis'].some(k=>k in s)||typeof s.objectId!=='string'||!s.objectId||s.part!=null&&!['start','end','vertex','edge'].includes(s.part)||['vertex','edge'].includes(s.part)&&(!Number.isInteger(s.index)||s.index<0))throw Error('Ongeldige constructiebron.');}if(['circleSectorRegion','circleSegmentRegion'].includes(c.kind)&&!['directed','minor','major'].includes(c.extent))throw Error('Ongeldige regio-omvang.');if(!['circleSectorRegion','circleSegmentRegion'].includes(c.kind)&&c.extent!=null)throw Error('Onverwachte regio-omvang.');if(contract(c.kind).branches.length&&!contract(c.kind).branches.includes(c.branch??0))throw Error('Ongeldige raaklijntak.');}
 function validate(c){validateLegacy(c);if(c.kind==='lineEllipseIntersection'&&(Object.keys(c).some(k=>!['kind','sources','branch'].includes(k))||!Number.isInteger(c.branch)||![0,1].includes(c.branch)||c.sources.some((s,i)=>Object.keys(s).some(k=>!['objectId','part','index'].includes(k))||i===0&&s.part!=null&&s.part!=='edge'||i===1&&(s.part!=null||s.index!=null))))failure('INVALID_REFERENCE','Een lijn-ellipssnijpunt vereist één lijnbron, één volledige ellipsbron en branch 0 of 1.');if(c.kind==='parallelogramBySideAngle'){const matched=c.sideLengthMode==='matchAB',hasMode=Object.prototype.hasOwnProperty.call(c,'sideLengthMode'),hasSide=Object.prototype.hasOwnProperty.call(c,'sideLength');if(Object.keys(c).some(k=>!['kind','sources','sideLength','signedAngle','sideLengthMode'].includes(k))||hasMode&&!matched||(!matched&&(!Number.isFinite(c.sideLength)||c.sideLength<=0))||(matched&&hasSide&&(!Number.isFinite(c.sideLength)||c.sideLength<=0))||!Number.isFinite(c.signedAngle)||c.signedAngle<=-Math.PI||c.signedAngle>=Math.PI||Math.abs(Math.sin(c.signedAngle))<=1e-12)failure('INVALID_PARALLELOGRAM_PARAMETERS','Zijlengte en gerichte hoek moeten een niet-gedegenereerd parallellogram bepalen.');if(c.sources.some(s=>Object.keys(s).length!==1||typeof s.objectId!=='string')||c.sources[0].objectId===c.sources[1].objectId)failure('INVALID_REFERENCE','Een parallellogram vereist twee verschillende volledige puntbronnen.');}}
 function point(o,s){if(s.part==='vertex'){if(!o.vertices||!o.vertices[s.index])throw Error('Hoekpunt bestaat niet.');return o.vertices[s.index];}if(['start','end'].includes(s.part)&&MI.LinearGeometry.isLinear(o))return s.part==='start'?{x:o.x1,y:o.y1}:{x:o.x2,y:o.y2};if(o.type==='point')return {x:o.x,y:o.y};throw Error('Selecteer een punt of een eindpunt.');}
 function line(o,s){if(s.part==='edge'&&o.type==='polygon'){const a=o.vertices[s.index],b=o.vertices[(s.index+1)%o.vertices.length];if(!a)throw Error('Zijde bestaat niet.');return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};}if(MI.LinearGeometry.isLinear(o))return o;throw Error('Selecteer een lijn of een zijde.');}
 function tangentOnCircle(circle,p){const d=Math.hypot(p.x-circle.cx,p.y-circle.cy);return Math.abs(d-circle.r)<=1e-9*Math.max(1,d,circle.r);}
 const unit=(x,y)=>{const l=Math.hypot(x,y);return l<1e-9?null:{x:x/l,y:y/l};};
 const linear=(type,p,d)=>d?{type,x1:p.x,y1:p.y,x2:p.x+d.x,y2:p.y+d.y}:null;
 function angleGeometry(c,source){
  if(c.kind==='anglePoints'){const vertices=source.map((o,i)=>point(o,c.sources[i]));return [0,2].some(i=>Math.hypot(vertices[i].x-vertices[1].x,vertices[i].y-vertices[1].y)<=1e-9)?null:{type:'angle',vertices};}
  const lines=source.map((o,i)=>line(o,c.sources[i])),directions=lines.map(l=>{const dx=l.x2-l.x1,dy=l.y2-l.y1,n=Math.hypot(dx,dy);return n<=1e-9?null:{x:dx/n,y:dy/n};});if(directions.some(d=>!d))return null;
  const first=lines[0];let v=c.sources.some(isAxis)?{x:0,y:0}:{x:first.x1,y:first.y1},a=c.kind==='angleXAxis'?{x:1,y:0}:directions[0],b=c.kind==='angleXAxis'?directions[0]:directions[1];
  if(c.kind==='angleDirections'){const cross=a.x*b.y-a.y*b.x;if(Math.abs(cross)>1e-12){const second=lines[1],distance=((second.x1-first.x1)*b.y-(second.y1-first.y1)*b.x)/cross;v={x:first.x1+distance*a.x,y:first.y1+distance*a.y};}}
  // Finite undirected arms point away from their intersection, toward the
  // farther endpoint. Axes, rays and vectors retain their positive direction.
  if(c.kind==='angleDirections'){
   const arm=(i,d)=>{const l=lines[i];if(c.sources[i].arm)return c.sources[i].arm==='start'?{x:-d.x,y:-d.y}:d;if(c.sources.some(isAxis))return d;const finite=c.sources[i].part==='edge'||['line','dimension'].includes(source[i].type);if(!finite)return d;const dx=l.x2-l.x1,dy=l.y2-l.y1,n=dx*dx+dy*dy,t=((v.x-l.x1)*dx+(v.y-l.y1)*dy)/n;if(t<-1e-9||t>1+1e-9)return d;return t>.5?{x:-d.x,y:-d.y}:d;};
   a=arm(0,a);b=arm(1,b);
  }
  const vertices=[{x:v.x+a.x,y:v.y+a.y},v,{x:v.x+b.x,y:v.y+b.y}];return vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=1e12&&Math.abs(p.y)<=1e12)?{type:'angle',vertices}:null;
 }
 function calculate(c,objects,distributions,geometryCache){validateReferences(c,objects);const source=c.sources.map(s=>sourceObject(s,objects));
  if(source.some(o=>o.construction && o.constructionValid===false))return null;
  if(c.kind==='parallelogramBySideAngle'){const result=parallelogramResult(c,source);if(!result.geometry)failure(result.reasonCode,'Ongeldige parallellogramgeometrie.');return result.geometry;}
  if(TRIANGLE_CENTER_KINDS.has(c.kind))return triangleCenter(c,source[0]).geometry;
  if(TRIANGLE_M6B_KINDS.has(c.kind))return triangleM6b(c,source[0]).geometry;
  if(MI.AngleMeasurements.isLinked(c.kind))return angleGeometry(c,source);
  if(['perimeter','area'].includes(c.kind)) {
   const o=source[0];if(!['circle','polygon'].includes(o.type))throw Error('Kies een cirkel, driehoek of veelhoek.');
   let amount,anchor;
   if(o.type==='circle'){amount=c.kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;anchor={x:o.cx,y:o.cy};}
   else {const vs=o.vertices;amount=c.kind==='area'?Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2:vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);anchor=MI.PolygonGeometry.anchor(o);}
   if(!Number.isFinite(amount))return null;return {type:'text',...anchor,text:(c.kind==='area'?'Oppervlakte = ':'Omtrek = ')+Number(amount.toFixed(2))};
  }
  if(c.kind==='pointOnCircle'){const o=source[0];return o.r>0?{type:'point',x:o.cx+o.r*Math.cos(2*Math.PI*c.parameter),y:o.cy+o.r*Math.sin(2*Math.PI*c.parameter)}:null;}
  if(c.kind==='pointOnEllipse'){const resolved=MI.EllipseGeometry.fromDefinition(source[0]);if(resolved.reasonCode!=='VALID')return null;const p=resolved.geometry.pointAt(c.parameter);return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=1e12&&Math.abs(p.y)<=1e12?{type:'point',...p}:null;}
  if(c.kind==='distributedPointOnCircle'){const d=distributions?.get(c.distributionId),o=source[0];if(!d||d.circleId!==o.id||d.pointIds[c.index]==null||o.r<=0)return null;let points=geometryCache?.get(d.id);if(!points){points=MI.RegularGeometry.pointsOnCircle({cx:o.cx,cy:o.cy,radius:o.r,count:d.count,startAngle:d.startAngle});geometryCache?.set(d.id,points);}const p=points[c.index];return p?{type:'point',...p}:null;}
  if(c.kind==='pointOnSegment'){const l=line(source[0],c.sources[0]);return Math.hypot(l.x2-l.x1,l.y2-l.y1)>1e-9?{type:'point',x:l.x1+c.parameter*(l.x2-l.x1),y:l.y1+c.parameter*(l.y2-l.y1)}:null;}
  if(c.kind==='rayOrigin')return source[0].type==='ray'?{type:'point',x:source[0].x1,y:source[0].y1}:null;
  if(c.kind==='circleCircleIntersection')return circleCircleIntersection(c,source).geometry;
  if(c.kind==='lineEllipseIntersection')return lineEllipseIntersection(c,source).geometry;
  if(c.kind==='lineCircleIntersection')return lineCircleIntersection(c,source).geometry;
  if(c.kind==='lineIntersection')return lineIntersection(c,source).geometry;
  const ps=()=>source.map((o,i)=>point(o,c.sources[i]));
  if(c.kind==='circleByCenterPoint'){const [center,p]=ps(),r=Math.hypot(p.x-center.x,p.y-center.y);return r>1e-9?{type:'circle',cx:center.x,cy:center.y,r}:null;}
  if(c.kind==='lineBetweenPoints'){const [a,b]=ps();return Math.hypot(b.x-a.x,b.y-a.y)>1e-9?{type:'line',x1:a.x,y1:a.y,x2:b.x,y2:b.y}:null;}
  if(c.kind==='midpoint'||c.kind==='perpendicularBisector'){const [a,b]=ps(),p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return c.kind==='midpoint'?{type:'point',...p}:linear('straight',p,unit(-(b.y-a.y),b.x-a.x));}
  if(c.kind==='parallel'||c.kind==='perpendicular'){const l=line(source[0],c.sources[0]),p=point(source[1],c.sources[1]),dx=l.x2-l.x1,dy=l.y2-l.y1;return linear('straight',p,c.kind==='parallel'?unit(dx,dy):unit(-dy,dx));}
  if(c.kind==='bisector'){const [a,v,b]=ps(),u=unit(a.x-v.x,a.y-v.y),w=unit(b.x-v.x,b.y-v.y);if(!u||!w)return null;return linear('ray',v,unit(u.x+w.x,u.y+w.y)||{x:-u.y,y:u.x});}
  const circle=source[0],p=point(source[1],c.sources[1]);if(circle.type!=='circle')throw Error('Selecteer een cirkel.');const dx=p.x-circle.cx,dy=p.y-circle.cy,d=Math.hypot(dx,dy),r=circle.r,tolerance=1e-9*Math.max(1,d,r);if(r<=0||d<r-tolerance||d<1e-9)return null;
  if(tangentOnCircle(circle,p))return linear('straight',p,unit(-dy,dx));
  const k=r*r/(d*d),h=r*Math.sqrt(Math.max(0,d*d-r*r))/(d*d),sign=c.branch===1?-1:1,q={x:circle.cx+k*dx-sign*h*dy,y:circle.cy+k*dy+sign*h*dx};return {type:'straight',x1:p.x,y1:p.y,x2:q.x,y2:q.y};
 }
 function selectAngleArms(sources,picks,objects){
  const c={kind:'angleDirections',sources},g=evaluate(c,objects).geometry;if(!g)return sources;
  const v=g.vertices[1];return sources.map((ref,i)=>{if(isAxis(ref))return ref;const o=objects.get(ref.objectId);if(!picks[i]||!(ref.part==='edge'||['line','straight','dimension'].includes(o.type)))return ref;const l=line(o,ref),dx=l.x2-l.x1,dy=l.y2-l.y1,dot=(picks[i].x-v.x)*dx+(picks[i].y-v.y)*dy;if(Math.abs(dot)<=1e-9)return ref;return {...ref,arm:dot>0?'end':'start'};});
 }
 function resolve(input,distributions=[]){if(!input.some(o=>o.construction||o.type==='ellipse'))return input;const distributionMap=new Map(distributions.map(d=>[d.id,d])),geometryCache=new Map(),map=new Map(input.map(o=>[o.id,JSON.parse(JSON.stringify(o))])),state=new Map();
  // Iterative postorder avoids stack overflows in deeply nested imported chains.
  for(const id of map.keys()){const stack=[{id,exit:false}];while(stack.length){const task=stack.pop(),o=map.get(task.id);if(!o)throw Error('Constructiebron ontbreekt: '+task.id);if(task.exit){const evaluation=evaluate(o.construction,map,distributionMap,geometryCache),g=evaluation.geometry;if(g&&g.type!==o.type)throw Error('Constructietype past niet bij object.');if(o.type==='region'){delete o.regionGeometry;delete o.regionArea;delete o.regionStatus;}if(o.type==='ellipse')for(const k of ['cx','cy','a','b','rotation','c','e','ellipseArea','ellipseBounds'])delete o[k];const noStaleGeometry=o.construction.kind==='ellipseByFociAndPoint'||o.construction.kind==='pointOnEllipse'&&o.construction.sources.some(ref=>map.get(ref.objectId)?.construction?.kind==='ellipseByFociAndPoint')||o.construction.kind==='parallelogramBySideAngle';if((!evaluation.valid||!g)&&noStaleGeometry)for(const key of contract(o.construction.kind).computedFields)delete o[key];Object.assign(o,g||{}, {constructionValid:evaluation.valid});state.set(task.id,2);continue;}if(state.get(task.id)===2)continue;if(state.get(task.id)===1)throw Error('Cyclische constructie.');state.set(task.id,1);if(!o.construction){if(o.type==='ellipse'){const r=MI.EllipseGeometry.fromDefinition(o);if(r.reasonCode!=='VALID')throw Error('Ongeldige zelfstandige ellips.');Object.assign(o,{c:r.geometry.c,e:r.geometry.e,ellipseArea:r.area,ellipseBounds:r.geometry.bounds});}state.set(task.id,2);continue;}validate(o.construction);if(o.type!==contract(o.construction.kind).resultType)throw Error('Constructietype past niet bij object.');stack.push({id:task.id,exit:true});for(const s of [...o.construction.sources].reverse().filter(ref=>!isAxis(ref)))stack.push({id:s.objectId,exit:false});}}
  return input.map(o=>map.get(o.id));
 }
 function descendants(objects,ids){const removed=new Set(ids);let changed=true;while(changed){changed=false;for(const o of objects)if(!removed.has(o.id)&&o.construction&&o.construction.sources.some(s=>removed.has(s.objectId))){removed.add(o.id);changed=true;}}return removed;}
 MI.ConstructionService=Object.freeze({kinds:Object.freeze(kinds),definitions,triangleCenterKinds:Object.freeze([...TRIANGLE_CENTER_KINDS]),triangleInvariantStatus,triangleShapeStatus,parallelogramShape,contract,referenceOptions,referencesForRole,contextualPlans,pathKind,schema2,normaliseParameter,projectParameter,validateReferences,validateUpdate,evaluate,describe,validate,point,line,calculate,resolve,descendants,tangentOnCircle,selectAngleArms,lineEllipseIntersection,parallelogramPreview:(a,b,sideLength,signedAngle,sideLengthMode)=>{const result=parallelogramResult({kind:'parallelogramBySideAngle',sources:[{objectId:'A'},{objectId:'B'}],sideLength,signedAngle,...(sideLengthMode?{sideLengthMode}:{})},[{type:'point',...a},{type:'point',...b}]);return {...result,valid:result.reasonCode==='VALID'};}});
})(window);
