// Acquisition only. Reproduction uses recorded upstream commits and verifies SHA256.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=path.join(__dirname,'fonts');fs.mkdirSync(out,{recursive:true});
const specs=[{repo:'adobe-fonts/source-sans',files:['SourceSans3-Regular.ttf','SourceSans3-Bold.ttf','SourceSans3-It.ttf','SourceSans3-BoldIt.ttf']},{repo:'adobe-fonts/source-serif',files:['SourceSerif4-Regular.ttf']}];
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'text-editor-preflight'}});if(!r.ok)throw Error(`${r.status} ${url}`);return Buffer.from(await r.arrayBuffer());}
(async()=>{const old=fs.existsSync(path.join(out,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))):null,manifest=[];
for(const spec of specs){const recorded=old?.find(f=>f.repo===spec.repo),sha=recorded?.commit||JSON.parse((await get(`https://api.github.com/repos/${spec.repo}/commits/release`)).toString()).sha;
for(const file of [...spec.files,'LICENSE.md']){const url=`https://raw.githubusercontent.com/${spec.repo}/${sha}/${file==='LICENSE.md'?file:'TTF/'+file}`,data=await get(url),hash=crypto.createHash('sha256').update(data).digest('hex'),name=file==='LICENSE.md'?spec.repo.split('/')[1]+'-LICENSE.md':file;
const prev=old?.find(f=>f.name===name);if(prev&&prev.sha256!==hash)throw Error('Font hash mismatch');fs.writeFileSync(path.join(out,name),data);manifest.push({name,repo:spec.repo,commit:sha,url,bytes:data.length,sha256:hash});}}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(manifest.map(f=>({name:f.name,bytes:f.bytes,commit:f.commit})));})().catch(e=>{console.error(e);process.exitCode=1;});
