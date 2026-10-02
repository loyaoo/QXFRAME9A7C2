import {parseColor,contrastRatio,chooseOnColor,colorToCss} from './color-engine.mjs';

const MIN_TEXT_CONTRAST=4.5;
const STRONG_TEXT_CONTRAST=7;
const STATUS_ROLES=Object.freeze(['success','warning','error','info']);

function token(tokens,mode,name){
  const value=tokens&&tokens[mode]&&tokens[mode][name];
  if(value==null)throw new TypeError('Readability audit missing token: '+name+' ('+mode+')');
  return value;
}
function contrastCheck(id,foreground,background,minimum=MIN_TEXT_CONTRAST){
  try{
    const fg=parseColor(foreground),bg=parseColor(background),ratio=contrastRatio(fg,bg);
    return Object.freeze({
      id,
      foreground:colorToCss(fg),
      background:colorToCss(bg),
      ratio:Number(ratio.toFixed(3)),
      minimum,
      verifiable:true,
      passes:ratio>=minimum
    });
  }catch(error){
    return Object.freeze({
      id,
      foreground:String(foreground),
      background:String(background),
      ratio:null,
      minimum,
      verifiable:false,
      passes:false,
      detail:error&&error.message||String(error)
    });
  }
}
function modeTextChecks(tokens,mode){
  const prefix='--qxframe9a7c2-theme-'+mode+'-';
  const surface=token(tokens,mode,prefix+'surface');
  return [
    contrastCheck(mode+'-text',token(tokens,mode,prefix+'text'),surface,STRONG_TEXT_CONTRAST),
    contrastCheck(mode+'-text-secondary',token(tokens,mode,prefix+'text-secondary'),surface,MIN_TEXT_CONTRAST)
  ];
}
function roleCheck(tokens,role){
  const background=token(tokens,'light','--qxframe9a7c2-theme-'+role);
  if(role==='primary'){
    const foreground=token(tokens,'light','--qxframe9a7c2-theme-primary-foreground');
    const checked=contrastCheck('on-primary',foreground,background,MIN_TEXT_CONTRAST);
    let recommendedForeground=null;try{recommendedForeground=chooseOnColor(background).css;}catch(_){}
    return Object.freeze({...checked,role,recommendedForeground});
  }
  try{
    const recommended=chooseOnColor(background,{minimum:MIN_TEXT_CONTRAST});
    return Object.freeze({
      id:'on-'+role,
      role,
      foreground:recommended.css,
      recommendedForeground:recommended.css,
      background:colorToCss(background),
      ratio:recommended.ratio,
      minimum:MIN_TEXT_CONTRAST,
      verifiable:true,
      passes:recommended.passes
    });
  }catch(error){
    return Object.freeze({
      id:'on-'+role,
      role,
      foreground:null,
      recommendedForeground:null,
      background:String(background),
      ratio:null,
      minimum:MIN_TEXT_CONTRAST,
      verifiable:false,
      passes:false,
      detail:error&&error.message||String(error)
    });
  }
}
function auditReadability(tokens){
  const checks=[
    ...modeTextChecks(tokens,'light'),
    ...modeTextChecks(tokens,'dark'),
    roleCheck(tokens,'primary'),
    ...STATUS_ROLES.map(role=>roleCheck(tokens,role))
  ];
  const warnings=checks.filter(check=>!check.passes).map(check=>Object.freeze({
    code:check.verifiable?'contrast':'contrast-unverifiable',
    id:check.id,
    ratio:check.ratio,
    minimum:check.minimum,
    message:check.verifiable
      ?check.id+' contrast '+check.ratio+' is below '+check.minimum+'.'
      :check.id+' contrast cannot be verified offline from the explicit CSS expression.'
  }));
  return Object.freeze({
    minimumTextContrast:MIN_TEXT_CONTRAST,
    strongTextContrast:STRONG_TEXT_CONTRAST,
    checks:Object.freeze(checks),
    warnings:Object.freeze(warnings),
    passes:warnings.length===0
  });
}

export {MIN_TEXT_CONTRAST,STRONG_TEXT_CONTRAST,contrastCheck,auditReadability};
