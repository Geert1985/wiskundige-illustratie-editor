const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),esbuild=require('esbuild'),{pathToFileURL}=require('node:url'),katex=require('katex');
const root=path.resolve(__dirname,'../..'),corpus=['x^2+y^2=r^2','\\sin^2(\\theta)+\\cos^2(\\theta)=1','\\frac{1}{2}','\\sqrt{x+1}','\\alpha+\\beta\\leq\\pi'];
(async()=>{
 const build=await esbuild.build({entryPoints:[path.join(root,'math-renderer.js')],nodePaths:[path.join(__dirname,'node_modules')],bundle:true,minify:true,format:'esm',target:'es2022',write:false,metafile:true});
 const bytes=build.outputFiles[0].contents;fs.writeFileSync(path.join(__dirname,'probe-bundle.mjs'),bytes);
 const start=performance.now(),{convert}=await import(pathToFileURL(path.join(__dirname,'probe-bundle.mjs'))),coldImportMs=performance.now()-start;
 const results=corpus.map(source=>{let t=performance.now(),svg=convert(source),coldMs=performance.now()-t;t=performance.now();for(let i=0;i<10;i++)convert(source);const warmMs=(performance.now()-t)/10;t=performance.now();const html=katex.renderToString(source,{trust:false,strict:'error',throwOnError:true,maxExpand:256});return {source,mathjax:{coldMs,warmMs,svgBytes:Buffer.byteLength(svg.body),...svg,body:undefined},katex:{ms:performance.now()-t,htmlBytes:Buffer.byteLength(html),directStandaloneSvg:false}};});
 const katexBytes=fs.readFileSync(require.resolve('katex/dist/katex.min.js'));
 const report={versions:{mathjax:'3.2.2',katex:'0.19.0'},mathjax:{rawBytes:bytes.length,gzipBytes:zlib.gzipSync(bytes).length,coldImportMs,externalFonts:0,inputs:Object.keys(build.metafile.inputs)},katex:{rawBytes:katexBytes.length,gzipBytes:zlib.gzipSync(katexBytes).length},results};
 fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,mathjax:{...report.mathjax,inputs:undefined}},null,2));
})();
