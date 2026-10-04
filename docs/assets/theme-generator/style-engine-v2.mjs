// Build/Studio only. Runtime visual authority remains CSS.
export const STYLE_RULE_VERSION='qx-style-1';
export const TYPOGRAPHY_PROFILES=Object.freeze(['compact','standard','roomy']);
export const BODY_FONTS=Object.freeze(['system-ui','inter','humanist','serif']);
export const HEADING_FONTS=Object.freeze(['inherit','system-ui','inter','humanist','serif']);
export const MONO_FONTS=Object.freeze(['ui-monospace','system-mono']);
export const BORDER_PROFILES=Object.freeze(['hairline','standard','strong']);
export const SHADOW_PROFILES=Object.freeze(['none','subtle','soft','elevated']);
export const MOTION_PROFILES=Object.freeze(['none','snappy','standard','relaxed']);
export const SURFACE_PROFILES=Object.freeze(['default','outlined','elevated','borderless']);
export const SHAPE_POLICIES=Object.freeze(['follow','intrinsic','square']);
export const SHAPE_FAMILIES=Object.freeze(['choice','toggle','range','compact','identity']);

const FONT_STACKS=Object.freeze({
  'system-ui':'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  humanist:'"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  serif:'Georgia, "Times New Roman", serif'
});
const MONO_STACKS=Object.freeze({
  'ui-monospace':'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'system-mono':'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace'
});
const TYPOGRAPHY=Object.freeze({
  compact:Object.freeze({body:'.75rem',meta:'.75rem',heading:'.875rem',kpi:'1.75rem'}),
  standard:Object.freeze({body:'.875rem',meta:'.75rem',heading:'1rem',kpi:'2.25rem'}),
  roomy:Object.freeze({body:'1rem',meta:'.875rem',heading:'1.125rem',kpi:'2.5rem'})
});
const BORDER=Object.freeze({hairline:'1px',standard:'.125rem',strong:'.25rem'});
const MOTION=Object.freeze({
  none:Object.freeze(['0ms','0ms','0ms','0ms']),
  snappy:Object.freeze(['90ms','140ms','180ms','280ms']),
  standard:Object.freeze(['100ms','150ms','200ms','300ms']),
  relaxed:Object.freeze(['180ms','240ms','320ms','480ms'])
});
const SHADOW=Object.freeze({
  none:'none',
  subtle:'var(--qxframe9a7c2-theme-v2-shadow-subtle)',
  soft:'var(--qxframe9a7c2-theme-v2-shadow-soft)',
  elevated:'var(--qxframe9a7c2-theme-v2-shadow-elevated)'
});
const DEFAULT_SHAPE=Object.freeze({choice:'intrinsic',toggle:'intrinsic',range:'intrinsic',compact:'follow',identity:'intrinsic'});

