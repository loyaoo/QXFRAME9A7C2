import {parseColor,colorToCss,mixSrgb,mixOklab} from './color-engine.mjs';

const DEFAULTS=Object.freeze({
  typography:Object.freeze({body:'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14}),
  radius:'default',
  density:'default',
  style:'nova',
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
  // shadcn/create exposes Default / None / Small / Medium / Large. QX keeps
  // even-pixel rem geometry while deriving a full scale from the selected base.
  default:Object.freeze({base:10,scale:[6,8,10,14,18]}),
  none:Object.freeze({base:0,scale:[0,0,0,0,0]}),
  small:Object.freeze({base:8,scale:[4,6,8,12,14]}),
  medium:Object.freeze({base:10,scale:[6,8,10,14,18]}),
  large:Object.freeze({base:14,scale:[8,12,14,20,26]})
});
const DENSITY_PROFILES=Object.freeze({
  // Legacy Config v1 compatibility only. Theme Studio v2 no longer exposes
  // Density because shadcn-style component density belongs to Style.
  compact:Object.freeze({
    heights:[11,13,15,17,19],paddingInline:[2,3,4,5,6],gaps:[1,2,2,3,4],
    tablePy:[1,2,3,4,5],tablePx:[3,4,5,6,7]
  }),
  comfortable:Object.freeze({
    heights:[13,15,17,19,21],paddingInline:[4,5,6,7,8],gaps:[3,4,5,6,7],
    tablePy:[3,4,5,6,7],tablePx:[5,6,7,8,9]
  })
});
function styleProfile(spec){return Object.freeze(spec);}
const STYLE_PROFILES=Object.freeze({
  // Style intent follows current shadcn/create. Values below translate that
  // component geometry into QXFRAME's frozen public Theme/Component tokens.
  vega:styleProfile({
    label:'Vega',heights:[12,14,16,18,20],padding:[3,4,5,6,7],gaps:[2,2,3,4,5],
    tablePy:[2,3,5,7,8],tablePx:[3,5,6,8,9],cardPadding:[4,5,6,7,8],
    switchHeight:[8,9,10,12,14],switchWidth:[14,16,18,22,25],switchPadding:[1,1,1,1,2],
    sliderHandle:[6,7,8,9,10],sliderRail:[1,1,2,3,3],sliderBorder:1,
    radiusRoles:['sm','sm','md','lg','md','lg','lg'],
    shadow:[1,1,9,3,1],cardShadow:'none',popupShadow:'none'
  }),
  nova:styleProfile({
    label:'Nova',heights:[12,14,16,18,20],padding:[2,3,4,5,6],gaps:[1,2,2,3,4],
    tablePy:[2,3,4,6,7],tablePx:[3,4,5,6,8],cardPadding:[4,5,5,6,7],
    switchHeight:[8,9,10,11,13],switchWidth:[13,15,17,20,23],switchPadding:[1,1,1,1,1],
    sliderHandle:[5,6,7,8,9],sliderRail:[1,1,2,2,3],sliderBorder:1,
    radiusRoles:['sm','sm','sm','md','md','lg','lg'],
    shadow:[1,1,7,2,1],cardShadow:'none',popupShadow:'none'
  }),
  maia:styleProfile({
    label:'Maia',heights:[13,15,17,19,21],padding:[4,5,6,7,8],gaps:[3,4,5,6,7],
    tablePy:[3,4,5,6,7],tablePx:[5,6,7,8,9],cardPadding:[6,7,8,9,10],
    switchHeight:[9,10,12,14,16],switchWidth:[16,18,22,25,28],switchPadding:[1,1,1,2,2],
    sliderHandle:[7,8,9,10,11],sliderRail:[2,2,3,3,4],sliderBorder:1,
    radiusRoles:['md','md','md','lg','lg','xl','xl'],
    shadow:[2,2,12,4,2],
    cardShadow:'0 var(--qxframe9a7c2-size-2) var(--qxframe9a7c2-size-8) rgba(var(--qxframe9a7c2-palette-black), .08)',
    popupShadow:'0 var(--qxframe9a7c2-size-2) var(--qxframe9a7c2-size-10) rgba(var(--qxframe9a7c2-palette-black), .10)'
  }),
  lyra:styleProfile({
    label:'Lyra',heights:[12,14,16,18,20],padding:[3,4,5,6,7],gaps:[2,2,3,4,5],
    tablePy:[2,3,4,5,6],tablePx:[4,5,6,7,8],cardPadding:[4,5,6,7,8],
    switchHeight:[8,9,10,11,13],switchWidth:[14,16,18,20,23],switchPadding:[1,1,1,1,1],
    sliderHandle:[5,6,7,8,9],sliderRail:[1,1,2,2,2],sliderBorder:1,
    radiusRoles:['xs','xs','xs','xs','xs','xs','xs'],
    shadow:[0,0,0,0,0],cardShadow:'none',popupShadow:'none'
  }),
  mira:styleProfile({
    label:'Mira',heights:[11,13,15,17,19],padding:[2,3,4,5,6],gaps:[1,2,2,3,4],
    tablePy:[1,2,3,4,5],tablePx:[3,4,5,6,7],cardPadding:[3,4,5,6,7],
    switchHeight:[7,8,9,10,12],switchWidth:[12,14,16,18,22],switchPadding:[1,1,1,1,1],
    sliderHandle:[5,6,7,8,9],sliderRail:[1,1,2,2,2],sliderBorder:1,
    radiusRoles:['xs','xs','xs','sm','sm','md','md'],
    shadow:[1,1,4,1,1],cardShadow:'none',popupShadow:'none'
  }),
  luma:styleProfile({
    label:'Luma',heights:[13,15,17,19,21],padding:[4,5,6,7,8],gaps:[3,4,5,6,7],
    tablePy:[3,4,5,6,7],tablePx:[5,6,7,8,9],cardPadding:[6,7,8,9,10],
    switchHeight:[9,10,12,14,16],switchWidth:[16,18,22,25,28],switchPadding:[1,1,1,2,2],
    sliderHandle:[7,8,9,10,11],sliderRail:[2,2,3,3,4],sliderBorder:1,
    radiusRoles:['md','md','md','lg','lg','xl','xl'],
    shadow:[2,2,14,5,2],
    cardShadow:'0 var(--qxframe9a7c2-size-2) var(--qxframe9a7c2-size-10) rgba(var(--qxframe9a7c2-palette-black), .08)',
    popupShadow:'0 var(--qxframe9a7c2-size-3) var(--qxframe9a7c2-size-12) rgba(var(--qxframe9a7c2-palette-black), .12)'
  }),
  sera:styleProfile({
    label:'Sera',heights:[12,14,16,18,20],padding:[2,3,4,5,6],gaps:[2,2,3,4,5],
    tablePy:[2,3,4,5,6],tablePx:[4,5,6,7,8],cardPadding:[4,5,6,7,8],
    switchHeight:[8,9,10,11,13],switchWidth:[14,16,18,20,23],switchPadding:[1,1,1,1,1],
    sliderHandle:[5,6,7,8,9],sliderRail:[1,1,1,2,2],sliderBorder:1,
    radiusRoles:['xs','xs','xs','xs','xs','xs','xs'],
    shadow:[0,0,0,0,0],cardShadow:'none',popupShadow:'none'
  }),
  rhea:styleProfile({
    label:'Rhea',heights:[11,13,15,17,19],padding:[3,4,5,6,7],gaps:[2,2,3,4,5],
    tablePy:[2,3,4,5,6],tablePx:[4,5,6,7,8],cardPadding:[4,5,6,7,8],
    switchHeight:[8,9,10,11,13],switchWidth:[14,16,18,20,23],switchPadding:[1,1,1,1,1],
    sliderHandle:[6,7,8,9,10],sliderRail:[1,1,2,2,3],sliderBorder:1,
    radiusRoles:['sm','sm','sm','md','md','lg','lg'],
    shadow:[1,1,8,2,1],
    cardShadow:'0 var(--qxframe9a7c2-size-1) var(--qxframe9a7c2-size-6) rgba(var(--qxframe9a7c2-palette-black), .07)',
    popupShadow:'0 var(--qxframe9a7c2-size-2) var(--qxframe9a7c2-size-8) rgba(var(--qxframe9a7c2-palette-black), .09)'
  })
});
const SIZES=Object.freeze(['xs','sm','md','lg','xl']);

function rem(px){
  if(px===0)return '0';
  const value=px/16;
  return String(Number(value.toFixed(4)))+'rem';
}
function setToken(tokenMaps,schema,changed,name,light,dark=light){
  if(!schema.tokenSet.has(name)&&!schema.optionalSet.has(name))return false;
  tokenMaps.light[name]=String(light);
  tokenMaps.dark[name]=String(dark);
  changed.add(name);
  return true;
}
function sizeRef(index){return index===0?'0':'var(--qxframe9a7c2-size-'+index+')';}
function applyStyle(tokenMaps,schema,config,changed){
  const profile=STYLE_PROFILES[config.style];
  if(!profile)throw new TypeError('Unknown design style: '+config.style);

  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-height-'+size,sizeRef(profile.heights[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-padding-inline-'+size,sizeRef(profile.padding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-gap-'+size,sizeRef(profile.gaps[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-py-'+size,sizeRef(profile.tablePy[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-px-'+size,sizeRef(profile.tablePx[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-'+size+'-padding',sizeRef(profile.cardPadding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-height-'+size,sizeRef(profile.switchHeight[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-width-'+size,sizeRef(profile.switchWidth[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-padding-'+size,sizeRef(profile.switchPadding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-'+size,sizeRef(profile.sliderHandle[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-rail-'+size,sizeRef(profile.sliderRail[index]));
  });
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-border-width',sizeRef(profile.sliderBorder));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-button-shadow-blur',sizeRef(profile.shadow[0]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-sm',sizeRef(profile.shadow[1]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-lg',sizeRef(profile.shadow[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-y-lg',sizeRef(profile.shadow[3]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-shadow-blur',sizeRef(profile.shadow[4]));

  const roles=['control','action','navigation','popup','data','surface','card'];
  profile.radiusRoles.forEach((radius,index)=>{
    const value='var(--qxframe9a7c2-theme-radius-'+radius+')';
    const name=roles[index]==='card'?'--qxframe9a7c2-card-radius':'--qxframe9a7c2-family-'+roles[index]+'-radius';
    setToken(tokenMaps,schema,changed,name,value);
  });
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-tooltip-radius','var(--qxframe9a7c2-theme-radius-'+profile.radiusRoles[3]+')');
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-shadow',profile.cardShadow);
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-family-popup-shadow',profile.popupShadow);
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
  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-font-size-'+size,rem(px[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-font-size-'+size,'var(--qxframe9a7c2-theme-font-size-'+size+')');
  });
}
function applyRadius(tokenMaps,schema,config,changed){
  const profile=RADIUS_PROFILES[config.radius];
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
  if(!profile)throw new TypeError('Unknown density preset: '+config.density);
  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-height-'+size,'var(--qxframe9a7c2-size-'+profile.heights[index]+')');
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-padding-inline-'+size,'var(--qxframe9a7c2-size-'+profile.paddingInline[index]+')');
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-gap-'+size,'var(--qxframe9a7c2-size-'+profile.gaps[index]+')');
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-py-'+size,'var(--qxframe9a7c2-size-'+profile.tablePy[index]+')');
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-table-cell-px-'+size,'var(--qxframe9a7c2-size-'+profile.tablePx[index]+')');
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
  applyStyle(tokenMaps,schema,config,changed);
  applyTypography(tokenMaps,schema,config,changed);
  applyRadius(tokenMaps,schema,config,changed);
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
