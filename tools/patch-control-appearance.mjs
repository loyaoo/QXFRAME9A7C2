import fs from 'node:fs';

function patch(file,edits){
  let text=fs.readFileSync(file,'utf8');
  for(const [from,to] of edits){
    if(!text.includes(from))throw new Error(file+' missing patch anchor: '+from.slice(0,120));
    text=text.replace(from,to);
  }
  fs.writeFileSync(file,text);
}

patch('docs/assets/theme-generator/studio-v2.mjs',[
  ["TYPOGRAPHY_PROFILES,TEXT_STYLE_PROFILES,BODY_FONTS","TYPOGRAPHY_PROFILES,TEXT_STYLE_PROFILES,CONTROL_APPEARANCE_PROFILES,BODY_FONTS"],
  ["editorial:'编辑式',normal:'正常'","editorial:'编辑式',outline:'描边',tinted:'着色描边','tinted-subtle':'轻着色描边',soft:'柔和填充',underline:'下划线',normal:'正常'"],
  ['<label>文字风格<select data-v2-appearance="textStyle">${options(TEXT_STYLE_PROFILES)}</select></label>','<label>文字风格<select data-v2-appearance="textStyle">${options(TEXT_STYLE_PROFILES)}</select></label>\n      <label>控件外观<select data-v2-appearance="controlAppearance">${options(CONTROL_APPEARANCE_PROFILES)}</select></label>']
]);

patch('tools/verify-theme-studio-static.mjs',[
  ["'排版密度','文字风格','编辑式','正文字体'","'排版密度','文字风格','编辑式','控件外观','描边','着色描边','轻着色描边','柔和填充','下划线','正文字体'"],
  ["editorialControl:true,visualOptInRetired:true","editorialControl:true,controlAppearance:true,visualOptInRetired:true"]
]);

patch('tools/verify-theme-studio-v2.mjs',[
  ["assert.equal(theme.config.styleRules,'qx-style-2');","assert.equal(theme.config.styleRules,'qx-style-3');"],
  ["const defaultAppearance={typography:'standard',textStyle:'standard',fontBody:'system-ui'","const defaultAppearance={typography:'standard',textStyle:'standard',controlAppearance:'outline',fontBody:'system-ui'"],
  ["eq('Style populates shadow',api.getTheme().config.appearance.shadow,'none');","eq('Style populates shadow',api.getTheme().config.appearance.shadow,'none');eq('Style populates control appearance',api.getTheme().config.appearance.controlAppearance,'tinted-subtle');"],
  ["eq('Sera visible text recipe',api.getTheme().config.appearance.textStyle,'editorial');eq('Sera heading font default',api.getTheme().config.appearance.fontHeading,'serif');","eq('Sera visible text recipe',api.getTheme().config.appearance.textStyle,'editorial');eq('Sera visible control appearance',api.getTheme().config.appearance.controlAppearance,'underline');eq('Sera heading font default',api.getTheme().config.appearance.fontHeading,'serif');"],
  ["eq('Chinese text remains source text',seraButton.textContent,'超小');","eq('Chinese text remains source text',seraButton.textContent,'超小');eq('Sera md control font source size',getComputedStyle(light().querySelector('.qxframe9a7c2-input.is-md')).fontSize,'12px');\n    let seraInput=light().querySelector('.qxframe9a7c2-input.is-md');eq('Sera underline top transparent',getComputedStyle(seraInput).borderTopColor,'rgba(0, 0, 0, 0)');yes('Sera underline bottom visible',getComputedStyle(seraInput).borderBottomColor!=='rgba(0, 0, 0, 0)');\n    appearance('controlAppearance','outline');eq('control appearance can reset Sera',api.getTheme().config.appearance.controlAppearance,'outline');seraInput=light().querySelector('.qxframe9a7c2-input.is-md');yes('outline top visible',getComputedStyle(seraInput).borderTopColor!=='rgba(0, 0, 0, 0)');eq('outline light fill transparent',getComputedStyle(seraInput).backgroundColor,'rgba(0, 0, 0, 0)');\n    appearance('controlAppearance','soft');eq('soft control appearance committed',api.getTheme().config.appearance.controlAppearance,'soft');seraInput=light().querySelector('.qxframe9a7c2-input.is-md');eq('soft default border transparent',getComputedStyle(seraInput).borderTopColor,'rgba(0, 0, 0, 0)');yes('soft fill visible',getComputedStyle(seraInput).backgroundColor!=='rgba(0, 0, 0, 0)');seraInput.classList.add('is-focused');yes('soft focused border visible',getComputedStyle(seraInput).borderTopColor!=='rgba(0, 0, 0, 0)');seraInput.classList.remove('is-focused');" ]
]);

console.log(JSON.stringify({ok:true,studioChinese:true,styleRules:'qx-style-3',controlAppearance:true}));
