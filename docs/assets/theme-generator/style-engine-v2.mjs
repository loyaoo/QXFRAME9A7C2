// Build/Studio only. Runtime visual authority remains CSS.
export const STYLE_RULE_VERSION='qx-style-3';
export const TYPOGRAPHY_PROFILES=Object.freeze(['compact','standard','roomy']);
export const TEXT_STYLE_PROFILES=Object.freeze(['standard','editorial']);
export const CONTROL_APPEARANCE_PROFILES=Object.freeze(['outline','tinted','tinted-subtle','soft','underline']);
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
// [light fill, dark fill, normal inline, normal block-start, normal block-end,
//  state inline, state block-start, state block-end]. Percentages are consumed
// by one static CSS recipe; the generator never emits component paint selectors.
const CONTROL_APPEARANCE=Object.freeze({
  outline:['0%','30%','100%','100%','100%','100%','100%','100%'],
  tinted:['30%','30%','100%','100%','100%','100%','100%','100%'],
  'tinted-subtle':['20%','30%','100%','100%','100%','100%','100%','100%'],
  soft:['50%','50%','0%','0%','0%','100%','100%','100%'],
  underline:['0%','0%','0%','0%','100%','0%','0%','100%']
});
// Neutral Action uses the same resolved appearance decision as controls. The
// recipe is expressed as source weights so the framework can recompute colors at
// the paint owner when Theme inputs are overridden locally.
const ACTION_APPEARANCE=Object.freeze({
  outline:['100%','0%','0%','30%','100%','0%','0%','50%','100%'],
  tinted:['0%','30%','0%','30%','0%','50%','0%','50%','100%'],
  'tinted-subtle':['0%','0%','0%','30%','0%','50%','0%','50%','100%'],
  soft:['100%','0%','0%','0%','100%','0%','0%','30%','100%'],
  underline:['0%','0%','0%','0%','100%','0%','0%','30%','100%']
});
const BORDER=Object.freeze({hairline:'1px',standard:'.125rem',strong:'.25rem'});
const MOTION=Object.freeze({none:['0ms','0ms','0ms','0ms'],snappy:['90ms','140ms','180ms','280ms'],standard:['100ms','150ms','200ms','300ms'],relaxed:['180ms','240ms','320ms','480ms']});
const SHADOW=Object.freeze({none:'none',xs:'var(--qxframe9a7c2-theme-v2-shadow-xs)',sm:'var(--qxframe9a7c2-theme-v2-shadow-sm)',md:'var(--qxframe9a7c2-theme-v2-shadow-md)',elevated:'var(--qxframe9a7c2-theme-v2-shadow-elevated)'});
const DEFAULT_SHAPE=Object.freeze({choice:'intrinsic',toggle:'intrinsic',range:'intrinsic',compact:'follow',identity:'intrinsic'});
const R='var(--qxframe9a7c2-theme-v2-radius-control-md)';
const SHADOW_COLOR='var(--qxframe9a7c2-theme-v2-shadow-color,var(--qxframe9a7c2-theme-v2-shadow))';
const shadowTint=alpha=>'color-mix(in oklab,'+SHADOW_COLOR+' '+alpha+'%,transparent)';
const POPUP_SHADOW=Object.freeze({
  default:'0 .25rem .5rem -.125rem '+shadowTint(10)+',0 .125rem .25rem -.125rem '+shadowTint(10),
  maia:'0 1.5rem 3rem -.75rem '+shadowTint(25),
  soft:'0 .625rem 1rem -.25rem '+shadowTint(10)+',0 .25rem .375rem -.25rem '+shadowTint(10)
});
const DIALOG_SHADOW=Object.freeze({none:'none',soft:'0 1.25rem 1.5rem -.25rem '+shadowTint(10)+',0 .5rem .625rem -.375rem '+shadowTint(10)});

