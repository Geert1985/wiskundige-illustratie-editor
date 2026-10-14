/* Pure, scale-aware geometry and area calculations for REG-2 regions. */
(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration, TAU=2*Math.PI, LIMIT=1e12;
  const invalid=reasonCode=>({geometry:null,area:null,reasonCode});
  function areaDisplay(input){
    const v=input||{visible:false,mode:'value',precision:null,position:{mode:'auto'}};
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['visible','mode','precision','position'].includes(k))||typeof v.visible!=='boolean'||!['value','equation'].includes(v.mode)||v.precision!==null&&(!Number.isInteger(v.precision)||v.precision<0||v.precision>10)||!v.position||typeof v.position!=='object'||Array.isArray(v.position))throw Error('Ongeldige oppervlakteweergave.');
    const p=v.position;if(p.mode==='auto'){if(Object.keys(p).some(k=>k!=='mode'))throw Error('Ongeldige labelpositie.');return {visible:v.visible,mode:v.mode,precision:v.precision,position:{mode:'auto'}};}
    if(p.mode!=='offset'||Object.keys(p).some(k=>!['mode','dx','dy'].includes(k))||!Number.isFinite(p.dx)||!Number.isFinite(p.dy)||Math.abs(p.dx)>LIMIT||Math.abs(p.dy)>LIMIT)throw Error('Ongeldige labelpositie.');
    return {visible:v.visible,mode:v.mode,precision:v.precision,position:{mode:'offset',dx:p.dx,dy:p.dy}};
  }
  function finitePoint(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}
  const exceedsCoordinateLimit=p=>Math.abs(p.x)>LIMIT||Math.abs(p.y)>LIMIT;
  function polygon(vertices){
    if(!Array.isArray(vertices)||vertices.length<3||vertices.length>256||vertices.some(p=>!finitePoint(p)))return invalid('SOURCE_INVALID');
    if(vertices.some(exceedsCoordinateLimit))return invalid('COORDINATE_LIMIT');
    const origin=vertices[0],scale=Math.max(...vertices.map(p=>Math.hypot(p.x-origin.x,p.y-origin.y)));
    if(!Number.isFinite(scale))return invalid('NON_FINITE_RESULT');if(scale===0)return invalid('DEGENERATE_REGION');
    const local=vertices.map(p=>({x:(p.x-origin.x)/scale,y:(p.y-origin.y)/scale}));
    try{MI.PolygonGeometry.validate(vertices,{allowDegenerateTriangle:true});}catch(_){return invalid('SOURCE_INVALID');}
    let twice=0;for(let i=0;i<local.length;i++){const a=local[i],b=local[(i+1)%local.length];twice+=a.x*b.y-b.x*a.y;}
    const norm=Math.abs(twice);if(!Number.isFinite(norm))return invalid('NON_FINITE_RESULT');if(norm===0)return invalid('DEGENERATE_REGION');
    const area=(norm/2)*scale*scale;if(!Number.isFinite(area))return invalid('NON_FINITE_RESULT');if(area===0)return invalid('NUMERIC_UNDERFLOW');
    const anchor=MI.PolygonGeometry.anchor({vertices});return {geometry:{kind:'polygon',vertices:vertices.map(p=>({...p})),anchor},area,reasonCode:'VALID'};
  }
  function smallSegment(theta){
    if(theta<0.5){const t2=theta*theta;return theta*t2*(1/6+t2*(-1/120+t2*(1/5040+t2*(-1/362880+t2*(1/39916800-t2/6227020800)))))/2;}
    return (theta-Math.sin(theta))/2;
  }
  function circular(kind,c,center,a,b,extent){
    if(!finitePoint(center)||!finitePoint(a)||!finitePoint(b)||!Number.isFinite(c.r)||c.r<=0)return invalid(c.r===0?'ZERO_RADIUS':'SOURCE_INVALID');
    if([center,a,b].some(exceedsCoordinateLimit))return invalid('COORDINATE_LIMIT');
    const ux=a.x-center.x,uy=a.y-center.y,vx=b.x-center.x,vy=b.y-center.y,un=Math.hypot(ux,uy),vn=Math.hypot(vx,vy);
    if(!Number.isFinite(un)||!Number.isFinite(vn))return invalid('NON_FINITE_RESULT');if(un===0||vn===0)return invalid('DEGENERATE_DIRECTION');
    const alpha=(Math.atan2(uy,ux)+TAU)%TAU,beta=(Math.atan2(vy,vx)+TAU)%TAU,delta=(beta-alpha+TAU)%TAU;
    const cross=(ux/un)*(vy/vn)-(uy/un)*(vx/vn),dot=(ux/un)*(vx/vn)+(uy/un)*(vy/vn),minor=Math.atan2(Math.abs(cross),Math.max(-1,Math.min(1,dot)));
    const mode=extent||'directed',full=mode==='major'&&delta===0,theta=mode==='directed'?delta:mode==='minor'?minor:TAU-minor;
    if(mode!=='major'&&theta===0)return invalid('DEGENERATE_REGION');
    // Deterministic CCW canonical start, including a stable tie at pi.
    let start;
    if(mode==='directed')start=alpha;
    else if(minor===Math.PI)start=Math.min(alpha,beta);
    else if(delta<Math.PI)start=mode==='minor'?alpha:beta;
    else start=mode==='minor'?beta:alpha;
    const r=c.r,extremes=[center.x+r,center.x-r,center.y+r,center.y-r];
    if(extremes.some(v=>!Number.isFinite(v)))return invalid('NON_FINITE_RESULT');
    if(extremes.some(v=>Math.abs(v)>LIMIT))return invalid('COORDINATE_LIMIT');
    const area=kind==='sector'?(r*r*theta)/2:full?Math.PI*r*r:theta<=Math.PI?r*r*smallSegment(theta):Math.PI*r*r-r*r*smallSegment(TAU-theta);
    if(!Number.isFinite(area))return invalid('NON_FINITE_RESULT');if(area===0)return invalid('NUMERIC_UNDERFLOW');
    return {geometry:{kind,center:{x:center.x,y:center.y},radius:r,startAngle:start,sweep:theta,fullDisk:full,anchor:{x:center.x,y:center.y}},area,reasonCode:'VALID'};
  }
  function resolve(recipe,sources){
    if(!recipe||!Array.isArray(sources))return invalid('INVALID_REFERENCE');
    if(recipe.kind==='polygonRegion')return sources.length===1&&sources[0].type==='polygon'?polygon(sources[0].vertices):invalid('INVALID_REFERENCE');
    if(!['circleSectorRegion','circleSegmentRegion'].includes(recipe.kind)||sources.length!==3||sources[0].type!=='circle'||sources[1].type!=='point'||sources[2].type!=='point'||!['directed','minor','major'].includes(recipe.extent||'directed'))return invalid('INVALID_REFERENCE');
    return circular(recipe.kind==='circleSectorRegion'?'sector':'segment',sources[0],{x:sources[0].cx,y:sources[0].cy},sources[1],sources[2],recipe.extent||'directed');
  }
  function format(area,display,measurement){const d=areaDisplay(display);if(!d.visible)return '';const config=d.precision==null?measurement:{...(measurement||MI.MeasurementUnits.defaults),precision:d.precision};const value=MI.MeasurementUnits.format(area,'area',config);return d.mode==='equation'?'A = '+value:value;}
  MI.RegionGeometry=Object.freeze({areaDisplay,resolve,format,limit:LIMIT});
})(window);
