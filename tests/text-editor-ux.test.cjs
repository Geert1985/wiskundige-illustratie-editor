const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');

function setup(){const context={};context.window=context;context.FZI={MathIllustration:{}};vm.createContext(context);for(const file of ['editor-color.js','text-editor-ux.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});return context.FZI.MathIllustration;}

test('text UI sizes are centralized point presets mapped to document SVG-pixel units',()=>{
 const ux=setup().TextEditorUX;
 assert.deepEqual(Array.from(ux.fontSizes,preset=>[preset.label,preset.points]),[['Klein',12],['Normaal',16],['Groot',20],['Titel',28]]);
 assert.deepEqual(Array.from(ux.fontSizes,preset=>preset.pixels),[16,64/3,80/3,112/3]);
 assert.equal(ux.pointLabel(17),'12,75 pt');
});

test('logarithmic width slider preserves the existing model boundaries and maps both endpoints',()=>{
 const ux=setup().TextEditorUX;
 assert.deepEqual({...ux.width},{min:1,max:1e6,sliderSteps:100000,defaultPreview:320});
 assert.equal(ux.widthToSlider(1),0);assert.equal(ux.widthToSlider(1e6),100000);
 for(const width of [1,17,90,145,320,1e3,1e6])assert.ok(Math.abs(ux.sliderToWidth(ux.widthToSlider(width))-width)<Math.max(.0001,width*1e-12));
});

test('text palette is the same immutable palette source for geometry and rich text',()=>{
 const MI=setup(),palette=MI.EditorColor.palette;
 assert.deepEqual(Array.from(palette,color=>color.value),['#222222','#e63946','#f4a261','#e9c46a','#2a9d8f','#457b9d','#8b5cf6']);
 assert.ok(Object.isFrozen(palette));assert.ok(palette.every(Object.isFrozen));
});