// Extra source-backed paint operands that cannot be represented by the generic
// typography/appearance/shape profiles alone. They remain finite role inputs,
// not component×state×size output matrices.
const STYLE_RECIPE=Object.freeze({
  vega:{disabled:['0%','30%'],cardBorder:['10%','10%'],popupBorder:['10%','10%'],popupShadow:POPUP_SHADOW.default,dialogShadow:DIALOG_SHADOW.none,choice:['0%','30%','100%'],radio:['100%','100%','0%','100%','0%'],switchTrack:['100%','80%','0%','0%'],switchThumb:SHADOW.none,slider:['100%','0%','100%','0%','0%',SHADOW.sm],status:['10%','20%','20%','100%']},
  nova:{disabled:['50%','80%'],cardBorder:['10%','10%'],popupBorder:['10%','10%'],popupShadow:POPUP_SHADOW.default,dialogShadow:DIALOG_SHADOW.none,choice:['0%','30%','100%'],radio:['100%','100%','0%','100%','0%'],switchTrack:['100%','80%','0%','0%'],switchThumb:SHADOW.none,slider:['100%','0%','0%','100%','0%',SHADOW.none],status:['10%','20%','20%','100%']},
  maia:{disabled:['30%','30%'],cardBorder:['10%','10%'],popupBorder:['5%','10%'],popupShadow:POPUP_SHADOW.maia,dialogShadow:DIALOG_SHADOW.none,choice:['0%','30%','100%'],radio:['100%','100%','0%','100%','0%'],switchTrack:['100%','80%','0%','0%'],switchThumb:SHADOW.none,slider:['100%','0%','100%','0%','0%',SHADOW.sm],status:['10%','20%','20%','100%']},
  lyra:{disabled:['50%','80%'],cardBorder:['10%','10%'],popupBorder:['10%','10%'],popupShadow:POPUP_SHADOW.default,dialogShadow:DIALOG_SHADOW.none,choice:['0%','30%','100%'],radio:['100%','100%','0%','100%','0%'],switchTrack:['100%','80%','0%','0%'],switchThumb:SHADOW.none,slider:['100%','0%','0%','100%','0%',SHADOW.none],status:['10%','20%','20%','100%']},
  mira:{disabled:['20%','30%'],cardBorder:['10%','10%'],popupBorder:['10%','10%'],popupShadow:POPUP_SHADOW.default,dialogShadow:DIALOG_SHADOW.none,choice:['0%','30%','100%'],radio:['100%','100%','0%','100%','0%'],switchTrack:['100%','80%','0%','0%'],switchThumb:SHADOW.none,slider:['100%','0%','0%','100%','0%',SHADOW.none],status:['10%','20%','20%','100%']},
  luma:{disabled:['50%','50%'],cardBorder:['5%','10%'],popupBorder:['5%','10%'],popupShadow:POPUP_SHADOW.soft,dialogShadow:DIALOG_SHADOW.soft,choice:['90%','90%','0%'],radio:['100%','0%','0%','100%','0%'],switchTrack:['90%','90%','0%','100%'],switchThumb:SHADOW.sm,slider:['0%','90%','0%','0%','0%',SHADOW.md],status:['10%','20%','20%','100%']},
  sera:{disabled:['0%','0%'],cardBorder:['5%','5%'],popupBorder:['10%','10%'],popupShadow:POPUP_SHADOW.default,dialogShadow:POPUP_SHADOW.default,choice:['0%','0%','100%'],radio:['0%','0%','100%','0%','100%'],switchTrack:['100%','100%','50%','100%'],switchThumb:SHADOW.none,slider:['0%','50%','0%','0%','100%',SHADOW.none],status:['0%','0%','0%','70%']},
  rhea:{disabled:['50%','50%'],cardBorder:['5%','10%'],popupBorder:['5%','10%'],popupShadow:POPUP_SHADOW.soft,dialogShadow:DIALOG_SHADOW.soft,choice:['90%','90%','0%'],radio:['100%','0%','0%','100%','0%'],switchTrack:['90%','90%','0%','100%'],switchThumb:SHADOW.sm,slider:['0%','90%','0%','0%','0%',SHADOW.md],status:['10%','20%','20%','100%']}
});
for(const recipe of Object.values(STYLE_RECIPE))Object.freeze(recipe);

