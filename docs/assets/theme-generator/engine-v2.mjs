import {generateSemanticTheme,RULE_VERSION} from './semantic-engine.mjs';
import {normalizeGeometryConfig,GEOMETRY_RULE_VERSION,GEOMETRY_ROLES} from './geometry-engine-v2.mjs';

export function generateThemeV2(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Configuration must be an object');
  const {options,geometry,geometryRules,...semantic}=input;
  if(geometryRules!==undefined&&geometryRules!==GEOMETRY_RULE_VERSION)throw new TypeError('Unsupported geometry rules');
  const colors=generateSemanticTheme(semantic),md=normalizeGeometryConfig({style:colors.config.style,options,geometry});
  // Explicit Theme inputs outrank :scope Style defaults even inside a preview scope.
  const css=colors.css+'/* Fixed CSS geometry '+GEOMETRY_RULE_VERSION+'; defaults only */\n[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-theme] {\n'+GEOMETRY_ROLES.map(role=>'  --qxframe9a7c2-theme-v2-'+role+': '+md.geometry[role]+';').join('\n')+'\n}\n';
  return {config:{...colors.config,geometryRules:GEOMETRY_RULE_VERSION,...md},css,statistics:{...colors.statistics,geometryNames:GEOMETRY_ROLES.length,geometryDeclarations:GEOMETRY_ROLES.length},rules:{color:RULE_VERSION,geometry:GEOMETRY_RULE_VERSION}};
}
export function serializeThemeV2(input={}){return JSON.stringify(generateThemeV2(input).config,null,2)+'\n';}
export function parseThemeV2(text){if(typeof text!=='string'||text.length>1000000)throw new TypeError('Invalid configuration text');return generateThemeV2(JSON.parse(text));}
