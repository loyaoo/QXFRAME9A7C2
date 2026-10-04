import fs from 'node:fs';
const file='docs/assets/theme-generator/studio-v2.mjs';
let text=fs.readFileSync(file,'utf8');
text=text.replace('TYPOGRAPHY_PROFILES,BODY_FONTS','TYPOGRAPHY_PROFILES,TEXT_STYLE_PROFILES,BODY_FONTS');
text=text.replace("standard:'标准',roomy:'宽松'","standard:'标准',roomy:'宽松',editorial:'编辑式'");
text=text.replace('<label>排版密度<select data-v2-appearance="typography">${options(TYPOGRAPHY_PROFILES)}</select></label>','<label>排版密度<select data-v2-appearance="typography">${options(TYPOGRAPHY_PROFILES)}</select></label>\n      <label>文字风格<select data-v2-appearance="textStyle">${options(TEXT_STYLE_PROFILES)}</select></label>');
text=text.replaceAll(' data-qxframe9a7c2-visual="2"','');
fs.writeFileSync(file,text);
console.log(JSON.stringify({ok:true,editorial:true,visualOptInRemoved:true}));
