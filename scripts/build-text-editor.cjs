// Reproduce with npm ci in both pinned experiment directories, then npm run build:text.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),esbuild=require(path.join(root,'experiments/text-editor-preflight/node_modules/esbuild'));
(async()=>{const metrics={};for(const [entry,dir] of [['rich-text-editor','text-editor-preflight'],['math-renderer','math-fragments-preflight']]){
 const result=await esbuild.build({entryPoints:[path.join(root,entry+'.js')],nodePaths:[path.join(root,'experiments',dir,'node_modules')],bundle:true,minify:true,format:'esm',target:'es2022',write:false,metafile:true});
 const data=result.outputFiles[0].contents;fs.writeFileSync(path.join(root,entry+'.bundle.js'),data);metrics[entry]={bytes:data.length,gzipBytes:zlib.gzipSync(data).length,sha256:crypto.createHash('sha256').update(data).digest('hex'),inputs:Object.keys(result.metafile.inputs)};
 if(Object.keys(result.metafile.inputs).some(p=>/xmldom|speech-rule|require\/|autoload\//.test(p)))throw Error('Unexpected unsafe/automatic loader dependency.');
 }fs.writeFileSync(path.join(root,'experiments/math-fragments-preflight/build-results.json'),JSON.stringify(metrics,null,2)+'\n');console.log(JSON.stringify(Object.fromEntries(Object.entries(metrics).map(([k,v])=>[k,{bytes:v.bytes,gzipBytes:v.gzipBytes,sha256:v.sha256}]))));})();
