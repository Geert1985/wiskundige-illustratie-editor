(function (global) {
  'use strict';
  function insertTextAtRange(surface,range,text) {
    surface.focus();
    const selection=global.getSelection();selection.removeAllRanges();selection.addRange(range);
    const node=document.createTextNode(text);range.deleteContents();range.insertNode(node);
    range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
    return range;
  }
  function insertFormulaAtSelection(input,text,slotStart=null,slotLength=0) {
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
    input.setRangeText(text,start,end,'end');
    const slot=slotStart==null?null:start+slotStart;
    if(slot!=null)input.setSelectionRange(slot,slot+slotLength);else input.setSelectionRange(start+text.length,start+text.length);
    input.focus();
    return {start:input.selectionStart,end:input.selectionEnd};
  }
  global.T5Prep=global.T5Prep||{};
  global.T5Prep.MathInput=Object.freeze({insertTextAtRange,insertFormulaAtSelection});
})(window);
