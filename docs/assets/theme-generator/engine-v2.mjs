import {generateSemanticTheme,RULE_VERSION} from './semantic-engine.mjs';
import {normalizeGeometryConfig,GEOMETRY_RULE_VERSION,GEOMETRY_ROLES} from './geometry-engine-v2.mjs';
import {normalizeStyleConfig,STYLE_RULE_VERSION,STYLE_ROLES} from './style-engine-v2.mjs';

export function generateThemeV2(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Configuration must be an object');
  const {options,geometry,geometryRules,appearance,styleRules,...semantic}=input;
  if(geometryRules!==undefined&&geometryRules!==GEOMETRY_RULE_VERSION)throw new TypeError('Unsupported geometry rules');
  if(styleRules!==undefined&&styleRules!==STYLE_RULE_VERSION)throw new TypeError('Unsupported style rules');
  const colors=generateSemanticTheme(semantic);
  const visual=normalizeStyleConfig({style:colors.config.style,appearance});
  const md=normalizeGeometryConfig({style:colors.config.style,options,geometry,textStyle:visual.appearance.textStyle});
  // Static Style recipes are defaults. Explicit generated Theme inputs must win
  // when the same element is also the Style scope root. Keep the ordinary
  // [data-theme] selector for nested mode boundaries, and add a stronger same-root
  // selector for Style roots instead of relying on source order/scoping proximity.
  const selector='html:root, :root[data-qxframe9a7c2-style], [data-qxframe9a7c2-theme], [data-qxframe9a7c2-theme][data-qxframe9a7c2-style]';
  const css=colors.css+
    '/* Fixed CSS geometry '+GEOMETRY_RULE_VERSION+'; md inputs only */\n'+selector+' {\n'+GEOMETRY_ROLES.map(role=>'  --qxframe9a7c2-theme-v2-'+role+': '+md.geometry[role]+';').join('\n')+'\n}\n'+
    '/* Finite non-color Style '+STYLE_RULE_VERSION+'; no size/state matrix */\n'+selector+' {\n'+STYLE_ROLES.map(role=>'  --qxframe9a7c2-theme-v2-'+role+': '+visual.style[role]+';').join('\n')+'\n}\n';
  return {config:{...colors.config,geometryRules:GEOMETRY_RULE_VERSION,styleRules:STYLE_RULE_VERSION,...md,appearance:visual.appearance},css,statistics:{...colors.statistics,geometryNames:GEOMETRY_ROLES.length,geometryDeclarations:GEOMETRY_ROLES.length,styleNames:STYLE_ROLES.length,styleDeclarations:STYLE_ROLES.length},rules:{color:RULE_VERSION,geometry:GEOMETRY_RULE_VERSION,style:STYLE_RULE_VERSION}};
}
export function serializeThemeV2(input={}){return JSON.stringify(generateThemeV2(input).config,null,2)+'\n';}
export function parseThemeV2(text){if(typeof text!=='string'||text.length>1000000)throw new TypeError('Invalid configuration text');return generateThemeV2(JSON.parse(text));}
