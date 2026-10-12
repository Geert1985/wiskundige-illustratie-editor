/* Geometry/policy host adapter kept OUTSIDE the UI-independent expression core. */
(function(root){
  'use strict';
  const MI=(root.FZI ||= {}).MathIllustration ||= {}, E=MI.ExpressionEngine,N=MI.ExpressionNumeric,A=MI.ExpressionAST;
  const physical=Object.freeze({mm:.001,cm:.01,m:1,km:1000});
  function convert(raw){
    A.object(raw,['value','property','measurement']);N.finite(raw.value);
    const p=raw.property;
    if(!A.properties.includes(p))N.fail('SOURCE_UNAVAILABLE');
    if(p==='angle')return E.quantity(N.multiply(raw.value,Math.PI/180),[0,0,1]);
    const m=raw.measurement?MI.MeasurementUnits.settings(raw.measurement):{schema:1,unit:'u',scale:1,precision:2};
    const power=p==='area'?2:1,dimension=[0,0,0];
    if(Object.hasOwn(physical,m.unit))dimension[0]=power;
    else if(m.unit!=='dimensionless')dimension[1]=power;
    let value=raw.value;
    for(let i=0;i<power;i++)value=N.multiply(value,m.scale);
    if(Object.hasOwn(physical,m.unit))for(let i=0;i<power;i++)value=N.multiply(value,physical[m.unit]);
    return E.quantity(value,dimension);
  }
  function createRestricted(session){
    if(!MI.RuntimeSession.isSession(session))N.fail('INVALID_ARGUMENT');
    return Object.freeze({
      evaluate(ast){
        if(!MI.RuntimeSession.isSession(session))N.fail('SOURCE_UNAVAILABLE');
        const revision=session.documentRevision,epoch=session.permissionEpoch;
        const meta=session.engine.model.meta;
        const result=E.evaluate(ast,{angleMode:meta.angleMeasurement?.unit||'deg',resolveSource:binding=>{
          if(!MI.RuntimeSession.isSession(session)||revision!==session.documentRevision||epoch!==session.permissionEpoch)N.fail('SOURCE_UNAVAILABLE');
          const raw=session.getExpressionSource(binding);return raw?convert(raw):null;
        }});
        if(!MI.RuntimeSession.isSession(session)||revision!==session.documentRevision||epoch!==session.permissionEpoch)N.fail('SOURCE_UNAVAILABLE');
        return result;
      }
    });
  }
  function createAuthor(engine){
    // The restricted facade is intentionally not an Engine and cannot opt into author reads.
    if(!(engine instanceof MI.Engine))N.fail('INVALID_ARGUMENT');
    return Object.freeze({evaluate(ast){
      const before=JSON.stringify(engine.toJSON()),meta=engine.model.meta;
      const result=E.evaluate(ast,{angleMode:meta.angleMeasurement?.unit||'deg',resolveSource:b=>{
        const o=engine.get(b.sourceId);if(!o||o.constructionValid===false||!MI.DynamicText.propertiesFor(o).includes(b.property))return null;
        const p=b.property,value=p==='radius'?o.r:['area','perimeter'].includes(p)?MI.MeasurementUnits.figureValue(o,p):['length','angle'].includes(p)?MI.MeasurementGeometry.value(o):o[p];
        if(!Number.isFinite(value))return null;
        return convert({value,property:p,measurement:meta.measurement||null});
      }});
      if(before!==JSON.stringify(engine.toJSON()))N.fail('SOURCE_UNAVAILABLE');return result;
    }});
  }
  MI.ExpressionSources=Object.freeze({convert,createAuthor,createRestricted});
})(globalThis);
