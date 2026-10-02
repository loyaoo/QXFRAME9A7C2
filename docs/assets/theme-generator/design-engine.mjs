import {parseColor,colorToCss,mixSrgb,mixOklab} from './color-engine.mjs';

const DEFAULTS=Object.freeze({
  typography:Object.freeze({body:'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14}),
  radius:'medium',
  density:'default',
  style:'balanced',
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
  small:Object.freeze({base:2,scale:[2,2,4,4,6]}),
  medium:Object.freeze({base:4,scale:[2,4,6,8,10]}),
  large:Object.freeze({base:8,scale:[4,6,8,10,12]})
});
const DENSITY_PROFILES=Object.freeze({
  compact:Object.freeze({
    heights:[11,13,15,17,19],
    paddingInline:[2,3,4,5,6],
    gaps:[1,2,2,3,4],
    tablePy:[1,2,3,4,5],
    tablePx:[3,4,5,6,7]
  }),
  comfortable:Object.freeze({
    heights:[13,15,17,19,21],
    paddingInline:[4,5,6,7,8],
    gaps:[3,4,5,6,7],
    tablePy:[3,4,5,6,7],
    tablePx:[5,6,7,8,9]
  })
});
const STYLE_PROFILES=Object.freeze({
  balanced:Object.freeze({}),
  soft:Object.freeze({
    '--qxframe9a7c2-theme-button-shadow-blur':'var(--qxframe9a7c2-size-2)',
    '--qxframe9a7c2-theme-card-shadow-blur-sm':'var(--qxframe9a7c2-size-2)',
    '--qxframe9a7c2-theme-card-shadow-blur-lg':'var(--qxframe9a7c2-size-12)',
    '--qxframe9a7c2-theme-card-shadow-y-lg':'var(--qxframe9a7c2-size-4)'
  }),
  precision:Object.freeze({
    '--qxframe9a7c2-theme-button-shadow-blur':'var(--qxframe9a7c2-size-1)',
    '--qxframe9a7c2-theme-card-shadow-blur-sm':'var(--qxframe9a7c2-size-1)',
    '--qxframe9a7c2-theme-card-shadow-blur-lg':'var(--qxframe9a7c2-size-5)',
    '--qxframe9a7c2-theme-card-shadow-y-lg':'var(--qxframe9a7c2-size-2)'
  }),
  compact:Object.freeze({
    '--qxframe9a7c2-theme-button-shadow-blur':'var(--qxframe9a7c2-size-1)',
    '--qxframe9a7c2-theme-card-shadow-blur-sm':'var(--qxframe9a7c2-size-1)',
    '--qxframe9a7c2-theme-card-shadow-blur-lg':'var(--qxframe9a7c2-size-4)',
    '--qxframe9a7c2-theme-card-shadow-y-lg':'var(--qxframe9a7c2-size-2)'
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
function applyStyle(tokenMaps,schema,config,changed){
  const profile=STYLE_PROFILES[config.style];
  if(!profile)throw new TypeError('Unknown design style: '+config.style);
  for(const [name,value] of Object.entries(profile))setToken(tokenMaps,schema,changed,name,value);
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
