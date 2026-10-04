// Build/Studio only. Runtime visual authority remains CSS.
export const STYLE_RULE_VERSION='qx-style-2';
export const TYPOGRAPHY_PROFILES=Object.freeze(['compact','standard','roomy']);
export const TEXT_STYLE_PROFILES=Object.freeze(['standard','editorial']);
export const BODY_FONTS=Object.freeze(['system-ui','inter','humanist','serif']);
export const HEADING_FONTS=Object.freeze(['inherit','system-ui','inter','humanist','serif']);
export const MONO_FONTS=Object.freeze(['ui-monospace','system-mono']);
export const BORDER_PROFILES=Object.freeze(['hairline','standard','strong']);
export const SHADOW_PROFILES=Object.freeze(['none','xs','sm','md','elevated']);
export const MOTION_PROFILES=Object.freeze(['none','snappy','standard','relaxed']);
export const SURFACE_PROFILES=Object.freeze(['default','outlined','elevated','borderless']);
export const SHAPE_POLICIES=Object.freeze(['follow','intrinsic','square']);
export const SHAPE_FAMILIES=Object.freeze(['choice','toggle','range','compact','identity']);

const FONT=Object.freeze({
  'system-ui':'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  humanist:'"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  serif:'Georgia, "Times New Roman", serif'
});
const MONO=Object.freeze({'ui-monospace':'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace','system-mono':'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace'});
const TYPE=Object.freeze({compact:['.75rem','.75rem','.875rem','1.75rem'],standard:['.875rem','.75rem','1rem','2.25rem'],roomy:['1rem','.875rem','1.125rem','2.5rem']});
const TEXT_STYLE=Object.freeze({
  standard:{controlWeight:'500',controlTracking:'normal',controlTransform:'none',headingTracking:'normal',headingTransform:'none'},
  editorial:{controlWeight:'600',controlTracking:'.1em',controlTransform:'uppercase',headingTracking:'.05em',headingTransform:'uppercase'}
});
const BORDER=Object.freeze({hairline:'1px',standard:'.125rem',strong:'.25rem'});
const MOTION=Object.freeze({none:['0ms','0ms','0ms','0ms'],snappy:['90ms','140ms','180ms','280ms'],standard:['100ms','150ms','200ms','300ms'],relaxed:['180ms','240ms','320ms','480ms']});
const SHADOW=Object.freeze({none:'none',xs:'var(--qxframe9a7c2-theme-v2-shadow-xs)',sm:'var(--qxframe9a7c2-theme-v2-shadow-sm)',md:'var(--qxframe9a7c2-theme-v2-shadow-md)',elevated:'var(--qxframe9a7c2-theme-v2-shadow-elevated)'});
const DEFAULT_SHAPE=Object.freeze({choice:'intrinsic',toggle:'intrinsic',range:'intrinsic',compact:'follow',identity:'intrinsic'});
const R='var(--qxframe9a7c2-theme-v2-radius-control-md)';

