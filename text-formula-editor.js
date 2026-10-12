(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  function mount({source,preview,error,onApply}){
    let serial=0,destroyed=false;
    async function render(){
      const request=++serial;error.textContent='';
      try{
        const notation=MI.MathSource.validate(source.value);
        await MI.MathFragments.load();
        if(destroyed||request!==serial)return false;
        preview.innerHTML=MI.MathFragments.svg(notation,24,'#ffffff');
        const svg=preview.firstElementChild;if(svg){svg.removeAttribute('x');svg.removeAttribute('y');svg.setAttribute('aria-hidden','true');}
        return true;
      }catch(exception){
        if(destroyed||request!==serial)return false;
        preview.replaceChildren();error.textContent=exception.message;return false;
      }
    }
    async function apply(){if(await render())return onApply(source.value);return false;}
    return Object.freeze({render,apply,cancel(){serial++;},destroy(){destroyed=true;serial++;preview.replaceChildren();}});
  }
  MI.TextFormulaEditor=Object.freeze({mount});
})(window);
