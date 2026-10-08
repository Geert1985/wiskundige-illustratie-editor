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
  MI.MeasurementGeometry={validateAngle,value,rightPoint,anchors,translate,edges,label:o=>o.measurementMode==='text'?String(o.measurementText||''):Number(value(o).toFixed(2))+(o.type==='angle'?'°':o.type==='circle'?' (r)':'')};
})(window);
