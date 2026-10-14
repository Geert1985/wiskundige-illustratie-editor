const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'editor.html'),'utf8');
const css=fs.readFileSync(path.join(root,'editor.css'),'utf8');
const script=fs.readFileSync(path.join(root,'editor-tool-search.js'),'utf8');

test('UI-LEFT-1 defaults independent navigation groups to collapsed and searchable',()=>{
  assert.match(html,/<details class="sidebar-section" open>\s*<summary>Gereedschappen<\/summary>/);
  assert.doesNotMatch(html,/<details id="layersSection" class="sidebar-section" open>/);
  assert.doesNotMatch(html,/<details data-tool-category="vrije-objecten" open>/);
  assert.match(html,/id="toolSearch" type="search"[^>]*aria-controls="toolGrid"/);
  const names=['puntconstructies','lijnconstructies','cirkelconstructies','driehoekconstructies','hoeken-tekenen-en-meten'];
  for(const name of names){
    assert.match(html,new RegExp('data-tool-subgroup="'+name+'"'));
    assert.match(html,new RegExp('aria-controls="subgroup-'+name+'" aria-expanded="false"'));
    assert.match(html,new RegExp('id="subgroup-'+name+'" class="tool-grid" hidden'));
  }
  assert.equal((html.match(/class="tool-subgroup-toggle"/g)||[]).length,5);
  assert.match(html,/editor-tool-search\.js\?v=ui-left-1/);
});

test('UI-LEFT-1 leaves tool IDs and fullscreen catalog unaffected, scopes hidden results to sidebar',()=>{
  assert.equal((html.match(/data-tool="[^"]+"/g)||[]).length,40);
  assert.match(script,/root\.querySelectorAll\(':scope > \[data-tool-category\]'\)/);
  assert.match(script,/entry\.querySelectorAll\('\[data-tool\]'\)/);
  assert.match(script,/beforeSearch/);
  assert.match(css,/#toolGrid \[data-search-hidden="true"\]/);
  assert.match(css,/\.sidebar \.tool-subgroup > \.tool-grid\[hidden\]/);
  assert.match(css,/grid-template-columns:340px minmax\(0,1fr\) 280px/);
});
