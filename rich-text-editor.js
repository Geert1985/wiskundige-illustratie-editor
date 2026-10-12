import {Schema} from 'prosemirror-model';
import {EditorState,TextSelection,NodeSelection} from 'prosemirror-state';
import {EditorView,Decoration,DecorationSet} from 'prosemirror-view';
import {toggleMark,baseKeymap} from 'prosemirror-commands';
import {history,undo,redo,undoDepth,redoDepth,closeHistory} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';

const marks={};
for(const [name,tag] of Object.entries({bold:'strong',italic:'em',underline:'u',strike:'s'}))marks[name]={parseDOM:[{tag}],toDOM:()=>[tag,0]};
marks.script={attrs:{value:{}},parseDOM:[{tag:'sup',getAttrs:()=>({value:'super'})},{tag:'sub',getAttrs:()=>({value:'sub'})}],toDOM:m=>[m.attrs.value==='super'?'sup':'sub',0]};
for(const [name,css] of [['color','color'],['fontSize','font-size'],['fontId','font-family']])marks[name]={attrs:{value:{}},toDOM:m=>['span',{'data-rich-mark':name,style:`${css}:${name==='fontId'?(m.attrs.value==='serif'?'"Source Serif 4"':'"Source Sans 3"'):m.attrs.value}${name==='fontSize'?'px':''}`},0]};
const schema=new Schema({nodes:{
 doc:{content:'paragraph+',attrs:{width:{default:null}}},
 paragraph:{content:'inline*',group:'block',attrs:{align:{default:'left'},lineHeight:{default:1.25}},parseDOM:[{tag:'p'}],toDOM:n=>['p',{style:`text-align:${n.attrs.align};line-height:${n.attrs.lineHeight}`},0]},
 text:{group:'inline'},
 hardBreak:{inline:true,group:'inline',selectable:false,parseDOM:[{tag:'br'}],toDOM:()=>['br']},
 dynamicValue:{inline:true,group:'inline',atom:true,draggable:true,attrs:{binding:{},format:{},runId:{default:null}},parseDOM:[{tag:'span[data-dynamic-value]',getAttrs:n=>{const value=JSON.parse(n.getAttribute('data-dynamic-value'));return window.FZI.MathIllustration.TextValues.validate(value.binding,value.format);}}],toDOM:n=>['span',{'data-dynamic-value':JSON.stringify({binding:n.attrs.binding,format:n.attrs.format})},'niet beschikbaar']},
 math:{inline:true,group:'inline',atom:true,draggable:true,attrs:{source:{},runId:{default:null}},parseDOM:[{tag:'span[data-math-source]',getAttrs:n=>({source:window.FZI.MathIllustration.MathSource.validate(n.getAttribute('data-math-source'))})}],toDOM:n=>['span',{'data-math-source':n.attrs.source,'aria-label':`Formule: ${n.attrs.source}`},n.attrs.source]}
},marks});
const marksFor=value=>Object.entries(value||{}).map(([k,v])=>schema.marks[k]?.create(['bold','italic','underline','strike'].includes(k)?null:{value:v})).filter(Boolean);
function toDoc(content){return schema.node('doc',{width:content.width},content.paragraphs.map(p=>schema.node('paragraph',{align:p.align,lineHeight:p.lineHeight},p.runs.map(r=>r.kind==='hardBreak'?schema.node('hardBreak'):r.kind==='dynamicValue'?schema.node('dynamicValue',{binding:r.binding,format:r.format,runId:r.id},null,marksFor(r.marks)):r.kind==='math'?schema.node('math',{source:r.source,runId:r.id},null,marksFor(r.marks)):schema.text(r.text,marksFor(r.marks))))));}
function fromDoc(doc,base){
 let pi=0,math=false,dynamic=false;const paragraphs=[],ids=new Set();
 doc.forEach(p=>{const runs=[];p.forEach(n=>{
   const m=Object.fromEntries(n.marks.map(x=>[x.type.name,x.attrs.value??true]));let id=['math','dynamicValue'].includes(n.type.name)&&n.attrs.runId||`r${pi+1}-${runs.length+1}`;
   while(ids.has(id))id+='-copy';ids.add(id);
   if(n.type.name==='dynamicValue'){dynamic=true;runs.push({id,kind:'dynamicValue',binding:n.attrs.binding,format:n.attrs.format,marks:m});}
   else if(n.type.name==='math'){math=true;runs.push({id,kind:'math',source:n.attrs.source,marks:m});}
   else runs.push(n.isText?{id,kind:'text',text:n.text,marks:m}:{id,kind:'hardBreak'});
 });paragraphs.push({id:`p${++pi}`,align:p.attrs.align,lineHeight:p.attrs.lineHeight,runs});});
 return window.FZI.MathIllustration.TextContent.validate({...base,width:doc.attrs.width,schema:Math.max(base.schema,dynamic?3:math?2:1),paragraphs});
}
function mount(element,initial,onChange=()=>{},options={}){
 const MI=window.FZI.MathIllustration,base=MI.TextContent.validate(initial);let view,editMath=()=>{},editValue=()=>{},serial=0,destroyed=false;const painters=new Set();
 const markNames=['bold','italic','underline','strike','script','fontSize','fontId','color'];
 const markValue=(marks,name)=>{const mark=marks.find(item=>item.type.name===name);return mark?mark.attrs.value??true:(name==='fontSize'?base.defaults.fontSize:name==='fontId'?base.defaults.fontId:name==='color'?base.defaults.color:false);};
 const common=values=>{if(!values.length)return {value:null,mixed:false};const first=values[0];return values.some(value=>value!==first)?{value:null,mixed:true}:{value:first,mixed:false};};
 const replaceMark=(name,attrs)=>{const mark=schema.marks[name],selection=view.state.selection;if(selection.empty){const current=view.state.storedMarks||selection.$from.marks(),next=current.filter(item=>item.type!==mark);next.push(mark.create(attrs));view.dispatch(view.state.tr.setStoredMarks(next));}else view.dispatch(view.state.tr.removeMark(selection.from,selection.to,mark).addMark(selection.from,selection.to,mark.create(attrs)));view.focus();};
 const toolbarState=()=>{if(!view)return null;const state=view.state,selection=state.selection,marks=[];if(selection.empty){marks.push(state.storedMarks||selection.$from.marks());}else state.doc.nodesBetween(selection.from,selection.to,node=>{if(node.isText||['math','dynamicValue'].includes(node.type.name))marks.push(node.marks);});if(!marks.length)marks.push(state.storedMarks||selection.$from.marks());const style=Object.fromEntries(markNames.map(name=>[name,common(marks.map(list=>markValue(list,name)))]));const paragraphs=[];let pos=0;state.doc.forEach(paragraph=>{if(selection.empty?pos<=selection.from&&selection.from<=pos+paragraph.nodeSize:pos<selection.to&&pos+paragraph.nodeSize>selection.from)paragraphs.push(paragraph.attrs.align);pos+=paragraph.nodeSize;});const align=common(paragraphs.length?paragraphs:['left']);return {...style,align,canUndo:undoDepth(state)>0,canRedo:redoDepth(state)>0};};
 const state=EditorState.create({schema,doc:toDoc(base),plugins:[history(),keymap({'Mod-z':undo,'Mod-y':redo,'Mod-Shift-z':redo,'Mod-b':toggleMark(schema.marks.bold),'Mod-i':toggleMark(schema.marks.italic),'Shift-Enter':(state,dispatch)=>{dispatch(state.tr.replaceSelectionWith(schema.node('hardBreak')));return true;},...baseKeymap})]});
 view=new EditorView(element,{
   attributes:{style:`font-size:${base.defaults.fontSize}px;font-family:${base.defaults.fontId==='serif'?'"Source Serif 4"':'"Source Sans 3"'};color:${base.defaults.color};font-kerning:none;font-variant-ligatures:none`,role:'textbox','aria-label':'Tekstinhoud','aria-multiline':'true',tabindex:'0'},state,
   decorations(state){
     const selection=state.selection;
     if(selection.empty||selection instanceof NodeSelection)return DecorationSet.empty;
     const selected=[];
     state.doc.nodesBetween(selection.from,selection.to,(node,pos)=>{
       if(['math','dynamicValue'].includes(node.type.name)&&pos>=selection.from&&pos+node.nodeSize<=selection.to)
         selected.push(Decoration.node(pos,pos+node.nodeSize,{class:'rich-atom-range-selected'}));
     });
     return DecorationSet.create(state.doc,selected);
   },
   handleKeyDown(view,event){if(event.key==='Enter'&&view.state.selection instanceof NodeSelection&&['math','dynamicValue'].includes(view.state.selection.node.type.name)){(view.state.selection.node.type.name==='math'?editMath:editValue)(view.state.selection.from);return true;}return false;},
   dispatchTransaction(tr){const next=view.state.apply(tr);try{const canonical=fromDoc(next.doc,base);view.updateState(next);onChange(canonical);options.onStateChange?.(toolbarState());}catch(e){onChange(null,e);}},
   nodeViews:{dynamicValue(node,view,getPos){
     const dom=document.createElement('span');dom.className='rich-value-atom';dom.contentEditable='false';dom.draggable=true;dom.setAttribute('role','group');let lastPaint=null;
     const paint=()=>{if(destroyed)return;const run={kind:'dynamicValue',binding:node.attrs.binding,format:node.attrs.format},value=options.resolveValue?.(run)||{status:'missing',text:'niet beschikbaar'},m=Object.fromEntries(node.marks.map(mark=>[mark.type.name,mark.attrs.value??true]));const signature=JSON.stringify([value.text,value.status,m]);if(signature===lastPaint)return;lastPaint=signature;dom.textContent=value.text;dom.dataset.valueStatus=value.status;dom.setAttribute('aria-label','Dynamische waarde: '+value.text);dom.style.fontSize=(m.fontSize||base.defaults.fontSize)+'px';dom.style.color=m.color||base.defaults.color;dom.style.fontFamily=(m.fontId||base.defaults.fontId)==='serif'?'"Source Serif 4"':'"Source Sans 3"';dom.style.fontWeight=m.bold?'700':'400';dom.style.fontStyle=m.italic?'italic':'normal';dom.style.textDecoration=[m.underline?'underline':'',m.strike?'line-through':''].filter(Boolean).join(' ');dom.style.verticalAlign=m.script==='super'?'super':m.script==='sub'?'sub':'baseline';if(m.script)dom.style.fontSize=((m.fontSize||base.defaults.fontSize)*.7)+'px';};
     paint();painters.add(paint);dom.addEventListener('dblclick',event=>{event.preventDefault();view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc,getPos())));editValue(getPos());});return {dom,ignoreMutation:mutation=>mutation.type!=='selection',destroy(){painters.delete(paint);}};
   },math(node,view,getPos){
     const dom=document.createElement('span');dom.className='rich-math-atom';dom.contentEditable='false';dom.draggable=true;dom.setAttribute('role','img');dom.setAttribute('aria-label',`Formule: ${node.attrs.source}`);let dead=false;
     const paint=()=>{if(dead||destroyed)return;const m=Object.fromEntries(node.marks.map(mark=>[mark.type.name,mark.attrs.value??true])),nominal=m.fontSize||base.defaults.fontSize,size=nominal*(m.script?0.7:1),shift=m.script==='super'?-nominal*0.4:m.script==='sub'?nominal*0.2:0,color=m.color||base.defaults.color,b=MI.MathFragments.box(node.attrs.source,m);dom.innerHTML=MI.MathFragments.svg(node.attrs.source,size,color,0,0,m);const svg=dom.firstChild;svg.removeAttribute('x');svg.removeAttribute('y');svg.setAttribute('aria-hidden','true');dom.style.verticalAlign=`${-b.descent*size-shift}px`;dom.style.borderBottom=m.underline?`1px solid ${color}`:'';dom.style.background=m.strike?`linear-gradient(transparent 45%,${color} 45%,${color} 50%,transparent 50%)`:'';};
     if(MI.MathFragments.ready())paint();else{dom.textContent=node.attrs.source;MI.MathFragments.load().then(paint).catch(()=>{if(!dead)dom.textContent='Formule niet beschikbaar';});}
     dom.addEventListener('dblclick',event=>{event.preventDefault();view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc,getPos())));editMath(getPos());});
     return {dom,destroy(){dead=true;}};
   }},
   transformPastedHTML(html){
     const doc=new window.DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe,object,embed,svg,math,img').forEach(n=>n.remove());
     doc.querySelectorAll('*').forEach(n=>{let source=n.tagName==='SPAN'?n.getAttribute('data-math-source'):null,value=n.tagName==='SPAN'?n.getAttribute('data-dynamic-value'):null;try{if(value){const raw=JSON.parse(value);if(Object.keys(raw).some(k=>!['binding','format'].includes(k)))throw Error();value=JSON.stringify(MI.TextValues.validate(raw.binding,raw.format));}}catch{value=null;}try{if(source)source=MI.MathSource.validate(source);}catch{source=null;}for(const a of [...n.attributes])n.removeAttribute(a.name);if(source)n.setAttribute('data-math-source',source);if(value)n.setAttribute('data-dynamic-value',value);});return doc.body.innerHTML;
   }
 });
 const bookmark=()=>({selection:view.state.selection.getBookmark(),doc:view.state.doc});
 const restore=b=>{if(!b||b.doc!==view.state.doc)throw Error('De tekstselectie is gewijzigd.');view.dispatch(view.state.tr.setSelection(b.selection.resolve(view.state.doc)));};
 return {
   view,get:()=>fromDoc(view.state.doc,base),focus:()=>view.focus(),bookmark,restore,toolbarState,
   setValueEditHandler:handler=>{editValue=handler;},refreshValues(){for(const paint of painters)paint();},
   setMathEditHandler:handler=>{editMath=handler;},
   selectedMath(){const s=view.state.selection;return s instanceof NodeSelection&&s.node.type.name==='math'?{position:s.from,source:s.node.attrs.source}:null;},
   selectedValue(){const s=view.state.selection;return s instanceof NodeSelection&&s.node.type.name==='dynamicValue'?{position:s.from,binding:s.node.attrs.binding,format:s.node.attrs.format}:null;},
   insertValue(binding,format,b,position=null){
     const data=MI.TextValues.validate(binding,format);restore(b);let tr=view.state.tr;
     if(position!=null){const old=tr.doc.nodeAt(position);if(old?.type.name!=='dynamicValue')throw Error('Het bronveld is niet meer beschikbaar.');tr=tr.setNodeMarkup(position,schema.nodes.dynamicValue,{...old.attrs,...data},old.marks).setSelection(NodeSelection.create(tr.doc,position));}
     else {const end=view.state.selection.to;tr=tr.replaceSelectionWith(schema.nodes.dynamicValue.create({...data,runId:`value-new-${++serial}`},null,view.state.storedMarks||view.state.selection.$from.marks()));tr=tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(end,1)),1));}
     view.dispatch(closeHistory(tr));view.dispatch(closeHistory(view.state.tr).setMeta('addToHistory',false));view.focus();
   },
   insertText(text,b){restore(b);view.dispatch(view.state.tr.insertText(text));view.focus();},
   insertMath(source,b,position=null){
     source=MI.MathSource.validate(source);MI.MathFragments.box(source);restore(b);let tr=view.state.tr;
     if(position!=null){const old=tr.doc.nodeAt(position);if(old?.type.name!=='math')throw Error('De formule is niet meer beschikbaar.');tr=tr.setNodeMarkup(position,schema.nodes.math,{...old.attrs,source},old.marks).setSelection(NodeSelection.create(tr.doc,position));}
     else {const end=view.state.selection.to;tr=tr.replaceSelectionWith(schema.nodes.math.create({source,runId:`math-new-${++serial}`},null,view.state.storedMarks||view.state.selection.$from.marks()));tr=tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(end,1)),1));}
     view.dispatch(closeHistory(tr));view.dispatch(closeHistory(view.state.tr).setMeta('addToHistory',false));view.focus();
   },
   toggle(name,value){const mark=schema.marks[name];if(name==='script'&&mark){const current=toolbarState().script;if(current.mixed||current.value!==value)replaceMark(name,{value});else toggleMark(mark,{value})(view.state,view.dispatch,view);}else if(mark)toggleMark(mark)(view.state,view.dispatch,view);view.focus();},
   setColor(value){replaceMark('color',{value});},
   setFontSize(value){replaceMark('fontSize',{value:Number(value)});},
   setFont(value){replaceMark('fontId',{value});},
   setAlign(align){const selection=view.state.selection,positions=[];let offset=0;view.state.doc.forEach(paragraph=>{if(selection.empty?offset<=selection.from&&selection.from<=offset+paragraph.nodeSize:offset<selection.to&&offset+paragraph.nodeSize>selection.from)positions.push([offset,paragraph]);offset+=paragraph.nodeSize;});let tr=view.state.tr;for(const [position,paragraph] of positions)if(paragraph.attrs.align!==align)tr=tr.setNodeMarkup(position,schema.nodes.paragraph,{...paragraph.attrs,align});if(tr.docChanged)view.dispatch(tr);view.focus();},
   undo(){undo(view.state,view.dispatch);view.focus();},redo(){redo(view.state,view.dispatch);view.focus();},destroy(){destroyed=true;view.destroy();}
 };
}
export {mount};
