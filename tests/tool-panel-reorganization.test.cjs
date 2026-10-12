const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../editor.html'),'utf8'),js=fs.readFileSync(path.join(__dirname,'../editor.js'),'utf8');
const categories=[...html.matchAll(/<details data-tool-category="([^"]+)"[^>]*>(.*?)<\/details>/gs)];
const tools=category=>[...category.matchAll(/data-tool="([^"]+)"/g)].map(m=>m[1]);
const expected={basis:['point','line','straight','ray','vector'],figuren:['triangle','polygon','circle'],constructies:['construct:midpoint','construct:pointOnSegment','construct:pointOnCircle','construct:lineIntersection','construct:lineCircleIntersection','construct:circleCircleIntersection','construct:perpendicular','construct:perpendicularBisector','construct:bisector','construct:lineBetweenPoints','construct:parallel','construct:tangent','construct:circleByCenterPoint','construct:centroid','construct:circumcenter','construct:orthocenter'],meten:['dimension','construct:perimeter','construct:area','construct:anglePoints','construct:angleDirections','angle','rightAngle'],transformeren:[],functies:[],tekst:['text'],verzamelingen:[]};
test('tool panel preserves every existing tool ID exactly once in its semantic category',()=>{
 assert.deepEqual(categories.map(m=>m[1]),Object.keys(expected));
 for(const [,id,content] of categories)assert.deepEqual(tools(content).sort(),expected[id].slice().sort(),id);
 const all=categories.flatMap(m=>tools(m[2]));assert.equal(new Set(all).size,all.length);assert.equal(all.length,32);
 assert.match(html,/<summary>Gereedschappen<\/summary>/);assert.match(html,/<summary>Lagen en objecten<\/summary>/);
});
test('planned tools are plain noninteractive content without tool IDs or focus actions',()=>{
 const placeholders=[...html.matchAll(/<div class="tool-placeholder"[^>]*>(.*?)<\/div>/gs)];
 assert.ok(placeholders.length>=30);
 for(const [whole,content] of placeholders){assert.match(content,/Gepland/);assert.doesNotMatch(whole,/<(?:button|a|input|select)|data-(?:tool|canvas-tool|split)|tabindex|on\w+=/);}
 for(const implemented of ['Zwaartepunt','Hoogtepunt','Middelpunt omgeschreven cirkel'])assert.ok(!placeholders.some(m=>m[1].includes(implemented)));
});
test('split menus keep unique linked controls and a real tool for every configured choice',()=>{
 const config=vm.runInNewContext('('+js.match(/const SPLIT_TOOLS=(\{.*?\});/)[1]+')');
 for(const [group,choices] of Object.entries(config)){
  const menu=html.match(new RegExp('<div id="'+group+'ToolMenu"[^>]*>(.*?)</div>','s'));
  assert.ok(menu,group);assert.deepEqual(tools(menu[1]),Array.from(choices));
  assert.equal((html.match(new RegExp('id="'+group+'ToolMain"','g'))||[]).length,1);
  assert.match(html,new RegExp('id="'+group+'ToolToggle"[^>]*aria-controls="'+group+'ToolMenu"[^>]*aria-expanded="false"'));
 }
});
