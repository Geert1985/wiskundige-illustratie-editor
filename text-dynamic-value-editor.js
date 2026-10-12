(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  const labels={name:'Naam',label:'Label',length:'Lengte',radius:'Straal',perimeter:'Omtrek',area:'Oppervlakte',angle:'Hoek',x:'x-coördinaat',y:'y-coördinaat'};
  const unitLabels={document:'Documentstandaard',none:'Geen eenheidssuffix',u:'Abstract (u)',dimensionless:'Dimensieloos',mm:'Millimeter (mm)',cm:'Centimeter (cm)',m:'Meter (m)',km:'Kilometer (km)',deg:'Graden (°)',rad:'Radialen (rad)'};
  const defaultFormat=()=>({precision:null,unitMode:'document',angleMode:'document',prefix:'',suffix:''});
  function mount(panel,editor,options,{begin,close,fail}){
    const sourceSelect=panel.querySelector('#valueSource'),propertySelect=panel.querySelector('#valueProperty'),precision=panel.querySelector('#valuePrecision'),precisionLabel=panel.querySelector('#valuePrecisionLabel'),unit=panel.querySelector('#valueUnit'),prefix=panel.querySelector('#valuePrefix'),suffix=panel.querySelector('#valueSuffix'),apply=panel.querySelector('#valueInsert'),preview=panel.querySelector('#valuePreview'),error=panel.querySelector('#mathError')||panel.closest('dialog')?.querySelector('#mathError');
    const listeners=[];let position=null,bookmark=null,destroyed=false,editing=false,precisionStored=null,precisionTouched=false,unitTouched=false,openedBinding=null,openedFormat=defaultFormat(),activeBaseFormat=defaultFormat();
    const on=(node,event,handler)=>{node.addEventListener(event,handler);listeners.push(()=>node.removeEventListener(event,handler));};
    function fillOptions(node,items,value){node.replaceChildren();for(const item of items){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;node.append(option);}node.value=value;if(!node.value&&items.length)node.value=items[0].value;}
    function optionsForProperty(property){
      if(property==='angle')return ['document','deg','rad','none'].map(value=>({value,label:unitLabels[value]}));
      if(property==='name'||property==='label')return [{value:'document',label:'Geen eenheid'}];
      return MI.TextValues.units.map(value=>({value,label:unitLabels[value]||value}));
    }
    function unitChoice(format,property){
      if(property==='angle')return format.unitMode==='none'?'none':format.angleMode||'document';
      if(property==='name'||property==='label')return 'document';
      return format.unitMode||'document';
    }
    function formatForUnit(choice,property,base){
      if(property==='angle')return {...base,unitMode:choice==='none'?'none':'document',angleMode:choice==='none'?'document':choice};
      if(property==='name'||property==='label')return {...base,unitMode:base.unitMode||'document',angleMode:base.angleMode||'document'};
      return {...base,unitMode:choice,angleMode:'document'};
    }
    function updatePrecisionLabel(){
      if(!precisionTouched&&precisionStored===null){precisionLabel.textContent='Documentstandaard';return;}
      if(!precisionTouched&&precisionStored>3){precisionLabel.textContent=`Aangepast (${precisionStored})`;return;}
      precisionLabel.textContent=`${precision.value} ${Number(precision.value)===1?'decimaal':'decimalen'}`;
    }
    function valueData(){
      const property=propertySelect.value,base=unitTouched?formatForUnit(unit.value,property,activeBaseFormat):activeBaseFormat;
      return MI.TextValues.validate({sourceId:sourceSelect.value,property},{precision:precisionTouched?precision.valueAsNumber:precisionStored,unitMode:base.unitMode,angleMode:base.angleMode,prefix:prefix.value,suffix:suffix.value});
    }
    function refresh(){
      if(destroyed||panel.querySelector('#textInsertPanel').dataset.tab!=='value')return;
      if(!sourceSelect.value||!propertySelect.value){preview.textContent='Geen beschikbare bron.';preview.dataset.valueStatus='missing';apply.disabled=true;error.textContent='';return;}
      try{
        const data=valueData(),result=options.resolveValue?.({...data,kind:'dynamicValue'})||{status:'missing',text:'niet beschikbaar'};
        preview.textContent=result.text;preview.dataset.valueStatus=result.status;apply.disabled=result.status==='denied';error.textContent=result.status==='denied'?'Bronwaarde niet toegestaan.':'';
      }catch(exception){preview.textContent='niet beschikbaar';preview.dataset.valueStatus='invalid';apply.disabled=true;error.textContent=exception.message;}
    }
    function setProperties(value){
      const source=(options.sourceOptions?.()||[]).find(item=>item.id===sourceSelect.value),properties=source?.properties||(value?[value]:[]);
      fillOptions(propertySelect,properties.map(property=>({value:property,label:labels[property]||property})),value);
      const isOriginal=openedBinding&&sourceSelect.value===openedBinding.sourceId&&propertySelect.value===openedBinding.property;
      activeBaseFormat=isOriginal?{...openedFormat}:{...defaultFormat(),precision:precisionStored};
      unitTouched=false;fillOptions(unit,optionsForProperty(propertySelect.value),unitChoice(activeBaseFormat,propertySelect.value));refresh();
    }
    function open(nextPosition=null){
      bookmark=begin('value');editing=true;
      const selected=editor.selectedValue(),node=nextPosition!=null?editor.view.state.doc.nodeAt(nextPosition):null,existing=node?.type.name==='dynamicValue'?node.attrs:selected;
      position=nextPosition??selected?.position??null;
      const data=existing||{binding:{},format:defaultFormat()},choices=(options.sourceOptions?.()||[]).map(item=>({value:item.id,label:item.name}));
      if(data.binding.sourceId&&!choices.some(item=>item.value===data.binding.sourceId))choices.unshift({value:data.binding.sourceId,label:'Bron niet beschikbaar'});
      openedBinding=data.binding.sourceId&&data.binding.property?{sourceId:data.binding.sourceId,property:data.binding.property}:null;openedFormat={...defaultFormat(),...data.format};
      precisionStored=data.format.precision??null;precisionTouched=false;precision.value=String(Math.min(3,Math.max(0,precisionStored??2)));updatePrecisionLabel();
      prefix.value=data.format.prefix;suffix.value=data.format.suffix;fillOptions(sourceSelect,choices,data.binding.sourceId);setProperties(data.binding.property);refresh();sourceSelect.focus();
    }
    on(sourceSelect,'change',()=>setProperties(propertySelect.value));
    on(propertySelect,'change',()=>setProperties(propertySelect.value));
    on(unit,'change',()=>{unitTouched=true;refresh();});
    on(precision,'input',()=>{precisionTouched=true;updatePrecisionLabel();refresh();});
    for(const node of [prefix,suffix])on(node,'input',refresh);
    on(apply,'click',()=>{try{refresh();if(apply.disabled)return;const data=valueData();if(!editing){bookmark=begin('value');position=null;editing=true;}editor.insertValue(data.binding,data.format,bookmark,position);editing=false;position=null;bookmark=null;close(false);refresh();}catch(exception){fail(exception);}});
    editor.setValueEditHandler(open);
    return Object.freeze({open,refresh,cancel(){editing=false;position=null;bookmark=null;apply.disabled=true;preview.textContent='';preview.dataset.valueStatus='idle';},destroy(){destroyed=true;listeners.splice(0).forEach(remove=>remove());editor.setValueEditHandler(null);}});
  }
  MI.TextDynamicValueEditor=Object.freeze({mount});
})(window);
