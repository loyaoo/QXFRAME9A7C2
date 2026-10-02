import {parseColor,colorToCss,mixSrgb,mixOklab} from './color-engine.mjs';

/*
 * Style data is translated from shadcn/create's public Vega/Nova/Maia/Lyra/
 * Mira/Luma/Sera/Rhea recipes. QXFRAME keeps its own Token architecture:
 * Style chooses component geometry/treatment; Radius chooses the radius scale;
 * typography, Theme color, chart color and Menu remain orthogonal dimensions.
 */
const DEFAULTS=Object.freeze({
  typography:Object.freeze({body:'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14}),
  radius:'default',
  density:'default',
  style:'vega',
  menu:Object.freeze({color:'default',appearance:'solid',accent:'subtle'})
});
const FONT_STACKS=Object.freeze({
  'system-ui':'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  humanist:'"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  serif:'Georgia, "Times New Roman", serif',
  mono:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
});
const MONO_STACKS=Object.freeze({
  'ui-monospace':'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'system-mono':'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace'
});
const RADIUS_PROFILES=Object.freeze({
  none:Object.freeze({base:0,scale:[0,0,0,0,0]}),
  small:Object.freeze({base:7.2,scale:[3.2,5.2,7.2,11.2,15.2]}),
  medium:Object.freeze({base:10,scale:[6,8,10,14,18]}),
  large:Object.freeze({base:14,scale:[10,12,14,18,22]})
});
const STYLE_DEFAULT_RADIUS=Object.freeze({vega:'medium',nova:'medium',maia:'medium',lyra:'none',mira:'medium',luma:'medium',sera:'none',rhea:'medium'});
const DENSITY_PROFILES=Object.freeze({
  compact:Object.freeze({heights:[22,24,28,32,36],paddingInline:[6,8,8,10,12],gaps:[2,4,4,6,6],tablePy:[2,4,4,6,6],tablePx:[6,8,8,10,12]}),
  comfortable:Object.freeze({heights:[28,32,36,40,44],paddingInline:[10,12,12,14,16],gaps:[6,6,8,8,10],tablePy:[6,6,8,8,10],tablePx:[10,12,12,14,16]})
});
const STYLE_PROFILES=Object.freeze({
  vega:Object.freeze({
    heights:[24,32,36,40,44],padding:[8,10,10,12,14],gaps:[4,4,6,6,8],fontRole:'md',
    cardPadding:[12,16,24,28,32],
    switchHeight:[14,16,18,20,22],switchWidth:[24,28,32,36,40],switchPadding:[1,1,1,1,1],
    switchThumbWidth:[12,14,16,18,20],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[2,4,6,6,8],sliderHandleWidth:[12,14,16,18,20],sliderHandleHeight:[12,14,16,18,20],
    radius:{control:'md',action:'md',navigation:'sm',data:'md',popup:'md',surface:'xl',switchTrack:'pill',switchThumb:'circle',sliderRail:'pill',sliderHandle:'circle'},
    shadow:[2,2,8,4]
  }),
  nova:Object.freeze({
    heights:[24,28,32,36,40],padding:[8,10,10,12,12],gaps:[4,4,6,6,6],fontRole:'md',
    cardPadding:[10,12,16,20,24],
    switchHeight:[14,16,18,20,22],switchWidth:[24,28,32,36,40],switchPadding:[1,1,1,1,1],
    switchThumbWidth:[12,14,16,18,20],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[2,2,4,4,6],sliderHandleWidth:[10,12,12,14,16],sliderHandleHeight:[10,12,12,14,16],
    radius:{control:'lg',action:'lg',navigation:'md',data:'lg',popup:'lg',surface:'xl',switchTrack:'pill',switchThumb:'circle',sliderRail:'pill',sliderHandle:'circle'},
    shadow:[1,1,4,2]
  }),
  maia:Object.freeze({
    heights:[28,32,36,40,44],padding:[10,12,12,14,16],gaps:[6,6,8,8,10],fontRole:'md',
    cardPadding:[12,16,24,28,32],
    switchHeight:[14,16,18,20,22],switchWidth:[24,28,32,36,40],switchPadding:[1,1,1,1,1],
    switchThumbWidth:[12,14,16,18,20],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[6,8,12,12,14],sliderHandleWidth:[14,16,16,18,20],sliderHandleHeight:[14,16,16,18,20],
    radius:{control:'xl',action:'xl',navigation:'xl',data:'xl',popup:'xl',surface:'xl',switchTrack:'pill',switchThumb:'circle',sliderRail:'xl',sliderHandle:'xl'},
    shadow:[1,1,12,4]
  }),
  lyra:Object.freeze({
    heights:[24,28,32,36,40],padding:[6,8,10,10,12],gaps:[4,4,6,6,6],fontRole:'xs',
    cardPadding:[10,12,16,20,24],
    switchHeight:[14,16,18,20,22],switchWidth:[24,28,32,36,40],switchPadding:[1,1,1,1,1],
    switchThumbWidth:[12,14,16,18,20],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[2,2,4,4,4],sliderHandleWidth:[10,12,12,14,16],sliderHandleHeight:[10,12,12,14,16],
    radius:{control:'zero',action:'zero',navigation:'zero',data:'zero',popup:'zero',surface:'zero',switchTrack:'pill',switchThumb:'circle',sliderRail:'zero',sliderHandle:'zero'},
    shadow:[1,1,2,1]
  }),
  mira:Object.freeze({
    heights:[22,24,28,32,36],padding:[6,8,8,10,12],gaps:[2,4,4,6,6],fontRole:'xs',
    cardPadding:[10,12,16,20,24],
    switchHeight:[14,14,16,18,20],switchWidth:[24,24,28,32,36],switchPadding:[1,1,1,1,1],
    switchThumbWidth:[12,12,14,16,18],switchThumbHeight:[12,12,14,16,18],
    sliderRail:[2,2,4,4,4],sliderHandleWidth:[10,12,12,14,16],sliderHandleHeight:[10,12,12,14,16],
    radius:{control:'md',action:'md',navigation:'md',data:'md',popup:'lg',surface:'lg',switchTrack:'pill',switchThumb:'circle',sliderRail:'md',sliderHandle:'md'},
    shadow:[1,1,4,2]
  }),
  luma:Object.freeze({
    heights:[28,32,36,40,44],padding:[10,12,12,14,16],gaps:[6,6,8,8,10],fontRole:'md',
    cardPadding:[12,16,24,28,32],
    switchHeight:[14,16,20,22,24],switchWidth:[24,28,44,48,52],switchPadding:[1,1,2,2,2],
    switchThumbWidth:[12,16,24,26,28],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[4,6,8,8,10],sliderHandleWidth:[16,20,24,26,28],sliderHandleHeight:[12,14,16,18,20],
    radius:{control:'xl',action:'xl',navigation:'pill',data:'xl',popup:'xl',surface:'xl',switchTrack:'pill',switchThumb:'pill',sliderRail:'pill',sliderHandle:'pill'},
    shadow:[1,2,12,4]
  }),
  sera:Object.freeze({
    heights:[28,36,40,44,48],padding:[10,16,24,24,28],gaps:[4,6,6,8,8],fontRole:'xs',
    cardPadding:[16,20,32,36,40],
    switchHeight:[12,14,18,20,22],switchWidth:[22,26,34,38,42],switchPadding:[1,1,2,2,2],
    switchThumbWidth:[10,12,14,16,18],switchThumbHeight:[10,12,14,16,18],
    sliderRail:[1,1,2,2,2],sliderHandleWidth:[10,12,12,14,16],sliderHandleHeight:[10,12,12,14,16],
    radius:{control:'zero',action:'zero',navigation:'zero',data:'zero',popup:'zero',surface:'zero',switchTrack:'zero',switchThumb:'zero',sliderRail:'zero',sliderHandle:'zero'},
    shadow:[1,1,6,2]
  }),
  rhea:Object.freeze({
    heights:[24,28,32,36,40],padding:[8,10,12,14,16],gaps:[4,4,6,6,8],fontRole:'md',
    cardPadding:[12,16,20,24,28],
    switchHeight:[14,16,20,22,24],switchWidth:[24,28,32,36,40],switchPadding:[1,1,2,2,2],
    switchThumbWidth:[12,14,16,18,20],switchThumbHeight:[12,14,16,18,20],
    sliderRail:[2,2,4,4,6],sliderHandleWidth:[12,14,16,18,20],sliderHandleHeight:[12,14,16,18,20],
    radius:{control:'lg',action:'lg',navigation:'lg',data:'lg',popup:'xl',surface:'xl',switchTrack:'xl',switchThumb:'xl',sliderRail:'xl',sliderHandle:'xl'},
    shadow:[1,1,8,3]
  })
});
const SIZES=Object.freeze(['xs','sm','md','lg','xl']);

function rem(px){
  if(px===0)return '0';
  return String(Number((px/16).toFixed(4)))+'rem';
}
function setToken(tokenMaps,schema,changed,name,light,dark=light){
  if(!schema.tokenSet.has(name)&&!schema.optionalSet.has(name))return false;
  tokenMaps.light[name]=String(light);
  tokenMaps.dark[name]=String(dark);
  changed.add(name);
  return true;
}
function radiusValue(role){
  if(role==='zero')return '0';
  if(role==='pill')return 'var(--qxframe9a7c2-theme-radius-pill)';
  if(role==='circle')return 'var(--qxframe9a7c2-theme-radius-circle)';
  return 'var(--qxframe9a7c2-theme-radius-'+role+')';
}
function applyStyle(tokenMaps,schema,config,changed){
  const p=STYLE_PROFILES[config.style];
  if(!p)throw new TypeError('Unknown design style: '+config.style);
  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-height-'+size,rem(p.heights[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-padding-inline-'+size,rem(p.padding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-gap-'+size,rem(p.gaps[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-font-size-'+size,'var(--qxframe9a7c2-theme-font-size-'+p.fontRole+')');
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-height-'+size,rem(p.switchHeight[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-width-'+size,rem(p.switchWidth[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-padding-'+size,rem(p.switchPadding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-rail-'+size,rem(p.sliderRail[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-'+size,rem(p.sliderHandleHeight[index]));
  });
  const roleTokens={control:'--qxframe9a7c2-family-control-radius',action:'--qxframe9a7c2-family-action-radius',navigation:'--qxframe9a7c2-family-navigation-radius',data:'--qxframe9a7c2-family-data-radius',popup:'--qxframe9a7c2-family-popup-radius',surface:'--qxframe9a7c2-family-surface-radius'};
  for(const [key,name] of Object.entries(roleTokens))setToken(tokenMaps,schema,changed,name,radiusValue(p.radius[key]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-switch-track-radius',radiusValue(p.radius.switchTrack));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-switch-thumb-radius',radiusValue(p.radius.switchThumb));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-rail-radius',radiusValue(p.radius.sliderRail));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-handle-radius',radiusValue(p.radius.sliderHandle));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-switch-thumb-width',rem(p.switchThumbWidth[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-switch-thumb-height',rem(p.switchThumbHeight[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-handle-width',rem(p.sliderHandleWidth[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-handle-height',rem(p.sliderHandleHeight[2]));
  const cardTokens=['xs','sm','md','lg','xl'];
  cardTokens.forEach((size,index)=>setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-'+size+'-padding',rem(p.cardPadding[index])));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-button-shadow-blur',rem(p.shadow[0]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-sm',rem(p.shadow[1]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-lg',rem(p.shadow[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-y-lg',rem(p.shadow[3]));
}
function applyTypography(tokenMaps,schema,config,changed){
  const body=FONT_STACKS[config.typography.body];
  const heading=config.typography.heading==='inherit'?'inherit':FONT_STACKS[config.typography.heading];
  const mono=MONO_STACKS[config.typography.mono];
  if(!body||!heading||!mono)throw new TypeError('Typography preset is incomplete.');
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-font-family',body);
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-font-family-heading',heading);
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-font-family-mono',mono);
  const base=config.typography.baseSize;
  const px=[Math.max(10,base-2),base,base,base+2,base+4];
  SIZES.forEach((size,index)=>setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-font-size-'+size,rem(px[index])));
}
function applyRadius(tokenMaps,schema,config,changed){
  const resolved=config.radius==='default'?(STYLE_DEFAULT_RADIUS[config.style]||'medium'):config.radius;
  const profile=RADIUS_PROFILES[resolved];
  if(!profile)throw new TypeError('Unknown radius preset: '+config.radius);
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-radius',rem(profile.base));
  SIZES.forEach((size,index)=>{
    const value=rem(profile.scale[index]);
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-radius-'+size,value);
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-radius-'+size,value);
  });
}
function applyDensity(tokenMaps,schema,config,changed){
  if(config.density==='default')return;
  const profile=DENSITY_PROFILES[config.density];
  if(!profile)throw new TypeError('Unknown legacy density preset: '+config.density);
  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-height-'+size,rem(profile.heights[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-padding-inline-'+size,rem(profile.paddingInline[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-gap-'+size,rem(profile.gaps[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-py-'+size,rem(profile.tablePy[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-px-'+size,rem(profile.tablePx[index]));
  });
}
function asColor(tokenMaps,mode,name){
  const value=tokenMaps[mode][name];
  if(value==null)throw new TypeError('Missing color token for design preset: '+name);
  return parseColor(value);
}
function alphaColor(value,alpha){
  const c=parseColor(value);
  return parseColor({r:c.r,g:c.g,b:c.b,a:Math.max(0,Math.min(1,alpha))});
}
function mixCss(a,b,weight,space='srgb'){
  return colorToCss(space==='oklab'?mixOklab(a,b,weight):mixSrgb(a,b,weight));
}
function menuModeBase(tokenMaps,mode,color){
  const surface=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-light-surface':'--qxframe9a7c2-theme-dark-surface');
  const muted=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-light-surface-muted':'--qxframe9a7c2-theme-dark-surface-muted');
  const text=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-light-text':'--qxframe9a7c2-theme-dark-text');
  const textSecondary=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-light-text-secondary':'--qxframe9a7c2-theme-dark-text-secondary');
  const oppositeSurface=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-dark-surface':'--qxframe9a7c2-theme-light-surface');
  const oppositeText=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-dark-text':'--qxframe9a7c2-theme-light-text');
  const primary=asColor(tokenMaps,mode,mode==='light'?'--qxframe9a7c2-theme-primary-7':'--qxframe9a7c2-theme-primary-9');
  const onPrimary=asColor(tokenMaps,mode,'--qxframe9a7c2-theme-primary-foreground');
  if(color==='primary')return {background:primary,text:onPrimary,surface,muted,accent:primary,onAccent:onPrimary};
  if(color==='inverted')return {background:oppositeSurface,text:oppositeText,surface,muted,accent:primary,onAccent:onPrimary};
  if(color==='neutral')return {background:muted,text,surface,muted,accent:primary,onAccent:onPrimary};
  return {background:surface,text:textSecondary,surface,muted,accent:primary,onAccent:onPrimary};
}
function menuPalette(tokenMaps,mode,menu){
  const base=menuModeBase(tokenMaps,mode,menu.color);
  const strength={subtle:0.12,balanced:0.2,strong:0.32}[menu.accent];
  if(strength==null)throw new TypeError('Unknown menu accent preset: '+menu.accent);
  let background=base.background,itemText=base.text;
  if(menu.appearance==='soft'){
    background=mixOklab(base.accent,base.surface,menu.color==='primary'?0.12:0.04);
    itemText=base.text;
  }else if(menu.appearance==='translucent'){
    const source=menu.color==='primary'?mixOklab(base.accent,base.surface,0.1):base.surface;
    background=alphaColor(source,0.88);
    itemText=base.text;
  }else if(menu.appearance!=='solid')throw new TypeError('Unknown menu appearance preset: '+menu.appearance);

  const saturated=menu.appearance==='solid'&&(menu.color==='primary'||menu.color==='inverted');
  const selectedBackground=saturated
    ?mixSrgb(background,itemText,1-strength)
    :mixOklab(base.accent,background,strength);
  const selectedHover=saturated
    ?mixSrgb(background,itemText,Math.max(0.5,1-(strength+0.08)))
    :mixOklab(base.accent,background,Math.min(0.5,strength+0.08));
  const hoverBackground=saturated
    ?mixSrgb(background,itemText,0.92)
    :mixOklab(base.accent,background,0.07);
  const selectedText=saturated?itemText:base.accent;
  return {
    background:colorToCss(background),
    itemBackground:'transparent',
    itemText:colorToCss(itemText),
    hoverBackground:colorToCss(hoverBackground),
    hoverText:colorToCss(itemText),
    selectedBackground:colorToCss(selectedBackground),
    selectedHoverBackground:colorToCss(selectedHover),
    selectedText:colorToCss(selectedText),
    selectedIndicator:colorToCss(selectedText)
  };
}
function applyMenu(tokenMaps,schema,config,changed){
  const menu=config.components.menu;
  if(menu.color===DEFAULTS.menu.color&&menu.appearance===DEFAULTS.menu.appearance&&menu.accent===DEFAULTS.menu.accent)return;
  const light=menuPalette(tokenMaps,'light',menu),dark=menuPalette(tokenMaps,'dark',menu);
  const slots={
    background:'--qxframe9a7c2-theme-menu-background',
    itemBackground:'--qxframe9a7c2-theme-menu-item-background',
    itemText:'--qxframe9a7c2-theme-menu-item-text',
    hoverBackground:'--qxframe9a7c2-theme-menu-hover-background',
    hoverText:'--qxframe9a7c2-theme-menu-hover-text',
    selectedBackground:'--qxframe9a7c2-theme-menu-selected-background',
    selectedHoverBackground:'--qxframe9a7c2-theme-menu-selected-hover-background',
    selectedText:'--qxframe9a7c2-theme-menu-selected-text',
    selectedIndicator:'--qxframe9a7c2-theme-menu-selected-indicator'
  };
  for(const [key,name] of Object.entries(slots))setToken(tokenMaps,schema,changed,name,light[key],dark[key]);
}
function applyDesignConfiguration(tokenMaps,schema,config){
  const changed=new Set();
  applyTypography(tokenMaps,schema,config,changed);
  applyRadius(tokenMaps,schema,config,changed);
  applyStyle(tokenMaps,schema,config,changed);
  applyDensity(tokenMaps,schema,config,changed);
  applyMenu(tokenMaps,schema,config,changed);
  return Object.freeze({changedTokens:Object.freeze([...changed].sort())});
}

export {
  FONT_STACKS,
  MONO_STACKS,
  RADIUS_PROFILES,
  DENSITY_PROFILES,
  STYLE_PROFILES,
  applyDesignConfiguration
};
