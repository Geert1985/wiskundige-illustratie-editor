const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {runtime,plain,root}=require('./helpers.cjs');let convert;
test.before(async()=>{({convert}=await import('data:text/javascript;base64,'+fs.readFileSync(path.join(root,'math-renderer.bundle.js')).toString('base64')));});
const setup=()=>{const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI;MI.MathFragments.install(convert);return MI;};
const formula=(source='x^2+y^2=r^2')=>({schema:2,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[{id:'r1',kind:'text',text:'Formule ',marks:{}},{id:'m1',kind:'math',source,marks:{color:'#cc0000'}},{id:'r2',kind:'text',text:' klaar',marks:{}}]}]});
const doc=content=>({version:7,textSchema:2,objects:[{id:'T',type:'text',x:0,y:0,text:'fallback',textContent:content||formula()}]});
const options=(document,caps={content:true,format:true,math:true},patch={})=>({actorId:'student',assessmentKind:'practice',initialDocument:document,policy:{schema:2,activityId:'t2',revision:'1',profile:'course',defaultCapabilities:{read:true,display:true,selectCanvas:true,selectList:true},initialObjectRules:document.objects.some(o=>o.id==='T')?{T:{read:true,display:true,textCapabilities:caps,...patch}}:{},createdObjectRules:{text:{read:true,display:true,textCapabilities:caps}},allowedTools:['create:text'],document:{undo:true,redo:true,exportJSON:true,exportSVG:true},parameters:{},limits:{maxObjects:100,maxCommandBytes:65536,maxBatchObjects:100,maxDependencyDepth:32}}});
test('T2 source language rejects macros, URLs, HTML, malformed groups and quota attacks',()=>{
 const MI=setup();for(const source of ['\\href{https://x}{x}','\\includegraphics{x}','\\require{html}','\\def\\x{x}','\\htmlClass{x}{y}','\\csname x\\endcsname','<script>x</script>','x%comment','\\frac{1}','\\sqrt{','x^','{'.repeat(33)+'x'+'}'.repeat(33),'x'.repeat(2049),'x'.repeat(257)])assert.throws(()=>MI.MathSource.validate(source),source);
 for(const source of ['x^2+y^2=r^2','\\sin^2(\\theta)+\\cos^2(\\theta)=1','\\frac{1}{2}','\\sqrt[3]{x+1}','\\mathbb{R}','\\alpha\\leq\\beta'])assert.equal(MI.MathSource.validate(source),source);
});
test('T2 schema 2 stores source only, retains schema 1 and rejects unknown fields/fragments',()=>{
 const MI=setup(),c=formula();assert.equal(MI.TextContent.validate(c).schema,2);assert.match(MI.TextContent.plain(c),/x\^2/);
 for(const patch of [{svg:'<path/>'},{html:'x'},{source:'\\href{x}{x}'},{source:'x^2^3'},{source:'\\left(x'},{kind:'dynamicValue'},{text:'cached'}]){const bad=plain(c);Object.assign(bad.paragraphs[0].runs[1],patch);assert.throws(()=>MI.TextContent.validate(bad));}
 const bad=plain(c);bad.schema=1;assert.throws(()=>MI.TextContent.validate(bad));bad.schema=4;assert.throws(()=>MI.TextContent.validate(bad));
 const many=plain(c);many.paragraphs[0].runs=Array.from({length:129},(_,i)=>({id:'m'+i,kind:'math',source:'x',marks:{}}));assert.throws(()=>MI.TextContent.validate(many));
});
test('T2 MathJax glyph output is bounded, sanitized, deterministic and self-contained',()=>{
 const MI=setup();for(const source of ['x^2+y^2=r^2','\\sin^2(\\theta)+\\cos^2(\\theta)=1','\\frac{1}{2}','\\sqrt{x+1}']){
   const b=MI.MathFragments.box(source);assert.ok(b.width>0&&b.ascent>0&&b.descent>=0);assert.ok(b.nodes<4096);assert.ok(b.body.length<262144);assert.match(b.body,/<path/);assert.doesNotMatch(b.body,/foreignObject|href=|<script|<text|style=|<use|\sid=|https?:/);assert.deepEqual(plain(b),plain(convert(source)));
 }
 assert.throws(()=>convert('\\frac{1}'));assert.throws(()=>convert('\\left(x'));
});
test('T2 v7 schema 2 JSON roundtrip, fallback, duplicate and atomic invalid import',()=>{
 const MI=setup(),e=new MI.Engine(doc());const saved=plain(e.toJSON());assert.equal(saved.textSchema,2);assert.equal(saved.objects[0].text,'Formule x^2+y^2=r^2 klaar');assert.deepEqual(plain(new MI.Engine(saved).toJSON()),saved);
 const commands=MI.AuthorCommands(e);const copy=commands.execute(commands.createCommand('object.duplicate',{ids:['T'],delta:{x:1,y:0}})).result[0];assert.deepEqual(plain(copy.textContent),plain(e.get('T').textContent));
 const before=plain(e.toJSON());assert.throws(()=>e.load({...before,textSchema:1}));assert.deepEqual(plain(e.toJSON()),before);assert.throws(()=>new MI.Engine({...doc(),version:6}));
});
test('T2 typed math commit replays source and is one undo/redo operation',()=>{
 const MI=setup(),d={objects:[]},seq=new MI.SemanticSequence(d),payload={target:{kind:'new',position:{x:0,y:0}},content:formula()};seq.execute('text.commit',payload);assert.deepEqual(plain(MI.SemanticSequence.replay(seq.toJSON())),plain(seq.document));
 const {session}=MI.RuntimeSession.create(options(doc()));session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:formula('\\sqrt{x}')}));assert.equal(session.engine.get('T').textContent.paragraphs[0].runs[1].source,'\\sqrt{x}');session.execute(session.createCommand('history.undo'));assert.equal(session.engine.get('T').textContent.paragraphs[0].runs[1].source,'x^2+y^2=r^2');session.execute(session.createCommand('history.redo'));assert.equal(session.engine.get('T').textContent.paragraphs[0].runs[1].source,'\\sqrt{x}');
});
test('T2 math-grant denies insertion, modification and removal atomically while permitting formatting',()=>{
 const MI=setup(),{session}=MI.RuntimeSession.create(options(doc(),{content:true,format:true,math:false})),before=plain(session.engine.toJSON());
 const changes=[formula('y'),formula(),formula()];changes[1].paragraphs[0].runs.splice(1,1);changes[2].paragraphs[0].runs.push({id:'m2',kind:'math',source:'x',marks:{}});
 for(const content of changes){assert.throws(()=>session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content})),e=>e.code==='PERMISSION_DENIED');assert.deepEqual(plain(session.engine.toJSON()),before);}
 const c=formula();c.paragraphs[0].runs[1].marks={bold:true};session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:c}));assert.equal(session.engine.get('T').textContent.paragraphs[0].runs[1].marks.bold,true);
 const denied=MI.RuntimeSession.create(options({objects:[]},{content:true,format:true,math:false})).session;assert.throws(()=>denied.execute(denied.createCommand('text.commit',{target:{kind:'new',position:{x:0,y:0}},content:formula()})),e=>e.code==='PERMISSION_DENIED');
});
test('T2 moving an existing formula preserves payload and only requires content/format as changed',()=>{
 const MI=setup(),c=formula();c.paragraphs[0].runs=[{id:'m1',kind:'math',source:'x',marks:{color:'#cc0000',bold:true}},{id:'t1',kind:'text',text:'tekst',marks:{}}];const {session}=MI.RuntimeSession.create(options(doc(c),{content:true,format:false,math:false}));c.paragraphs[0].runs.reverse();session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:c}));assert.equal(session.engine.get('T').textContent.paragraphs[0].runs[1].source,'x');assert.deepEqual(plain(session.engine.get('T').textContent.paragraphs[0].runs[1].marks),{color:'#cc0000',bold:true});
});
test('T2 text-only grants cannot move formatting boundaries or swap atom sources',()=>{
 const MI=setup(),c=formula();c.paragraphs[0].runs=[{id:'a',kind:'text',text:'abc',marks:{}},{id:'b',kind:'text',text:'def',marks:{bold:true}},{id:'m1',kind:'math',source:'x',marks:{}},{id:'m2',kind:'math',source:'y',marks:{}}];const {session}=MI.RuntimeSession.create(options(doc(c),{content:true,format:false,math:false})),before=plain(session.engine.toJSON()),boundary=plain(c);boundary.paragraphs[0].runs[0].text='a';boundary.paragraphs[0].runs[1].text='bcdef';const swapped=plain(c);swapped.paragraphs[0].runs[2].source='y';swapped.paragraphs[0].runs[3].source='x';
 for(const content of [boundary,swapped]){assert.throws(()=>session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content})),e=>e.code==='PERMISSION_DENIED');assert.deepEqual(plain(session.engine.toJSON()),before);}
});
test('T2 locked targets and stale revisions refuse commit without changing source',()=>{
 const MI=setup(),d=doc();d.objects[0].locked=true;const e=new MI.Engine(d),commands=MI.AuthorCommands(e);assert.throws(()=>commands.execute(commands.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:formula('y')})),x=>x.code==='LOCKED');
 const open=new MI.Engine(doc()),a=MI.AuthorCommands(open),cmd=a.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:formula('y')});open.update('T',{x:2});assert.throws(()=>a.execute(cmd),x=>x.code==='STALE_TRANSACTION');
});
test('T2 restricted exports preserve schema 2 and redact unreadable objects',()=>{
 const MI=setup(),{session}=MI.RuntimeSession.create(options(doc()));const json=session.execute(session.createCommand('document.exportJSON')).result;assert.equal(json.textSchema,2);assert.deepEqual(plain(new MI.Engine(json).toJSON()),plain(json));const svg=session.execute(session.createCommand('document.exportSVG')).result;assert.match(svg,/data-math-fragment/);
 const denied=MI.RuntimeSession.create(options(doc(),{}, {read:false,display:false})).session;const redacted=denied.execute(denied.createCommand('document.exportJSON')).result;assert.equal(redacted.objects.length,0);assert.doesNotMatch(denied.execute(denied.createCommand('document.exportSVG')).result,/x\^2|data-math-fragment/);
});
test('T2 mixed layout respects baseline, line heights, rotation, color and explicit readiness',()=>{
 const MI=setup(),c=formula('\\frac{1}{2}');c.paragraphs.push({id:'p2',align:'right',lineHeight:1.25,runs:[{id:'m2',kind:'math',source:'\\sqrt{x}',marks:{fontSize:32}}]});const e=new MI.Engine(doc(c));e.update('T',{rotation:37});const svg=e.renderSVG();assert.match(svg,/data-rich-text="2"/);assert.match(svg,/rotate\(37 /);assert.match(svg,/fill="#cc0000"/);assert.match(svg,/aria-label="\\frac/);assert.doesNotMatch(svg,/NaN|Infinity/);
 const cold=runtime(['model.js','renderer.js','index.js']).MI;assert.throws(()=>new cold.Engine(doc()).renderSVG(),/assets/);
 assert.notEqual(MI.MathFragments.box('x+y',{bold:true}).body,MI.MathFragments.box('x+y').body);
 const align=value=>{const object={textContent:formula()};object.textContent.paragraphs[0].align=value;return MI.RichTextRenderer.render(object,100,100);};const firstX=svg=>Number(svg.match(/<text x="([^"]+)"/)[1]);assert.equal(firstX(align('left')),100);assert.ok(firstX(align('right'))<firstX(align('center'))&&firstX(align('center'))<100);assert.match(align('left'),/xml:space="preserve"/);
});
test('T2 legacy textBinding remains exact after format, duplicate, roundtrip and restricted undo',()=>{
 const MI=setup(),binding={schema:1,sourceId:'P',property:'x',precision:2,prefix:'x = ',suffix:' u'},d={objects:[{id:'P',type:'point',x:2,y:3},{id:'T',type:'text',x:0,y:0,text:'backup',textBinding:binding}]};const opts=options(d,{format:true},{propertyFields:['style.fontSize'],duplicate:true}),{session}=MI.RuntimeSession.create(opts);session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},legacyStylePatch:{style:{fontSize:24}}}));assert.deepEqual(plain(session.engine.get('T').textBinding),binding);session.execute(session.createCommand('history.undo'));session.execute(session.createCommand('history.redo'));assert.deepEqual(plain(session.engine.get('T').textBinding),binding);assert.throws(()=>session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:formula()})),x=>x.code==='MODE_DENIED');const e=new MI.Engine(d),a=MI.AuthorCommands(e),copy=a.execute(a.createCommand('object.duplicate',{ids:['T'],delta:{x:1,y:0}})).result[0];assert.deepEqual(plain(copy.textBinding),binding);assert.deepEqual(plain(new MI.Engine(e.toJSON()).get('T').textBinding),binding);
});
test('T2 document formula-work quotas reject import/add atomically',()=>{
 const MI=setup(),c=formula();c.paragraphs[0].runs=Array.from({length:128},(_,i)=>({id:'m'+i,kind:'math',source:'x',marks:{}}));const d={version:7,textSchema:2,objects:Array.from({length:4},(_,i)=>({id:'T'+i,type:'text',x:0,y:0,textContent:c}))},e=new MI.Engine(d),before=plain(e.toJSON());
 assert.throws(()=>e.add({type:'text',x:0,y:0,textContent:formula('y')}),/formulewerk/);assert.deepEqual(plain(e.toJSON()),before);assert.throws(()=>e.load({...d,objects:[...d.objects,{id:'excess',type:'text',textContent:formula()}]}),/formulewerk/);assert.deepEqual(plain(e.toJSON()),before);
});
test('T2 permission revocation revalidates already-created commands',()=>{
 const MI=setup(),opts=options(doc()),{session,owner}=MI.RuntimeSession.create(opts),command=session.createCommand('text.commit',{target:{kind:'existing',id:'T'},content:formula('y')}),before=plain(session.engine.toJSON()),next=plain(opts.policy);next.initialObjectRules.T.textCapabilities.math=false;owner.replacePolicy(next);assert.throws(()=>session.execute(command),e=>e.code==='PERMISSION_DENIED');assert.deepEqual(plain(session.engine.toJSON()),before);
});
test('T2 restricted duplicate must satisfy new rich-object category grants',()=>{
 const MI=setup(),opts=options(doc(),{content:true,format:true,math:false},{duplicate:true}),{session}=MI.RuntimeSession.create(opts),before=plain(session.engine.toJSON());assert.throws(()=>session.execute(session.createCommand('object.duplicate',{ids:['T'],delta:{x:1,y:0}})),e=>e.code==='PERMISSION_DENIED');assert.deepEqual(plain(session.engine.toJSON()),before);
 const allowed=MI.RuntimeSession.create(options(doc(),{content:true,format:true,math:true},{duplicate:true})).session;const copy=allowed.execute(allowed.createCommand('object.duplicate',{ids:['T'],delta:{x:1,y:0}})).result[0];assert.equal(copy.textContent.schema,2);assert.equal(copy.textContent.paragraphs[0].runs[1].source,'x^2+y^2=r^2');
});
test('T2 legacy-binding lifecycle matrix: 12 precision/source fixtures retain exact bindings',()=>{
 const MI=setup();for(const precision of [null,0,10])for(const status of ['normal','hidden','locked','missing']){
   const binding={schema:1,sourceId:'P',property:'x',precision,prefix:'x = ',suffix:' u'},objects=status==='missing'?[]:[{id:'P',type:'point',x:1.2345678901,y:2,visible:status!=='hidden',locked:status==='locked'}];objects.push({id:'T',type:'text',x:0,y:0,text:'legacy fallback',rotation:37,textBinding:binding,style:{fontSize:16,fill:'#123456'}});const d={objects},opts=options(d,{format:true},{propertyFields:['style.fontSize']}),{session,owner}=MI.RuntimeSession.create(opts),value=MI.DynamicText.value(session.engine.get('T'),new Map(objects.map(o=>[o.id,o])));
   session.execute(session.createCommand('text.commit',{target:{kind:'existing',id:'T'},legacyStylePatch:{style:{fontSize:24}}}));session.execute(session.createCommand('history.undo'));session.execute(session.createCommand('history.redo'));assert.deepEqual(plain(owner.inspect().document.objects.find(o=>o.id==='T').textBinding),binding);assert.equal(MI.DynamicText.value(session.engine.get('T'),new Map(objects.map(o=>[o.id,o]))),value);const exported=session.execute(session.createCommand('document.exportJSON')).result;assert.deepEqual(plain(new MI.Engine(exported).get('T').textBinding),status==='missing'?null:binding);assert.match(session.execute(session.createCommand('document.exportSVG')).result,/<text/);
   const e=new MI.Engine(d),a=MI.AuthorCommands(e);for(const ids of [status==='missing'?['T']:['P','T'],['T']]){const copies=a.execute(a.createCommand('object.duplicate',{ids,delta:{x:1,y:0}})).result,copy=copies.find(o=>o.type==='text');assert.equal(copy.textBinding.precision,precision);assert.equal(copy.textBinding.prefix,binding.prefix);assert.equal(copy.textBinding.suffix,binding.suffix);assert.equal(copy.textBinding.sourceId,'P');}
 }
});
