/* Simple closed polygons; shared validation, anchors and finite boundary geometry. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  const cross = (a,b,c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function edges(object) { return object.vertices.map((p,i,points) => { const q=points[(i+1)%points.length]; return {id:object.id,type:'line',x1:p.x,y1:p.y,x2:q.x,y2:q.y}; }); }
  function contains(points,p) {
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) { const a=points[i],b=points[j]; if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside; }
    return inside;
  }
  function validate(input) {
    if(!Array.isArray(input)||input.length<3||input.length>256) throw Error('Een veelhoek vereist 3 tot 256 hoekpunten.');
    const points=input.map(p=>{
      if(!p || ['x','y'].some(k=>!['number','string'].includes(typeof p[k]) || String(p[k]).trim()==='' || !Number.isFinite(Number(p[k])) || Math.abs(Number(p[k]))>1e12)) throw Error('Ongeldig hoekpunt.');
      return {...p,x:Number(p.x),y:Number(p.y)};
    });
    const origin=points[0], span=Math.max(...points.map(p=>Math.max(Math.abs(p.x-origin.x),Math.abs(p.y-origin.y))));
    if(!span) throw Error('Hoekpunten moeten verschillend zijn.');
    const normalized=points.map(p=>({x:(p.x-origin.x)/span,y:(p.y-origin.y)/span}));
    let area=0;
    for(let i=0;i<points.length;i++) {
      const a=normalized[i], b=normalized[(i+1)%points.length]; area+=a.x*b.y-a.y*b.x;
      for(let j=i+1;j<points.length;j++) if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<1e-9) throw Error('Hoekpunten moeten verschillend zijn.');
      const c=normalized[(i+2)%points.length];
      if(Math.abs(cross(a,b,c))<1e-12 && (a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y)>0) throw Error('Zijden mogen niet teruglopen.');
    }
    if(Math.abs(area)<1e-12) throw Error('Een veelhoek moet een oppervlakte hebben.');
    const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-12 && p.x>=Math.min(a.x,b.x)-1e-12 && p.x<=Math.max(a.x,b.x)+1e-12 && p.y>=Math.min(a.y,b.y)-1e-12 && p.y<=Math.max(a.y,b.y)+1e-12;
    for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) {
      if(j===i+1 || (i===0&&j===points.length-1)) continue;
      const a=normalized[i],b=normalized[(i+1)%points.length],c=normalized[j],d=normalized[(j+1)%points.length];
      if((cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)) throw Error('Zijden van een veelhoek mogen elkaar niet kruisen.');
    }
    return points;
  }
  MI.PolygonGeometry={validate,edges,contains,anchor:object=>({x:object.vertices.reduce((s,p)=>s+p.x,0)/object.vertices.length,y:object.vertices.reduce((s,p)=>s+p.y,0)/object.vertices.length})};
})(window);
