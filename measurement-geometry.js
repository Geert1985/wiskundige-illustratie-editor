(function(global) {
  const MI=global.FZI.MathIllustration;
  const angleDefaults=Object.freeze({schema:1,frame:'cartesian',mode:'smallest',unit:'document',precision:null,showArc:true});
  const precision=v=>Number.isInteger(v)&&v>=0&&v<=10;
  function angleSettings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['schema','frame','mode','unit','precision','showArc'].includes(k))||v.schema!==1||v.frame!=='cartesian'||!['smallest','directed'].includes(v.mode)||!['document','deg','rad'].includes(v.unit)||v.precision!==null&&!precision(v.precision)||typeof v.showArc!=='boolean')throw Error('Ongeldige hoekinstellingen.');return {...v};}
  function angleDocument(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['schema','unit','precision'].includes(k))||v.schema!==1||!['deg','rad'].includes(v.unit)||!precision(v.precision))throw Error('Ongeldige hoekeenheid of precisie.');return {...v};}
  function angleLabel(o,measurement,document){const a=o.angleSettings;if(!a&&!document)return format(value(o),'angle',measurement);const config=a?angleSettings(a):angleDefaults,doc=document?angleDocument(document):{unit:'deg',precision:measurement?.precision??2},unit=config.unit==='document'?doc.unit:config.unit,digits=config.precision??doc.precision,amount=value(o)*(unit==='rad'?Math.PI/180:1);let text=amount.toFixed(digits);if(config.mode==='directed'&&unit==='deg'&&Number(text)>=360)text=(0).toFixed(digits);return text.replace('.',',')+(unit==='rad'?' rad':'\u00b0');}
  MI.AngleMeasurements=Object.freeze({defaults:angleDefaults,settings:angleSettings,document:angleDocument,label:angleLabel,isLinked:kind=>['anglePoints','angleDirections','angleXAxis'].includes(kind)});
  function validateAngle(input,mark='arc') {
    if(!Array.isArray(input)||input.length!==3) throw Error('Een hoek vereist drie punten: arm, hoekpunt, arm.');
    const points=input.map(p=>{if(!p||['x','y'].some(k=>!['number','string'].includes(typeof p[k])||String(p[k]).trim()===''||!Number.isFinite(Number(p[k]))||Math.abs(Number(p[k]))>1e12))throw Error('Ongeldig hoekpunt.');return {...p,x:Number(p.x),y:Number(p.y)};});
    if([0,2].some(i=>Math.hypot(points[i].x-points[1].x,points[i].y-points[1].y)<1e-9))throw Error('Hoekarmen mogen niet samenvallen met het hoekpunt.');
    if(!['arc','right'].includes(mark))throw Error('Onbekende hoekmarkering.');
    if(mark==='right'&&Math.abs(value({type:'angle',vertices:points})-90)>1e-6)throw Error('Een rechtehoekmarkering vereist 90 graden.');
    return points;
  }
  function value(o) {
    if(o.type==='circle')return o.r;
    if(o.type==='straight'||o.type==='ray')return null;
    if(o.type!=='angle')return Math.hypot(o.x2-o.x1,o.y2-o.y1);
    const [a,v,b]=o.vertices,ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y;
    const al=Math.hypot(ax,ay),bl=Math.hypot(bx,by),signed=Math.atan2((ax/al)*(by/bl)-(ay/al)*(bx/bl),(ax/al)*(bx/bl)+(ay/al)*(by/bl))*180/Math.PI;return o.angleSettings?.mode==='directed'?(signed<0?signed+360:signed===0?0:signed):Math.abs(signed);
  }
  function rightPoint(points,raw) {
    const [a,v]=points,dx=a.x-v.x,dy=a.y-v.y,l=Math.hypot(dx,dy),r=Math.hypot(raw.x-v.x,raw.y-v.y);
    if(!l)return {...raw};const sign=(-dy*(raw.x-v.x)+dx*(raw.y-v.y))>=0?1:-1;
    return {x:v.x-sign*dy/l*r,y:v.y+sign*dx/l*r};
  }
  function anchors(o) {
    if(o.vertices)return o.vertices.map(p=>({...p}));
    if(MI.LinearGeometry.isLinear(o))return [{x:o.x1,y:o.y1},{x:o.x2,y:o.y2}];
    return [o.type==='circle'?{x:o.cx,y:o.cy}:{x:o.x,y:o.y}];
  }
  function translate(o,delta) {
    if(o.vertices)return {vertices:o.vertices.map(p=>({...p,x:p.x+delta.x,y:p.y+delta.y}))};
    if(MI.LinearGeometry.isLinear(o))return {x1:o.x1+delta.x,y1:o.y1+delta.y,x2:o.x2+delta.x,y2:o.y2+delta.y};
    return o.type==='circle'?{cx:o.cx+delta.x,cy:o.cy+delta.y}:{x:o.x+delta.x,y:o.y+delta.y};
  }
  function edges(o) {if(o.type==='polygon')return MI.PolygonGeometry.edges(o);if(o.type==='angle')return [0,2].map(i=>({id:o.id,type:'line',x1:o.vertices[1].x,y1:o.vertices[1].y,x2:o.vertices[i].x,y2:o.vertices[i].y}));return [o];}
  const unitFactors={e:null,u:null,dimensionless:null,mm:.001,cm:.01,m:1,km:1000},defaults=Object.freeze({schema:1,unit:'cm',scale:1,precision:2});
  function settings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['schema','unit','scale','precision'].includes(k))||v.schema!==1||typeof v.unit!=='string'||!Object.prototype.hasOwnProperty.call(unitFactors,v.unit)||typeof v.scale!=='number'||!Number.isFinite(v.scale)||v.scale<=0||!Number.isInteger(v.precision)||v.precision<0||v.precision>10)throw Error('Ongeldige eenheden, schaal of precisie.');return {...v};}
  function format(amount,kind,config){if(!config)return Number(amount.toFixed(2))+(kind==='angle'?'\u00b0':'');const v=settings(config),scaled=kind==='angle'||kind==='dimensionless'?amount:kind==='area'?amount*v.scale*v.scale:amount*v.scale;if(!Number.isFinite(scaled))return 'niet beschikbaar';const unit=v.unit==='e'?'u':v.unit,suffix=kind==='angle'?'\u00b0':unit==='dimensionless'?'':' '+unit+(kind==='area'?'\u00b2':'');const text=scaled.toFixed(v.precision);return (Number(text)===0?Math.abs(scaled).toFixed(v.precision):text).replace('.',',')+suffix;}
  function convert(config,unit){const v=settings(config);if(typeof unit!=='string'||!Object.prototype.hasOwnProperty.call(unitFactors,unit))throw Error('Onbekende eenheid.');return settings({...v,unit,scale:unitFactors[unit]&&unitFactors[v.unit]?v.scale*unitFactors[v.unit]/unitFactors[unit]:v.scale});}
  function figureValue(o,kind){if(o.type==='circle')return kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;const vs=o.vertices;if(kind==='perimeter')return vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);return Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2;}
  MI.MeasurementUnits=Object.freeze({defaults,settings,format,convert,figureValue});
  const measurementKeys=o=>o?.type==='circle'?['radius','diameter','circumference','area']:o?.type==='ellipse'?['semiMajor','semiMinor','majorAxis','minorAxis','eccentricity','area']:o?.type==='polygon'?[...o.vertices.map((_,i)=>'side:'+i),...o.vertices.map((_,i)=>'angle:'+i),'perimeter','area']:o?.type==='line'||o?.type==='dimension'?['length']:o?.type==='angle'?['angle']:[];
  const measurementText=Object.freeze({radius:'Straal',diameter:'Diameter',circumference:'Omtrek',area:'Oppervlakte',semiMajor:'Grote halve as',semiMinor:'Kleine halve as',majorAxis:'Grote as',minorAxis:'Kleine as',eccentricity:'Excentriciteit',perimeter:'Omtrek',length:'Lengte',angle:'Hoek'});
  function measurementSettings(input,object){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['schema','values'].includes(k))||input.schema!==1||!input.values||typeof input.values!=='object'||Array.isArray(input.values))throw Error('Ongeldige meetinstellingen.');
    const known=new Set(measurementKeys(object));if(Object.keys(input.values).some(k=>!known.has(k)))throw Error('Onbekende meetsoort.');const values=Object.fromEntries([...known].map(key=>[key,{visible:false,precision:null,mode:'computed',text:'',dx:0,dy:0}]));
    for(const [key,entry] of Object.entries(input.values)){
      if(!entry||typeof entry!=='object'||Array.isArray(entry)||Object.keys(entry).some(k=>!['visible','precision','mode','text','dx','dy'].includes(k))||typeof entry.visible!=='boolean'||entry.precision!==null&&(!Number.isInteger(entry.precision)||entry.precision<0||entry.precision>10)||!['computed','text'].includes(entry.mode)||typeof entry.text!=='string'||entry.text.length>2000||!Number.isFinite(entry.dx)||!Number.isFinite(entry.dy)||Math.abs(entry.dx)>1e12||Math.abs(entry.dy)>1e12)throw Error('Ongeldige instelling voor meetsoort '+key+'.');
      values[key]={visible:entry.visible,precision:entry.precision,mode:entry.mode,text:entry.text,dx:entry.dx,dy:entry.dy};
    }
    return {schema:1,values};
  }
  function defaultMeasurementSettings(object){const values={};for(const key of measurementKeys(object)){const legacy=['line','dimension','angle'].includes(object.type)||object.type==='circle'&&key==='radius',visible=object.type==='line'?object.showMeasurement===true:object.type==='circle'?key==='radius'&&object.showMeasurement===true:object.type==='dimension'||object.type==='angle';values[key]={visible,precision:null,mode:legacy?(object.measurementMode||'computed'):'computed',text:legacy?(object.measurementText||''):'',dx:0,dy:0};}return {schema:1,values};}
  function measurementValue(object,key){
    if(object.constructionValid===false)return null;
    if((object.type==='line'||object.type==='dimension')&&key==='length')return Math.hypot(object.x2-object.x1,object.y2-object.y1);
    if(object.type==='angle'&&key==='angle')return value(object);
    if(object.type==='circle'){if(key==='radius')return object.r;if(key==='diameter')return 2*object.r;if(key==='circumference')return 2*Math.PI*object.r;if(key==='area')return Math.PI*object.r*object.r;}
    if(object.type==='ellipse'){if(key==='semiMajor')return object.a;if(key==='semiMinor')return object.b;if(key==='majorAxis')return 2*object.a;if(key==='minorAxis')return 2*object.b;if(key==='eccentricity')return object.e;if(key==='area')return object.ellipseArea;}
    if(object.type==='polygon'){
      const vs=object.vertices,n=vs.length,index=Number(key.split(':')[1]);
      if(key.startsWith('side:'))return Math.hypot(vs[(index+1)%n].x-vs[index].x,vs[(index+1)%n].y-vs[index].y);
      if(key.startsWith('angle:')){const a=vs[(index+n-1)%n],v=vs[index],b=vs[(index+1)%n],ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y,small=Math.atan2(Math.abs(ax*by-ay*bx),ax*bx+ay*by)*180/Math.PI,orientation=Math.sign(vs.reduce((sum,p,i)=>sum+p.x*vs[(i+1)%n].y-vs[(i+1)%n].x*p.y,0))||1,turn=(v.x-a.x)*(b.y-v.y)-(v.y-a.y)*(b.x-v.x);return turn*orientation<0?360-small:small;}
      if(key==='perimeter')return figureValue(object,'perimeter');if(key==='area')return figureValue(object,'area');
    }
    return null;
  }
  function measurementDimension(key){return key==='area'?'area':key==='angle'||key.startsWith('angle:')?'angle':key==='eccentricity'?'dimensionless':'length';}
  function measurementAnchor(object,key){
    if(object.type==='circle'){if(key==='radius')return {x:object.cx+object.r,y:object.cy};if(key==='diameter')return {x:object.cx,y:object.cy-object.r};if(key==='circumference')return {x:object.cx,y:object.cy+object.r};return {x:object.cx,y:object.cy};}
    if(object.type==='line'||object.type==='dimension')return {x:(object.x1+object.x2)/2,y:(object.y1+object.y2)/2};
    if(object.type==='angle')return object.vertices[1];
    if(object.type==='ellipse'){const c=object.c||{x:object.cx,y:object.cy},r=object.rotation||0;if(key==='semiMajor')return {x:c.x+object.a*Math.cos(r),y:c.y+object.a*Math.sin(r)};if(key==='majorAxis')return {x:c.x-object.a*Math.cos(r),y:c.y-object.a*Math.sin(r)};if(key==='semiMinor')return {x:c.x-object.b*Math.sin(r),y:c.y+object.b*Math.cos(r)};if(key==='minorAxis')return {x:c.x+object.b*Math.sin(r),y:c.y-object.b*Math.cos(r)};if(key==='eccentricity')return {x:c.x,y:c.y+object.b*1.15};return c;}
    if(object.type==='polygon'){if(key.startsWith('side:')){const i=Number(key.split(':')[1]),a=object.vertices[i],b=object.vertices[(i+1)%object.vertices.length],center=MI.PolygonGeometry.anchor(object),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=mx-center.x,dy=my-center.y,l=Math.hypot(dx,dy)||1;return {x:mx+dx/l*.18,y:my+dy/l*.18};}if(key.startsWith('angle:'))return object.vertices[Number(key.split(':')[1])];if(key==='perimeter'){const vs=object.vertices;return {x:vs.reduce((sum,p)=>sum+p.x,0)/vs.length,y:Math.min(...vs.map(p=>p.y))-.2};}return MI.PolygonGeometry.anchor(object);}
    return {x:0,y:0};
  }
  function measurementLabel(object,key,config,meta,angleDocument){const amount=measurementValue(object,key),entry=config?.values?.[key]||{mode:'computed',text:'',precision:null,dx:0,dy:0};if(entry.mode==='text')return entry.text;if(amount==null||!Number.isFinite(amount))return 'Niet beschikbaar';const label=measurementText[key]||key.replace(/^side:/,'Zijde ').replace(/^angle:/,'Hoek ');if(key==='angle'&&object.type==='angle'){const settings={...(object.angleSettings||angleDefaults),...(entry.precision===null?{}:{precision:entry.precision})};return label+': '+angleLabel({...object,angleSettings:settings},meta,angleDocument);}if(measurementDimension(key)==='angle'){const doc=angleDocument||{unit:'deg',precision:meta?.precision??2},unit=doc.unit||'deg',digits=entry.precision??doc.precision??2,shown=unit==='rad'?amount*Math.PI/180:amount;return label+': '+shown.toFixed(digits).replace('.',',')+(unit==='rad'?' rad':'°');}const base=meta||defaults,dimension=measurementDimension(key),settingsForValue=dimension==='dimensionless'?{...base,unit:'dimensionless',scale:1,precision:entry.precision??base.precision}:entry.precision===null?base:{...base,precision:entry.precision};return label+': '+format(amount,dimension,settingsForValue);}
  MI.MeasurementGeometry={validateAngle,value,rightPoint,anchors,translate,edges,measurementKeys,measurementSettings,defaultMeasurementSettings,measurementValue,measurementDimension,measurementAnchor,measurementLabel,label:(o,config,angleDocument)=>o.type==='straight'||o.type==='ray'?'geen eindige lengte':o.measurementMode==='text'?String(o.measurementText||''):o.type==='angle'?angleLabel(o,config,angleDocument):format(value(o),'length',config)+(o.type==='circle'?' (r)':o.type==='vector'?' (norm)':'')};
})(window);
