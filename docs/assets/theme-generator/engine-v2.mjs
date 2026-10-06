import {generateSemanticTheme,RULE_VERSION} from './semantic-engine.mjs';
import {normalizeGeometryConfig,GEOMETRY_RULE_VERSION,GEOMETRY_ROLES} from './geometry-engine-v2.mjs';
import {normalizeStyleConfig,STYLE_RULE_VERSION,STYLE_ROLES} from './style-engine-v2.mjs';

const PREFIX='--qxframe9a7c2-theme-v2-';
const has=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));

function sparseSection(source,resolved){
  if(!source||typeof source!=='object'||Array.isArray(source))return undefined;
  const result={};
  for(const key of Object.keys(source))if(has(resolved,key))result[key]=resolved[key];
  return Object.keys(result).length?result:undefined;
}

function normalizeIntent(input,resolved){
  const intent={schema:2,rules:RULE_VERSION,geometryRules:GEOMETRY_RULE_VERSION,styleRules:STYLE_RULE_VERSION,style:resolved.style};
  if(has(input,'name'))intent.name=resolved.name;
  for(const mode of ['light','dark']){
    const colors=sparseSection(input.colors?.[mode],resolved.colors[mode]);
    const overrides=sparseSection(input.overrides?.[mode],resolved.overrides[mode]);
    if(colors)(intent.colors??={})[mode]=colors;
    if(overrides)(intent.overrides??={})[mode]=overrides;
  }
  const options=sparseSection(input.options,resolved.options);if(options)intent.options=options;
  const geometry=sparseSection(input.geometry,resolved.geometry);if(geometry)intent.geometry=geometry;
  if(input.appearance&&typeof input.appearance==='object'&&!Array.isArray(input.appearance)){
    const appearance={};
    for(const key of Object.keys(input.appearance)){
      if(key==='shape'){
        const shape=sparseSection(input.appearance.shape,resolved.appearance.shape);if(shape)appearance.shape=shape;
      }else if(has(resolved.appearance,key))appearance[key]=resolved.appearance[key];
    }
    if(Object.keys(appearance).length)intent.appearance=appearance;
  }
  return intent;
}

function declarations(values){
  return Object.entries(values).map(([key,value])=>'  '+PREFIX+key+': '+value+';').join('\n');
}
function modeValues(config,mode){
  return Object.fromEntries(Object.entries(config.colors[mode]).concat(Object.entries(config.overrides[mode]).map(([key,value])=>['override-'+key,value])));
}

export function generateThemeV2(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Configuration must be an object');
  const {options,geometry,geometryRules,appearance,styleRules,...semantic}=input;
  if(geometryRules!==undefined&&geometryRules!==GEOMETRY_RULE_VERSION)throw new TypeError('Unsupported geometry rules');
  if(styleRules!==undefined&&styleRules!==STYLE_RULE_VERSION)throw new TypeError('Unsupported style rules');
  const colors=generateSemanticTheme(semantic);
  const visual=normalizeStyleConfig({style:colors.config.style,appearance});
  const md=normalizeGeometryConfig({style:colors.config.style,options,geometry,textStyle:visual.appearance.textStyle});
  const resolved={...colors.config,geometryRules:GEOMETRY_RULE_VERSION,styleRules:STYLE_RULE_VERSION,...md,appearance:visual.appearance};
  const root={...modeValues(colors.config,'light'),...md.geometry,...visual.style};
  const dark=modeValues(colors.config,'dark');
  const css='/* QXFRAME Theme; Style is compile-time recipe metadata only. */\n'+
    ':root {\n'+declarations(root)+'\n}\n'+
    '.dark {\n'+declarations(dark)+'\n}\n';
  const intent=normalizeIntent(input,resolved);
  return {intent,config:resolved,css,statistics:{...colors.statistics,geometryNames:GEOMETRY_ROLES.length,geometryDeclarations:GEOMETRY_ROLES.length,styleNames:STYLE_ROLES.length,styleDeclarations:STYLE_ROLES.length},rules:{color:RULE_VERSION,geometry:GEOMETRY_RULE_VERSION,style:STYLE_RULE_VERSION}};
}
export function serializeThemeV2(input={}){return JSON.stringify(generateThemeV2(input).intent,null,2)+'\n';}
export function parseThemeV2(text){if(typeof text!=='string'||text.length>1000000)throw new TypeError('Invalid configuration text');return generateThemeV2(JSON.parse(text));}
