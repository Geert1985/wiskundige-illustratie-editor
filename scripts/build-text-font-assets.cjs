const fs=require('node:fs');
const dir='experiments/text-editor-preflight/fonts';
const files={sansRegular:'SourceSans3-Regular.ttf',sansBold:'SourceSans3-Bold.ttf',sansItalic:'SourceSans3-It.ttf',sansBoldItalic:'SourceSans3-BoldIt.ttf',serifRegular:'SourceSerif4-Regular.ttf'};
const data=Object.fromEntries(Object.entries(files).map(([key,file])=>[key,fs.readFileSync(`${dir}/${file}`).toString('base64')]));
fs.writeFileSync('font-assets.js',`(function(global){'use strict';global.FZI=global.FZI||{};global.FZI.MathIllustration=global.FZI.MathIllustration||{};const MI=global.FZI.MathIllustration;MI.TextFontData=Object.freeze(${JSON.stringify(data)});})(window);\n`);
