/* Pure model-space geometry for an ellipse defined by two foci and a distance sum. */
(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration, LIMIT=1e12, TAU=2*Math.PI;
  const invalid=reasonCode=>({geometry:null,area:null,areaStatus:null,reasonCode});
  const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  const withinLimit=p=>Math.abs(p.x)<=LIMIT&&Math.abs(p.y)<=LIMIT;

  function resolve(recipe,sources){
    if(!recipe||recipe.kind!=='ellipseByFociAndSum'||!Array.isArray(sources)||sources.length!==2||sources.some(p=>p?.type!=='point'))return invalid('INVALID_REFERENCE');
    const [f1,f2]=sources;
    if(!finitePoint(f1)||!finitePoint(f2))return invalid('SOURCE_INVALID');
    if(!withinLimit(f1)||!withinLimit(f2))return invalid('COORDINATE_LIMIT');
    const sum=recipe.sumDistance;
    if(typeof sum!=='number'||!Number.isFinite(sum))return invalid('INVALID_SUM');
    if(sum<=0)return invalid('SUM_NOT_POSITIVE');

    const dx=f2.x-f1.x,dy=f2.y-f1.y,distance=Math.hypot(dx,dy);
    if(!Number.isFinite(distance))return invalid('NON_FINITE_RESULT');
    if(sum<distance)return invalid('SUM_TOO_SMALL');
    if(sum===distance)return invalid('DEGENERATE_ELLIPSE');

    const a=sum/2,c=distance/2,delta=a-c,center={x:f1.x+dx/2,y:f1.y+dy/2};
    if(!(a>0)||!(delta>0)||!finitePoint(center))return invalid('NON_FINITE_RESULT');
    // Separate square roots avoid forming a potentially overflowing product.
    const productScale=Math.max(delta,a+c);
    const b=c===0?a:productScale*Math.sqrt((delta/productScale)*((a+c)/productScale)),e=c/a;
    const u=distance===0?{x:1,y:0}:{x:dx/distance,y:dy/distance};
    const v={x:u.y===0?0:-u.y,y:u.x};
    if(![b,e,u.x,u.y,v.x,v.y].every(Number.isFinite)||!(b>0))return invalid('NON_FINITE_RESULT');

    const halfWidthX=Math.hypot(a*u.x,b*v.x),halfWidthY=Math.hypot(a*u.y,b*v.y);
    const bounds={xMin:center.x-halfWidthX,xMax:center.x+halfWidthX,yMin:center.y-halfWidthY,yMax:center.y+halfWidthY};
    if(!Object.values(bounds).every(Number.isFinite))return invalid('NON_FINITE_RESULT');
    if(bounds.xMin < -LIMIT||bounds.xMax > LIMIT||bounds.yMin < -LIMIT||bounds.yMax > LIMIT)return invalid('COORDINATE_LIMIT');

    const area=Math.PI*a*b;
    const geometry={center,a,b,c,e,u,v,rotation:Math.atan2(u.y,u.x),bounds,
      pointAt(t){if(!Number.isFinite(t))return null;const angle=TAU*t,cs=Math.cos(angle),sn=Math.sin(angle);return {x:center.x+a*cs*u.x+b*sn*v.x,y:center.y+a*cs*u.y+b*sn*v.y};}};
    return {geometry,area:Number.isFinite(area)&&area>0?area:null,areaStatus:Number.isFinite(area)&&area>0?'VALID':'NUMERIC_UNDERFLOW',reasonCode:'VALID'};
  }

  function assertCreatable(recipe,sources){
    const result=resolve(recipe,sources);
    if(result.reasonCode!=='VALID'){
      const error=new Error('Ongeldige ellips: '+result.reasonCode);
      error.code=result.reasonCode;
      throw error;
    }
    return result;
  }

  function fromDefinition(definition){
    if(!definition||!['cx','cy','a','b','rotation'].every(k=>typeof definition[k]==='number'&&Number.isFinite(definition[k])))return invalid('INVALID_DEFINITION');
    const {cx,cy,a,b,rotation}=definition;
    if(!(a>0)||!(b>0)||b>a)return invalid('INVALID_DEFINITION');
    const center={x:cx,y:cy};if(!withinLimit(center))return invalid('COORDINATE_LIMIT');
    const u={x:Math.cos(rotation),y:Math.sin(rotation)},v={x:-u.y,y:u.x};
    const halfWidthX=Math.hypot(a*u.x,b*v.x),halfWidthY=Math.hypot(a*u.y,b*v.y);
    const bounds={xMin:cx-halfWidthX,xMax:cx+halfWidthX,yMin:cy-halfWidthY,yMax:cy+halfWidthY};
    if(!Object.values(bounds).every(Number.isFinite))return invalid('NON_FINITE_RESULT');
    if(bounds.xMin < -LIMIT||bounds.xMax > LIMIT||bounds.yMin < -LIMIT||bounds.yMax > LIMIT)return invalid('COORDINATE_LIMIT');
    const c=Math.sqrt(Math.max(0,(a-b)*(a+b))),area=Math.PI*a*b;
    const geometry={center,a,b,c,e:c/a,u,v,rotation,bounds,
      pointAt(t){if(!Number.isFinite(t))return null;const angle=TAU*t,cs=Math.cos(angle),sn=Math.sin(angle);return {x:cx+a*cs*u.x+b*sn*v.x,y:cy+a*cs*u.y+b*sn*v.y};}};
    return {geometry,area:Number.isFinite(area)&&area>0?area:null,areaStatus:Number.isFinite(area)&&area>0?'VALID':'NUMERIC_UNDERFLOW',reasonCode:'VALID'};
  }

  MI.EllipseGeometry=Object.freeze({resolve,assertCreatable,fromDefinition,limit:LIMIT});
})(window);
