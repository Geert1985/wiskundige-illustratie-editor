// Semantic change categories for typed text.commit. No editor or authorization state.
(function(global){
  'use strict';const MI=global.FZI.MathIllustration;
  const stableMarks=marks=>JSON.stringify(Object.fromEntries(Object.entries(marks||{}).sort(([a],[b])=>a.localeCompare(b))));
  const mathRuns=value=>value.paragraphs.flatMap(p=>p.runs.filter(r=>r.kind==='math'));
  function contentShape(value){return JSON.stringify(value.paragraphs.map(p=>p.runs.reduce((out,r)=>{if(r.kind==='text'&&out.at(-1)?.[0]==='text')out.at(-1)[1]+=r.text;else out.push(r.kind==='text'?['text',r.text]:r.kind==='math'?['math',r.source]:['hardBreak']);return out;},[])));}
  function formatShape(value){return JSON.stringify({defaults:value.defaults,width:value.width,paragraphs:value.paragraphs.map(p=>{
    const styles=p.runs.filter(r=>r.kind!=='math').reduce((out,r)=>{
      if(r.kind==='hardBreak'){out.push(['break',0]);return out;}
      const mark=stableMarks(r.marks),last=out.at(-1);
      if(last?.[0]===mark)last[1]+=r.text.length;else out.push([mark,r.text.length]);return out;
    },[]);
    // Uniform text may change length with only content rights. Mixed formatting
    // retains its boundaries; ambiguous edits require a format grant.
    if(styles.length===1&&styles[0][0]!=='break')styles[0][1]=null;
    return {align:p.align,lineHeight:p.lineHeight,styles};
  })});}
  function changes(before,after){
    const old=mathRuns(before),next=mathRuns(after),oldById=new Map(old.map(r=>[r.id,r]));
    const changedMathFormat=next.some(r=>{const previous=oldById.get(r.id);return previous?stableMarks(previous.marks)!==stableMarks(r.marks):stableMarks(r.marks)!=='{}';});
    const changedMathSource=old.length!==next.length||next.some(r=>!oldById.has(r.id)||oldById.get(r.id).source!==r.source);
    return {content:contentShape(before)!==contentShape(after),format:formatShape(before)!==formatShape(after)||changedMathFormat,math:changedMathSource};
  }
  MI.TextContentDiff=Object.freeze({changes});
})(window);
