const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'editor.html'),'utf8');
const css=fs.readFileSync(path.join(root,'editor.css'),'utf8');
const script=fs.readFileSync(path.join(root,'editor-tool-search.js'),'utf8');

test('UI-LEFT-1 exposes the tools/layers tabs and searchable standalone tools',()=>{
  assert.match(html,/<button id="sidebarToolsTab"[^>]*role="tab" aria-selected="true"[^>]*>Gereedschappen<\/button>/);
  assert.match(html,/<button id="sidebarLayersTab"[^>]*role="tab" aria-selected="false"[^>]*>Lagen en objecten<\/button>/);
  assert.match(html,/id="sidebarLayersPanel"[^>]*hidden/);
  assert.doesNotMatch(html,/<details data-tool-category="vrije-objecten" open>/);
  assert.match(html,/id="toolSearch" type="search"[^>]*aria-controls="toolGrid"/);
  assert.equal((html.match(/class="tool-subgroup-toggle"/g)||[]).length,5);
  assert.equal((html.match(/class="tool-split[^\"]*"/g)||[]).length,0);
  assert.match(html,/editor-tool-search\.js\?v=geo-ui-regression-20261016/);
});

test('UI-LEFT-1 leaves tool IDs and fullscreen catalog unaffected, scopes hidden results to sidebar',()=>{
  const allIds=[...html.matchAll(/data-tool="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(allIds).size,allIds.length);
  assert.equal(allIds.filter(id=>id!=='select').length,42);
  assert.match(script,/root\.querySelectorAll\(':scope > \[data-tool-category\]'\)/);
  assert.match(script,/\.tool-grid > \.tool/);
  assert.match(script,/beforeSearch/);
  assert.match(css,/#toolGrid \[data-search-hidden="true"\]/);
  assert.match(css,/\.workspace\{grid-template-columns:340px minmax\(0,1fr\)!important\}/);
});
