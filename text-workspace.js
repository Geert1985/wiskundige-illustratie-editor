/* Workspace presentation only: the existing text session owns all mutations. */
(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  function mount(dialog,{onClose}={}){
    const document=dialog.ownerDocument,body=document.body,menu=dialog.querySelector('#textMoreMenu'),summary=menu.querySelector('summary'),items=menu.querySelector('.text-more-items');
    const listeners=[],background=[...body.children].filter(node=>node!==dialog&&['HEADER','MAIN'].includes(node.tagName)).map(node=>({node,inert:node.inert}));
    let opened=false;
    const on=(node,event,handler)=>{node.addEventListener(event,handler);listeners.push(()=>node.removeEventListener(event,handler));};
    function closeMenu(focus=false){menu.open=false;summary.setAttribute('aria-expanded','false');if(focus)summary.focus();}
    on(menu,'toggle',()=>summary.setAttribute('aria-expanded',String(menu.open)));
    on(document,'pointerdown',event=>{if(!menu.contains(event.target))closeMenu();});
    on(dialog,'focusin',event=>{if(menu.open&&!menu.contains(event.target))closeMenu();});
    on(menu,'keydown',event=>{
      if(event.key==='Escape'&&menu.open){event.preventDefault();event.stopPropagation();closeMenu(true);return;}
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();menu.open=true;const buttons=[...items.querySelectorAll('button:not(:disabled)')];
      if(!buttons.length){items.focus();return;}
      const index=buttons.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;buttons[next].focus();
    });
    on(dialog,'keydown',event=>{
      // Illustrator keyboard commands must never operate behind this workspace.
      event.stopPropagation();
      if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();onClose?.();return;}
      if(event.key!=='Tab')return;
      const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex],[contenteditable="true"]')].filter(node=>node.tabIndex>=0&&!node.closest('[hidden]')&&node.getClientRects().length);
      const first=focusable[0],last=focusable[focusable.length-1],active=document.activeElement;
      if(!first){event.preventDefault();dialog.focus();return;}
      if(event.shiftKey&&(active===first||!focusable.includes(active))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(active===last||!focusable.includes(active))){event.preventDefault();first.focus();}
    });
    on(document,'focusin',event=>{if(opened&&!dialog.contains(event.target))dialog.querySelector('#richTextSurface .ProseMirror')?.focus();});
    function restore(){if(!opened)return;opened=false;closeMenu();body.classList.remove('text-workspace-open');for(const item of background)item.node.inert=item.inert;}
    on(dialog,'close',restore);
    return Object.freeze({open(){if(opened)return;body.classList.add('text-workspace-open');for(const item of background)item.node.inert=true;dialog.tabIndex=-1;summary.setAttribute('aria-expanded','false');try{dialog.show();opened=true;}catch(error){opened=true;restore();throw error;}},destroy(){restore();listeners.splice(0).forEach(remove=>remove());}});
  }
  MI.TextWorkspace=Object.freeze({mount});
})(window);
