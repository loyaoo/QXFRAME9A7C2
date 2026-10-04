// Build/Studio only. CSS owns all instance-size derivation in production.
export const GEOMETRY_RULE_VERSION='qx-md-3';
export const DENSITIES=Object.freeze(['tight','compact','standard','roomy']);
export const RADII=Object.freeze(['none','xs','sm','md','lg','xl']);
export const SPACINGS=Object.freeze(['compact','normal','roomy']);
export const GEOMETRY_ROLES=Object.freeze([
  'control-min-block-md','control-font-size-md','control-line-box-md','control-padding-inline-md','control-gap-md','control-icon-md',
  'radius-control-md','radius-action-md','radius-choice-md','radius-surface-md','radius-popup-md',
  'surface-padding-md','surface-gap-md','switch-height-md','switch-width-md','switch-inset-md',
  'slider-track-md','slider-thumb-md','progress-track-md','progress-ring-md','choice-size-md'
]);
const densityValues={tight:[28,12,16,8,4,12],compact:[32,14,20,12,6,16],standard:[36,14,20,16,8,16],roomy:[40,16,24,20,10,20]};
const radiusValues={none:0,xs:4,sm:8,md:10,lg:14,xl:18};
const spacingValues={compact:[12,8],normal:[20,12],roomy:[28,16]};
// Styles choose default option values, never a universal cross-dimension curve.
export const STYLE_GEOMETRY=Object.freeze({
  vega:{density:'standard',radius:'sm',spacing:'normal',switch:[20,40]},
  nova:{density:'standard',radius:'sm',spacing:'normal',switch:[20,40]},
  maia:{density:'roomy',radius:'xl',spacing:'roomy',switch:[24,48]},
  lyra:{density:'compact',radius:'none',spacing:'normal',switch:[20,40]},
  mira:{density:'tight',radius:'xs',spacing:'compact',switch:[16,32]},
  luma:{density:'standard',radius:'md',spacing:'normal',switch:[20,40]},
  sera:{density:'standard',radius:'none',spacing:'normal',switch:[20,40]},
  rhea:{density:'standard',radius:'md',spacing:'normal',switch:[20,40]}
});
const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError(label+' must be a plain object');};
const rem=px=>String(px/16)+'rem';
const evenCeil=px=>Math.ceil(px/2)*2;
const number=(value,role)=>{
  if(typeof value!=='string'||!/^\d*\.?\d+rem$/.test(value))throw new TypeError(role+' must be a complete nonnegative rem length');
  const px=Number(value.slice(0,-3))*16;
  if(!Number.isFinite(px)||px>256||Math.abs(px/2-Math.round(px/2))>1e-9)throw new TypeError(role+' must be an even length at the 16px reference root');
  return px;
};
const borderPx=value=>{
  if(value==='1px')return 1;
  if(typeof value==='string'&&/^\d*\.?\d+rem$/.test(value)){
    const px=Number(value.slice(0,-3))*16;
    if(Number.isFinite(px)&&px>0&&px<=16)return px;
  }
  throw new TypeError('borderWidth must be 1px or a positive rem length');
};
const adjustment=(role,requested,effective,reason)=>Object.freeze({role,requested,effective,reason});

