const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../editor.html'),'utf8'),js=fs.readFileSync(path.join(__dirname,'../editor.js'),'utf8');
const categories=[...html.matchAll(/<details data-tool-category="([^"]+)"[^>]*>(.*?)<\/details>/gs)];
const tools=category=>[...category.matchAll(/data-tool="([^"]+)"/g)].map(m=>m[1]);
const expected={'vrije-objecten':['point','line','straight','ray','vector','triangle','polygon','circle','angle','rightAngle'],constructies:['construct:midpoint','construct:pointOnSegment','construct:pointOnCircle','construct:lineIntersection','construct:lineCircleIntersection','construct:circleCircleIntersection','construct:perpendicular','construct:perpendicularBisector','construct:bisector','construct:lineBetweenPoints','construct:parallel','construct:tangent','construct:circleByCenterPoint','construct:ellipseByFociAndPoint','construct:pointOnEllipse','construct:centroid','construct:circumcenter','construct:orthocenter','construct:triangleFromPoints','construct:incenter','construct:incircle','construct:eulerLine','construct:ninePointCircle','construct:parallelogramBySideAngle'],meten:['dimension','construct:anglePoints','construct:angleDirections'],gebieden:['construct:polygonRegion','construct:circleSectorRegion','construct:circleSegmentRegion'],transformeren:[],functies:[],tekst:['text'],verzamelingen:[]};
test('UI-T1 places working tools in the eight approved semantic categories without changing IDs',()=>{
 assert.deepEqual(categories.map(m=>m[1]),Object.keys(expected));
 for(const [,id,content] of categories)assert.deepEqual(tools(content).sort(),expected[id].slice().sort(),id);
 const all=categories.flatMap(m=>tools(m[2]));assert.equal(new Set(all).size,all.length);assert.equal(all.length,41);
 const construction=categories.find(m=>m[1]==='constructies')[2],conics=construction.match(/data-tool-subgroup="kegelsneden"[^>]*>(.*?)<\/div><\/div>/s)[1];
 assert.match(conics,/data-tool="construct:circleByCenterPoint"/);assert.match(conics,/data-tool="construct:pointOnEllipse"/);assert.equal((construction.match(/data-tool="construct:circleByCenterPoint"/g)||[]).length,1);assert.equal((construction.match(/data-tool="construct:pointOnEllipse"/g)||[]).length,1);
 assert.doesNotMatch(construction,/cirkelconstructies/);assert.match(construction,/data-tool-subgroup="vectoren"[^>]*>[\s\S]*?Vectoren[\s\S]*?M7-VEC-FUND/);
 assert.doesNotMatch(categories.find(m=>m[1]==='meten')[2],/data-tool="construct:(?:perimeter|area)"/);
 assert.match(categories.find(m=>m[1]==='meten')[2],/combined-measurement-placeholder[^>]*title="Binnenkort beschikbaar"[\s\S]*?Gecombineerde meting/);
 assert.match(html,/<button id="sidebarToolsTab"[^>]*role="tab"[^>]*>Gereedschappen<\/button>/);assert.match(html,/<button id="sidebarLayersTab"[^>]*role="tab"[^>]*>Lagen en objecten<\/button>/);
});
test('planned tools are plain noninteractive content without tool IDs or focus actions',()=>{
 const placeholders=[...html.matchAll(/<div class="tool-placeholder"[^>]*>(.*?)<\/div>/gs)];
 assert.ok(placeholders.length>=25);
 for(const [whole,content] of placeholders){assert.match(content,/Gepland/);assert.doesNotMatch(whole,/<(?:button|a|input|select)|data-(?:tool|canvas-tool|split)|tabindex|on\w+=/);}
 for(const implemented of ['Zwaartepunt','Hoogtepunt','Middelpunt omgeschreven cirkel','Incentrum','Ingeschreven cirkel','Eulerrechte','Negenpuntscirkel'])assert.ok(!placeholders.some(m=>m[1].includes(implemented)));
 const freeCategory=categories.find(m=>m[1]==='vrije-objecten')[2];
 for(const removed of ['Punt op ellips','Gekoppelde vector AB','Regelmatige veelhoek'])assert.ok(!freeCategory.includes(removed),removed);
 assert.doesNotMatch(freeCategory,/class="planned-tools"/,'The five removed free-object entries leave no stale placeholder list.');
});
test('UI-LEFT-1 renders standalone tool buttons and removes sidebar split menus',()=>{
 const toolGrid=html.match(/<div id="toolGrid"[^>]*>(.*?)<\/div>\s*<\/div>/s)?.[1];assert.ok(toolGrid);
 const all=categories.flatMap(match=>tools(match[2]));assert.equal(new Set(all).size,all.length);assert.deepEqual(all.slice().sort(),Object.values(expected).flat().sort());
 assert.doesNotMatch(toolGrid,/tool-split|data-tool-split|ToolToggle|ToolMenu/);
 assert.doesNotMatch(js,/SPLIT_TOOLS/);
});
