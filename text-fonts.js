(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration;
  const faces=[
    ['Source Sans 3','normal','400','sansRegular'],['Source Sans 3','normal','700','sansBold'],
    ['Source Sans 3','italic','400','sansItalic'],['Source Sans 3','italic','700','sansBoldItalic'],
    ['Source Serif 4','normal','400','serifRegular']
  ];
  function css(){return faces.map(([family,style,weight,key])=>`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};src:url(data:font/ttf;base64,${MI.TextFontData[key]}) format('truetype');font-display:block}`).join('\n');}
  function install(doc){if(!doc?.head||doc.getElementById('fzi-text-fonts'))return;const node=doc.createElement('style');node.id='fzi-text-fonts';node.textContent=css();doc.head.append(node);}
  function svgStyle(){return '<style><![CDATA['+css()+']]></style>';}
  MI.TextFonts=Object.freeze({install,svgStyle,faces:Object.freeze(faces.map(f=>Object.freeze({family:f[0],style:f[1],weight:f[2]})))});
})(window);