// Defaults port the already-accepted Visual Recipe character; v1.5 owns the output contract.
export const STYLE_APPEARANCE=Object.freeze({
  vega:Object.freeze({typography:'standard',border:'hairline',shadow:'subtle',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']}),
  nova:Object.freeze({typography:'standard',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']}),
  maia:Object.freeze({typography:'standard',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.5rem',toggle:['100rem','50%'],range:['var(--qxframe9a7c2-theme-v2-radius-control-md)','var(--qxframe9a7c2-theme-v2-radius-control-md)']}),
  lyra:Object.freeze({typography:'compact',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['0','0'],range:['0','0']}),
  mira:Object.freeze({typography:'compact',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['var(--qxframe9a7c2-theme-v2-radius-control-md)','var(--qxframe9a7c2-theme-v2-radius-control-md)']}),
  luma:Object.freeze({typography:'standard',border:'hairline',shadow:'soft',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:['100rem','100rem'],range:['100rem','100rem']}),
  sera:Object.freeze({typography:'compact',border:'hairline',shadow:'subtle',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.25rem',cardMetaGap:'.375rem',toggle:['0','0'],range:['0','0']}),
  rhea:Object.freeze({typography:'standard',border:'hairline',shadow:'subtle',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:['var(--qxframe9a7c2-theme-v2-radius-control-md)','var(--qxframe9a7c2-theme-v2-radius-control-md)'],range:['var(--qxframe9a7c2-theme-v2-radius-control-md)','var(--qxframe9a7c2-theme-v2-radius-control-md)']})
});

export const STYLE_ROLES=Object.freeze([
  'font-family','font-family-heading','font-family-mono','typography-body-size','typography-meta-size','typography-heading-size','typography-kpi-size','typography-body-weight','typography-label-weight',
  'border-width','card-border-width','card-shadow','card-font-size','card-title-delta','card-meta-gap',
  'motion-duration-1','motion-duration-2','motion-duration-3','motion-duration-5',
  'shape-choice-radio-radius','shape-choice-checkbox-radius','shape-toggle-track-radius','shape-toggle-thumb-radius','shape-range-track-radius','shape-range-thumb-radius','shape-compact-radius','shape-identity-radius','shape-progress-radius'
]);

function plain(value,label){if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError(label+' must be a plain object');}
function pick(value,choices,label){if(!choices.includes(value))throw new TypeError('Unknown '+label+': '+value);return value;}
function shapeValue(policy,intrinsic,follow){return policy==='square'?'0':policy==='follow'?follow:intrinsic;}
export function normalizeStyleConfig({style='vega',appearance={}}={}){
  const profile=STYLE_APPEARANCE[style];if(!profile)throw new TypeError('Unknown Style');plain(appearance,'appearance');
  const known=new Set(['typography','fontBody','fontHeading','fontMono','border','shadow','motion','surface','shape']);for(const key of Object.keys(appearance))if(!known.has(key))throw new TypeError('Unknown appearance option: '+key);
  const selected={
    typography:pick(appearance.typography??profile.typography,TYPOGRAPHY_PROFILES,'typography'),
    fontBody:pick(appearance.fontBody??'system-ui',BODY_FONTS,'body font'),
    fontHeading:pick(appearance.fontHeading??'inherit',HEADING_FONTS,'heading font'),
    fontMono:pick(appearance.fontMono??'ui-monospace',MONO_FONTS,'mono font'),
    border:pick(appearance.border??profile.border,BORDER_PROFILES,'border'),
    shadow:pick(appearance.shadow??profile.shadow,SHADOW_PROFILES,'shadow'),
    motion:pick(appearance.motion??profile.motion,MOTION_PROFILES,'motion'),
    surface:pick(appearance.surface??profile.surface,SURFACE_PROFILES,'surface'),
    shape:{...DEFAULT_SHAPE,...(appearance.shape??{})}
  };
  plain(selected.shape,'appearance.shape');for(const family of Object.keys(selected.shape))if(!SHAPE_FAMILIES.includes(family))throw new TypeError('Unknown shape family: '+family);for(const family of SHAPE_FAMILIES)pick(selected.shape[family],SHAPE_POLICIES,'shape.'+family);
  const typography=TYPOGRAPHY[selected.typography],motion=MOTION[selected.motion],body=FONT_STACKS[selected.fontBody],heading=selected.fontHeading==='inherit'?body:FONT_STACKS[selected.fontHeading];
  const border=BORDER[selected.border],surfaceBorder=['elevated','borderless'].includes(selected.surface)?'0':border,cardShadow=['outlined','borderless'].includes(selected.surface)?'none':selected.surface==='elevated'?SHADOW.elevated:SHADOW[selected.shadow];
  const values={
    'font-family':body,'font-family-heading':heading,'font-family-mono':MONO_STACKS[selected.fontMono],
    'typography-body-size':typography.body,'typography-meta-size':typography.meta,'typography-heading-size':typography.heading,'typography-kpi-size':typography.kpi,'typography-body-weight':'400','typography-label-weight':'500',
    'border-width':border,'card-border-width':surfaceBorder,'card-shadow':cardShadow,'card-font-size':profile.cardFont,'card-title-delta':profile.cardTitleDelta,'card-meta-gap':profile.cardMetaGap,
    'motion-duration-1':motion[0],'motion-duration-2':motion[1],'motion-duration-3':motion[2],'motion-duration-5':motion[3],
    'shape-choice-radio-radius':shapeValue(selected.shape.choice,'50%','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-choice-checkbox-radius':shapeValue(selected.shape.choice,'var(--qxframe9a7c2-theme-v2-radius-choice-md)','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-toggle-track-radius':shapeValue(selected.shape.toggle,profile.toggle[0],'var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-toggle-thumb-radius':shapeValue(selected.shape.toggle,profile.toggle[1],'var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-range-track-radius':shapeValue(selected.shape.range,profile.range[0],'var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-range-thumb-radius':shapeValue(selected.shape.range,profile.range[1],'var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-compact-radius':shapeValue(selected.shape.compact,'100rem','var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-identity-radius':shapeValue(selected.shape.identity,'50%','var(--qxframe9a7c2-theme-v2-radius-control-md)'),
    'shape-progress-radius':shapeValue(selected.shape.range,'100rem','var(--qxframe9a7c2-theme-v2-radius-control-md)')
  };
  return {appearance:selected,style:values};
}
