(function(global){
  'use strict';
  const TAU=2*Math.PI,MAX_COUNT=100000;
  function pointsOnCircle({cx,cy,radius,count,startAngle}){
    if(![cx,cy,radius,startAngle].every(Number.isFinite)||radius<0||!Number.isSafeInteger(count)||count<1||count>MAX_COUNT)throw new RangeError('Ongeldige cirkelpuntenverdeling.');
    return Array.from({length:count},(_,index)=>{const angle=startAngle+TAU*index/count,point={x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)};if(!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new RangeError('Cirkelpunten moeten eindig blijven.');return Object.freeze(point);});
  }
  global.FZI=global.FZI||{};global.FZI.MathIllustration=global.FZI.MathIllustration||{};
  global.FZI.MathIllustration.RegularGeometry=Object.freeze({pointsOnCircle,MAX_COUNT});
})(window);
