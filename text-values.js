// Typed presentation values. No document mutation, editor state or expression evaluation.
(function(global){
  'use strict';const MI=(global.FZI=global.FZI||{}).MathIllustration=global.FZI.MathIllustration||{};
  const properties=Object.freeze(['name','label','length','radius','perimeter','area','angle','x','y']);
  const units=Object.freeze(['document','none','u','dimensionless','mm','cm','m','km']);
  const limits=Object.freeze({fields:128,documentFields:512,valueCodePoints:4096});
  const record=v=>v!=null&&Object.prototype.toString.call(v)==='[object Object]';
  function validate(binding,format){
    if(!record(binding)||Object.keys(binding).some(k=>!['sourceId','property'].includes(k))||typeof binding.sourceId!=='string'||!binding.sourceId.trim()||!properties.includes(binding.property))throw Error('Ongeldige bronverwijzing.');
    if(!record(format)||Object.keys(format).some(k=>!['precision','unitMode','angleMode','prefix','suffix'].includes(k))||format.precision!==null&&(!Number.isInteger(format.precision)||format.precision<0||format.precision>10)||!units.includes(format.unitMode)||format.angleMode!=null&&!['document','deg','rad'].includes(format.angleMode)||['prefix','suffix'].some(k=>typeof format[k]!=='string'||format[k].length>2000))throw Error('Ongeldige waardeopmaak.');
    return {binding:{...binding},format:{...format,angleMode:format.angleMode||'document'}};
  }
  const runs=content=>content?.paragraphs.flatMap(p=>p.runs.filter(r=>r.kind==='dynamicValue'))||[];
  function resolve(run,sources,meta={},allowed=()=>true){
    const {binding:b,format:f}=validate(run.binding,run.format),source=sources.get(b.sourceId);
    if(!allowed(b.sourceId,b.property))return {status:'denied',text:'niet beschikbaar'};
    let status=!source?'missing':source.constructionValid===false?'invalid':!MI.DynamicText.propertiesFor(source).includes(b.property)?'unsupported':'ok';
    if(status!=='ok')return {status,text:f.prefix+'niet beschikbaar'+f.suffix};
    try{let adjusted=source,settings=meta.measurement;
    if(!['name','label','angle'].includes(b.property)&&!['document','none'].includes(f.unitMode)){
      const initial=settings||{schema:1,unit:'e',scale:1,precision:2},physical=u=>['mm','cm','m','km'].includes(u);
      if(physical(initial.unit)!==physical(f.unitMode))return {status:'invalid',text:f.prefix+'niet beschikbaar'+f.suffix};
      settings=MI.MeasurementUnits.convert(initial,f.unitMode);
    }
    if(b.property==='angle'&&f.angleMode!=='document')adjusted={...source,angleSettings:{...(source.angleSettings||MI.AngleMeasurements.defaults),unit:f.angleMode}};
    let text=MI.DynamicText.value({textBinding:{schema:1,...b,precision:f.precision,prefix:'',suffix:''}},new Map([[b.sourceId,adjusted]]),{...meta,measurement:settings});
    if(f.unitMode==='none'&&!['name','label'].includes(b.property))text=text.replace(/(?:\s(?:rad|u|e|mm|cm|m|km)(?:\u00b2)?|\u00b0)$/,'');
    if(Array.from(text).length>limits.valueCodePoints||!['name','label'].includes(b.property)&&(/NaN|Infinity/.test(text)||text==='niet beschikbaar'))return {status:'invalid',text:f.prefix+'niet beschikbaar'+f.suffix};
    return {status,text:f.prefix+text+f.suffix};
    }catch{return {status:'invalid',text:f.prefix+'niet beschikbaar'+f.suffix};}
  }
  function renderContent(content,sources,meta={},allowed){return {...content,paragraphs:content.paragraphs.map(p=>({...p,runs:p.runs.map(r=>r.kind==='dynamicValue'?{id:r.id,kind:'text',text:resolve(r,sources,meta,allowed).text,marks:r.marks}:r)}))};}
  function redact(content,allowed){return {...content,paragraphs:content.paragraphs.map(p=>({...p,runs:p.runs.map(r=>r.kind==='dynamicValue'&&!allowed(r.binding.sourceId,r.binding.property)?{id:r.id,kind:'text',text:'niet beschikbaar',marks:r.marks}:r)}))};}
  function migrate(object){
    if('legacyStaticText'in object)throw Error('Een legacy objectveld botst met de tekstbackup.');
    const b=MI.DynamicText.settings(object.textBinding);if(!b)throw Error('Selecteer bestaande dynamische tekst.');
    const style=object.style||{},font=style.fontFamily||'Source Sans 3, sans-serif';
    if(!/Source Sans 3|Source Serif 4|^sans-serif$|^serif$/.test(font))throw Error('Dit legacy-lettertype kan niet zonder opmaakverlies worden omgezet.');
    const content={schema:3,defaults:{fontId:/Serif|^serif$/.test(font)?'serif':'sans',fontSize:style.fontSize||16,color:style.fill||'#222222'},width:null,paragraphs:[{id:'legacy-p1',align:style.anchor==='middle'?'center':style.anchor==='end'?'right':'left',lineHeight:1.25,runs:[]}]},list=content.paragraphs[0].runs;
    if(b.prefix)list.push({id:'legacy-prefix',kind:'text',text:b.prefix,marks:{}});
    list.push({id:'legacy-value',kind:'dynamicValue',binding:{sourceId:b.sourceId,property:b.property},format:{precision:b.precision,unitMode:'document',angleMode:'document',prefix:'',suffix:''},marks:{}});
    if(b.suffix)list.push({id:'legacy-suffix',kind:'text',text:b.suffix,marks:{}});
    return MI.TextContent.validate(content);
  }
  function checkDocument(objects){let count=0;const map=new Map(objects.map(o=>[o.id,o]));for(const o of objects){const list=runs(o.textContent);if(list.length>limits.fields)throw Error('Tekst bevat te veel bronvelden.');count+=list.length;for(const r of list){if(r.binding.sourceId===o.id)throw Error('Tekst kan niet naar zichzelf verwijzen.');const source=map.get(r.binding.sourceId);if(source&&!MI.DynamicText.propertiesFor(source).includes(r.binding.property))throw Error('Bron en eigenschap passen niet bij elkaar.');}}if(count>limits.documentFields)throw Error('Document bevat te veel bronvelden.');}
  MI.TextValues=Object.freeze({properties,units,limits,validate,runs,resolve,renderContent,redact,migrate,checkDocument});
})(window);
