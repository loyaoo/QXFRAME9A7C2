import {parseColor,colorToCss,mixSrgb,mixOklab} from './color-engine.mjs';

const DEFAULTS=Object.freeze({
  typography:Object.freeze({body:'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14}),
  radius:'default',
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
const RADIUS_MULTIPLIERS=Object.freeze([0.6,0.8,1,1.4,1.8]);
const RADIUS_PROFILES=Object.freeze({
  default:Object.freeze({base:null}),
  none:Object.freeze({base:0}),
  small:Object.freeze({base:7.2}),
  medium:Object.freeze({base:10}),
  large:Object.freeze({base:14})
});
const STYLE_PROFILES=Object.freeze({
  vega:Object.freeze({
    defaultRadius:10, controlRadius:0.8, cardRadius:1.4, popupRadius:0.8, tabsRadius:1, tabsItemRadius:0.8,
    heights:[24,32,36,40,44], padding:[8,10,10,10,12], gaps:[4,4,6,6,8], fonts:[12,14,14,14,16],
    cardPadding:[12,16,24,24,28], switchHeight:[12,14,18,22,26], switchWidth:[20,24,32,38,44], switchPadding:[1,1,1,1,1],
    sliderRail:[2,4,6,6,8], sliderHandle:[12,14,16,18,20], sliderBorder:1,
    shadow:Object.freeze({button:1,cardSm:1,cardLg:9,cardY:3,switchThumb:1,sliderThumb:2})
  }),
  nova:Object.freeze({
    defaultRadius:10, controlRadius:1, cardRadius:1.4, popupRadius:1, tabsRadius:1, tabsItemRadius:0.8,
    heights:[24,28,32,36,40], padding:[8,10,10,10,12], gaps:[4,4,6,6,8], fonts:[12,13,14,14,16],
    cardPadding:[10,12,16,16,20], switchHeight:[12,14,18,22,26], switchWidth:[20,24,32,38,44], switchPadding:[1,1,1,1,1],
    sliderRail:[2,3,4,4,6], sliderHandle:[10,12,12,14,16], sliderBorder:1,
    shadow:Object.freeze({button:0,cardSm:0,cardLg:4,cardY:2,switchThumb:0,sliderThumb:0})
  }),
  maia:Object.freeze({
    defaultRadius:10, controlRadius:2.6, cardRadius:1.8, popupRadius:1.8, tabsRadius:2.6, tabsItemRadius:1.4,
    heights:[24,32,36,40,44], padding:[10,12,12,16,18], gaps:[4,4,6,6,8], fonts:[12,14,14,14,16],
    cardPadding:[12,16,24,24,28], switchHeight:[12,14,18,22,26], switchWidth:[20,24,32,38,44], switchPadding:[1,1,1,1,1],
    sliderRail:[6,8,12,12,14], sliderHandle:[12,14,16,18,20], sliderBorder:1,
    shadow:Object.freeze({button:0,cardSm:0,cardLg:12,cardY:4,switchThumb:0,sliderThumb:2})
  }),
  lyra:Object.freeze({
    defaultRadius:0, controlRadius:0, cardRadius:0, popupRadius:0, tabsRadius:0, tabsItemRadius:0,
    heights:[24,28,32,36,40], padding:[8,10,10,10,12], gaps:[4,4,6,6,8], fonts:[12,12,12,12,14],
    cardPadding:[10,12,16,16,20], switchHeight:[12,14,18,22,26], switchWidth:[20,24,32,38,44], switchPadding:[1,1,1,1,1],
    sliderRail:[2,3,4,4,6], sliderHandle:[10,12,12,14,16], sliderBorder:1,
    shadow:Object.freeze({button:0,cardSm:0,cardLg:0,cardY:0,switchThumb:0,sliderThumb:0})
  }),
  mira:Object.freeze({
    defaultRadius:10, controlRadius:0.8, cardRadius:1, popupRadius:1, tabsRadius:1, tabsItemRadius:0.8,
    heights:[20,24,28,32,36], padding:[8,8,8,10,12], gaps:[4,4,4,4,6], fonts:[10,12,12,12,14],
    cardPadding:[10,12,16,16,20], switchHeight:[12,14,16,20,24], switchWidth:[20,24,28,34,40], switchPadding:[1,1,1,1,1],
    sliderRail:[2,3,4,4,6], sliderHandle:[10,12,12,14,16], sliderBorder:1,
    shadow:Object.freeze({button:0,cardSm:0,cardLg:4,cardY:2,switchThumb:0,sliderThumb:0})
  }),
  luma:Object.freeze({
    defaultRadius:10, controlRadius:2.2, cardRadius:2.6, popupRadius:2.2, tabsRadius:3, tabsItemRadius:3,
    heights:[24,32,36,40,44], padding:[10,12,12,16,18], gaps:[4,4,6,6,8], fonts:[12,14,14,14,16],
    cardPadding:[12,16,24,24,28], switchHeight:[14,16,20,24,28], switchWidth:[24,28,44,52,60], switchPadding:[1,1,2,2,2],
    sliderRail:[4,6,8,8,10], sliderHandle:[12,14,16,18,20], sliderBorder:0,
    shadow:Object.freeze({button:0,cardSm:2,cardLg:12,cardY:4,switchThumb:2,sliderThumb:4})
  }),
  sera:Object.freeze({
    defaultRadius:0, controlRadius:0, cardRadius:0, popupRadius:0, tabsRadius:0, tabsItemRadius:0,
    heights:[28,36,40,44,48], padding:[12,16,24,32,40], gaps:[4,4,6,6,8], fonts:[10,12,12,12,14],
    cardPadding:[16,20,32,32,40], switchHeight:[12,14,18,22,26], switchWidth:[20,25,33,40,47], switchPadding:[1,1,1,1,1],
    sliderRail:[1,1,2,2,2], sliderHandle:[10,12,12,14,16], sliderBorder:0,
    shadow:Object.freeze({button:0,cardSm:2,cardLg:6,cardY:2,switchThumb:0,sliderThumb:0})
  }),
  rhea:Object.freeze({
    defaultRadius:10, controlRadius:1.8, cardRadius:2.6, popupRadius:1.8, tabsRadius:1.8, tabsItemRadius:1.8,
    heights:[24,28,32,36,40], padding:[10,12,12,16,18], gaps:[4,4,6,6,8], fonts:[12,14,14,14,16],
    cardPadding:[12,16,20,20,24], switchHeight:[14,16,20,24,28], switchWidth:[22,26,32,38,44], switchPadding:[1,1,2,2,2],
    sliderRail:[2,3,4,4,6], sliderHandle:[12,14,16,18,20], sliderBorder:0,
    shadow:Object.freeze({button:0,cardSm:2,cardLg:8,cardY:3,switchThumb:2,sliderThumb:4})
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
function profileRadiusBase(config,profile){
  const radius=RADIUS_PROFILES[config.radius];
  if(!radius)throw new TypeError('Unknown radius preset: '+config.radius);
  return radius.base==null?profile.defaultRadius:radius.base;
}
function scaledRadius(base,multiplier){
  if(base===0||multiplier===0)return '0';
  return rem(Math.min(24,base*multiplier));
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
  const profile=STYLE_PROFILES[config.style];
  if(!profile)throw new TypeError('Unknown design style: '+config.style);
  const base=profileRadiusBase(config,profile);
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-radius',rem(base));
  SIZES.forEach((size,index)=>setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-radius-'+size,rem(base*RADIUS_MULTIPLIERS[index])));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-radius-pill',base===0?'0':'9999px');
  return base;
}
function applyStyle(tokenMaps,schema,config,changed,radiusBase){
  const p=STYLE_PROFILES[config.style];
  if(!p)throw new TypeError('Unknown design style: '+config.style);
  SIZES.forEach((size,index)=>{
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-height-'+size,rem(p.heights[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-padding-inline-'+size,rem(p.padding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-gap-'+size,rem(p.gaps[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-font-size-'+size,rem(p.fonts[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-control-radius-'+size,scaledRadius(radiusBase,p.controlRadius));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-height-'+size,rem(p.switchHeight[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-width-'+size,rem(p.switchWidth[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-padding-'+size,rem(p.switchPadding[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-rail-'+size,rem(p.sliderRail[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-'+size,rem(p.sliderHandle[index]));
    setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-'+size+'-padding',rem(p.cardPadding[index]));
  });
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-padding',rem(p.cardPadding[2]));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-card-radius',scaledRadius(radiusBase,p.cardRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-family-popup-radius',scaledRadius(radiusBase,p.popupRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-popover-radius',scaledRadius(radiusBase,p.popupRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-menu-popup-radius',scaledRadius(radiusBase,p.popupRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-menu-item-radius',scaledRadius(radiusBase,p.tabsItemRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-tabs-radius',scaledRadius(radiusBase,p.tabsRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-tabs-item-radius',scaledRadius(radiusBase,p.tabsItemRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-slider-tooltip-radius',scaledRadius(radiusBase,p.popupRadius));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-border-width',rem(p.sliderBorder));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-button-shadow-blur',rem(p.shadow.button));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-sm',rem(p.shadow.cardSm));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-blur-lg',rem(p.shadow.cardLg));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-card-shadow-y-lg',rem(p.shadow.cardY));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-switch-thumb-shadow-blur',rem(p.shadow.switchThumb));
  setToken(tokenMaps,schema,changed,'--qxframe9a7c2-theme-slider-handle-shadow-blur',rem(p.shadow.sliderThumb));
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
  const radiusBase=applyRadius(tokenMaps,schema,config,changed);
  applyStyle(tokenMaps,schema,config,changed,radiusBase);
  applyMenu(tokenMaps,schema,config,changed);
  return Object.freeze({changedTokens:Object.freeze([...changed].sort())});
}

export {
  FONT_STACKS,
  MONO_STACKS,
  RADIUS_PROFILES,
  STYLE_PROFILES,
  applyDesignConfiguration
};
