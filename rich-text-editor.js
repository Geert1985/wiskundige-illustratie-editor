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
marks.textRunId={attrs:{id:{}},parseDOM:[{tag:'span[data-rich-run-id]',getAttrs:n=>({id:n.getAttribute('data-rich-run-id')})}],toDOM:m=>['span',{'data-rich-run-id':m.attrs.id},0]};
const schema=new Schema({nodes:{
 doc:{content:'paragraph+',attrs:{width:{default:null}}},
 paragraph:{content:'inline*',group:'block',attrs:{id:{default:null},align:{default:'left'},lineHeight:{default:1.25}},parseDOM:[{tag:'p'}],toDOM:n=>['p',{style:`text-align:${n.attrs.align};line-height:${n.attrs.lineHeight}`},0]},
 text:{group:'inline'},
 hardBreak:{inline:true,group:'inline',selectable:false,attrs:{runId:{default:null}},parseDOM:[{tag:'br'}],toDOM:()=>['br']},
 dynamicValue:{inline:true,group:'inline',atom:true,draggable:true,attrs:{binding:{},format:{},runId:{default:null}},parseDOM:[{tag:'span[data-dynamic-value]',getAttrs:n=>{const value=JSON.parse(n.getAttribute('data-dynamic-value'));return window.FZI.MathIllustration.TextValues.validate(value.binding,value.format);}}],toDOM:n=>['span',{'data-dynamic-value':JSON.stringify({binding:n.attrs.binding,format:n.attrs.format})},'niet beschikbaar']},
 math:{inline:true,group:'inline',content:'text*',draggable:true,attrs:{source:{},runId:{default:null}},parseDOM:[{tag:'span[data-math-source]',getAttrs:n=>({source:window.FZI.MathIllustration.MathSource.validate(n.getAttribute('data-math-source'))})}],toDOM:n=>['span',{'data-math-source':n.attrs.source,'aria-label':`Formule: ${n.attrs.source}`},`\\(${n.attrs.source}\\)`]}
},marks});
const marksFor=value=>Object.entries(value||{}).map(([k,v])=>schema.marks[k]?.create(['bold','italic','underline','strike'].includes(k)?null:{value:v})).filter(Boolean);
const codeForMath=source=>`\\(${source}\\)`;
function validMathCode(value){const match=/^\\\((.*?)\\\)$/s.exec(String(value));if(!match)return null;try{return window.FZI.MathIllustration.MathSource.validate(match[1]);}catch{return null;}}
function toDoc(content){return schema.node('doc',{width:content.width},content.paragraphs.map(p=>schema.node('paragraph',{id:p.id,align:p.align,lineHeight:p.lineHeight},p.runs.map(r=>r.kind==='hardBreak'?schema.node('hardBreak',{runId:r.id}):r.kind==='dynamicValue'?schema.node('dynamicValue',{binding:r.binding,format:r.format,runId:r.id},null,marksFor(r.marks)):r.kind==='math'?schema.nodes.math.create({source:r.source,runId:r.id},schema.text(codeForMath(r.source)),marksFor(r.marks)):schema.text(r.text,[...marksFor(r.marks),schema.marks.textRunId.create({id:r.id})])))));}
function fromDoc(doc,base){
 let pi=0,math=false,dynamic=false;const paragraphs=[],ids=new Set();
 doc.forEach(p=>{const paragraphIndex=++pi,runs=[];p.forEach(n=>{
   const m=Object.fromEntries(n.marks.filter(x=>x.type.name!=='textRunId').map(x=>[x.type.name,x.attrs.value??true])),textId=n.marks.find(x=>x.type.name==='textRunId')?.attrs.id;let id=['math','dynamicValue','hardBreak'].includes(n.type.name)&&n.attrs.runId||textId||`r${paragraphIndex}-${runs.length+1}`;
   while(ids.has(id))id+='-copy';ids.add(id);
   if(n.type.name==='dynamicValue'){dynamic=true;runs.push({id,kind:'dynamicValue',binding:n.attrs.binding,format:n.attrs.format,marks:m});}
   else if(n.type.name==='math'){const source=validMathCode(n.textContent);if(source){math=true;runs.push({id,kind:'math',source,marks:m});}else runs.push({id,kind:'text',text:n.textContent,marks:m});}
   else runs.push(n.isText?{id,kind:'text',text:n.text,marks:m}:{id,kind:'hardBreak'});
 });paragraphs.push({id:p.attrs.id||`p${paragraphIndex}`,align:p.attrs.align,lineHeight:p.attrs.lineHeight,runs});});
 return window.FZI.MathIllustration.TextContent.validate({...base,width:doc.attrs.width,schema:Math.max(base.schema,dynamic?3:math?2:1),paragraphs});
}
function hasInvalidMathCode(doc){let invalid=false;doc.descendants(node=>{if(invalid)return;if(node.type.name==='math'){if(!validMathCode(node.textContent))invalid=true;return;}if(node.isText){const code=node.text||'';for(const match of code.matchAll(/\\\((.*?)(?:\\\)|$)/gs)){if(!match[0].endsWith('\\)')){invalid=true;return;}try{window.FZI.MathIllustration.MathSource.validate(match[1]);}catch{invalid=true;return;}}}});return invalid;}
function mount(element,initial,onChange=()=>{},options={}){
 const MI=window.FZI.MathIllustration,base=MI.TextContent.validate(initial);let view,editMath=()=>{},editValue=()=>{},serial=0,destroyed=false;const painters=new Set();
 const markNames=['bold','italic','underline','strike','script','fontSize','fontId','color'];
 const markValue=(marks,name)=>{const mark=marks.find(item=>item.type.name===name);return mark?mark.attrs.value??true:(name==='fontSize'?base.defaults.fontSize:name==='fontId'?base.defaults.fontId:name==='color'?base.defaults.color:false);};
 const common=values=>{if(!values.length)return {value:null,mixed:false};const first=values[0];return values.some(value=>value!==first)?{value:null,mixed:true}:{value:first,mixed:false};};
 const replaceMark=(name,attrs)=>{const mark=schema.marks[name],selection=view.state.selection;if(selection.empty){const current=view.state.storedMarks||selection.$from.marks(),next=current.filter(item=>item.type!==mark);next.push(mark.create(attrs));view.dispatch(view.state.tr.setStoredMarks(next));}else view.dispatch(view.state.tr.removeMark(selection.from,selection.to,mark).addMark(selection.from,selection.to,mark.create(attrs)));view.focus();};
 const toolbarState=()=>{if(!view)return null;const state=view.state,selection=state.selection,marks=[];if(selection.empty){marks.push(state.storedMarks||selection.$from.marks());}else state.doc.nodesBetween(selection.from,selection.to,node=>{if(node.isText||['math','dynamicValue'].includes(node.type.name))marks.push(node.marks);});if(!marks.length)marks.push(state.storedMarks||selection.$from.marks());const style=Object.fromEntries(markNames.map(name=>[name,common(marks.map(list=>markValue(list,name)))]));const paragraphs=[];let pos=0;state.doc.forEach(paragraph=>{if(selection.empty?pos<=selection.from&&selection.from<=pos+paragraph.nodeSize:pos<selection.to&&pos+paragraph.nodeSize>selection.from)paragraphs.push(paragraph.attrs.align);pos+=paragraph.nodeSize;});const align=common(paragraphs.length?paragraphs:['left']);return {...style,align,canUndo:undoDepth(state)>0,canRedo:redoDepth(state)>0};};
 let editableMode=true;const mathViews=new Set();
 const state=EditorState.create({schema,doc:toDoc(base),plugins:[history(),keymap({'Mod-z':undo,'Mod-y':redo,'Mod-Shift-z':redo,'Mod-b':toggleMark(schema.marks.bold),'Mod-i':toggleMark(schema.marks.italic),'Shift-Enter':(state,dispatch)=>{dispatch(state.tr.replaceSelectionWith(schema.node('hardBreak')));return true;},...baseKeymap})]});
 view=new EditorView(element,{
   attributes:{style:`font-size:${base.defaults.fontSize}px;font-family:${base.defaults.fontId==='serif'?'"Source Serif 4"':'"Source Sans 3"'};color:${base.defaults.color};font-kerning:none;font-variant-ligatures:none`,role:'textbox','aria-label':'Tekstinhoud','aria-multiline':'true',tabindex:'0'},state,
   handleTextInput(view,from,to,text){const $from=view.state.doc.resolve(from),$to=view.state.doc.resolve(to);if($from.parent.type===schema.nodes.math&&$from.parentOffset===$from.parent.content.size&&from===to){const math=$from.parent,source=validMathCode(math.textContent);if(source){const depth=$from.depth,start=$from.before(depth),after=start+$from.node(depth).nodeSize,tr=view.state.tr.insertText(text,after,after);tr.setSelection(TextSelection.create(tr.doc,after+text.length));view.dispatch(tr);return true;}}if($from.parent.type!==schema.nodes.paragraph||$to.parent!==$from.parent)return false;if(from!==to){let hasNonText=false;view.state.doc.nodesBetween(from,to,node=>{if(!node.isText)hasNonText=true;});if(hasNonText)return false;}const parentStart=from-$from.parentOffset;let before='',beforeStart=from;$from.parent.forEach((node,offset)=>{const start=parentStart+offset,end=start+node.nodeSize;if(node.isText){const count=Math.max(0,Math.min(node.nodeSize,from-start));if(count){if(!before)beforeStart=start;before+=node.text.slice(0,count);}}else if(start<from){before='';beforeStart=end;}});const relativeTo=before.length+(to-from),expression=MI.TextMathInput.delimitedInput(before,before.length,relativeTo,text);if(!expression)return false;let source;try{source=MI.MathSource.validate(expression.source);}catch{return false;}const replaceFrom=beforeStart+expression.from,replaceTo=beforeStart+expression.to,node=schema.nodes.math.create({source,runId:`math-typed-${++serial}`},schema.text(codeForMath(source)),view.state.storedMarks||$from.marks()),tr=view.state.tr.replaceWith(replaceFrom,replaceTo,node);tr.setSelection(TextSelection.create(tr.doc,replaceFrom+node.nodeSize));view.dispatch(tr);return true;},
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
   dispatchTransaction(tr){if(tr.docChanged){const updates=[];tr.doc.descendants((node,pos)=>{if(node.type===schema.nodes.math){const source=validMathCode(node.textContent);if(source&&source!==node.attrs.source)updates.push([pos,node,source]);}});for(const [pos,node,source] of updates)tr.setNodeMarkup(pos,schema.nodes.math,{...node.attrs,source},node.marks);}const next=view.state.apply(tr);view.updateState(next);try{onChange(fromDoc(next.doc,base));}catch(e){onChange(null,e);}options.onStateChange?.(toolbarState());},
   nodeViews:{dynamicValue(node,view,getPos){
     const dom=document.createElement('span');dom.className='rich-value-atom';dom.contentEditable='false';dom.draggable=true;dom.setAttribute('role','group');let lastPaint=null;
     const paint=()=>{if(destroyed)return;const run={kind:'dynamicValue',binding:node.attrs.binding,format:node.attrs.format},value=options.resolveValue?.(run)||{status:'missing',text:'niet beschikbaar'},m=Object.fromEntries(node.marks.map(mark=>[mark.type.name,mark.attrs.value??true]));const signature=JSON.stringify([value.text,value.status,m]);if(signature===lastPaint)return;lastPaint=signature;dom.textContent=value.text;dom.dataset.valueStatus=value.status;dom.setAttribute('aria-label','Dynamische waarde: '+value.text);dom.style.fontSize=(m.fontSize||base.defaults.fontSize)+'px';dom.style.color=m.color||base.defaults.color;dom.style.fontFamily=(m.fontId||base.defaults.fontId)==='serif'?'"Source Serif 4"':'"Source Sans 3"';dom.style.fontWeight=m.bold?'700':'400';dom.style.fontStyle=m.italic?'italic':'normal';dom.style.textDecoration=[m.underline?'underline':'',m.strike?'line-through':''].filter(Boolean).join(' ');dom.style.verticalAlign=m.script==='super'?'super':m.script==='sub'?'sub':'baseline';if(m.script)dom.style.fontSize=((m.fontSize||base.defaults.fontSize)*.7)+'px';};
     paint();painters.add(paint);dom.addEventListener('dblclick',event=>{event.preventDefault();view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc,getPos())));editValue(getPos());});return {dom,ignoreMutation:mutation=>mutation.type!=='selection',destroy(){painters.delete(paint);}};
   },math(node,view,getPos){
     const dom=document.createElement('span'),contentDOM=document.createElement('span'),rendered=document.createElement('span');dom.className='rich-math-atom';dom.setAttribute('role','group');contentDOM.className='rich-math-code-source';rendered.className='rich-math-rendered';dom.append(contentDOM,rendered);let dead=false,current=node;
     const display=()=>{dom.dataset.view=editableMode?'code':'visual';contentDOM.hidden=!editableMode;rendered.hidden=editableMode;};
     const paint=()=>{if(dead||destroyed)return;const source=validMathCode(current.textContent);if(!source){dom.setAttribute('aria-invalid','true');display();return;}const m=Object.fromEntries(current.marks.map(mark=>[mark.type.name,mark.attrs.value??true])),nominal=m.fontSize||base.defaults.fontSize,size=nominal*(m.script?0.7:1),shift=m.script==='super'?-nominal*0.4:m.script==='sub'?nominal*0.2:0,color=m.color||base.defaults.color;try{const b=MI.MathFragments.box(source,m);rendered.innerHTML=MI.MathFragments.svg(source,size,color,0,0,m);const svg=rendered.firstChild;if(svg){svg.removeAttribute('x');svg.removeAttribute('y');svg.setAttribute('aria-hidden','true');}rendered.style.verticalAlign=`${-b.descent*size-shift}px`;rendered.style.borderBottom=m.underline?`1px solid ${color}`:'';rendered.style.background=m.strike?`linear-gradient(transparent 45%,${color} 45%,${color} 50%,transparent 50%)`:'';dom.setAttribute('aria-label',`Formule: ${source}`);dom.removeAttribute('aria-invalid');}catch{rendered.textContent=source;dom.setAttribute('data-render-pending','true');}display();};
     const sync=()=>{const pos=getPos();if(Number.isInteger(pos))current=view.state.doc.nodeAt(pos)||current;paint();};
     mathViews.add(sync);sync();if(!MI.MathFragments.ready())MI.MathFragments.load().then(()=>{for(const paintView of mathViews)paintView();options.onMathReady?.();}).catch(()=>{});
     return {dom,contentDOM,update(next){if(next.type!==schema.nodes.math)return false;current=next;paint();return true;},ignoreMutation:mutation=>mutation.type==='selection'?false:!contentDOM.contains(mutation.target),destroy(){dead=true;mathViews.delete(sync);}};
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
   hasInvalidMathDraft(){return hasInvalidMathCode(view.state.doc);},
   setEditable(value){const next=Boolean(value);if(!next&&hasInvalidMathCode(view.state.doc))return false;let hasMath=false;view.state.doc.descendants(node=>{if(node.type===schema.nodes.math)hasMath=true;});if(!next&&hasMath&&!MI.MathFragments.ready())return false;editableMode=next;view.setProps({editable:()=>editableMode});element.dataset.view=editableMode?'code':'visual';for(const sync of mathViews)sync();return true;},
   setValueEditHandler:handler=>{editValue=handler;},refreshValues(){for(const paint of painters)paint();},
   setMathEditHandler:handler=>{editMath=handler;},
   selectedMath(){const s=view.state.selection;return s instanceof NodeSelection&&s.node.type.name==='math'?{position:s.from,source:validMathCode(s.node.textContent)||s.node.attrs.source}:null;},
   selectedValue(){const s=view.state.selection;return s instanceof NodeSelection&&s.node.type.name==='dynamicValue'?{position:s.from,binding:s.node.attrs.binding,format:s.node.attrs.format}:null;},
   insertValue(binding,format,b,position=null){
     const data=MI.TextValues.validate(binding,format);restore(b);let tr=view.state.tr;
     if(position!=null){const old=tr.doc.nodeAt(position);if(old?.type.name!=='dynamicValue')throw Error('Het bronveld is niet meer beschikbaar.');tr=tr.setNodeMarkup(position,schema.nodes.dynamicValue,{...old.attrs,...data},old.marks).setSelection(NodeSelection.create(tr.doc,position));}
     else {const end=view.state.selection.to;tr=tr.replaceSelectionWith(schema.nodes.dynamicValue.create({...data,runId:`value-new-${++serial}`},null,view.state.storedMarks||view.state.selection.$from.marks()));tr=tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(end,1)),1));}
     view.dispatch(closeHistory(tr));view.dispatch(closeHistory(view.state.tr).setMeta('addToHistory',false));view.focus();
   },
   insertText(text,b){restore(b);view.dispatch(view.state.tr.insertText(text));view.focus();},
   insertMath(source,b,position=null){
     source=MI.MathSource.validate(source);MI.MathFragments.box(source);restore(b);let tr=view.state.tr,node;
     if(position!=null){const old=tr.doc.nodeAt(position);if(old?.type.name!=='math')throw Error('De formule is niet meer beschikbaar.');node=schema.nodes.math.create({...old.attrs,source},schema.text(codeForMath(source)),old.marks);tr=tr.replaceWith(position,position+old.nodeSize,node);tr=tr.setSelection(TextSelection.create(tr.doc,position+node.nodeSize));}
     else {const end=view.state.selection.to;node=schema.nodes.math.create({source,runId:`math-new-${++serial}`},schema.text(codeForMath(source)),view.state.storedMarks||view.state.selection.$from.marks());tr=tr.replaceSelectionWith(node);tr=tr.setSelection(TextSelection.create(tr.doc,tr.mapping.map(end,1)));}
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
