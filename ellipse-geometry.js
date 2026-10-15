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

  // Euclidean closest point, optionally measured after an affine screen mapping.
  // Principal axes reduce the transformed ellipse to a canonical first-quadrant
  // problem. Its stationary equation has one interior root for x,y > 0.
  function nearest(definition,query,map=p=>p){
    const result=fromDefinition(definition);if(result.reasonCode!=='VALID'||!finitePoint(query))return null;
    const g=result.geometry,center=map(g.center),pa=map({x:g.center.x+g.a*g.u.x,y:g.center.y+g.a*g.u.y}),pb=map({x:g.center.x+g.b*g.v.x,y:g.center.y+g.b*g.v.y});
    if(![center,pa,pb].every(finitePoint))return null;
    const U={x:pa.x-center.x,y:pa.y-center.y},V={x:pb.x-center.x,y:pb.y-center.y};
    const scale=Math.max(Math.hypot(U.x,U.y),Math.hypot(V.x,V.y));if(!(scale>0)||!Number.isFinite(scale))return null;
    const u={x:U.x/scale,y:U.y/scale},v={x:V.x/scale,y:V.y/scale};
    const theta=.5*Math.atan2(2*(u.x*u.y+v.x*v.y),u.x*u.x+v.x*v.x-u.y*u.y-v.y*v.y);
    const ex={x:Math.cos(theta),y:Math.sin(theta)},ey={x:-Math.sin(theta),y:Math.cos(theta)};
    const dot=(a,b)=>a.x*b.x+a.y*b.y,det=u.x*v.y-u.y*v.x;
    const major=Math.hypot(dot(u,ex),dot(v,ex)),minor=Math.abs(det)/major;
    if(!(minor>0)||!Number.isFinite(major))return null;
    const d={x:(query.x-center.x)/scale,y:(query.y-center.y)/scale},qx=dot(d,ex),qy=dot(d,ey),x=Math.abs(qx),y=Math.abs(qy),A=major,B=Math.min(major,minor);
    if(!finitePoint(d))return null;
    let cs,sn,iterations=0;
    if(A===B){const length=Math.hypot(x,y);cs=length?x/length:1;sn=length?y/length:0;}
    else if(y===0){cs=Math.min(1,A*x/((A-B)*(A+B)));sn=Math.sqrt(Math.max(0,(1-cs)*(1+cs)));}
    else if(x===0){cs=0;sn=1;}
    else {
      // Normalize products to avoid overflow for queries far from a tiny ellipse.
      const size=Math.max(A,B,x,y),a=A/size,b=B/size,X=x/size,Y=y/size;
      let low=0,high=Math.PI/2;
      for(let i=0;i<96;i++){iterations++;const t=(low+high)/2,c=Math.cos(t),s=Math.sin(t),f=(b*b-a*a)*s*c+a*X*s-b*Y*c;if(f>0)high=t;else low=t;}
      const t=(low+high)/2;cs=Math.cos(t);sn=Math.sin(t);
    }
    cs*=qx<0?-1:1;sn*=qy<0?-1:1;
    const right={x:dot(u,ex)/major,y:dot(v,ex)/major},orientation=det<0?-1:1;
    const cp=right.x*cs-orientation*right.y*sn,sp=right.y*cs+orientation*right.x*sn;
    const parameter=((Math.atan2(sp,cp)/TAU)%1+1)%1,point=g.pointAt(parameter),screenPoint=map(point);
    if(!finitePoint(point)||!finitePoint(screenPoint))return null;
    const distance=Math.hypot(query.x-screenPoint.x,query.y-screenPoint.y);if(!Number.isFinite(distance))return null;
    return {point,screenPoint,parameter,distance,iterations};
  }

  function rectangleHit(definition,rect,mode,map=p=>p){
    const g=fromDefinition(definition).geometry;if(!g||!rect||!['left','right','top','bottom'].every(k=>Number.isFinite(rect[k])))return false;
    const C=map(g.center),P=map({x:g.center.x+g.a*g.u.x,y:g.center.y+g.a*g.u.y}),Q=map({x:g.center.x+g.b*g.v.x,y:g.center.y+g.b*g.v.y});if(![C,P,Q].every(finitePoint))return false;
    const U={x:P.x-C.x,y:P.y-C.y},V={x:Q.x-C.x,y:Q.y-C.y},ex=Math.hypot(U.x,V.x),ey=Math.hypot(U.y,V.y),eps=1e-8;
    const contained=C.x-ex>=rect.left-eps&&C.x+ex<=rect.right+eps&&C.y-ey>=rect.top-eps&&C.y+ey<=rect.bottom+eps;
    if(mode==='contain'||contained)return contained;
    if(C.x+ex<rect.left||C.x-ex>rect.right||C.y+ey<rect.top||C.y-ey>rect.bottom)return false;
    const scale=Math.max(ex,ey),ux=U.x/scale,uy=U.y/scale,vx=V.x/scale,vy=V.y/scale,det=ux*vy-uy*vx;if(!det)return false;
    const corners=[{x:rect.left,y:rect.top},{x:rect.right,y:rect.top},{x:rect.right,y:rect.bottom},{x:rect.left,y:rect.bottom}].map(p=>{const dx=(p.x-C.x)/scale,dy=(p.y-C.y)/scale;return {x:(dx*vy-dy*vx)/det,y:(ux*dy-uy*dx)/det};});
    return corners.some((p,i)=>{const q=corners[(i+1)%4],dx=q.x-p.x,dy=q.y-p.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,-(p.x*dx+p.y*dy)/length)):0;return Math.hypot(p.x+t*dx,p.y+t*dy)<=1+eps&&Math.max(Math.hypot(p.x,p.y),Math.hypot(q.x,q.y))>=1-eps;});
  }

  MI.EllipseGeometry=Object.freeze({resolve,assertCreatable,fromDefinition,nearest,rectangleHit,limit:LIMIT});
})(window);
