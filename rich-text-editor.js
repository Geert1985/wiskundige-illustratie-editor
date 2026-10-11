import {Schema} from 'prosemirror-model';
import {EditorState,TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {toggleMark,baseKeymap} from 'prosemirror-commands';
import {history,undo,redo} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';

const marks={};
for(const [name,tag] of Object.entries({bold:'strong',italic:'em',underline:'u',strike:'s'}))marks[name]={parseDOM:[{tag}],toDOM:()=>[tag,0]};
marks.script={attrs:{value:{}},parseDOM:[{tag:'sup',getAttrs:()=>({value:'super'})},{tag:'sub',getAttrs:()=>({value:'sub'})}],toDOM:m=>[m.attrs.value==='super'?'sup':'sub',0]};
for(const [name,css] of [['color','color'],['fontSize','font-size'],['fontId','font-family']])marks[name]={attrs:{value:{}},toDOM:m=>['span',{'data-rich-mark':name,style:`${css}:${m.attrs.value}${name==='fontSize'?'px':''}`},0]};
const schema=new Schema({nodes:{doc:{content:'paragraph+'},paragraph:{content:'inline*',group:'block',attrs:{align:{default:'left'},lineHeight:{default:1.25}},parseDOM:[{tag:'p'}],toDOM:n=>['p',{style:`text-align:${n.attrs.align};line-height:${n.attrs.lineHeight}`},0]},text:{group:'inline'},hardBreak:{inline:true,group:'inline',selectable:false,parseDOM:[{tag:'br'}],toDOM:()=>['br']}} ,marks});
const marksFor=value=>Object.entries(value||{}).map(([k,v])=>schema.marks[k]?.create(['bold','italic','underline','strike'].includes(k)?null:{value:v})).filter(Boolean);
function toDoc(content){return schema.node('doc',null,content.paragraphs.map(p=>schema.node('paragraph',{align:p.align,lineHeight:p.lineHeight},p.runs.map(r=>r.kind==='hardBreak'?schema.node('hardBreak'):schema.text(r.text,marksFor(r.marks))))));}
function fromDoc(doc,base){let pi=0;const paragraphs=[];doc.forEach(p=>{const runs=[];p.forEach(n=>{const m=Object.fromEntries(n.marks.map(x=>[x.type.name,x.attrs.value??true]));runs.push(n.isText?{id:`r${pi+1}-${runs.length+1}`,kind:'text',text:n.text,marks:m}:{id:`r${pi+1}-${runs.length+1}`,kind:'hardBreak'});});paragraphs.push({id:`p${++pi}`,align:p.attrs.align,lineHeight:p.attrs.lineHeight,runs});});return window.FZI.MathIllustration.TextContent.validate({...base,paragraphs});}
function mount(element,initial,onChange=()=>{}){const base=window.FZI.MathIllustration.TextContent.validate(initial),state=EditorState.create({schema,doc:toDoc(base),plugins:[history(),keymap({'Mod-z':undo,'Mod-y':redo,'Mod-Shift-z':redo,'Mod-b':toggleMark(schema.marks.bold),'Mod-i':toggleMark(schema.marks.italic),...baseKeymap})]});let view;
 view=new EditorView(element,{attributes:{role:'textbox','aria-label':'Tekstinhoud','aria-multiline':'true'},state,dispatchTransaction(tr){const next=view.state.apply(tr);try{const canonical=fromDoc(next.doc,base);view.updateState(next);onChange(canonical);}catch(e){onChange(null,e);}},transformPastedHTML(html){const doc=new window.DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe,object,embed,svg,math,img').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])n.removeAttribute(a.name);});return doc.body.innerHTML;}});
 return {view,get:()=>fromDoc(view.state.doc,base),focus:()=>view.focus(),toggle(name,value){const mark=schema.marks[name];if(mark)toggleMark(mark,name==='script'?{value}:undefined)(view.state,view.dispatch,view);view.focus();},setColor(value){toggleMark(schema.marks.color,{value})(view.state,view.dispatch,view);view.focus();},setFontSize(value){toggleMark(schema.marks.fontSize,{value:Number(value)})(view.state,view.dispatch,view);view.focus();},setFont(value){toggleMark(schema.marks.fontId,{value})(view.state,view.dispatch,view);view.focus();},setAlign(align){view.dispatch(view.state.tr.setNodeMarkup(view.state.selection.$from.before(1),schema.nodes.paragraph,{align,lineHeight:1.25}));view.focus();},undo(){undo(view.state,view.dispatch);},redo(){redo(view.state,view.dispatch);},destroy(){view.destroy();}};
}
export {mount};
