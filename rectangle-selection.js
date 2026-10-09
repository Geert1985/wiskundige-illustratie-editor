/* Pure canvas selection rules. No model mutation, listeners or viewport discovery. */
(function(global) {
  'use strict';
  const MI=global.FZI.MathIllustration, EPS=1e-8;
  const finite=p=>p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const inside=(p,r)=>p.x>=r.left-EPS && p.x<=r.right+EPS && p.y>=r.top-EPS && p.y<=r.bottom+EPS;
  const corners=r=>[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom}];
  function segment(a,b,r) {
    let low=0,high=1;
    for(const [origin,delta,min,max] of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]) {
      if(Math.abs(delta)<EPS){if(origin<min-EPS||origin>max+EPS)return false;continue;}
      const u=(min-origin)/delta,v=(max-origin)/delta;low=Math.max(low,Math.min(u,v));high=Math.min(high,Math.max(u,v));if(low>high+EPS)return false;
    }
    return true;
  }
  function polygonContains(points,p) {
    let result=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const a=points[j],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
      if(Math.abs(dx*(p.y-a.y)-dy*(p.x-a.x))<=EPS && p.x>=Math.min(a.x,b.x)-EPS && p.x<=Math.max(a.x,b.x)+EPS && p.y>=Math.min(a.y,b.y)-EPS && p.y<=Math.max(a.y,b.y)+EPS)return true;
      if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
    }
    return result;
  }
  function polygonHit(points,r,mode) {
    if(!points || points.length<3 || !points.every(finite))return false;
    if(mode==='contain')return points.every(p=>inside(p,r));
    return points.some(p=>inside(p,r)) || points.some((p,i)=>segment(p,points[(i+1)%points.length],r)) || corners(r).some(p=>polygonContains(points,p));
  }
  function distanceToSegment(p,a,b) {
    const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function angleMarker(o,r,mode,t) {
    const [a,c,b]=o.vertices,la=Math.hypot(a.x-c.x,a.y-c.y),lb=Math.hypot(b.x-c.x,b.y-c.y),radius=Math.min(28/(t.scale||1),la*.35,lb*.35);
    const u={x:(a.x-c.x)/la,y:(a.y-c.y)/la},v={x:(b.x-c.x)/lb,y:(b.y-c.y)/lb};
    const p={x:c.x+u.x*radius,y:c.y+u.y*radius},q={x:c.x+v.x*radius,y:c.y+v.y*radius};
    if(o.angleMark==='right') {
      const corner={x:p.x+v.x*radius,y:p.y+v.y*radius},points=[p,corner,q].map(p=>t.mathToScreen(p));
      return mode==='contain'?points.every(p=>inside(p,r)):segment(points[0],points[1],r)||segment(points[1],points[2],r);
    }
    const start=Math.atan2(u.y,u.x),cross=u.x*v.y-u.y*v.x,dot=u.x*v.x+u.y*v.y,sweep=Math.abs(cross)<EPS && dot<0?-Math.PI:Math.atan2(cross,dot);
    const tau=2*Math.PI,normalize=x=>(x%tau+tau)%tau;
    const onArc=angle=>sweep>=0?normalize(angle-start)<=sweep+EPS:normalize(start-angle)<=-sweep+EPS;
    const at=angle=>t.mathToScreen({x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)});
    const center=t.mathToScreen(c),px=t.mathToScreen({x:c.x+radius,y:c.y}),py=t.mathToScreen({x:c.x,y:c.y+radius});
    const extrema=[start,start+sweep,...[Math.atan2(py.x-center.x,px.x-center.x),Math.atan2(py.y-center.y,px.y-center.y)].flatMap(angle=>[angle,angle+Math.PI]).filter(onArc)];
    if(mode==='contain')return extrema.every(angle=>inside(at(angle),r));
    if(inside(t.mathToScreen(p),r)||inside(t.mathToScreen(q),r))return true;
    const quad=corners(r).map(p=>t.screenToMath(p));
    return quad.some((a,i)=>{
      const b=quad[(i+1)%4],dx=b.x-a.x,dy=b.y-a.y,x=a.x-c.x,y=a.y-c.y,A=dx*dx+dy*dy,B=2*(x*dx+y*dy),C=x*x+y*y-radius*radius,D=B*B-4*A*C;
      if(!A||D<-EPS)return false;
      return [(-B-Math.sqrt(Math.max(0,D)))/(2*A),(-B+Math.sqrt(Math.max(0,D)))/(2*A)].some(k=>k>=-EPS&&k<=1+EPS&&onArc(Math.atan2(y+k*dy,x+k*dx)));
    });
  }
  function hits(o,r,mode,{transform:t,bounds,textGeometry={}}) {
    if(!o || o.visible===false || (o.construction && o.constructionValid===false) || !t)return false;
    if(o.type==='text')return finite(o) && polygonHit(textGeometry[o.id],r,mode);
    if(o.measurementLabelOnly && ['angle','dimension'].includes(o.type)) {
      if(o.type==='angle'){try{MI.MeasurementGeometry.validateAngle(o.vertices,o.angleMark);}catch(_){return false;}}
      else if(![o.x1,o.y1,o.x2,o.y2].every(Number.isFinite)||Math.hypot(o.x2-o.x1,o.y2-o.y1)<EPS)return false;
      return polygonHit(textGeometry[o.id],r,mode);
    }
    if(o.type==='point')return finite(o) && inside(t.mathToScreen(o),r);
    if(o.type==='circle') {
      const c={x:o.cx,y:o.cy};if(!finite(c)||!Number.isFinite(o.r)||o.r<=0)return false;
      const center=t.mathToScreen(c),px=t.mathToScreen({x:c.x+o.r,y:c.y}),py=t.mathToScreen({x:c.x,y:c.y+o.r});
      if(![center,px,py].every(finite))return false;
      const ex=Math.hypot(px.x-center.x,py.x-center.x),ey=Math.hypot(px.y-center.y,py.y-center.y);
      if(mode==='contain')return center.x-ex>=r.left-EPS && center.x+ex<=r.right+EPS && center.y-ey>=r.top-EPS && center.y+ey<=r.bottom+EPS;
      const quad=corners(r).map(p=>t.screenToMath(p));if(!quad.every(finite))return false;
      return polygonContains(quad,c) || quad.some((p,i)=>distanceToSegment(c,p,quad[(i+1)%4])<=o.r+EPS);
    }
    if(o.type==='polygon') {
      try{MI.PolygonGeometry.validate(o.vertices);}catch(_){return false;}
      return polygonHit(o.vertices.map(p=>t.mathToScreen(p)),r,mode);
    }
    if(o.type==='angle') {
      try{MI.MeasurementGeometry.validateAngle(o.vertices,o.angleMark);}catch(_){return false;}
      const points=o.vertices.map(p=>t.mathToScreen(p));
      return mode==='contain'?points.every(p=>inside(p,r))&&angleMarker(o,r,mode,t):[0,2].some(i=>segment(points[1],points[i],r))||angleMarker(o,r,mode,t);
    }
    if(MI.LinearGeometry.isLinear(o)) {
      if(![o.x1,o.y1,o.x2,o.y2].every(Number.isFinite)||Math.hypot(o.x2-o.x1,o.y2-o.y1)<EPS)return false;
      const clipped=['straight','ray'].includes(o.type)?MI.LinearGeometry.clip(o,bounds):{start:{x:o.x1,y:o.y1},end:{x:o.x2,y:o.y2}};
      if(!clipped)return false;const a=t.mathToScreen(clipped.start),b=t.mathToScreen(clipped.end);
      return finite(a)&&finite(b)&&(mode==='contain'?inside(a,r)&&inside(b,r):segment(a,b,r));
    }
    return false;
  }
  function operation(event={}){return event.ctrlKey||event.metaKey?'toggle':event.shiftKey?'add':'replace';}
  function combine(base,found,op) {
    const candidates=new Set(found);
    if(op==='replace')return found.slice();
    return [...base.filter(id=>op!=='toggle'||!candidates.has(id)),...found.filter(id=>!base.includes(id))];
  }
  function resolve(objects,start,end,options) {
    const rectangle={left:Math.min(start.x,end.x),right:Math.max(start.x,end.x),top:Math.min(start.y,end.y),bottom:Math.max(start.y,end.y)};
    const mode=options.mode || (end.x>=start.x?'contain':'cross');
    const found=objects.filter(o=>hits(o,rectangle,mode,options)).map(o=>o.id);
    return {rectangle,mode,found,ids:combine(options.base||[],found,options.operation||'replace')};
  }
  MI.RectangleSelection={hits,resolve,operation,combine};
})(window);
