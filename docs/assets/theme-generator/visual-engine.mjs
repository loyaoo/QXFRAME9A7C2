// Offline recipe compiler. Production components only consume the resulting CSS.
import {parseColor,colorToCss,mixOklab,mixSrgb,contrastRatio,chooseOnColor} from './color-engine.mjs';
const prefix='--qxframe9a7c2-';
const sizes=['xs','sm','md','lg','xl'];
function write(maps,schema,changed,name,value,dark=value){
  const key=prefix+name;
  if(!schema.tokenSet.has(key)&&!schema.optionalSet.has(key))throw new TypeError('Unregistered visual slot: '+key);
  maps.light[key]=String(value);maps.dark[key]=String(dark);changed.add(key);
}
function shape(config,family,intrinsic,follow='var(--qxframe9a7c2-theme-radius-sm)'){
  return config.shape[family]==='square'?'0':config.shape[family]==='follow'?follow:intrinsic;
}
function scaleDimensions(maps,schema,config){
  for(const mode of ['light','dark'])for(const [key,value] of Object.entries(maps[mode])){
    if(/font|line-height|motion|shadow|border-width|spinner-border|indicator-size/.test(key))continue;
    const factor=/radius/.test(key)?config.foundation.radiusScale:config.foundation.sizeScale;
    if(factor===1||!schema.tokenSet.has(key)&&!schema.optionalSet.has(key))continue;
    // Scale upstream geometry references, never scan runtime CSS or infer component names.
    if(/^(?:\d+(?:\.\d+)?rem|var\(--qxframe9a7c2-(?:size|space)-\d+\))$/.test(value))maps[mode][key]='calc('+value+' * '+factor+')';
  }
}
function applyVisualFoundation(maps,schema,config,changed){
  // Body and Control values share one role. Meta stays a separate small tier.
  for(const size of sizes){
    write(maps,schema,changed,'theme-control-font-size-'+size,'var(--qxframe9a7c2-theme-font-size-md)');
    write(maps,schema,changed,'theme-control-icon-size-'+size,'var(--qxframe9a7c2-theme-control-font-size-'+size+')');
  }
  write(maps,schema,changed,'theme-button-spinner-border','1px');
  write(maps,schema,changed,'typography-body-size','var(--qxframe9a7c2-theme-font-size-md)');
  write(maps,schema,changed,'typography-meta-size','var(--qxframe9a7c2-theme-font-size-xs)');
  write(maps,schema,changed,'typography-heading-size','var(--qxframe9a7c2-theme-font-size-lg)');
  write(maps,schema,changed,'typography-kpi-size','calc(var(--qxframe9a7c2-theme-font-size-xl) * 2)');
  write(maps,schema,changed,'typography-label-weight','500');
  write(maps,schema,changed,'typography-body-weight','400');
  const slots={
    'choice-radio-radius':shape(config,'choice','var(--qxframe9a7c2-theme-radius-circle)'),
    'choice-checkbox-radius':shape(config,'choice','var(--qxframe9a7c2-theme-radius-sm)'),
    'compact-shape-radius':shape(config,'compact','var(--qxframe9a7c2-theme-radius-pill)'),
    'identity-shape-radius':shape(config,'identity','var(--qxframe9a7c2-theme-radius-circle)'),
    'range-progress-radius':shape(config,'range','var(--qxframe9a7c2-theme-radius-pill)')
  };
  for(const [slot,value] of Object.entries(slots))write(maps,schema,changed,slot,value);
  for(const family of ['toggle','range']){
    const names=family==='toggle'?['switch-track-radius','switch-thumb-radius']:['slider-rail-radius','slider-handle-radius'];
    if(config.shape[family]!=='intrinsic')for(const name of names)write(maps,schema,changed,name,shape(config,family,'0'));
  }
  // Ordinary rectangular options always follow the scale, even in a pill Style.
  write(maps,schema,changed,'menu-item-radius','var(--qxframe9a7c2-theme-radius-sm)');
  write(maps,schema,changed,'item-radius','var(--qxframe9a7c2-theme-radius-sm)');
  write(maps,schema,changed,'card-font-size','var(--qxframe9a7c2-typography-body-size)');
  write(maps,schema,changed,'card-border-width',['elevated','borderless'].includes(config.surface)?'0':'1px');
  if(['outlined','borderless'].includes(config.surface))write(maps,schema,changed,'card-shadow','none');
  if(config.surface==='elevated')write(maps,schema,changed,'card-shadow','0 var(--qxframe9a7c2-theme-space-2) var(--qxframe9a7c2-theme-space-6) var(--qxframe9a7c2-theme-color-card-shadow-2)');
  scaleDimensions(maps,schema,config);
  // A compound control needs two borders plus equal insets around Body line height.
  const minimum=Math.ceil((config.typography.baseSize*1.35+4+4*config.foundation.sizeScale)/2)*2;
  for(const mode of ['light','dark'])for(const size of sizes){
    const key=prefix+'theme-control-height-'+size,value=maps[mode][key];
    const match=/^(?:calc\()?([0-9.]+)rem(?: \* ([0-9.]+)\))?$/.exec(value);
    if(match&&Number(match[1])*16*Number(match[2]||1)<minimum)maps[mode][key]=String(minimum/16)+'rem';
  }
}
function resolveMenu(maps,mode,menu){
  const get=name=>parseColor(maps[mode][prefix+'theme-'+name]);
  const surface=get(mode+'-surface'),neutral=get(mode+'-surface-muted'),text=get(mode+'-text');
  const inverse=get((mode==='light'?'dark':'light')+'-surface'),inverseText=get((mode==='light'?'dark':'light')+'-text');
  const brand=get(mode==='light'?'primary-7':'primary-9');
  const onBrand=chooseOnColor(brand).color;
  const bg={normal:surface,neutral,inverse,brand}[menu.scheme];
  const fg={normal:text,neutral:text,inverse:inverseText,brand:onBrand}[menu.scheme];
  const mix=(a,b,amount)=>mixSrgb(a,b,amount);
  const tone=mix(bg,fg,0.86),strong=mix(bg,fg,0.7);
  const ink=contrastRatio(brand,bg)>=4.5?brand:mix(bg,fg,0.08);
  let selected=menu.scheme==='brand'||menu.scheme==='inverse'?tone:mixOklab(brand,bg,0.12),selectedFg=ink,indicator='transparent';
  if(menu.accentStyle==='text'){selected=bg;}
  if(menu.accentStyle==='indicator'){selected=bg;indicator=ink;}
  if(menu.accentStyle==='solid'){
    // Brand on Brand must retain a separate active surface with reliable foreground.
    selected=menu.scheme==='brand'?fg:brand;
    selectedFg=menu.scheme==='brand'?bg:onBrand;
  }
  if(menu.accentStyle==='neutral'){selected=strong;selectedFg=fg;}
  if(menu.accentStyle==='accent'){selected=menu.scheme==='brand'?tone:mixOklab(brand,neutral,0.08);indicator=ink;}
  if(contrastRatio(selected,selectedFg)<4.5)selectedFg=contrastRatio(selected,fg)>=4.5?fg:chooseOnColor(selected).color;
  const expanded=menu.expand==='minimal'?bg:menu.expand==='inherited'?mix(bg,selected,0.55):tone;
  return {background:bg,text:fg,hover:tone,selected,selectedText:selectedFg,selectedHover:mix(selected,selectedFg,0.94),indicator,expanded,expandedText:fg,group:menu.expand==='grouped'?tone:bg};
}
function applyMenuRecipe(maps,schema,config,changed){
  const resolved={light:resolveMenu(maps,'light',config.components.menu),dark:resolveMenu(maps,'dark',config.components.menu)};
  for(const key of Object.keys(resolved.light))write(maps,schema,changed,'menu-recipe-'+key.replace(/[A-Z]/g,x=>'-'+x.toLowerCase()),colorToCss(resolved.light[key]),colorToCss(resolved.dark[key]));
}
export {applyVisualFoundation,applyMenuRecipe,resolveMenu};
