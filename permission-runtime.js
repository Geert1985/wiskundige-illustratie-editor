/* Bound local permission runtime. The learner facade never owns the geometry kernel. */
(function(global) {
  'use strict';
  const MI=global.FZI.MathIllustration, states=new WeakMap();
  const clone=v=>JSON.parse(JSON.stringify(v));
  const freeze=v=>{if(v && typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
  const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
  const plain=v=>{if(!v || typeof v!=='object'||Array.isArray(v))return false;const p=Object.getPrototypeOf(v);return p===null||Object.getPrototypeOf(p)===null;};
  class PermissionError extends Error {constructor(code){super(code);this.name='PermissionError';this.code=code;}}
  const fail=code=>{throw new PermissionError(code);};
  function tree(v,code='INVALID_COMMAND',depth=0) {
    if(depth>64)fail(code);
    if(v===null||typeof v==='string'||typeof v==='boolean')return;
    if(typeof v==='number'){if(!Number.isFinite(v))fail(code);return;}
    if(Array.isArray(v)){v.forEach(x=>tree(x,code,depth+1));return;}
    if(!plain(v))fail(code);
    for(const [k,d] of Object.entries(Object.getOwnPropertyDescriptors(v))){if(['__proto__','constructor','prototype'].includes(k)||!own(d,'value'))fail(code);tree(d.value,code,depth+1);}
  }
  function keys(v,allowed,code='INVALID_COMMAND'){if(!plain(v)||Object.keys(v).some(k=>!allowed.includes(k)))fail(code);}
  const number=v=>{if(typeof v!=='number'||!Number.isFinite(v))fail('INVALID_COMMAND');return v;};
  const identifier=v=>{if(typeof v!=='string'||!v.trim())fail('INVALID_COMMAND');return v;};
  const available=(o,engine)=>!!o&&o.visible!==false&&!(o.construction&&o.constructionValid===false)&&(!engine||MI.DocumentLayers.visible(engine.model.layers||[],o.id));
  const propertyFields=['name','text','rotation','label','labelDx','labelDy','labelOffsetX','labelOffsetY','showLabel','showMeasurement','measurementLabelOnly','measurementMode','measurementText','style.stroke','style.fill','style.strokeWidth','style.opacity','style.radius','style.fontSize','style.fontFamily','style.anchor','style.dash'];
  const resultTypes={triangle:'polygon',rightAngle:'angle',midpoint:'point',perpendicular:'straight',parallel:'straight',perpendicularBisector:'straight',bisector:'ray',tangent:'straight',area:'text',perimeter:'text'};
  const tools=[...MI.OBJECT_TYPES.map(t=>'create:'+t),'create:triangle','create:rightAngle',...Object.keys(MI.ConstructionService.kinds).map(t=>'construct:'+t)];
  function geometryFields(o){if(o.vertices)return o.vertices.flatMap((p,i)=>[`vertices[${i}].x`,`vertices[${i}].y`]);if(MI.LinearGeometry.isLinear(o))return ['x1','y1','x2','y2'];return o.type==='circle'?['cx','cy','r']:['x','y'];}
  function getPath(o,path){const m=path.match(/^vertices\[(\d+)\]\.(x|y)$/);if(m)return o.vertices?.[Number(m[1])]?.[m[2]];return path.split('.').reduce((v,k)=>v?.[k],o);}
  function putPath(o,path,value){const m=path.match(/^vertices\[(\d+)\]\.(x|y)$/);if(m){if(!o.vertices?.[Number(m[1])])fail('INVALID_COMMAND');o.vertices[Number(m[1])][m[2]]=value;return;}const parts=path.split('.');let v=o;for(const k of parts.slice(0,-1)){if(!plain(v[k]))v[k]={};v=v[k];}v[parts.at(-1)]=value;}
  function fieldsOfPatch(o,patch) {
    keys(patch,[...geometryFields(o).filter(k=>!k.startsWith('vertices[')),'vertices',...propertyFields.filter(k=>!k.includes('.')),'style']);
    const fields=[];
    for(const [k,v] of Object.entries(patch)) {
      if(k==='vertices'){if(!Array.isArray(v)||v.length!==o.vertices?.length)fail('INVALID_COMMAND');v.forEach((p,i)=>{keys(p,['x','y']);for(const axis of Object.keys(p))fields.push({path:`vertices[${i}].${axis}`,value:p[axis]});});}
      else if(k==='style'){keys(v,propertyFields.filter(x=>x.startsWith('style.')).map(x=>x.slice(6)));Object.entries(v).forEach(([key,value])=>fields.push({path:'style.'+key,value}));}
      else fields.push({path:k,value:v});
    }
    return fields;
  }
  const ruleKeys=['read','display','selectCanvas','selectList','translate','duplicate','delete','geometryFields','propertyFields','sourceTools','snap','immutableFields','indirectGeometry','allowIndirectInvalid'];
  const listKeys=['geometryFields','propertyFields','sourceTools','immutableFields'];
  function validateRule(r,o) {
    keys(r,ruleKeys,'INVALID_POLICY');
    for(const [k,v] of Object.entries(r)) {
      if(listKeys.includes(k)){if(!Array.isArray(v)||v.some(x=>typeof x!=='string')||new Set(v).size!==v.length)fail('INVALID_POLICY');if(k==='sourceTools'&&v.some(x=>!tools.includes(x)||!x.startsWith('construct:')))fail('UNSUPPORTED_POLICY');
        if(k!=='sourceTools'&&v.some(x=>{if(k==='propertyFields')return !propertyFields.includes(x);if(k==='immutableFields'&&['id','type','locked','visible','construction','constructionValid'].includes(x))return false;return o?!geometryFields(o).includes(x)&&!(k==='immutableFields'&&propertyFields.includes(x)):!['x','y','x1','y1','x2','y2','cx','cy','r'].includes(x)&&!/^vertices\[\d+\]\.[xy]$/.test(x)&&!(k==='immutableFields'&&propertyFields.includes(x));}))fail('INVALID_POLICY');
      }else if(k==='indirectGeometry'){if(!['follow','freeze'].includes(v))fail('INVALID_POLICY');}else if(typeof v!=='boolean')fail('INVALID_POLICY');
    }
    if(o&&o.construction&&(r.geometryFields?.length||r.translate))fail('INVALID_POLICY');
  }
  function compilePolicy(input,baseline) {
    tree(input,'INVALID_POLICY');keys(input,['schema','activityId','revision','profile','defaultCapabilities','initialObjectRules','createdObjectRules','allowedTools','document','parameters','limits'],'INVALID_POLICY');
    if(input.schema!==1||!['course','assessment'].includes(input.profile)||typeof input.activityId!=='string'||!input.activityId.trim()||typeof input.revision!=='string'||!input.revision.trim())fail('INVALID_POLICY');
    const p=clone(input);p.defaultCapabilities=p.defaultCapabilities||{};p.initialObjectRules=p.initialObjectRules||{};p.createdObjectRules=p.createdObjectRules||{};p.document=p.document||{};p.parameters=p.parameters||{};
    validateRule(p.defaultCapabilities);if(p.profile==='assessment'&&(p.defaultCapabilities.translate||p.defaultCapabilities.delete||p.defaultCapabilities.geometryFields?.length))fail('INVALID_POLICY');
    if(!Array.isArray(p.allowedTools)||new Set(p.allowedTools).size!==p.allowedTools.length||p.allowedTools.some(t=>!tools.includes(t)))fail('UNSUPPORTED_POLICY');
    const map=new Map(baseline.objects.map(o=>[o.id,o]));
    for(const [id,r] of Object.entries(p.initialObjectRules)){const o=map.get(id);if(!o)fail('INVALID_POLICY');validateRule(r,o);if(p.profile==='assessment'&&r.delete)fail('INVALID_POLICY');}
    for(const [type,r] of Object.entries(p.createdObjectRules)){if(!MI.OBJECT_TYPES.includes(type))fail('UNSUPPORTED_POLICY');validateRule(r);}
    for(const t of p.allowedTools){const suffix=t.split(':')[1],type=resultTypes[suffix]||suffix,r={...p.defaultCapabilities,...p.createdObjectRules[type]};if(!own(p.createdObjectRules,type)||!r.read||!r.display)fail('INVALID_POLICY');}
    const docBooleans=['undo','redo','reset','draftSave','draftResume','exportSVG','exportJSON','pan','zoom','viewConfigure'];
    keys(p.document,[...docBooleans,'setMetaFields','setPresentationFields'],'INVALID_POLICY');for(const k of docBooleans)if(k in p.document&&typeof p.document[k]!=='boolean')fail('INVALID_POLICY');
    if(p.document.draftSave||p.document.draftResume)fail('UNSUPPORTED_POLICY');
    for(const [k,known] of [['setMetaFields',['title','description']],['setPresentationFields',[...MI.PRESENTATION_FLAGS,'bounds','coordinateSystem','background','axisStep']]])if(k in p.document&&(!Array.isArray(p.document[k])||p.document[k].some(v=>!known.includes(v))))fail('INVALID_POLICY');
    keys(p.limits,['maxObjects','maxCommandBytes','maxBatchObjects','maxDependencyDepth'],'INVALID_POLICY');if(Object.values(p.limits).length!==4||Object.values(p.limits).some(v=>!Number.isSafeInteger(v)||v<=0))fail('INVALID_POLICY');
    if(baseline.objects.length>p.limits.maxObjects||baseline.objects.some(o=>o.construction&&o.constructionValid===false))fail('INVALID_POLICY');
    for(const o of baseline.objects){const r={...p.defaultCapabilities,...p.initialObjectRules[o.id]},immutable=[...(p.defaultCapabilities.immutableFields||[]),...(p.initialObjectRules[o.id]?.immutableFields||[])];if((r.translate&&geometryFields(o).some(k=>immutable.includes(k)))||(r.geometryFields||[]).some(k=>immutable.includes(k))||(r.propertyFields||[]).some(k=>immutable.includes(k)))fail('INVALID_POLICY');}
    const bindings=new Set();
    for(const [id,b] of Object.entries(p.parameters)){if(!id.trim())fail('INVALID_POLICY');keys(b,['targets','min','max','step','initialValue'],'INVALID_POLICY');if(!Array.isArray(b.targets)||!b.targets.length||[b.min,b.max,b.initialValue].some(v=>typeof v!=='number'||!Number.isFinite(v))||b.min>b.max||('step'in b&&(!(b.step>0)||!Number.isFinite(b.step))))fail('INVALID_POLICY');
      for(const t of b.targets){keys(t,['objectId','fieldPath'],'INVALID_POLICY');const o=map.get(t.objectId),r={...p.defaultCapabilities,...p.initialObjectRules[t.objectId]},key=t.objectId+'\0'+t.fieldPath;
        if(!o||o.locked||o.construction||!geometryFields(o).includes(t.fieldPath)||bindings.has(key)||[...(p.defaultCapabilities.immutableFields||[]),...(r.immutableFields||[])].includes(t.fieldPath)||getPath(o,t.fieldPath)!==b.initialValue)fail('INVALID_POLICY');bindings.add(key);
      }if(!inDomain(b.initialValue,b))fail('INVALID_POLICY');
    }
    return freeze(p);
  }
  function inDomain(value,b){if(typeof value!=='number'||!Number.isFinite(value)||value<b.min||value>b.max)return false;if(!b.step)return true;const k=Math.round((value-b.min)/b.step),expected=b.min+k*b.step;return Math.abs(value-expected)<=Math.min(b.step*1e-6,32*Number.EPSILON*Math.max(1,Math.abs(value),Math.abs(b.min)));}
  function effective(s,o) {
    if(s.author)return {read:true,display:true,selectCanvas:available(o,s.kernel),selectList:true,translate:!o.locked&&!o.construction,delete:!o.locked,duplicate:true,snap:available(o,s.kernel),geometryFields:geometryFields(o),propertyFields,sourceTools:tools.filter(t=>t.startsWith('construct:')),immutableFields:[],indirectGeometry:'follow',allowIndirectInvalid:true};
    const base=s.policy.defaultCapabilities,override=s.initialIds.has(o.id)?s.policy.initialObjectRules[o.id]:s.policy.createdObjectRules[o.type],r={indirectGeometry:'follow',allowIndirectInvalid:s.policy.profile==='course',...base,...override};
    r.immutableFields=[...new Set([...(base.immutableFields||[]),...(override?.immutableFields||[])])];return r;
  }
  function newKernel(s){const r=s.kernel.renderer,e=new MI.Engine(s.kernel.toJSON(),{width:r.width,height:r.height,padding:r.padding});e.model._nextId=s.kernel.model._nextId;return e;}
  function utf8Size(v){let n=0;for(const c of JSON.stringify(v)){const k=c.codePointAt(0);n+=k<128?1:k<2048?2:k<65536?3:4;}return n;}
  function checkBudgets(s,candidate,command){if(s.author)return;if(utf8Size(command)>s.policy.limits.maxCommandBytes||candidate.model.objects.length>s.policy.limits.maxObjects)fail('INVALID_COMMAND');const depths=new Map(),map=new Map(candidate.model.objects.map(o=>[o.id,o]));for(const o of map.values()){const stack=[{id:o.id,exit:false}];while(stack.length){const t=stack.pop(),v=map.get(t.id);if(depths.has(t.id))continue;if(!v)fail('INVALID_COMMAND');if(!v.construction){depths.set(t.id,0);continue;}if(t.exit){const d=1+Math.max(...v.construction.sources.map(r=>depths.get(r.objectId)));if(d>s.policy.limits.maxDependencyDepth)fail('INVALID_COMMAND');depths.set(t.id,d);}else{stack.push({id:t.id,exit:true});v.construction.sources.forEach(r=>{if(!depths.has(r.objectId))stack.push({id:r.objectId,exit:false});});}}}}
  function commandOf(operation,payload,revision){return {schema:1,operation,payload,expectedDocumentRevision:revision};}
  const payloadKeys={
    'layer.create':['name'],'layer.assign':['ids','layerId'],'layer.rename':['id','name'],'layer.setVisibility':['id','value'],'layer.reorder':['ids'],'layer.delete':['id'],
    'group.create':['members','name'],'group.ungroup':['ids'],
    'object.select':['ids','source'],'object.translate':['ids','delta'],'object.setGeometry':['id','fields'],'object.setProperties':['ids','fields'],'object.patchBatch':['updates'],
    'object.create':['toolId','object'],'construction.create':['toolId','sources'],'object.duplicate':['ids','delta'],'object.delete':['ids'],
    'parameter.set':['parameterId','value'],'history.undo':[],'history.redo':[],'document.reset':[],'document.exportSVG':[],'document.exportJSON':[],
    'document.setMeta':['fields'],'document.setPresentation':['fields'],'view.pan':['bounds'],'view.zoom':['bounds'],'view.configure':['fields'],
    'document.replace':['document'],'document.clear':[],'policy.configure':[],'document.draftSave':[],'document.draftResume':[],
    'object.setLock':['ids','value'],'object.setVisibility':['ids','value']
  };
  function normalize(s,command){if(s.disposed)fail('STALE_TRANSACTION');tree(command);keys(command,['schema','operation','payload','expectedDocumentRevision','origin']);if(command.schema!==1||!own(payloadKeys,command.operation))fail('UNSUPPORTED_COMMAND');keys(command.payload,payloadKeys[command.operation]);if(!Number.isSafeInteger(command.expectedDocumentRevision)||command.expectedDocumentRevision!==s.revision)fail('STALE_TRANSACTION');if(!s.author&&utf8Size(command)>s.policy.limits.maxCommandBytes)fail('INVALID_COMMAND');return clone(command);}
  function requireObject(s,id,{visible=true,unlocked=false}={}){identifier(id);const o=s.kernel.get(id);if(!o||(!s.author&&(!effective(s,o).read||(visible&&(!available(o,s.kernel)||!effective(s,o).display)))))fail('OBJECT_NOT_AVAILABLE');if(unlocked&&o.locked)fail('LOCKED');return o;}
  function idsOf(s,ids){if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!id.trim())||new Set(ids).size!==ids.length)fail('INVALID_COMMAND');if(!s.author&&ids.length>s.policy.limits.maxBatchObjects)fail('INVALID_COMMAND');return ids;}
  function grant(s,o,key){if(!effective(s,o)[key])fail('PERMISSION_DENIED');}
  function writable(s,o,path,kind,parameter=false){const r=effective(s,o);if(o.locked)fail('LOCKED');if(r.immutableFields?.includes(path))fail('IMMUTABLE_FIELD');if(kind==='geometry'&&o.construction)fail('MODE_DENIED');if(!s.author&&!parameter&&!(r[kind==='geometry'?'geometryFields':'propertyFields']||[]).includes(path))fail('PERMISSION_DENIED');}
  function validateValue(path,value,geometric=false) {
    if(geometric || ['rotation','labelDx','labelDy','style.strokeWidth','style.opacity','style.radius','style.fontSize'].includes(path))number(value);
    else if(['labelOffsetX','labelOffsetY'].includes(path)){if(value!==null)number(value);}
    else if(['showLabel','showMeasurement','measurementLabelOnly'].includes(path)){if(typeof value!=='boolean')fail('INVALID_COMMAND');}
    else if(typeof value!=='string')fail('INVALID_COMMAND');
  }
  function applyFields(s,e,o,fields,kind,parameter=false){if(!Array.isArray(fields)||!fields.length||new Set(fields.map(f=>f.path)).size!==fields.length)fail('INVALID_COMMAND');const copy=clone(o);for(const f of fields){keys(f,['path','value']);const geometric=geometryFields(o).includes(f.path);if((kind==='geometry'&&!geometric)||(kind==='properties'&&!propertyFields.includes(f.path)))fail('INVALID_COMMAND');validateValue(f.path,f.value,geometric);writable(s,o,f.path,geometric?'geometry':'properties',parameter);putPath(copy,f.path,f.value);}e.update(o.id,copy);}
  function checkEffects(s,e,directIds){const before=new Map(s.kernel.model.objects.map(o=>[o.id,o]));for(const o of e.model.objects){const prior=before.get(o.id);if(!prior)continue;const r=effective(s,prior);if(!directIds.has(o.id)&&o.construction){const outputs=o.type==='text'?['x','y','text']:geometryFields(o),changed=outputs.some(k=>JSON.stringify(getPath(o,k))!==JSON.stringify(getPath(prior,k)))||o.constructionValid!==prior.constructionValid;if(changed&&r.indirectGeometry==='freeze')fail('INDIRECT_FROZEN');if(prior.constructionValid!==false&&o.constructionValid===false&&!r.allowIndirectInvalid)fail('WOULD_INVALIDATE');
        for(const key of Object.keys(prior))if(!outputs.includes(key)&&key!=='constructionValid'&&JSON.stringify(o[key])!==JSON.stringify(prior[key]))fail('INVALID_COMMAND');
      }}
    if(!s.author)for(const b of Object.values(s.policy.parameters))for(const t of b.targets){const o=e.get(t.objectId);if(o&&!inDomain(getPath(o,t.fieldPath),b))fail('OUT_OF_RANGE');}
  }
  function authorizeCommand(s,input) {
    const c=normalize(s,input),p=c.payload,op=c.operation,direct=new Set(),e=newKernel(s);let result=null,view=null,selection=null,historyAction=null,relatedCommandId=null;
    if(!s.author&&['document.replace','document.clear','policy.configure','document.draftSave','document.draftResume','object.setLock','object.setVisibility','group.create','group.ungroup','layer.create','layer.assign','layer.rename','layer.setVisibility','layer.reorder','layer.delete'].includes(op))fail('MODE_DENIED');
    const docGrant=k=>{if(!s.author&&!s.policy.document[k])fail('PERMISSION_DENIED');};
    if(op==='layer.create'){result=e.createLayer(p.name);}
    else if(op==='layer.assign'){result=e.assignLayer(idsOf(s,p.ids),identifier(p.layerId));}
    else if(op==='layer.rename'){e.renameLayer(identifier(p.id),p.name);}
    else if(op==='layer.setVisibility'){e.setLayerVisibility(identifier(p.id),p.value);}
    else if(op==='layer.reorder'){e.reorderLayers(idsOf(s,p.ids));}
    else if(op==='layer.delete'){e.removeLayer(identifier(p.id));}
    else if(op==='group.create'){const refs=idsOf(s,p.members);result=e.group(refs,p.name);}
    else if(op==='group.ungroup'){result=e.ungroup(idsOf(s,p.ids));}
    else if(op==='object.select') {if(!Array.isArray(p.ids)||p.ids.some(id=>typeof id!=='string')||!['canvas','list'].includes(p.source))fail('INVALID_COMMAND');selection=[...new Set(p.ids.flatMap(id=>s.kernel.get(id)?MI.PersistentGroups.members(s.kernel.model.groups,MI.PersistentGroups.top(s.kernel.model.groups,id)):[]))].filter(id=>groupSelectable(s,id,p.source));}
    else if(op==='object.translate') {
      const ids=idsOf(s,p.ids);try{MI.PersistentGroups.roots(s.kernel.model.groups,ids);}catch(_){fail('INCOMPLETE_GROUP');}keys(p.delta,['x','y']);number(p.delta.x);number(p.delta.y);const objects=ids.map(id=>requireObject(s,id,{unlocked:true})),roots=objects.filter(o=>!o.construction),rootIds=new Set(roots.map(o=>o.id));
      const covered=o=>{if(!o)fail('INVALID_COMMAND');if(!o.construction)return rootIds.has(o.id);return o.construction.sources.every(r=>covered(s.kernel.get(r.objectId)));};
      if(objects.some(o=>o.construction&&!covered(o)))fail('INCOMPLETE_GROUP');if(!roots.length)fail('INCOMPLETE_GROUP');
      for(const o of roots){grant(s,o,'translate');for(const path of geometryFields(o))if(effective(s,o).immutableFields?.includes(path))fail('IMMUTABLE_FIELD');direct.add(o.id);e.update(o.id,MI.MeasurementGeometry.translate(o,p.delta));}
    }else if(op==='object.setGeometry') {const o=requireObject(s,p.id,{unlocked:true});direct.add(o.id);applyFields(s,e,o,p.fields,'geometry');}
    else if(op==='object.setProperties'){for(const id of idsOf(s,p.ids)){const o=requireObject(s,id,{unlocked:true});direct.add(id);applyFields(s,e,o,p.fields,'properties');}}
    else if(op==='object.patchBatch'){if(!Array.isArray(p.updates)||!p.updates.length)fail('INVALID_COMMAND');idsOf(s,p.updates.map(u=>u.id));for(const u of p.updates){keys(u,['id','patch']);const o=requireObject(s,u.id,{unlocked:true}),fields=fieldsOfPatch(o,u.patch);direct.add(o.id);applyFields(s,e,o,fields,'mixed');}}
    else if(op==='parameter.set'){identifier(p.parameterId);number(p.value);const b=s.policy?.parameters[p.parameterId];if(!b)fail('PERMISSION_DENIED');if(!inDomain(p.value,b))fail('OUT_OF_RANGE');for(const t of b.targets){const o=s.kernel.get(t.objectId);if(!o || o.locked || o.construction)fail('INVALID_POLICY');direct.add(o.id);applyFields(s,e,o,[{path:t.fieldPath,value:p.value}],'geometry',true);}}
    else if(op==='object.create') {
      if(typeof p.toolId!=='string'||!tools.includes(p.toolId)||!p.toolId.startsWith('create:'))fail('INVALID_COMMAND');if(!s.author&&!s.policy.allowedTools.includes(p.toolId))fail('PERMISSION_DENIED');const recipe=p.toolId.slice(7),type=resultTypes[recipe]||recipe;
      if(!plain(p.object)||p.object.type!==type)fail('INVALID_COMMAND');const probe=MI.normaliseObject({...p.object,id:'permission-probe'}),geo=geometryFields(probe).some(k=>k.startsWith('vertices['))?['vertices']:geometryFields(probe),extra=propertyFields.filter(k=>!k.includes('.'));
      keys(p.object,['type',...geo,...extra,'style',...(type==='angle'?['angleMark']:[])]);if(geo.includes('vertices')){if(!Array.isArray(p.object.vertices))fail('INVALID_COMMAND');p.object.vertices.forEach(v=>{keys(v,['x','y']);number(v.x);number(v.y);});}else geo.forEach(k=>{if(k in p.object)number(p.object[k]);});
      if(recipe==='triangle'&&p.object.vertices?.length!==3)fail('INVALID_COMMAND');if(recipe==='rightAngle'&&(p.object.angleMark!=='right'||Math.abs(MI.MeasurementGeometry.value(p.object)-90)>1e-6))fail('INVALID_COMMAND');if(recipe==='angle'&&p.object.angleMark&&p.object.angleMark!=='arc')fail('INVALID_COMMAND');
      const base={type,...Object.fromEntries(geo.filter(k=>k in p.object).map(k=>[k,p.object[k]])),...(type==='text'?{text:p.object.text||''}:{}),...(type==='angle'?{angleMark:recipe==='rightAngle'?'right':p.object.angleMark||'arc'}:{})};
      const props=fieldsOfPatch(probe,Object.fromEntries(Object.entries(p.object).filter(([k])=>k!=='type'&&!geo.includes(k)&&k!=='angleMark'&&!(type==='text'&&k==='text'))));const createdRule={...s.policy?.defaultCapabilities,...s.policy?.createdObjectRules[type]};
      if(!s.author&&props.some(f=>!(createdRule.propertyFields||[]).includes(f.path)))fail('PERMISSION_DENIED');props.forEach(f=>{validateValue(f.path,f.value);putPath(base,f.path,f.value);});result=e.add(base);direct.add(result.id);
    }else if(op==='construction.create') {
      if(typeof p.toolId!=='string'||!tools.includes(p.toolId)||!p.toolId.startsWith('construct:'))fail('INVALID_COMMAND');if(!s.author&&!s.policy.allowedTools.includes(p.toolId))fail('PERMISSION_DENIED');if(!Array.isArray(p.sources))fail('INVALID_COMMAND');for(const ref of p.sources){keys(ref,['objectId','part','index']);const o=requireObject(s,ref.objectId);if(!(effective(s,o).sourceTools||[]).includes(p.toolId))fail('MISSING_SOURCE_PERMISSION');}result=e.construct(p.toolId.slice(10),p.sources);result.forEach(o=>direct.add(o.id));
    }else if(op==='object.duplicate'){
      const ids=idsOf(s,p.ids);for(const id of ids){const o=requireObject(s,id);grant(s,o,'duplicate');if(!s.author&&(o.construction||!s.policy.allowedTools.includes('create:'+o.type)))fail(o.construction?'MODE_DENIED':'PERMISSION_DENIED');}if(p.delta){keys(p.delta,['x','y']);number(p.delta.x);number(p.delta.y);}result=e.duplicateMany(ids,p.delta);if(!s.author)result=result.map(projectObject);result.forEach(o=>direct.add(o.id));
    }else if(op==='object.delete'){
      const ids=idsOf(s,p.ids),closure=MI.ConstructionService.descendants(s.kernel.model.objects,ids);for(const id of closure){const o=requireObject(s,id,{visible:false});if(!s.author&&(!effective(s,o).delete||o.locked||(s.policy.profile==='assessment'&&s.initialIds.has(id))))fail(ids.includes(id)?(o.locked?'LOCKED':'PERMISSION_DENIED'):'CASCADE_DENIED');if(s.author&&ids.includes(id)&&o.locked)fail('LOCKED');}ids.forEach(id=>e.remove(id));
    }else if(['history.undo','history.redo'].includes(op)){const undo=op==='history.undo';docGrant(undo?'undo':'redo');const entry=s.history[undo?s.cursor-1:s.cursor];if(!entry || digest(s.kernel.toJSON())!==digest(undo?entry.after:entry.before))fail('UNTRUSTED_HISTORY');e.load(undo?entry.before:entry.after);e.model._nextId=Math.max(s.kernel.model._nextId,undo?entry.beforeNext:entry.afterNext);historyAction=undo?'undo':'redo';relatedCommandId=entry.commandId;}
    else if(op==='document.reset'){docGrant('reset');e.load(s.initial);historyAction='reset';view=clone(s.initial.presentation||{});}
    else if(op==='document.exportSVG'||op==='document.exportJSON'){docGrant(op==='document.exportSVG'?'exportSVG':'exportJSON');result=exportData(s,op==='document.exportSVG');}
    else if(op==='document.setMeta'||op==='document.setPresentation') {const metadata=op==='document.setMeta';if(!Array.isArray(p.fields)||!p.fields.length)fail('INVALID_COMMAND');const target=metadata?e.model.meta:clone(e.toJSON().presentation),allowed=metadata?['title','description']:[...MI.PRESENTATION_FLAGS,'bounds','coordinateSystem','background','axisStep'];for(const f of p.fields){keys(f,['path','value']);if(!allowed.includes(f.path))fail('INVALID_COMMAND');if(metadata&&typeof f.value!=='string')fail('INVALID_COMMAND');if(!metadata&&MI.PRESENTATION_FLAGS.includes(f.path)&&typeof f.value!=='boolean')fail('INVALID_COMMAND');if(!s.author&&!(s.policy.document[metadata?'setMetaFields':'setPresentationFields']||[]).includes(f.path))fail('PERMISSION_DENIED');target[f.path]=f.value;}if(!metadata)e.load({...e.toJSON(),presentation:target});}
    else if(['view.pan','view.zoom','view.configure'].includes(op)){docGrant(op==='view.pan'?'pan':op==='view.zoom'?'zoom':'viewConfigure');const r=new MI.SvgRenderer({...s.kernel.toJSON().presentation,...s.view});if(op==='view.configure'){if(!Array.isArray(p.fields))fail('INVALID_COMMAND');for(const f of p.fields){keys(f,['path','value']);if(!MI.PRESENTATION_FLAGS.includes(f.path)||typeof f.value!=='boolean')fail('INVALID_COMMAND');r[f.path]=f.value;}}else r.setBounds(p.bounds);view={bounds:clone(r.bounds)};MI.PRESENTATION_FLAGS.forEach(k=>view[k]=r[k]);}
    else if(op==='object.setLock'||op==='object.setVisibility'){if(typeof p.value!=='boolean')fail('INVALID_COMMAND');for(const id of idsOf(s,p.ids)){direct.add(id);e.update(id,{[op==='object.setLock'?'locked':'visible']:p.value});}}
    else if(op==='document.replace'){if(!s.author)fail('MODE_DENIED');e.load(p.document);historyAction='reset';}
    else if(op==='document.clear'){if(!s.author)fail('MODE_DENIED');e.model.clear();}
    else fail(s.author?'UNSUPPORTED_COMMAND':'MODE_DENIED');
    checkEffects(s,e,direct);checkBudgets(s,e,c);return {command:c,candidate:e,result,view,selection,historyAction,relatedCommandId};
  }
  function projectObject(o){const keys=['id','type','visible','locked',...geometryFields(o).filter(k=>!k.startsWith('vertices[')),...propertyFields.filter(k=>!k.includes('.')),'vertices','style','angleMark','construction','constructionValid'];const result=clone(Object.fromEntries(Object.entries(o).filter(([k])=>keys.includes(k))));if(result.style)result.style=Object.fromEntries(Object.entries(result.style).filter(([k])=>propertyFields.includes('style.'+k)));if(result.vertices)result.vertices=result.vertices.map(p=>({x:p.x,y:p.y}));if(result.construction)result.construction={kind:o.construction.kind,sources:o.construction.sources.map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>['objectId','part','index'].includes(k)))),...(o.construction.branch!=null?{branch:o.construction.branch}:{})};return result;}
  // Stable local integrity digest, deliberately not a security signature (M17).
  function digest(value){const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);let hash=2166136261;for(const ch of canonical(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return 'fnv1a32:'+ (hash>>>0).toString(16).padStart(8,'0');}
  function readObjects(s,source=s.kernel,display=false){return MI.DocumentLayers.ordered(source.model.objects,source.model.layers||[]).filter(o=>effective(s,o).read&&(!display||(available(o,source)&&effective(s,o).display))).map(projectObject);}
  function groupSelectable(s,id,source){return MI.PersistentGroups.members(s.kernel.model.groups,MI.PersistentGroups.top(s.kernel.model.groups,id)).every(member=>{const o=s.kernel.get(member);return o&&effective(s,o)[source==='list'?'selectList':'selectCanvas']&&(s.author&&source==='list'||available(o,s.kernel)&&effective(s,o).display)&&effective(s,o).read;});}
  function readLayers(s){const ids=new Set(readObjects(s).map(o=>o.id));return s.kernel.model.layers.filter(l=>!l.members.length||l.members.some(id=>ids.has(id))).map(l=>({...l,members:l.members.filter(id=>ids.has(id))}));}
  function readGroups(s){const readable=new Set(readObjects(s).map(o=>o.id));return s.kernel.model.groups.filter(g=>s.kernel.groupMembers(g.id).every(id=>readable.has(id))).map(clone);}
  function exportData(s,svg){const objects=readObjects(s,s.kernel,svg);if(!svg){const ids=new Set(objects.map(o=>o.id));if(objects.some(o=>o.construction&&o.construction.sources.some(r=>!ids.has(r.objectId))))fail('PERMISSION_DENIED');}const doc=s.kernel.toJSON(),data={type:doc.type,version:doc.version,...(doc.constructionSchema?{constructionSchema:doc.constructionSchema}:{}),meta:{title:doc.meta.title||'',description:doc.meta.description||''},objects,presentation:doc.presentation};if(!svg){if(doc.groups?.length){const groups=readGroups(s);if(groups.length!==s.kernel.model.groups.length)fail('PERMISSION_DENIED');data.groupSchema=1;data.groups=groups;}if(doc.version===5){const layers=readLayers(s);if(layers.reduce((n,l)=>n+l.members.length,0)!==s.kernel.model.objects.length)fail('PERMISSION_DENIED');data.layerSchema=1;data.layers=layers;}return data;}const r=new MI.SvgRenderer({...doc.presentation,...s.view});return r.render({meta:data.meta,layers:s.kernel.model.layers,all:()=>objects});}
  function rendererFacade(s) {
    const facade={};for(const key of ['width','height','padding','bounds','background','coordinateSystem','axisStep',...MI.PRESENTATION_FLAGS])Object.defineProperty(facade,key,{enumerable:true,get:()=>typeof s.render[key]==='object'?freeze(clone(s.render[key])):s.render[key]});
    Object.defineProperty(facade,'preview',{enumerable:true,get:()=>s.render.preview,set:v=>{s.render.preview=v==null?null:clone(v);}});
    for(const key of ['mapX','mapY','scale','render','renderGrid','renderAxes'])facade[key]=(...args)=>s.render[key](...args);
    facade.setBounds=()=>fail('MODE_DENIED');return Object.freeze(facade);
  }
  function facadeFor(session,s) {
    const invoke=(op,payload)=>session.execute(commandOf(op,payload,s.revision)),e={};let cache=null,cacheEpoch=-1,model=null;
    Object.defineProperty(e,'model',{enumerable:true,get:()=>{if(cache!==s.kernel.model.objects||cacheEpoch!==s.epoch||!model){cache=s.kernel.model.objects;cacheEpoch=s.epoch;const objects=freeze(readObjects(s));model=Object.freeze({objects,layers:freeze(readLayers(s)),groups:freeze(readGroups(s)),meta:freeze({title:s.kernel.model.meta.title||'',description:s.kernel.model.meta.description||''}),all:()=>clone(objects),get:id=>{const o=objects.find(o=>o.id===id);return o?clone(o):null;}});}return model;}});
    Object.defineProperty(e,'renderer',{enumerable:true,get:()=>s.rendererFacade});
    e.createLayer=name=>invoke('layer.create',{name}).result;e.assignLayer=(ids,layerId)=>invoke('layer.assign',{ids,layerId}).result;e.renameLayer=(id,name)=>invoke('layer.rename',{id,name});e.setLayerVisibility=(id,value)=>invoke('layer.setVisibility',{id,value});e.reorderLayers=ids=>invoke('layer.reorder',{ids});e.removeLayer=id=>invoke('layer.delete',{id});e.isDisplayed=id=>session.getObjectCapabilities(id).display;
    e.group=(members,name)=>invoke('group.create',{members,...(name==null?{}:{name})}).result;e.ungroup=ids=>invoke('group.ungroup',{ids}).result;e.groupMembers=id=>MI.PersistentGroups.members(e.model.groups,id);
    e.get=id=>e.model.get(id);e.add=object=>invoke('object.create',{toolId:'create:'+object.type,object}).result;e.construct=(kind,sources)=>invoke('construction.create',{toolId:'construct:'+kind,sources}).result;
    e.move=(id,x,y)=>{const o=e.get(id);if(!o)fail('OBJECT_NOT_AVAILABLE');const anchor=o.type==='circle'?{x:o.cx,y:o.cy}:MI.MeasurementGeometry.anchors(o)[0];return invoke('object.translate',{ids:[id],delta:{x:x-anchor.x,y:y-anchor.y}}).result||e.get(id);};
    e.update=(id,patch)=>{invoke('object.patchBatch',{updates:[{id,patch}]});return e.get(id);};e.updateMany=updates=>{invoke('object.patchBatch',{updates});return updates.map(u=>e.get(u.id));};
    e.remove=id=>{invoke('object.delete',{ids:[id]});return true;};e.duplicateMany=(ids,delta)=>invoke('object.duplicate',{ids,...(delta?{delta}:{})}).result;
    e.load=()=>fail('MODE_DENIED');e.toJSON=()=>invoke('document.exportJSON',{}).result;e.toJSONString=pretty=>JSON.stringify(e.toJSON(),null,pretty?2:0);e.renderSVG=()=>invoke('document.exportSVG',{}).result;
    e.canSnap=id=>session.getObjectCapabilities(id).snap;e.selectAt=(x,y,tolerance)=>MI.Engine.prototype.selectAt.call({model:{layers:s.kernel.model.layers,objects:s.kernel.model.objects.filter(o=>session.getObjectCapabilities(o.id).selectCanvas)}},x,y,tolerance);
    return Object.freeze(e);
  }
  function refreshRender(s){const preview=s.render?.preview;s.render=new MI.SvgRenderer({...s.kernel.toJSON().presentation,...s.view});s.render.preview=preview||null;}
  function decision(s,c){try{authorizeCommand(s,c);return Object.freeze({allowed:true,code:'ALLOWED',deniedTargets:[],deniedFields:[]});}catch(e){if(e instanceof PermissionError)return Object.freeze({allowed:false,code:e.code,deniedTargets:[],deniedFields:[]});return Object.freeze({allowed:false,code:'INVALID_COMMAND',deniedTargets:[],deniedFields:[]});}}
  class RuntimeSession {
    static isSession(value) { return states.has(value) && !states.get(value).disposed; }
    static create(options={}) {
      let kernel,policy;try{if(!options||!own(options,'initialDocument')||!plain(options.initialDocument)||typeof options.actorId!=='string'||!options.actorId.trim())fail('INVALID_POLICY');kernel=new MI.Engine(options.initialDocument);policy=compilePolicy(options.policy,kernel.toJSON());}catch(e){if(e instanceof PermissionError)throw e;fail('INVALID_POLICY');}
      if(policy.profile==='assessment'&&!['practice','summative'].includes(options.assessmentKind))fail('INVALID_POLICY');
      const session=new RuntimeSession(),s={kernel,policy,author:false,initial:kernel.toJSON(),initialIds:new Set(kernel.model.objects.map(o=>o.id)),actorId:options.actorId,assessmentKind:options.assessmentKind,revision:0,epoch:0,history:[],cursor:0,created:new Set(),events:[],selection:[],view:{},handles:new Map(),listeners:new Set(),onCommitted:typeof options.onCommitted==='function'?options.onCommitted:null};
      states.set(session,s);refreshRender(s);s.rendererFacade=rendererFacade(s);s.facade=facadeFor(session,s);Object.freeze(session);
      const owner=Object.freeze({inspect:()=>freeze({document:s.kernel.toJSON(),revision:s.revision,epoch:s.epoch,cursor:s.cursor,history:s.history.map(e=>({before:e.before,after:e.after})),nextId:s.kernel.model._nextId,created:[...s.created],events:clone(s.events),selection:s.selection.slice()}),replacePolicy:next=>{const p=compilePolicy(next,s.initial);if(p.activityId!==s.policy.activityId||p.revision!==s.policy.revision||p.profile!==s.policy.profile)fail('INVALID_POLICY');checkEffects({...s,policy:p},s.kernel,new Set());checkBudgets({...s,policy:p},s.kernel,commandOf('document.reset',{},s.revision));s.policy=p;s.epoch++;s.handles.clear();s.render.preview=null;refreshRender(s);s.history=[];s.cursor=0;for(const fn of s.listeners)try{fn({type:'context-changed'});}catch(_){}},dispose:()=>{s.disposed=true;s.handles.clear();s.epoch++;for(const fn of s.listeners)try{fn({type:'disposed'});}catch(_){}s.listeners.clear();}});
      return Object.freeze({session,owner});
    }
    get engine(){return states.get(this).facade;}
    get documentRevision(){return states.get(this).revision;}
    get activityId(){return states.get(this).policy.activityId;}
    get canUndo(){const s=states.get(this);return !!s.policy.document.undo&&s.cursor>0;}
    get canRedo(){const s=states.get(this);return !!s.policy.document.redo&&s.cursor<s.history.length;}
    subscribe(fn){if(typeof fn!=='function')fail('INVALID_COMMAND');const s=states.get(this);s.listeners.add(fn);return ()=>s.listeners.delete(fn);}
    canExecute(c){return decision(states.get(this),c);}
    getAllowedTools(){const s=states.get(this);return tools.map(toolId=>Object.freeze({toolId,enabled:s.policy.allowedTools.includes(toolId),reason:s.policy.allowedTools.includes(toolId)?'ALLOWED':'PERMISSION_DENIED'}));}
    getObjectCapabilities(id){const s=states.get(this),o=s.kernel.get(id);if(!o)return Object.freeze({read:false,display:false,selectCanvas:false,selectList:false,translate:false,snap:false,sourceTools:[],geometryFields:[],propertyFields:[]});const r=effective(s,o),visible=available(o,s.kernel)&&!!r.read&&!!r.display;
      const geometry=o.locked||o.construction||!visible?[]:(r.geometryFields||[]).filter(k=>geometryFields(o).includes(k)&&!r.immutableFields.includes(k)),properties=o.locked||!visible?[]:(r.propertyFields||[]).filter(k=>!r.immutableFields.includes(k));
      return freeze({setGeometryFields:geometry.slice(),setPropertyFields:properties.slice(),labelMove:['labelOffsetX','labelOffsetY'].every(k=>properties.includes(k)),reasonCodes:[o.locked?'LOCKED':visible?'ALLOWED':'OBJECT_NOT_AVAILABLE'],read:!!r.read,display:visible,selectCanvas:visible&&!!r.selectCanvas&&groupSelectable(s,id,'canvas'),selectList:visible&&!!r.selectList&&groupSelectable(s,id,'list'),translate:visible&&!o.locked&&!o.construction&&!!r.translate,delete:!!r.read&&!o.locked&&!!r.delete&&!(s.policy.profile==='assessment'&&s.initialIds.has(id)),duplicate:visible&&!!r.duplicate,snap:visible&&!!r.snap,sourceTools:visible?(r.sourceTools||[]).slice():[],geometryFields:geometry,propertyFields:properties});
    }
    createCommand(operation,payload={}){return commandOf(operation,payload,states.get(this).revision);}
    execute(input){const s=states.get(this);let p;try{p=authorizeCommand(s,input);}catch(e){if(e instanceof PermissionError)throw e;fail('INVALID_COMMAND');}return this.#apply(p);}
    #apply(p){const s=states.get(this),before=s.kernel.toJSON(),after=p.candidate.toJSON(),changed=JSON.stringify(before)!==JSON.stringify(after),beforeNext=s.kernel.model._nextId;
      if(p.command.operation.startsWith('document.export'))return freeze({status:'read',documentRevision:s.revision,result:clone(p.result)});
      if(p.selection)s.selection=p.selection;if(p.view)s.view={...s.view,...p.view};
      if(changed||p.historyAction==='reset'){s.kernel=p.candidate;s.revision++;if(p.historyAction==='undo')s.cursor--;else if(p.historyAction==='redo')s.cursor++;else if(p.historyAction!=='reset'){s.history.splice(s.cursor);s.history.push({commandId:s.events.length+1,before,after,beforeNext,afterNext:s.kernel.model._nextId});s.cursor=s.history.length;}
        s.created=new Set(s.kernel.model.objects.filter(o=>!s.initialIds.has(o.id)).map(o=>o.id));const beforeById=new Map(before.objects.map(o=>[o.id,o])),directIds=new Set(p.command.payload.ids||[p.command.payload.id].filter(Boolean));const actual=after.objects.filter(o=>JSON.stringify(beforeById.get(o.id))!==JSON.stringify(o));const directEffects=actual.filter(o=>!beforeById.has(o.id)||!o.construction||directIds.has(o.id)).map(o=>o.id),indirectEffects=actual.filter(o=>beforeById.has(o.id)&&o.construction&&!directIds.has(o.id)).map(o=>o.id);const event={schema:1,commandId:s.events.length+1,sequence:s.events.length+1,actorId:s.actorId,activityId:s.policy.activityId,artifactRevision:s.policy.revision,epoch:s.epoch,operation:p.command.operation,input:clone(p.command.payload),preRevision:s.revision-1,postRevision:s.revision,preDigest:digest(before),postDigest:digest(after),policyDigest:digest(s.policy),previousEventDigest:s.events.length?digest(s.events.at(-1)):null,...(['undo','redo'].includes(p.historyAction)?{historyAction:p.historyAction,relatedCommandId:p.relatedCommandId}:{}),directEffects,indirectEffects,removed:before.objects.filter(o=>!after.objects.some(x=>x.id===o.id)).map(o=>o.id)};s.events.push(event);if(s.onCommitted)try{s.onCommitted(freeze(clone(event)));}catch(_){}
      }
      if(p.historyAction==='reset'){s.history=[];s.cursor=0;s.created.clear();s.selection=[];s.handles.clear();}
      refreshRender(s);for(const fn of s.listeners)try{fn({type:'committed',operation:p.command.operation,documentRevision:s.revision});}catch(_){}
      return freeze({status:'committed',documentRevision:s.revision,commandId:(changed||p.historyAction==='reset')?s.events.at(-1).commandId:null,result:p.result==null?null:Array.isArray(p.result)?p.result.filter(o=>effective(s,o).read).map(projectObject):p.result.id?(effective(s,p.result).read?projectObject(p.result):null):clone(p.result),selectedIds:s.selection.slice()});
    }
    begin(input){const s=states.get(this),p=authorizeCommand(s,input),handle=Object.freeze({});s.handles.set(handle,{command:p.command,revision:s.revision,epoch:s.epoch,plan:p});return handle;}
    #transaction(handle,payload){const s=states.get(this),t=s.handles.get(handle);if(!t||t.revision!==s.revision||t.epoch!==s.epoch)fail('STALE_TRANSACTION');const old=t.command.payload;for(const k of ['ids','id','toolId','parameterId','sources'])if(k in old&&JSON.stringify(old[k])!==JSON.stringify(payload[k]))fail('INVALID_COMMAND');if(old.fields&&JSON.stringify(old.fields.map(f=>f.path))!==JSON.stringify(payload.fields?.map(f=>f.path)))fail('INVALID_COMMAND');return {s,t,plan:authorizeCommand(s,{...t.command,payload})};}
    preview(handle,payload){const {t,plan:p}=this.#transaction(handle,payload);t.plan=p;if(p.view){const preview=states.get(this).render.preview;states.get(this).render=new MI.SvgRenderer({...states.get(this).kernel.toJSON().presentation,...states.get(this).view,...p.view});states.get(this).render.preview=preview;}return freeze({objects:readObjects(states.get(this),p.candidate,true),result:p.result==null?null:clone(p.result)});}
    previewObject(handle,id){const s=states.get(this),t=s.handles.get(handle);if(!t||t.epoch!==s.epoch||t.revision!==s.revision)return null;return readObjects(s,t.plan.candidate,true).find(o=>o.id===id)||null;}
    commit(handle,payload){try{const {s,plan:p}=this.#transaction(handle,payload);s.handles.delete(handle);return this.#apply(p);}catch(error){const s=states.get(this);s.handles.delete(handle);refreshRender(s);throw error;}}
    cancel(handle){const s=states.get(this);s.handles.delete(handle);refreshRender(s);}
  }
  MI.PermissionError=PermissionError;
  MI.PermissionPolicy=Object.freeze({compile:compilePolicy,tools:Object.freeze(tools.slice())});
  MI.PermissionEvaluator=Object.freeze({canExecute:(command,context)=>decision(states.get(context.session),command),getAllowedTools:context=>context.session.getAllowedTools(),getObjectCapabilities:(id,context)=>context.session.getObjectCapabilities(id)});
  MI.RuntimeSession=RuntimeSession;
  MI.PermissionFields=Object.freeze({geometry:geometryFields,properties:Object.freeze(propertyFields.slice()),patch:fieldsOfPatch});
  MI.AuthorCommands=function(engine) {
    const context=()=>({kernel:engine,author:true,revision:0,view:{},initial:engine.toJSON(),history:[],cursor:0});
    return Object.freeze({
      createCommand:(operation,payload={})=>commandOf(operation,payload,0),
      getObjectCapabilities(id){const o=engine.get(id);return o?effective(context(),o):{read:false,display:false,selectCanvas:false,selectList:false,translate:false,snap:false,geometryFields:[],propertyFields:[],sourceTools:[]};},
      getAllowedTools:()=>tools.map(toolId=>({toolId,enabled:true,reason:'ALLOWED'})),
      canExecute(command){if(['history.undo','history.redo','document.reset'].includes(command.operation))return {allowed:true,code:'ALLOWED',deniedTargets:[],deniedFields:[]};return decision(context(),command);},
      execute(command){let p;try{p=authorizeCommand(context(),command);}catch(e){throw e;}if(command.operation.startsWith('document.export'))return {result:command.operation==='document.exportSVG'?engine.renderSVG():engine.toJSON()};engine.model=p.candidate.model;if(p.view){engine.renderer.setBounds(p.view.bounds);for(const key of MI.PRESENTATION_FLAGS)engine.renderer[key]=p.view[key];}if(['document.setPresentation','document.replace'].includes(command.operation))engine.renderer=p.candidate.renderer;return {result:p.result,selectedIds:p.selection};}
    });
  };
})(window);
