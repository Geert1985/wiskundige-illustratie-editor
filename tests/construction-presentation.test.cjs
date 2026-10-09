const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
function setup(){const {MI}=runtime(),e=new MI.Engine({objects:[{id:'a',type:'point',x:0,y:0},{id:'b',type:'point',x:2,y:0},{id:'c',type:'circle',cx:0,cy:0,r:1}]});return {MI,e,commands:MI.AuthorCommands(e)};}
test('author visibility commands hide and restore constructed points lines and measurement text',()=>{
  const {e,commands:c}=setup();for(const [kind,sources] of [['midpoint',[{objectId:'a'},{objectId:'b'}]],['perpendicularBisector',[{objectId:'a'},{objectId:'b'}]],['area',[{objectId:'c'}]],['perimeter',[{objectId:'c'}]]]){
    const o=e.construct(kind,sources)[0];c.execute(c.createCommand('object.setVisibility',{ids:[o.id],value:false}));assert.equal(e.get(o.id).visible,false);assert.doesNotMatch(e.renderSVG(),new RegExp('data-object-id="'+o.id+'"'));
    e.update('b',{x:4});assert.equal(e.get(o.id).visible,false);assert.deepEqual(plain(e.get(o.id).construction),plain(o.construction));
    const copy=new e.constructor(e.toJSON());assert.equal(copy.get(o.id).visible,false);c.execute(c.createCommand('object.setVisibility',{ids:[o.id],value:true}));assert.match(e.renderSVG(),new RegExp('data-object-id="'+o.id+'"'));
  }
});
test('author lock commands identify constructed objects as direct presentation targets',()=>{
  const {e,commands:c}=setup(),o=e.construct('midpoint',[{objectId:'a'},{objectId:'b'}])[0];for(const value of [true,false]){c.execute(c.createCommand('object.setLock',{ids:[o.id],value}));assert.equal(e.get(o.id).locked,value);assert.equal(e.get(o.id).x,1);}
});
test('restricted direct facade cannot change construction visibility or locks',()=>{
  const {MI}=runtime(),{fixture}=require('./permission-fixtures.cjs'),{session:s,owner}=MI.RuntimeSession.create(fixture()),before=plain(owner.inspect());for(const op of ['object.setVisibility','object.setLock'])assert.throws(()=>s.execute(s.createCommand(op,{ids:['M'],value:false})),error=>error.code==='MODE_DENIED');assert.deepEqual(plain(owner.inspect()),before);
});
