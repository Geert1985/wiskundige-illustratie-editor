import {openEditor} from './adapter.js';
import content from './content.cjs';
import * as render from './render.js';
const dialog=document.querySelector('#dialog'),palette=document.querySelector('#palette');
let host=content.fixture,hostActions=0,editor=null,openedAtom=null;
function open(value=host){editor?.destroy();editor=openEditor(document.querySelector('#editor'),value,(draft,event)=>{document.querySelector('#draft').textContent=JSON.stringify(draft);if(event?.opened)openedAtom=event.opened;});dialog.showModal();editor.view.focus();}
function cancel(){dialog.close();palette.hidden=true;editor?.destroy();editor=null;}
document.querySelector('#open').onclick=()=>open();
document.querySelector('#cancel').onclick=cancel;
document.querySelector('#ok').onclick=()=>{const next=editor.get();if(JSON.stringify(host)!==JSON.stringify(next)){host=next;hostActions++;}cancel();};
for(const name of ['bold','italic']){const b=document.querySelector('#'+name);b.onmousedown=e=>{e.preventDefault();editor.bookmark();};b.onclick=()=>{editor.restore();editor.mark(name);};}
document.querySelector('#paletteButton').onclick=()=>{editor.bookmark();palette.hidden=false;document.querySelector('#paletteClose').focus();};
document.querySelector('#paletteClose').onclick=()=>{palette.hidden=true;editor.restore();};
dialog.addEventListener('cancel',e=>{e.preventDefault();if(!palette.hidden){palette.hidden=true;editor.restore();}else cancel();});
// Explicit layer-aware Escape routing avoids relying on browser cancel-event timing.
dialog.addEventListener('keydown',e=>{if(e.key!=='Escape')return;e.preventDefault();e.stopPropagation();if(!palette.hidden){palette.hidden=true;editor.restore();}else cancel();});
document.querySelector('#fullscreen').onclick=()=>document.querySelector('#surface').classList.toggle('fullscreen');
document.querySelector('#renders').onclick=async()=>{await render.ready;document.querySelector('#renderArea').innerHTML=render.makeSvg('text',{count:5});};
window.probe={open,cancel,get editor(){return editor;},get host(){return host;},get hostActions(){return hostActions;},get openedAtom(){return openedAtom;},reset:()=>{host=content.fixture;hostActions=0;},content,render};