// Source-backed defaults. Sera editorial values come directly from pinned
// .cn-button/.cn-card-title excerpts; no uppercase transformation is invented
// for the other Styles.
export const STYLE_APPEARANCE=Object.freeze({
  vega:{typography:'standard',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'xs',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']},
  nova:{typography:'standard',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']},
  maia:{typography:'standard',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.5rem',toggle:['100rem','50%'],range:[R,R]},
  lyra:{typography:'compact',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['0','0'],range:['0','0']},
  mira:{typography:'compact',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:[R,R]},
  luma:{typography:'standard',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'md',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:['100rem','100rem'],range:['100rem','100rem']},
  sera:{typography:'compact',textStyle:'editorial',fontHeading:'serif',border:'hairline',shadow:'sm',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.25rem',cardMetaGap:'.375rem',toggle:['0','0'],range:['0','0']},
  rhea:{typography:'standard',textStyle:'standard',fontHeading:'inherit',border:'hairline',shadow:'sm',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:[R,R],range:[R,R]}
});
for(const profile of Object.values(STYLE_APPEARANCE))Object.freeze(profile);

export const STYLE_ROLES=Object.freeze([
  'font-family','font-family-heading','font-family-mono','typography-body-size','typography-meta-size','typography-heading-size','typography-kpi-size','typography-body-weight','typography-label-weight',
  'control-font-weight','control-letter-spacing','control-text-transform','heading-letter-spacing','heading-text-transform',
  'border-width','card-border-width','card-shadow','card-font-size','card-title-delta','card-meta-gap','motion-duration-1','motion-duration-2','motion-duration-3','motion-duration-5',
  'shape-choice-radio-radius','shape-choice-checkbox-radius','shape-toggle-track-radius','shape-toggle-thumb-radius','shape-range-track-radius','shape-range-thumb-radius','shape-compact-radius','shape-identity-radius','shape-progress-radius'
]);
function plain(v,n){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw new TypeError(n+' must be a plain object');}
function pick(v,a,n){if(!a.includes(v))throw new TypeError('Unknown '+n+': '+v);return v;}
function shape(p,intrinsic,follow){return p==='square'?'0':p==='follow'?follow:intrinsic;}

export function normalizeStyleConfig({style='vega',appearance={}}={}){
  const p=STYLE_APPEARANCE[style];if(!p)throw new TypeError('Unknown Style');plain(appearance,'appearance');
  const known=new Set(['typography','textStyle','fontBody','fontHeading','fontMono','border','shadow','motion','surface','shape']);for(const k of Object.keys(appearance))if(!known.has(k))throw new TypeError('Unknown appearance option: '+k);
  const a={typography:pick(appearance.typography??p.typography,TYPOGRAPHY_PROFILES,'typography'),textStyle:pick(appearance.textStyle??p.textStyle,TEXT_STYLE_PROFILES,'text style'),fontBody:pick(appearance.fontBody??'system-ui',BODY_FONTS,'body font'),fontHeading:pick(appearance.fontHeading??p.fontHeading,HEADING_FONTS,'heading font'),fontMono:pick(appearance.fontMono??'ui-monospace',MONO_FONTS,'mono font'),border:pick(appearance.border??p.border,BORDER_PROFILES,'border'),shadow:pick(appearance.shadow??p.shadow,SHADOW_PROFILES,'shadow'),motion:pick(appearance.motion??p.motion,MOTION_PROFILES,'motion'),surface:pick(appearance.surface??p.surface,SURFACE_PROFILES,'surface'),shape:{...DEFAULT_SHAPE,...(appearance.shape??{})}};
  plain(a.shape,'appearance.shape');for(const k of Object.keys(a.shape))if(!SHAPE_FAMILIES.includes(k))throw new TypeError('Unknown shape family: '+k);for(const k of SHAPE_FAMILIES)pick(a.shape[k],SHAPE_POLICIES,'shape.'+k);
  const t=TYPE[a.typography],text=TEXT_STYLE[a.textStyle],m=MOTION[a.motion],body=FONT[a.fontBody],heading=a.fontHeading==='inherit'?body:FONT[a.fontHeading],border=BORDER[a.border];
  const cardBorder=['elevated','borderless'].includes(a.surface)?'0':border,cardShadow=['outlined','borderless'].includes(a.surface)?'none':a.surface==='elevated'?SHADOW.elevated:SHADOW[a.shadow];
  return {appearance:a,style:{
    'font-family':body,'font-family-heading':heading,'font-family-mono':MONO[a.fontMono],
    'typography-body-size':t[0],'typography-meta-size':t[1],'typography-heading-size':t[2],'typography-kpi-size':t[3],'typography-body-weight':'400','typography-label-weight':'500',
    'control-font-weight':text.controlWeight,'control-letter-spacing':text.controlTracking,'control-text-transform':text.controlTransform,'heading-letter-spacing':text.headingTracking,'heading-text-transform':text.headingTransform,
    'border-width':border,'card-border-width':cardBorder,'card-shadow':cardShadow,'card-font-size':p.cardFont,'card-title-delta':p.cardTitleDelta,'card-meta-gap':p.cardMetaGap,
    'motion-duration-1':m[0],'motion-duration-2':m[1],'motion-duration-3':m[2],'motion-duration-5':m[3],
    'shape-choice-radio-radius':shape(a.shape.choice,'50%','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-choice-checkbox-radius':shape(a.shape.choice,'var(--qxframe9a7c2-theme-v2-radius-choice-md)','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-toggle-track-radius':shape(a.shape.toggle,p.toggle[0],R),'shape-toggle-thumb-radius':shape(a.shape.toggle,p.toggle[1],R),
    'shape-range-track-radius':shape(a.shape.range,p.range[0],R),'shape-range-thumb-radius':shape(a.shape.range,p.range[1],R),
    'shape-compact-radius':shape(a.shape.compact,'100rem',R),'shape-identity-radius':shape(a.shape.identity,'50%',R),'shape-progress-radius':shape(a.shape.range,'100rem',R)
  }};
}
