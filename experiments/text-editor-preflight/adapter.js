import {Schema,DOMParser} from 'prosemirror-model';
import {EditorState,TextSelection,NodeSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {toggleMark,baseKeymap} from 'prosemirror-commands';
import {history,undo,redo,closeHistory} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import content from './content.cjs';
const tags={bold:'strong',italic:'em',underline:'u',strike:'s'};
const marks=Object.fromEntries(Object.entries(tags).map(([name,tag])=>[name,{parseDOM:[{tag}],toDOM:()=>[tag,0]}]));
marks.script={attrs:{value:{}},parseDOM:[{tag:'sup',getAttrs:()=>({value:'super'})},{tag:'sub',getAttrs:()=>({value:'sub'})}],toDOM:m=>[m.attrs.value==='super'?'sup':'sub',0]};
for(const [name,style] of [['color','color'],['fontSize','font-size'],['fontId','font-family']])marks[name]={attrs:{value:{}},toDOM:m=>['span',{'data-format':name,style:`${style}:${m.attrs.value}${name==='fontSize'?'px':''}`},0]};
export const schema=new Schema({nodes:{doc:{content:'paragraph+'},paragraph:{content:'inline*',group:'block',attrs:{align:{default:'left'},lineHeight:{default:1.25}},parseDOM:[{tag:'p'}],toDOM:n=>['p',{style:`text-align:${n.attrs.align};line-height:${n.attrs.lineHeight}`},0]},text:{group:'inline'},hardBreak:{inline:true,group:'inline',selectable:false,parseDOM:[{tag:'br'}],toDOM:()=>['br']},atom:{inline:true,group:'inline',atom:true,selectable:true,draggable:true,attrs:{kind:{},payload:{}},toDOM:n=>['span',{'data-atom':n.attrs.kind,contenteditable:'false',role:'button',tabindex:'0','aria-label':`Bewerk ${n.attrs.kind}`},`[${n.attrs.kind}]`]}},marks});
function pmMarks(value={}){return Object.entries(value).filter(([k])=>schema.marks[k]).map(([k,v])=>schema.marks[k].create(['bold','italic','underline','strike'].includes(k)?null:{value:v}));}
export function toPM(value){const own=content.canonical(value);return schema.node('doc',null,own.paragraphs.map(p=>schema.node('paragraph',{align:p.align,lineHeight:p.lineHeight},p.runs.map(r=>r.kind==='text'?schema.text(r.text,pmMarks(r.marks)):r.kind==='hardBreak'?schema.node('hardBreak'):schema.node('atom',{kind:r.kind,payload:r.payload},null,pmMarks(r.marks))))));}
export function fromPM(doc,base){const paragraphs=[];doc.forEach(p=>{const runs=[];p.forEach(n=>{const m=Object.fromEntries(n.marks.map(x=>[x.type.name,x.attrs.value??true]));runs.push(n.isText?{kind:'text',text:n.text,marks:m}:n.type.name==='hardBreak'?{kind:'hardBreak'}:{kind:n.attrs.kind,payload:n.attrs.payload,marks:m});});paragraphs.push({align:p.attrs.align,lineHeight:p.attrs.lineHeight,runs});});return content.canonical({...base,paragraphs});}
export function openEditor(element,initial,onEdit=()=>{}){
 const base=content.canonical(initial),stats={compositions:[],paste:0,rejected:0};
 const view=new EditorView(element,{attributes:{role:'textbox','aria-label':'Experimentele teksteditor','aria-multiline':'true'},state:EditorState.create({schema,doc:toPM(base),plugins:[history(),keymap({'Mod-z':undo,'Mod-y':redo,'Mod-Shift-z':redo,'Mod-b':toggleMark(schema.marks.bold),'Mod-i':toggleMark(schema.marks.italic),...baseKeymap})]}),
 dispatchTransaction(tr){const candidate=view.state.apply(tr);let own;try{own=fromPM(candidate.doc,base);}catch{stats.rejected++;return;}view.updateState(candidate);onEdit(own);},
 transformPastedHTML(html){const doc=new window.DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe,object,embed,svg,math,img').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])n.removeAttribute(a.name);});return doc.body.innerHTML;},
 handleDOMEvents:{compositionstart:()=>{stats.compositions.push('start');return false;},compositionend:()=>{stats.compositions.push('end');return false;},paste:()=>{stats.paste++;return false;}},
 handleDoubleClickOn(_v,pos,node){if(node.type.name==='atom'){view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc,pos)));onEdit(fromPM(view.state.doc,base),{opened:node.attrs});return true;}return false;}
 });
 let bookmark=null;
 return {view,base,stats,get:()=>fromPM(view.state.doc,base),select:(a,b=a)=>{view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc,a,b)));view.focus();},mark:(name)=>toggleMark(schema.marks[name])(view.state,view.dispatch,view),undo:()=>undo(view.state,view.dispatch),redo:()=>redo(view.state,view.dispatch),boundary:()=>view.dispatch(closeHistory(view.state.tr)),bookmark:()=>{bookmark=view.state.selection.getBookmark();},restore:()=>{if(bookmark)view.dispatch(view.state.tr.setSelection(bookmark.resolve(view.state.doc)));view.focus();},nodeSelect:pos=>view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc,pos))),editAtom:(pos,payload)=>view.dispatch(view.state.tr.setNodeMarkup(pos,null,{...view.state.doc.nodeAt(pos).attrs,payload})),moveAtom:(pos,to)=>{const n=view.state.doc.nodeAt(pos);const tr=view.state.tr.delete(pos,pos+n.nodeSize);tr.insert(tr.mapping.map(to),n);view.dispatch(tr);},parsePaste:html=>DOMParser.fromSchema(schema).parse(new window.DOMParser().parseFromString(html,'text/html').body),destroy:()=>view.destroy()};
}
