// Minimal reproducible negative result; this is not a glyph-engine repair.
const fs=require('node:fs'),opentype=require('opentype.js');
process.chdir(__dirname);
const corpus='Nederlands: café, naïef, één; e\u0301 en é Grieks: αβθΩπ — ≤≥±×÷ Kerning: AV To Wa fi ffi Lang: oppervlakte van cirkel met meerdere bronwaarden';
const findings=[];
for(const file of fs.readdirSync('fonts').filter(f=>f.endsWith('.ttf'))){const b=fs.readFileSync('fonts/'+file),font=opentype.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));const path=font.getPath(corpus,0,0,16),nonFiniteInput=path.commands.flatMap(c=>Object.values(c)).filter(v=>typeof v==='number'&&!Number.isFinite(v)).length;
let minimalPrefix=null;for(let n=1;n<=corpus.length;n++){const prefix=corpus.slice(0,n);if(/NaN|Infinity/.test(font.getPath(prefix,0,0,16).toPathData(3))){minimalPrefix=prefix;break;}}
findings.push({file,nonFiniteInput,nonFiniteSerialized:/NaN|Infinity/.test(path.toPathData(3)),minimalPrefix,names:font.names});}
fs.writeFileSync('results/path-defects.json',JSON.stringify({opentypeVersion:require('opentype.js/package.json').version,findings},null,2)+'\n');console.log(findings.map(({names,...f})=>f));
