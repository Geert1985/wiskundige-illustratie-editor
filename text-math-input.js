(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  function templateSelection(source){
    const match=/\\(?:frac|sqrt|mathrm|mathbf|mathit|mathbb|mathcal|operatorname|overline|underline|vec|hat|bar)\s*(?:\[[^\]]+\])?\{([^{}]+)\}/.exec(source)||/\^\{([^{}]+)\}|_\{([^{}]+)\}/.exec(source);
    if(!match)return {start:source.length,end:source.length};
    const content=match[1]||match[2],offset=match.index+match[0].lastIndexOf('{')+1;
    return {start:offset,end:offset+content.length};
  }
  function catalogValue(item){return item.source||item.formula||item.latex||item.unicode;}
  function insertAtSelection(current,item,start,end){
    current=String(current);start=Math.max(0,Math.min(current.length,Number(start)||0));end=Math.max(start,Math.min(current.length,Number(end)||0));
    const inserted=catalogValue(item),value=current.slice(0,start)+inserted+current.slice(end);
    const selection=item.source?templateSelection(inserted):{start:inserted.length,end:inserted.length};
    return Object.freeze({value,selectionStart:start+selection.start,selectionEnd:start+selection.end,asFormula:Boolean(item.source||item.formula||item.latex)});
  }
  async function insertSymbol(editor,item,bookmark){
    if(item.source)return Object.freeze({mode:'formula',source:item.source,selection:templateSelection(item.source)});
    if(item.latex){const source=MI.MathSource.validate(item.latex);await MI.MathFragments.load();editor.insertMath(source,bookmark);return Object.freeze({mode:'inserted',kind:'math'});}
    editor.insertText(item.unicode,bookmark);return Object.freeze({mode:'inserted',kind:'text'});
  }
  function insertFormula(editor,source,bookmark,position){const valid=MI.MathSource.validate(source);editor.insertMath(valid,bookmark,position);return valid;}
  MI.TextMathInput=Object.freeze({templateSelection,insertAtSelection,insertSymbol,insertFormula});
})(window);
