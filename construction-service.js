/* Linked constructions: validated references, acyclic resolution and recoverable degeneracy. */
(function(global){
 const MI=global.FZI.MathIllustration;
 const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const failure=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
 const recipes={perimeter:['text',['figure']],area:['text',['figure']],midpoint:['point',['point','point']],perpendicular:['straight',['line','point']],parallel:['straight',['line','point']],perpendicularBisector:['straight',['point','point']],bisector:['ray',['point','point','point']],tangent:['straight',['circle','point']]};
 const fields={point:['x','y'],text:['x','y','text'],straight:['x1','y1','x2','y2'],ray:['x1','y1','x2','y2']};
 const definitions=freeze(Object.fromEntries(Object.entries(recipes).map(([kind,[resultType,sourceRoles]])=>[kind,{kind,resultType,sourceRoles,branches:kind==='tangent'?[0,1]:[],computedFields:fields[resultType]}])));
 const kinds=Object.fromEntries(Object.entries(definitions).map(([kind,d])=>[kind,d.sourceRoles.length]));
 function contract(kind){if(!Object.prototype.hasOwnProperty.call(definitions,kind))failure('INVALID_CONSTRUCTION_KIND','Onbekende constructie.');return definitions[kind];}
 function accepts(object,ref,role){
  if(ref.index!=null&&!['vertex','edge'].includes(ref.part))return false;
  if(role==='point'){if(ref.part==null)return object.type==='point';if(['start','end'].includes(ref.part))return MI.LinearGeometry.isLinear(object);return ref.part==='vertex'&&['polygon','angle'].includes(object.type)&&Array.isArray(object.vertices)&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length;}
  if(role==='line'){if(ref.part==null)return MI.LinearGeometry.isLinear(object);return ref.part==='edge'&&object.type==='polygon'&&Number.isInteger(ref.index)&&ref.index>=0&&ref.index<object.vertices.length;}
  return ref.part==null&&(role==='circle'?object.type==='circle':['circle','polygon'].includes(object.type));
 }
 function validateReferences(c,objects){validate(c);const d=contract(c.kind);c.sources.forEach((ref,i)=>{const o=objects.get(ref.objectId);if(!o)failure('MISSING_REFERENCE','Constructiebron ontbreekt: '+ref.objectId);if(!accepts(o,ref,d.sourceRoles[i]))failure('INVALID_REFERENCE','Deze bron of dit onderdeel past niet bij de constructie.');});}
 function referenceOptions(o){const refs={point:[],line:[],circle:[],figure:[]};if(!o)return freeze(refs);const whole={objectId:o.id};if(o.type==='point')refs.point.push(whole);if(MI.LinearGeometry.isLinear(o)){refs.point.push({objectId:o.id,part:'start'},{objectId:o.id,part:'end'});refs.line.push(whole);}if(['polygon','angle'].includes(o.type))o.vertices.forEach((p,index)=>{refs.point.push({objectId:o.id,part:'vertex',index});if(o.type==='polygon')refs.line.push({objectId:o.id,part:'edge',index});});if(o.type==='circle')refs.circle.push(whole);if(['circle','polygon'].includes(o.type))refs.figure.push(whole);return freeze(refs);}
 function validateUpdate(objects,current,patch){
  if(current.construction&&Object.prototype.hasOwnProperty.call(patch,'construction')&&!patch.construction)failure('CONSTRUCTION_LINK_MANAGED','Gebruik Constructie losmaken om de koppeling te verwijderen.');
  if(current.construction)for(const key of contract(current.construction.kind).computedFields)if(key in patch&&JSON.stringify(patch[key])!==JSON.stringify(current[key]))failure('COMPUTED_FIELD','Deze waarde wordt berekend. Maak de constructie eerst los om ze vrij te bewerken.');
  if(current.vertices&&Array.isArray(patch.vertices)&&patch.vertices.length!==current.vertices.length&&objects.some(o=>o.construction?.sources.some(ref=>ref.objectId===current.id&&['vertex','edge'].includes(ref.part))))failure('TOPOLOGY_REFERENCED','Dit object heeft gekoppelde hoekpunten of zijden; het aantal hoekpunten kan niet worden gewijzigd.');
 }
 function evaluate(c,objects){
  validateReferences(c,objects);const source=c.sources.map(ref=>objects.get(ref.objectId));if(source.some(o=>o.construction&&o.constructionValid===false))return {valid:false,reasonCode:'SOURCE_INVALID',geometry:null};
  const geometry=calculate(c,objects);let reasonCode='VALID';
  if(!geometry){reasonCode=c.kind==='perpendicularBisector'?'COINCIDENT_POINTS':['parallel','perpendicular'].includes(c.kind)?'DEGENERATE_DIRECTION':c.kind==='bisector'?'DEGENERATE_ARM':c.kind==='tangent'?(source[0].r<=0?'ZERO_RADIUS':'POINT_INSIDE_CIRCLE'):'NON_FINITE_RESULT';}
  else for(const [key,value] of Object.entries(geometry))if(['x','y','x1','y1','x2','y2'].includes(key)){if(!Number.isFinite(value)){reasonCode='NON_FINITE_RESULT';break;}if(Math.abs(value)>1e12){reasonCode='COORDINATE_LIMIT';break;}}
  return {valid:reasonCode==='VALID',reasonCode,geometry:reasonCode==='VALID'?geometry:null};
 }
 function describe(objects,id){const o=objects.find(o=>o.id===id);if(!o)return null;const linked=!!o.construction,result=linked?evaluate(o.construction,new Map(objects.map(o=>[o.id,o]))):{valid:true,reasonCode:'FREE'};return freeze({id,mode:linked?'linked':'free',kind:linked?o.construction.kind:null,...(linked&&o.construction.kind==='tangent'?{branch:o.construction.branch??0}:{}),valid:result.valid,reasonCode:result.reasonCode,geometryEditable:!linked&&!o.locked,canDetach:linked&&result.valid&&!o.locked,computedFields:linked?contract(o.construction.kind).computedFields.slice():[],sources:linked?o.construction.sources.map(r=>({objectId:r.objectId,...(r.part!=null?{part:r.part}:{}),...(r.index!=null?{index:r.index}:{})})):[],dependents:objects.filter(child=>child.construction?.sources.some(r=>r.objectId===id)).map(child=>child.id)});}
 function validate(c){if(!c||!Object.prototype.hasOwnProperty.call(kinds,c.kind)||!Array.isArray(c.sources)||c.sources.length!==kinds[c.kind])throw Error('Ongeldige constructie.');for(const s of c.sources){if(!s||typeof s.objectId!=='string'||!s.objectId||s.part!=null&&!['start','end','vertex','edge'].includes(s.part)||['vertex','edge'].includes(s.part)&&(!Number.isInteger(s.index)||s.index<0))throw Error('Ongeldige constructiebron.');}if(contract(c.kind).branches.length&&!contract(c.kind).branches.includes(c.branch??0))throw Error('Ongeldige raaklijntak.');}
 function point(o,s){if(s.part==='vertex'){if(!o.vertices||!o.vertices[s.index])throw Error('Hoekpunt bestaat niet.');return o.vertices[s.index];}if(['start','end'].includes(s.part)&&MI.LinearGeometry.isLinear(o))return s.part==='start'?{x:o.x1,y:o.y1}:{x:o.x2,y:o.y2};if(o.type==='point')return {x:o.x,y:o.y};throw Error('Selecteer een punt of een eindpunt.');}
 function line(o,s){if(s.part==='edge'&&o.type==='polygon'){const a=o.vertices[s.index],b=o.vertices[(s.index+1)%o.vertices.length];if(!a)throw Error('Zijde bestaat niet.');return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};}if(MI.LinearGeometry.isLinear(o))return o;throw Error('Selecteer een lijn of een zijde.');}
 const unit=(x,y)=>{const l=Math.hypot(x,y);return l<1e-9?null:{x:x/l,y:y/l};};
 const linear=(type,p,d)=>d?{type,x1:p.x,y1:p.y,x2:p.x+d.x,y2:p.y+d.y}:null;
 function calculate(c,objects){validateReferences(c,objects);const source=c.sources.map(s=>objects.get(s.objectId));
  if(source.some(o=>o.construction && o.constructionValid===false))return null;
  if(['perimeter','area'].includes(c.kind)) {
   const o=source[0];if(!['circle','polygon'].includes(o.type))throw Error('Kies een cirkel, driehoek of veelhoek.');
   let amount,anchor;
   if(o.type==='circle'){amount=c.kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;anchor={x:o.cx,y:o.cy};}
   else {const vs=o.vertices;amount=c.kind==='area'?Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2:vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);anchor=MI.PolygonGeometry.anchor(o);}
   if(!Number.isFinite(amount))return null;return {type:'text',...anchor,text:(c.kind==='area'?'Oppervlakte = ':'Omtrek = ')+Number(amount.toFixed(2))};
  }
  const ps=()=>source.map((o,i)=>point(o,c.sources[i]));
  if(c.kind==='midpoint'||c.kind==='perpendicularBisector'){const [a,b]=ps(),p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return c.kind==='midpoint'?{type:'point',...p}:linear('straight',p,unit(-(b.y-a.y),b.x-a.x));}
  if(c.kind==='parallel'||c.kind==='perpendicular'){const l=line(source[0],c.sources[0]),p=point(source[1],c.sources[1]),dx=l.x2-l.x1,dy=l.y2-l.y1;return linear('straight',p,c.kind==='parallel'?unit(dx,dy):unit(-dy,dx));}
  if(c.kind==='bisector'){const [a,v,b]=ps(),u=unit(a.x-v.x,a.y-v.y),w=unit(b.x-v.x,b.y-v.y);if(!u||!w)return null;return linear('ray',v,unit(u.x+w.x,u.y+w.y)||{x:-u.y,y:u.x});}
  const circle=source[0],p=point(source[1],c.sources[1]);if(circle.type!=='circle')throw Error('Selecteer een cirkel.');const dx=p.x-circle.cx,dy=p.y-circle.cy,d=Math.hypot(dx,dy),r=circle.r,tolerance=1e-9*Math.max(1,d,r);if(r<=0||d<r-tolerance||d<1e-9)return null;
  if(Math.abs(d-r)<=tolerance)return linear('straight',p,unit(-dy,dx));
  const k=r*r/(d*d),h=r*Math.sqrt(Math.max(0,d*d-r*r))/(d*d),sign=c.branch===1?-1:1,q={x:circle.cx+k*dx-sign*h*dy,y:circle.cy+k*dy+sign*h*dx};return {type:'straight',x1:p.x,y1:p.y,x2:q.x,y2:q.y};
 }
 function resolve(input){if(!input.some(o=>o.construction))return input;const map=new Map(input.map(o=>[o.id,JSON.parse(JSON.stringify(o))])),state=new Map();
  // Iterative postorder avoids stack overflows in deeply nested imported chains.
  for(const id of map.keys()){const stack=[{id,exit:false}];while(stack.length){const task=stack.pop(),o=map.get(task.id);if(!o)throw Error('Constructiebron ontbreekt: '+task.id);if(task.exit){const g=evaluate(o.construction,map).geometry;if(g&&g.type!==o.type)throw Error('Constructietype past niet bij object.');Object.assign(o,g||{}, {constructionValid:!!g});state.set(task.id,2);continue;}if(state.get(task.id)===2)continue;if(state.get(task.id)===1)throw Error('Cyclische constructie.');state.set(task.id,1);if(!o.construction){state.set(task.id,2);continue;}validate(o.construction);if(o.type!==contract(o.construction.kind).resultType)throw Error('Constructietype past niet bij object.');stack.push({id:task.id,exit:true});for(const s of [...o.construction.sources].reverse())stack.push({id:s.objectId,exit:false});}}
  return input.map(o=>map.get(o.id));
 }
 function descendants(objects,ids){const removed=new Set(ids);let changed=true;while(changed){changed=false;for(const o of objects)if(!removed.has(o.id)&&o.construction&&o.construction.sources.some(s=>removed.has(s.objectId))){removed.add(o.id);changed=true;}}return removed;}
 MI.ConstructionService=Object.freeze({kinds:Object.freeze(kinds),definitions,contract,referenceOptions,validateReferences,validateUpdate,evaluate,describe,validate,point,line,calculate,resolve,descendants});
})(window);
