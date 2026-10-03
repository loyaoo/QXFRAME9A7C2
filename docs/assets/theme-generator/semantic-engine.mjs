// Build/Studio tooling only. Production components never import this module.
import {parseColor} from './color-engine.mjs';

export const SEMANTIC_SCHEMA = 2;
export const RULE_VERSION = 'shadcn-295a1f11-qx-1';
export const SEMANTIC_STYLES = Object.freeze(['vega','nova','maia','lyra','mira','luma','sera','rhea']);
export const CORE_ROLES = Object.freeze(['background','foreground','card','card-foreground','popover','popover-foreground','primary','primary-foreground','secondary','secondary-foreground','muted','muted-foreground','accent','accent-foreground','success','success-foreground','warning','warning-foreground','error','error-foreground','info','info-foreground','border','input','ring','mask','inverse','inverse-foreground']);
export const OPTIONAL_ROLES = Object.freeze(['sidebar','sidebar-foreground','sidebar-primary','sidebar-primary-foreground','sidebar-accent','sidebar-accent-foreground','sidebar-border','sidebar-ring','chart-1','chart-2','chart-3','chart-4','chart-5','shadow-color']);
export const OVERRIDE_ROLES = Object.freeze(['action-background','action-hover-background','action-foreground','control-background','control-border','control-foreground','surface-background','surface-foreground','popup-background','popup-foreground','navigation-highlight-background','navigation-highlight-foreground']);
const prefix = '--qxframe9a7c2-theme-v2-';
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const own = (value,keys,label) => { if(!plain(value))throw new TypeError(label+' must be an object');for(const key of Object.keys(value))if(!keys.includes(key))throw new TypeError('Unknown '+label+' key: '+key); };

