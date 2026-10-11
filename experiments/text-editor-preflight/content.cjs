// Prototype storage adapter. No ProseMirror dependency; not a production schema/validator.
const kinds=['text','hardBreak','math','dynamicValue','calculatedValue'];
const allowedMarks=['bold','italic','underline','strike','script','color','fontSize','fontId'];
function canonical(input){
 if(!input||!Array.isArray(input.paragraphs)||input.paragraphs.length>128)throw Error('INVALID_CONTENT');
 let chars=0,runs=0;
 const paragraphs=input.paragraphs.map((p,pi)=>{const out=[];if(!['left','center','right'].includes(p.align))throw Error('INVALID_ALIGN');
 for(const run of p.runs){if(!kinds.includes(run.kind))throw Error('INVALID_RUN');if(++runs>2048)throw Error('RUN_LIMIT');
 const marks=Object.fromEntries(allowedMarks.filter(k=>run.marks?.[k]!=null&&run.marks[k]!==false).map(k=>[k,run.marks[k]]));
 if(run.kind==='text'){if(typeof run.text!=='string')throw Error('INVALID_TEXT');chars+=Array.from(run.text).length;if(chars>20000)throw Error('TEXT_LIMIT');if(!run.text)continue;const prior=out.at(-1);if(prior?.kind==='text'&&JSON.stringify(prior.marks)===JSON.stringify(marks))prior.text+=run.text;else out.push({kind:'text',text:run.text,marks});}
 else if(run.kind==='hardBreak')out.push({kind:'hardBreak'});
 else {if(!run.payload||typeof run.payload!=='object')throw Error('INVALID_ATOM');out.push({kind:run.kind,payload:JSON.parse(JSON.stringify(run.payload)),marks});}
 }return {id:`p${pi+1}`,align:p.align,lineHeight:p.lineHeight??1.25,runs:out.map((r,i)=>({id:`r${pi+1}-${i+1}`,...r}))};});
 return {schema:1,defaults:{fontId:'sans',fontSize:16,color:'#222222',...input.defaults},width:input.width??null,paragraphs};
}
const fixture=canonical({paragraphs:[{align:'left',runs:[{kind:'text',text:'Alpha beta',marks:{}},{kind:'hardBreak'},{kind:'text',text:'é e\u0301 αβθΩπ ≤≥±×÷ AV To Wa fi',marks:{}}]},{align:'left',runs:[{kind:'text',text:'Second paragraph',marks:{italic:true}}]}]});
const atoms=canonical({paragraphs:[{align:'left',runs:[{kind:'text',text:'A',marks:{}},{kind:'math',payload:{source:'x^2'}},{kind:'text',text:'B',marks:{}},{kind:'dynamicValue',payload:{sourceId:'circle-2',property:'radius'}},{kind:'text',text:'C',marks:{}},{kind:'calculatedValue',payload:{ast:{kind:'number',value:2}}},{kind:'text',text:'D',marks:{}}]}]});
module.exports={canonical,fixture,atoms,allowedMarks};
