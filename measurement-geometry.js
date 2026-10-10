(function(global) {
  const MI=global.FZI.MathIllustration;
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
    if(o.type!=='angle')return Math.hypot(o.x2-o.x1,o.y2-o.y1);
    const [a,v,b]=o.vertices,ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y;
    return Math.atan2(Math.abs(ax*by-ay*bx),ax*bx+ay*by)*180/Math.PI;
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
  const unitFactors={e:null,mm:.001,cm:.01,m:1,km:1000},defaults=Object.freeze({schema:1,unit:'cm',scale:1,precision:2});
  function settings(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['schema','unit','scale','precision'].includes(k))||v.schema!==1||typeof v.unit!=='string'||!Object.prototype.hasOwnProperty.call(unitFactors,v.unit)||typeof v.scale!=='number'||!Number.isFinite(v.scale)||v.scale<=0||!Number.isInteger(v.precision)||v.precision<0||v.precision>10)throw Error('Ongeldige eenheden, schaal of precisie.');return {...v};}
  function format(amount,kind,config){if(!config)return Number(amount.toFixed(2))+(kind==='angle'?'\u00b0':'');const v=settings(config),scaled=kind==='angle'?amount:kind==='area'?amount*v.scale*v.scale:amount*v.scale;if(!Number.isFinite(scaled))return 'niet beschikbaar';const suffix=kind==='angle'?'\u00b0':' '+v.unit+(kind==='area'?'\u00b2':'');const text=scaled.toFixed(v.precision);return (Number(text)===0?Math.abs(scaled).toFixed(v.precision):text).replace('.',',')+suffix;}
  function convert(config,unit){const v=settings(config);if(typeof unit!=='string'||!Object.prototype.hasOwnProperty.call(unitFactors,unit))throw Error('Onbekende eenheid.');return settings({...v,unit,scale:unitFactors[unit]&&unitFactors[v.unit]?v.scale*unitFactors[v.unit]/unitFactors[unit]:v.scale});}
  function figureValue(o,kind){if(o.type==='circle')return kind==='area'?Math.PI*o.r*o.r:2*Math.PI*o.r;const vs=o.vertices;if(kind==='perimeter')return vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+Math.hypot(q.x-p.x,q.y-p.y);},0);return Math.abs(vs.reduce((sum,p,i)=>{const q=vs[(i+1)%vs.length];return sum+(p.x-vs[0].x)*(q.y-vs[0].y)-(q.x-vs[0].x)*(p.y-vs[0].y);},0))/2;}
  MI.MeasurementUnits=Object.freeze({defaults,settings,format,convert,figureValue});
  MI.MeasurementGeometry={validateAngle,value,rightPoint,anchors,translate,edges,label:(o,config)=>o.measurementMode==='text'?String(o.measurementText||''):format(value(o),o.type==='angle'?'angle':'length',config)+(o.type==='circle'?' (r)':'')};
})(window);