// Reference colors are inputs, never an attempt to synthesize a role from one seed.
export const REFERENCE_COLORS = Object.freeze({
  light:Object.freeze({background:'oklch(1 0 0)',foreground:'oklch(.145 0 0)',card:'oklch(1 0 0)','card-foreground':'oklch(.145 0 0)',popover:'oklch(1 0 0)','popover-foreground':'oklch(.145 0 0)',primary:'rgb(37 99 235)','primary-foreground':'rgb(255 255 255)',secondary:'oklch(.97 0 0)','secondary-foreground':'oklch(.205 0 0)',muted:'oklch(.97 0 0)','muted-foreground':'oklch(.556 0 0)',accent:'oklch(.97 0 0)','accent-foreground':'oklch(.205 0 0)',success:'rgb(22 163 74)','success-foreground':'rgb(255 255 255)',warning:'rgb(245 158 11)','warning-foreground':'rgb(23 23 23)',error:'oklch(.577 .245 27.325)','error-foreground':'rgb(255 255 255)',info:'rgb(8 145 178)','info-foreground':'rgb(255 255 255)',border:'oklch(.922 0 0)',input:'oklch(.922 0 0)',ring:'oklch(.708 0 0)',mask:'rgb(0 0 0 / .1)',inverse:'oklch(.205 0 0)','inverse-foreground':'oklch(.985 0 0)'}),
  dark:Object.freeze({background:'oklch(.145 0 0)',foreground:'oklch(.985 0 0)',card:'oklch(.205 0 0)','card-foreground':'oklch(.985 0 0)',popover:'oklch(.205 0 0)','popover-foreground':'oklch(.985 0 0)',primary:'rgb(96 165 250)','primary-foreground':'rgb(23 23 23)',secondary:'oklch(.269 0 0)','secondary-foreground':'oklch(.985 0 0)',muted:'oklch(.269 0 0)','muted-foreground':'oklch(.708 0 0)',accent:'oklch(.269 0 0)','accent-foreground':'oklch(.985 0 0)',success:'rgb(74 222 128)','success-foreground':'rgb(23 23 23)',warning:'rgb(251 191 36)','warning-foreground':'rgb(23 23 23)',error:'oklch(.704 .191 22.216)','error-foreground':'rgb(23 23 23)',info:'rgb(34 211 238)','info-foreground':'rgb(23 23 23)',border:'rgb(255 255 255 / .1)',input:'rgb(255 255 255 / .15)',ring:'oklch(.556 0 0)',mask:'rgb(0 0 0 / .1)',inverse:'oklch(.985 0 0)','inverse-foreground':'oklch(.205 0 0)'})
});
const MASK_ALPHA = Object.freeze({vega:.1,nova:.1,maia:.8,lyra:.1,mira:.1,luma:.3,sera:.2,rhea:.3});
function color(value,label){
  if(typeof value!=='string'||value.length>180||/[;{}<>]|\b(?:var|url|env|light-dark|color-mix)\s*\(/i.test(value))throw new TypeError(label+' must be an independent complete color');
  const text=value.trim().toLowerCase();
  if(!/^(?:black|white|transparent|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/.test(text)){
    const call=text.match(/^(?:rgba?|hsla?|oklab|oklch|color)\((.*)\)$/);
    if(!call)throw new TypeError(label+' uses unsupported complete-color syntax');
    const args=call[1].replace(/^srgb\s+/,'').split(/[\s,/]+/).filter(Boolean);
    if(args.some(v=>!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:%|deg|grad|rad|turn)?$/.test(v)||!Number.isFinite(parseFloat(v))))throw new TypeError(label+' contains invalid color channels');
  }
  // Existing parser supports numeric rgb/rgba, hex, hsl and OKLCH. Preserve the
  // original expression and alpha instead of round-tripping through sRGB.
  parseColor(value);
  return value.trim();
}
export function normalizeSemanticConfig(input={}){
  own(input,['schema','rules','name','style','colors','overrides'],'configuration');
  if(input.schema!==undefined&&input.schema!==2)throw new TypeError('Use migrateLegacySemanticColors for schema 1; migration must report losses');
  if(input.rules!==undefined&&input.rules!==RULE_VERSION)throw new TypeError('Unsupported semantic rule version');
  const style=input.style??'vega';if(!SEMANTIC_STYLES.includes(style))throw new TypeError('Unknown Style: '+style);
  const name=input.name??'qx-semantic-theme';if(typeof name!=='string'||name.length>100)throw new TypeError('Invalid theme name');
  const colors={},overrides={};own(input.colors??{},['light','dark'],'colors');own(input.overrides??{},['light','dark'],'overrides');
  for(const mode of ['light','dark']){
    const values=input.colors?.[mode]??{},custom=input.overrides?.[mode]??{};
    own(values,[...CORE_ROLES,...OPTIONAL_ROLES],mode+' colors');own(custom,OVERRIDE_ROLES,mode+' overrides');
    colors[mode]={...REFERENCE_COLORS[mode],mask:'rgb(0 0 0 / '+MASK_ALPHA[style]+')'};
    for(const [key,value]of Object.entries(values))colors[mode][key]=color(value,key);
    overrides[mode]=Object.fromEntries(Object.entries(custom).map(([key,value])=>[key,color(value,key)]));
  }
  return {schema:2,rules:RULE_VERSION,name,style,colors,overrides};
}
export function generateSemanticTheme(input={}){
  const config=normalizeSemanticConfig(input);
  const declarations=mode=>Object.entries(config.colors[mode]).concat(Object.entries(config.overrides[mode]).map(([key,value])=>['override-'+key,value])).map(([key,value])=>'  '+prefix+key+': '+value+';').join('\n');
  // Complete colors are declared at mode boundaries. The framework owns Style
  // rule branches, so the export contains no component or private result matrix.
  const css='/* QXFRAME semantic schema 2; '+RULE_VERSION+' */\n'+
    '[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-theme="light"] {\n'+declarations('light')+'\n}\n'+
    '[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-theme="dark"] {\n'+declarations('dark')+'\n}\n';
  return {config,css,statistics:{colorNames:new Set(Object.values(config.colors).flatMap(v=>Object.keys(v))).size,colorDeclarations:Object.values(config.colors).reduce((n,v)=>n+Object.keys(v).length,0),overrideDeclarations:Object.values(config.overrides).reduce((n,v)=>n+Object.keys(v).length,0)}};
}
export function migrateLegacySemanticColors(legacy){
  if(!plain(legacy))throw new TypeError('Legacy values must be an object');
  const colors={light:{},dark:{}},unmapped=[];
  for(const [name,value]of Object.entries(legacy)){
    const match=name.match(/^(light|dark)\.(.+)$/);
    if(!match||!CORE_ROLES.includes(match[2])){unmapped.push({name,value,reason:'No reviewed semantic mapping; size/state/palette matrices are not silently imported'});continue;}
    colors[match[1]][match[2]]=color(typeof value==='string'&&/^\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*$/.test(value)?'rgb('+value+')':value,name);
  }
  return {config:normalizeSemanticConfig({colors}),unmapped};
}