export function normalizeGeometryConfig({style='vega',options={},geometry={},textStyle='standard',borderWidth='1px'}={}){
  if(!STYLE_GEOMETRY[style])throw new TypeError('Unknown Style');object(options,'options');object(geometry,'geometry');
  if(!['standard','editorial'].includes(textStyle))throw new TypeError('Unknown text style geometry recipe');
  for(const key of Object.keys(options))if(!['density','radius','spacing'].includes(key))throw new TypeError('Unknown option: '+key);
  for(const key of Object.keys(geometry))if(!GEOMETRY_ROLES.includes(key))throw new TypeError('Unknown md geometry: '+key);
  const profile=STYLE_GEOMETRY[style],selected={density:options.density??profile.density,radius:options.radius??profile.radius,spacing:options.spacing??profile.spacing};
  for(const [key,choices]of Object.entries({density:DENSITIES,radius:RADII,spacing:SPACINGS}))if(!choices.includes(selected[key]))throw new TypeError('Unknown '+key);
  const values={};densityValues[selected.density].forEach((v,i)=>values[GEOMETRY_ROLES[i]]=rem(v));
  // Typography style is not a geometry owner. In particular, Sera editorial
  // treatment must not collapse Button/Input/Select onto one 12px Control font.
  // Source-backed Action/Control component exceptions are resolved downstream.
  for(const role of GEOMETRY_ROLES.slice(6,11))values[role]=rem(radiusValues[selected.radius]);
  const [padding,gap]=spacingValues[selected.spacing];
  Object.assign(values,{'surface-padding-md':rem(padding),'surface-gap-md':rem(gap),'switch-height-md':rem(profile.switch[0]),'switch-width-md':rem(profile.switch[1]),'switch-inset-md':'.125rem','slider-track-md':'.25rem','slider-thumb-md':'1rem','progress-track-md':'.5rem','progress-ring-md':'7.5rem','choice-size-md':'1rem'});
  for(const [role,value]of Object.entries(geometry)){number(value,role);values[role]=value;}

  const adjustments=[];
  const actualBorder=borderPx(borderWidth);
  let n=Object.fromEntries(Object.entries(values).map(([role,value])=>[role,number(value,role)]));

  // Resolve the alignment-group minimum against the real two-sided border.
  // Padding may reach zero, but content or border may never be clipped to force
  // the requested outer height. If any xs..xl member cannot fit, increase the
  // shared md anchor once and expose the adjustment to the Inspector/config.
  let requiredMd=n['control-min-block-md'];
  for(const t of [-2,-1,0,1,2]){
    const font=Math.max(12,n['control-font-size-md']+Math.max(-1,Math.min(1,t))*2);
    const line=Math.max(font,n['control-line-box-md']+Math.max(-1,Math.min(1,t))*2);
    const icon=Math.max(8,n['control-icon-md']+t*2);
    requiredMd=Math.max(requiredMd,Math.max(line,icon)+actualBorder*2-t*4);
  }
  requiredMd=evenCeil(requiredMd);
  if(requiredMd!==n['control-min-block-md']){
    const requested=values['control-min-block-md'];
    values['control-min-block-md']=rem(requiredMd);
    adjustments.push(adjustment('control-min-block-md',requested,values['control-min-block-md'],'alignment-group-content-plus-actual-border'));
  }

  // The production Slider recipe has a 2px visible-track floor. Resolve the
  // effective value here as well, so an accepted 0rem input never masquerades
  // as the value that will actually paint.
  if(n['slider-track-md']<2){
    const requested=values['slider-track-md'];
    values['slider-track-md']=rem(2);
    adjustments.push(adjustment('slider-track-md',requested,values['slider-track-md'],'slider-visible-track-minimum'));
  }

  n=Object.fromEntries(Object.entries(values).map(([role,value])=>[role,number(value,role)]));
  const perSize=[];
  for(const t of [-2,-1,0,1,2]){
    const font=Math.max(12,n['control-font-size-md']+Math.max(-1,Math.min(1,t))*2),line=Math.max(font,n['control-line-box-md']+Math.max(-1,Math.min(1,t))*2),icon=Math.max(8,n['control-icon-md']+t*2),height=n['control-min-block-md']+t*4;
    const paddingBlock=Math.max(0,(height-Math.max(line,icon)-actualBorder*2)/2);
    if(n['control-font-size-md']<12||n['control-line-box-md']<n['control-font-size-md']||n['control-icon-md']<12||height<Math.max(line,icon)+actualBorder*2)throw new TypeError('Control md inputs leave insufficient text/icon/actual-border space in '+t);
    perSize.push(Object.freeze({sizeIndex:t,minBlock:rem(height),font:rem(font),lineBox:rem(line),icon:rem(icon),border:borderWidth,paddingBlock:rem(Math.floor(paddingBlock/2)*2)}));
    const switchHeight=n['switch-height-md']+t*2,width=n['switch-width-md']+t*4;
    if(n['switch-inset-md']<2||switchHeight-n['switch-inset-md']*2<8||width<switchHeight+n['switch-inset-md']*2)throw new TypeError('Switch md inputs leave insufficient thumb travel');
    if(n['slider-thumb-md']+t*2<8||n['choice-size-md']+t*2<8||n['progress-track-md']<2||n['progress-ring-md']<32)throw new TypeError('Special family md inputs are too small');
  }
  return {options:selected,geometry:values,constraints:Object.freeze({borderWidth,adjustments:Object.freeze(adjustments),control:Object.freeze(perSize)})};
}