// Source-backed defaults. Style chooses a visible finite profile; the resolved
// profile is then fully represented in config and can be changed independently.
export const STYLE_APPEARANCE=Object.freeze({
  vega:{typography:'standard',textStyle:'standard',controlAppearance:'outline',fontHeading:'inherit',border:'hairline',shadow:'xs',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']},
  nova:{typography:'standard',textStyle:'standard',controlAppearance:'outline',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:['100rem','50%']},
  maia:{typography:'standard',textStyle:'standard',controlAppearance:'tinted',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.5rem',toggle:['100rem','50%'],range:[R,R]},
  lyra:{typography:'compact',textStyle:'standard',controlAppearance:'outline',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['0','0'],range:['0','0']},
  mira:{typography:'compact',textStyle:'standard',controlAppearance:'tinted-subtle',fontHeading:'inherit',border:'hairline',shadow:'none',motion:'standard',surface:'default',cardFont:'.75rem',cardTitleDelta:'.125rem',cardMetaGap:'.25rem',toggle:['100rem','50%'],range:[R,R]},
  luma:{typography:'standard',textStyle:'standard',controlAppearance:'soft',fontHeading:'inherit',border:'hairline',shadow:'md',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:['100rem','100rem'],range:['100rem','100rem']},
  sera:{typography:'compact',textStyle:'editorial',controlAppearance:'underline',fontHeading:'serif',border:'hairline',shadow:'sm',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.25rem',cardMetaGap:'.375rem',toggle:['0','0'],range:['0','0']},
  rhea:{typography:'standard',textStyle:'standard',controlAppearance:'soft',fontHeading:'inherit',border:'hairline',shadow:'sm',motion:'standard',surface:'default',cardFont:'.875rem',cardTitleDelta:'.125rem',cardMetaGap:'.375rem',toggle:[R,R],range:[R,R]}
});
for(const profile of Object.values(STYLE_APPEARANCE))Object.freeze(profile);

export const STYLE_ROLES=Object.freeze([
  'font-family','font-family-heading','font-family-mono','typography-body-size','typography-meta-size','typography-heading-size','typography-kpi-size','typography-body-weight','typography-label-weight',
  'control-font-weight','control-letter-spacing','control-text-transform','heading-letter-spacing','heading-text-transform',
  'control-fill-light-weight','control-fill-dark-weight','control-border-inline-weight','control-border-block-start-weight','control-border-block-end-weight','control-state-border-inline-weight','control-state-border-block-start-weight','control-state-border-block-end-weight',
  'action-outline-light-background-weight','action-outline-light-input-weight','action-outline-dark-background-weight','action-outline-dark-input-weight','action-outline-hover-light-muted-weight','action-outline-hover-light-input-weight','action-outline-hover-dark-muted-weight','action-outline-hover-dark-input-weight','action-outline-border-weight',
  'control-disabled-fill-light-weight','control-disabled-fill-dark-weight','card-border-light-weight','card-border-dark-weight','popup-border-light-weight','popup-border-dark-weight','popup-shadow','dialog-shadow',
  'choice-fill-light-weight','choice-fill-dark-weight','choice-border-weight','radio-checked-bg-type-weight','radio-checked-border-type-weight','radio-checked-border-foreground-weight','radio-checked-text-type-weight','radio-checked-text-foreground-weight',
  'switch-track-fill-light-weight','switch-track-fill-dark-weight','switch-track-border-weight','switch-checked-border-type-weight','switch-thumb-shadow',
  'slider-rail-muted-weight','slider-rail-input-weight','slider-thumb-border-type-weight','slider-thumb-border-ring-weight','slider-thumb-fill-type-weight','slider-thumb-shadow',
  'status-filled-light-weight','status-filled-dark-weight','status-filled-hover-weight','status-filled-hover-text-weight',
  'border-width','card-border-width','card-shadow','card-font-size','card-title-delta','card-meta-gap','motion-duration-1','motion-duration-2','motion-duration-3','motion-duration-5',
  'shape-choice-radio-radius','shape-choice-checkbox-radius','shape-toggle-track-radius','shape-toggle-thumb-radius','shape-range-track-radius','shape-range-thumb-radius','shape-compact-radius','shape-identity-radius','shape-progress-radius'
]);
function plain(v,n){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw new TypeError(n+' must be a plain object');}
function pick(v,a,n){if(!a.includes(v))throw new TypeError('Unknown '+n+': '+v);return v;}
function shape(p,intrinsic,follow){return p==='square'?'0':p==='follow'?follow:intrinsic;}

export function normalizeStyleConfig({style='vega',appearance={}}={}){
  const p=STYLE_APPEARANCE[style],recipe=STYLE_RECIPE[style];if(!p||!recipe)throw new TypeError('Unknown Style');plain(appearance,'appearance');
  const known=new Set(['typography','textStyle','controlAppearance','fontBody','fontHeading','fontMono','border','shadow','motion','surface','shape']);for(const k of Object.keys(appearance))if(!known.has(k))throw new TypeError('Unknown appearance option: '+k);
  const a={typography:pick(appearance.typography??p.typography,TYPOGRAPHY_PROFILES,'typography'),textStyle:pick(appearance.textStyle??p.textStyle,TEXT_STYLE_PROFILES,'text style'),controlAppearance:pick(appearance.controlAppearance??p.controlAppearance,CONTROL_APPEARANCE_PROFILES,'control appearance'),fontBody:pick(appearance.fontBody??'system-ui',BODY_FONTS,'body font'),fontHeading:pick(appearance.fontHeading??p.fontHeading,HEADING_FONTS,'heading font'),fontMono:pick(appearance.fontMono??'ui-monospace',MONO_FONTS,'mono font'),border:pick(appearance.border??p.border,BORDER_PROFILES,'border'),shadow:pick(appearance.shadow??p.shadow,SHADOW_PROFILES,'shadow'),motion:pick(appearance.motion??p.motion,MOTION_PROFILES,'motion'),surface:pick(appearance.surface??p.surface,SURFACE_PROFILES,'surface'),shape:{...DEFAULT_SHAPE,...(appearance.shape??{})}};
  plain(a.shape,'appearance.shape');for(const k of Object.keys(a.shape))if(!SHAPE_FAMILIES.includes(k))throw new TypeError('Unknown shape family: '+k);for(const k of SHAPE_FAMILIES)pick(a.shape[k],SHAPE_POLICIES,'shape.'+k);
  const t=TYPE[a.typography],text=TEXT_STYLE[a.textStyle],control=CONTROL_APPEARANCE[a.controlAppearance],action=ACTION_APPEARANCE[a.controlAppearance],m=MOTION[a.motion],body=FONT[a.fontBody],heading=a.fontHeading==='inherit'?body:FONT[a.fontHeading],border=BORDER[a.border];
  const cardBorder=['elevated','borderless'].includes(a.surface)?'0':border,cardShadow=['outlined','borderless'].includes(a.surface)?'none':a.surface==='elevated'?SHADOW.elevated:SHADOW[a.shadow];
  return {appearance:a,style:{
    'font-family':body,'font-family-heading':heading,'font-family-mono':MONO[a.fontMono],
    'typography-body-size':t[0],'typography-meta-size':t[1],'typography-heading-size':t[2],'typography-kpi-size':t[3],'typography-body-weight':'400','typography-label-weight':'500',
    'control-font-weight':text.controlWeight,'control-letter-spacing':text.controlTracking,'control-text-transform':text.controlTransform,'heading-letter-spacing':text.headingTracking,'heading-text-transform':text.headingTransform,
    'control-fill-light-weight':control[0],'control-fill-dark-weight':control[1],'control-border-inline-weight':control[2],'control-border-block-start-weight':control[3],'control-border-block-end-weight':control[4],'control-state-border-inline-weight':control[5],'control-state-border-block-start-weight':control[6],'control-state-border-block-end-weight':control[7],
    'action-outline-light-background-weight':action[0],'action-outline-light-input-weight':action[1],'action-outline-dark-background-weight':action[2],'action-outline-dark-input-weight':action[3],'action-outline-hover-light-muted-weight':action[4],'action-outline-hover-light-input-weight':action[5],'action-outline-hover-dark-muted-weight':action[6],'action-outline-hover-dark-input-weight':action[7],'action-outline-border-weight':action[8],
    'control-disabled-fill-light-weight':recipe.disabled[0],'control-disabled-fill-dark-weight':recipe.disabled[1],
    'card-border-light-weight':recipe.cardBorder[0],'card-border-dark-weight':recipe.cardBorder[1],'popup-border-light-weight':recipe.popupBorder[0],'popup-border-dark-weight':recipe.popupBorder[1],'popup-shadow':recipe.popupShadow,'dialog-shadow':recipe.dialogShadow,
    'choice-fill-light-weight':recipe.choice[0],'choice-fill-dark-weight':recipe.choice[1],'choice-border-weight':recipe.choice[2],
    'radio-checked-bg-type-weight':recipe.radio[0],'radio-checked-border-type-weight':recipe.radio[1],'radio-checked-border-foreground-weight':recipe.radio[2],'radio-checked-text-type-weight':recipe.radio[3],'radio-checked-text-foreground-weight':recipe.radio[4],
    'switch-track-fill-light-weight':recipe.switchTrack[0],'switch-track-fill-dark-weight':recipe.switchTrack[1],'switch-track-border-weight':recipe.switchTrack[2],'switch-checked-border-type-weight':recipe.switchTrack[3],'switch-thumb-shadow':recipe.switchThumb,
    'slider-rail-muted-weight':recipe.slider[0],'slider-rail-input-weight':recipe.slider[1],'slider-thumb-border-type-weight':recipe.slider[2],'slider-thumb-border-ring-weight':recipe.slider[3],'slider-thumb-fill-type-weight':recipe.slider[4],'slider-thumb-shadow':recipe.slider[5],
    'status-filled-light-weight':recipe.status[0],'status-filled-dark-weight':recipe.status[1],'status-filled-hover-weight':recipe.status[2],'status-filled-hover-text-weight':recipe.status[3],
    'border-width':border,'card-border-width':cardBorder,'card-shadow':cardShadow,'card-font-size':p.cardFont,'card-title-delta':p.cardTitleDelta,'card-meta-gap':p.cardMetaGap,
    'motion-duration-1':m[0],'motion-duration-2':m[1],'motion-duration-3':m[2],'motion-duration-5':m[3],
    'shape-choice-radio-radius':shape(a.shape.choice,'50%','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-choice-checkbox-radius':shape(a.shape.choice,'var(--qxframe9a7c2-theme-v2-radius-choice-md)','var(--qxframe9a7c2-theme-v2-radius-choice-md)'),
    'shape-toggle-track-radius':shape(a.shape.toggle,p.toggle[0],R),'shape-toggle-thumb-radius':shape(a.shape.toggle,p.toggle[1],R),
    'shape-range-track-radius':shape(a.shape.range,p.range[0],R),'shape-range-thumb-radius':shape(a.shape.range,p.range[1],R),
    'shape-compact-radius':shape(a.shape.compact,'100rem',R),'shape-identity-radius':shape(a.shape.identity,'50%',R),'shape-progress-radius':shape(a.shape.range,'100rem',R)
  }};
}
