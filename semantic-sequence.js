/* Isolated author command sequences; never an assessment provenance claim. */
(function(global){
 'use strict';
 const MI=global.FZI.MathIllustration,MAX_STEPS=1000,MAX_CHARS=4*1024*1024;
 const operations=new Set(['document.setAngleMeasurement','document.setMeasurement','object.create','construction.create','construction.setInputs','construction.setParameter','construction.detach','object.setGeometry','object.setProperties','object.patchBatch','object.translate','object.duplicate','object.delete','object.setLock','object.setVisibility','group.create','group.ungroup','layer.create','layer.assign','layer.rename','layer.setVisibility','layer.reorder','layer.delete']);
 const fail=code=>{const e=new Error(code);e.code=code;throw e;},copy=v=>JSON.parse(JSON.stringify(v));
 const plain=v=>{if(!v||typeof v!=='object'||Array.isArray(v))return false;const p=Object.getPrototypeOf(v);return p===null||Object.getPrototypeOf(p)===null;};
 function safe(value){let nodes=0;const seen=new Set();function visit(v,depth){if(++nodes>100000||depth>64)fail('INVALID_SEQUENCE');if(v===null||typeof v==='boolean'||typeof v==='string')return;if(typeof v==='number'){if(!Number.isFinite(v))fail('INVALID_SEQUENCE');return;}if(typeof v!=='object'||(!Array.isArray(v)&&!plain(v))||seen.has(v))fail('INVALID_SEQUENCE');seen.add(v);for(const [key,d] of Object.entries(Object.getOwnPropertyDescriptors(v))){if(Array.isArray(v)&&key==='length')continue;if(['__proto__','prototype','constructor'].includes(key)||!('value' in d))fail('INVALID_SEQUENCE');visit(d.value,depth+1);}seen.delete(v);}visit(value,0);const text=JSON.stringify(value);if(text.length>MAX_CHARS)fail('SEQUENCE_LIMIT');return JSON.parse(text);}
 function keys(value,allowed){if(!plain(value)||Object.keys(value).some(k=>!allowed.includes(k)))fail('INVALID_SEQUENCE');}
 function identifiers(document){return [...document.objects,...(document.groups||[]),...(document.layers||[])].map(o=>o.id);}
 class SemanticSequence {
  #engine;#baseline;#commands=[];
  constructor(document){const data=safe(document);this.#engine=new MI.Engine(data);this.#baseline=copy(this.#engine.toJSON());}
  get document(){return copy(this.#engine.toJSON());}
  get length(){return this.#commands.length;}
  execute(operation,payload){if(!operations.has(operation))fail('UNSUPPORTED_SEQUENCE_COMMAND');if(this.length>=MAX_STEPS)fail('SEQUENCE_LIMIT');const data=safe(payload),candidate=new MI.Engine(this.#engine.toJSON()),commands=MI.AuthorCommands(candidate),before=new Set(identifiers(candidate.toJSON()));const result=commands.execute(commands.createCommand(operation,data));const createdIds=identifiers(candidate.toJSON()).filter(id=>!before.has(id)),entry={operation,payload:data,createdIds};safe({type:'geometry-command-sequence',version:1,baseline:this.#baseline,commands:[...this.#commands,entry]});this.#engine=candidate;this.#commands.push(entry);return copy(result);}
  toJSON(){return copy({type:'geometry-command-sequence',version:1,baseline:this.#baseline,commands:this.#commands});}
  static replay(artifact,{steps}={}){const data=safe(artifact);keys(data,['type','version','baseline','commands']);if(data.type!=='geometry-command-sequence'||data.version!==1||!Array.isArray(data.commands)||data.commands.length>MAX_STEPS)fail('INVALID_SEQUENCE');for(const c of data.commands){keys(c,['operation','payload','createdIds']);if(!operations.has(c.operation)||!plain(c.payload)||!Array.isArray(c.createdIds)||c.createdIds.some(id=>typeof id!=='string'||!id)||new Set(c.createdIds).size!==c.createdIds.length)fail('INVALID_SEQUENCE');}const count=steps===undefined?data.commands.length:steps;if(!Number.isSafeInteger(count)||count<0||count>data.commands.length)fail('INVALID_SEQUENCE');const sequence=new SemanticSequence(data.baseline);for(const c of data.commands.slice(0,count)){sequence.execute(c.operation,c.payload);const actual=sequence.#commands.at(-1).createdIds;if(JSON.stringify(actual)!==JSON.stringify(c.createdIds))fail('REPLAY_ID_MISMATCH');}return sequence.document;}
 }
 MI.SemanticSequence=SemanticSequence;
})(window);
