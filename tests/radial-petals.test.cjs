const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');

function element(tag='div'){
  return {
    tagName:tag.toUpperCase(),className:'',dataset:{},attributes:{},children:[],
    classList:{add(){},remove(){}},
    style:{values:{},setProperty(name,value){this.values[name]=value;}},
    innerHTML:'',value:'',textContent:'',hidden:false,readOnly:false,disabled:false,
    setAttribute(key,value){
      this.attributes[key]=String(value);
      if(key==='class')this.className=String(value);
    },
    getAttribute(key){return this.attributes[key];},
    append(...nodes){this.children.push(...nodes);},
    replaceChildren(...nodes){this.children=[...nodes];},
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;},
    querySelectorAll(selector){
      const out=[];
      const matches=node=>{
        if(selector.startsWith('.'))return node.className.split(' ').includes(selector.slice(1));
        if(selector.startsWith('[data-radial-toggle='))return node.dataset.radialToggle===selector.match(/"([^"]+)"/)[1];
        return node.tagName.toLowerCase()===selector.toLowerCase();
      };
      const visit=node=>{for(const child of node.children){if(matches(child))out.push(child);visit(child);}};
      visit(this);
      return out;
    }
  };
}
function wheel(){
  const context={FZI:{MathIllustration:{}}};
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'editor-radial-properties.js'),'utf8'),context,
    {filename:'editor-radial-properties.js'});
  const Radial=context.FZI.MathIllustration.RadialProperties;
  const radial=Object.create(Radial.prototype);
  radial.doc={createElement:element,createElementNS:(_ns,tag)=>element(tag)};
  radial.wheel=element();
  radial.app={inspectorTarget:'axes'};
  radial.context=()=>({type:'axes',name:'Assenstelsel',id:'axes'});
  radial.constructionContext=()=>false;
  radial.renderWheel();
  return radial.wheel;
}

test('UI-RADIAL-11 renders six matching Bezier petals with individual SVG paint servers',()=>{
  const root=wheel(),segments=root.querySelectorAll('.radial-segment');
  assert.equal(segments.length,6);
  const contours=[],insets=[],sheens=[],gradientIds=[];
  for(const [index,segment] of segments.entries()){
    assert.equal(segment.style.values['--radial-angle'],(index*60)+'deg');
    assert.equal(segment.style.values['--radial-counter-angle'],(-index*60)+'deg');
    const shapes=segment.querySelectorAll('.radial-segment-silhouette');
    assert.equal(shapes.length,1);
    contours.push(shapes[0].attributes.d);
    assert.match(shapes[0].attributes.fill,/^url\(#fziRadialPetalSurface[0-5]\)$/);
    assert.match(shapes[0].attributes.stroke,/^url\(#fziRadialPetalRim[0-5]\)$/);
    insets.push(...segment.querySelectorAll('.radial-segment-inset').map(n=>n.attributes.d));
    sheens.push(...segment.querySelectorAll('.radial-segment-sheen').map(n=>n.attributes.d));
    const defs=segment.querySelectorAll('defs');
    assert.equal(defs.length,1);
    const ids=[...defs[0].innerHTML.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(ids.length,2);
    gradientIds.push(...ids);
  }
  assert.match(contours[0],/^M43 12 C77 -2 133 -2 167 12 /,
    'the narrower UI-RADIAL-12 outline must be rendered');
  assert.match(insets[0],/^M47 19 C79 7 131 7 163 19 /,
    'the inner bevel must track the narrowed outline');
  assert.equal(new Set(contours).size,1,'every petal shares the same silhouette');
  assert.equal(new Set(insets).size,1,'bevel stays consistent');
  assert.equal(new Set(sheens).size,1,'top-edge highlight stays consistent');
  assert.equal(new Set(gradientIds).size,12,'SVG paint server IDs cannot collide');
  assert.equal(root.querySelectorAll('.radial-center').length,1,
    'central approved hub stays a distinct unchanged component');
});

test('UI-RADIAL-11 styles use SVG gradients, preserve accessible HTML buttons and hub CSS',()=>{
  const css=fs.readFileSync(path.join(root,'editor.css'),'utf8');
  const script=fs.readFileSync(path.join(root,'editor-radial-properties.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'editor.html'),'utf8');
  assert.match(css,/\.radial-segment-stop-top\{stop-color:/);
  assert.match(css,/\.radial-segment:is\(:hover,:focus-visible,\[aria-pressed="true"\]\)/);
  assert.match(css,/\.radial-segment-inset\{/);
  assert.match(css,/#radialPropertiesWheel input\.radial-center-input\{/);
  assert.match(script,/node\.type='button';node\.className='radial-segment'/);
  assert.match(script,/node\.setAttribute\('aria-label',label\)/);
  assert.match(html,/editor-radial-properties\.js\?v=radialmenu-5/);
  assert.match(html,/editor\.css\?v=radialmenu-5/);
});
