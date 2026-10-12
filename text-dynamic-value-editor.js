(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  const labels={name:'Naam',label:'Label',length:'Lengte',radius:'Straal',perimeter:'Omtrek',area:'Oppervlakte',angle:'Hoek',x:'x-coordinaat',y:'y-coordinaat'};
  const unitLabels={document:'Documentstandaard',none:'Geen eenheidssuffix',u:'Abstract (u)',dimensionless:'Dimensieloos'};
  function mount(panel,editor,options,{begin,close,fail}){
    const sourceSelect=panel.querySelector('#valueSource'),propertySelect=panel.querySelector('#valueProperty'),precision=panel.querySelector('#valuePrecision'),unit=panel.querySelector('#valueUnit'),angle=panel.querySelector('#valueAngle'),prefix=panel.querySelector('#valuePrefix'),suffix=panel.querySelector('#valueSuffix'),apply=panel.querySelector('#valueInsert'),preview=panel.querySelector('#valuePreview'),error=panel.querySelector('#mathError');
    const listeners=[];let position=null,bookmark=null,destroyed=false;
    const on=(node,event,handler)=>{node.addEventListener(event,handler);listeners.push(()=>node.removeEventListener(event,handler));};
    function fillOptions(node,items,value){node.replaceChildren();for(const item of items){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;node.append(option);}node.value=value;if(!node.value&&items.length)node.value=items[0].value;}
    fillOptions(unit,MI.TextValues.units.map(value=>({value,label:unitLabels[value]||value})),'document');
    function valueData(){return MI.TextValues.validate({sourceId:sourceSelect.value,property:propertySelect.value},{precision:precision.value===''?null:precision.valueAsNumber,unitMode:unit.value,angleMode:angle.value,prefix:prefix.value,suffix:suffix.value});}
    function refresh(){
      if(destroyed||panel.hidden||panel.dataset.mode!=='value')return;
      try{
        const data=valueData(),result=options.resolveValue?.({...data,kind:'dynamicValue'})||{status:'missing',text:'niet beschikbaar'};
        preview.textContent=result.text;preview.dataset.valueStatus=result.status;apply.disabled=result.status==='denied';error.textContent=result.status==='denied'?'Bronwaarde niet toegestaan.':'';
      }catch(exception){preview.textContent='niet beschikbaar';preview.dataset.valueStatus='invalid';apply.disabled=true;error.textContent=exception.message;}
    }
    function setProperties(value){
      const source=(options.sourceOptions?.()||[]).find(item=>item.id===sourceSelect.value),properties=source?.properties||(value?[value]:[]);
      fillOptions(propertySelect,properties.map(property=>({value:property,label:labels[property]||property})),value);refresh();
    }
    function open(nextPosition=null){
      bookmark=begin('value');
      const selected=editor.selectedValue(),node=nextPosition!=null?editor.view.state.doc.nodeAt(nextPosition):null,existing=node?.type.name==='dynamicValue'?node.attrs:selected;
      position=nextPosition??selected?.position??null;
      const data=existing||{binding:{},format:{precision:null,unitMode:'document',angleMode:'document',prefix:'',suffix:''}},choices=(options.sourceOptions?.()||[]).map(item=>({value:item.id,label:item.name}));
      if(data.binding.sourceId&&!choices.some(item=>item.value===data.binding.sourceId))choices.unshift({value:data.binding.sourceId,label:'Bron niet beschikbaar'});
      fillOptions(sourceSelect,choices,data.binding.sourceId);precision.value=data.format.precision??'';unit.value=data.format.unitMode;angle.value=data.format.angleMode;prefix.value=data.format.prefix;suffix.value=data.format.suffix;setProperties(data.binding.property);sourceSelect.focus();
    }
    on(sourceSelect,'change',()=>setProperties(propertySelect.value));
    for(const node of [propertySelect,precision,unit,angle,prefix,suffix])on(node,'input',refresh);
    on(apply,'click',()=>{try{const data=valueData();editor.setEditable(true);editor.insertValue(data.binding,data.format,bookmark,position);close(false);}catch(exception){editor.setEditable(false);fail(exception);}});
    editor.setValueEditHandler(open);
    return Object.freeze({open,refresh,destroy(){destroyed=true;listeners.splice(0).forEach(remove=>remove());editor.setValueEditHandler(null);}});
  }
  MI.TextDynamicValueEditor=Object.freeze({mount});
})(window);
