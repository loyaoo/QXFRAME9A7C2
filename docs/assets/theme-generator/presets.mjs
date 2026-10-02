import {normalizeConfig} from './engine.mjs';

const THEME_PRESETS=Object.freeze([
  Object.freeze({
    id:'signal',
    label:'Signal',
    description:'Crisp product analytics with a blue primary, blue monochrome charts and familiar geometry.',
    config:Object.freeze({style:'vega',baseColor:'zinc',roles:{primary:'blue'},chart:{color:'blue'},typography:{body:'inter',heading:'inter',baseSize:14},radius:'default',density:'default',components:{menu:{color:'default',appearance:'solid',accent:'balanced'}}})
  }),
  Object.freeze({
    id:'ledger',
    label:'Ledger',
    description:'Dense finance and operations surfaces with Mira compact geometry and restrained color.',
    config:Object.freeze({style:'mira',baseColor:'neutral',roles:{primary:'teal'},chart:{color:'teal'},typography:{body:'inter',heading:'system-ui',baseSize:14},radius:'default',density:'default',components:{menu:{color:'neutral',appearance:'solid',accent:'subtle'}}})
  }),
  Object.freeze({
    id:'harbor',
    label:'Harbor',
    description:'Calm SaaS workspace with mist neutrals, cyan accents and Luma soft geometry.',
    config:Object.freeze({style:'luma',baseColor:'mist',roles:{primary:'cyan'},chart:{color:'cyan'},typography:{body:'inter',heading:'system-ui',baseSize:14},radius:'default',density:'default',components:{menu:{color:'default',appearance:'soft',accent:'balanced'}}})
  }),
  Object.freeze({
    id:'juniper',
    label:'Juniper',
    description:'Warm product workspace centered on green/teal roles with Maia rounded surfaces.',
    config:Object.freeze({style:'maia',baseColor:'olive',roles:{primary:'green',success:'teal'},chart:{color:'green'},typography:{body:'humanist',heading:'humanist',baseSize:14},radius:'default',density:'default',components:{menu:{color:'neutral',appearance:'soft',accent:'balanced'}}})
  }),
  Object.freeze({
    id:'ember',
    label:'Ember',
    description:'Warm commerce treatment with orange primary, orange monochrome charts and Nova controls.',
    config:Object.freeze({style:'nova',baseColor:'stone',roles:{primary:'orange',warning:'yellow'},chart:{color:'orange'},typography:{body:'system-ui',heading:'serif',baseSize:14},radius:'default',density:'default',components:{menu:{color:'default',appearance:'solid',accent:'strong'}}})
  }),
  Object.freeze({
    id:'orbit',
    label:'Orbit',
    description:'Purple-forward creative SaaS theme with purple monochrome charts and translucent navigation.',
    config:Object.freeze({style:'rhea',baseColor:'mauve',roles:{primary:'purple'},chart:{color:'purple'},typography:{body:'inter',heading:'humanist',baseSize:16},radius:'default',density:'default',components:{menu:{color:'primary',appearance:'translucent',accent:'subtle'}}})
  }),
  Object.freeze({
    id:'graphite',
    label:'Graphite',
    description:'Monochrome admin tooling with Lyra geometry and a quiet neutral chart hierarchy.',
    config:Object.freeze({style:'lyra',baseColor:'zinc',roles:{primary:'#52525b'},chart:{color:'neutral'},typography:{body:'mono',heading:'mono',baseSize:14},radius:'default',density:'default',components:{menu:{color:'inverted',appearance:'solid',accent:'subtle'}}})
  }),
  Object.freeze({
    id:'canvas',
    label:'Canvas',
    description:'Editorial workspace with serif headings, taupe neutrals and Sera editorial spacing.',
    config:Object.freeze({style:'sera',baseColor:'taupe',roles:{primary:'red'},chart:{color:'red'},typography:{body:'system-ui',heading:'serif',baseSize:16},radius:'default',density:'default',components:{menu:{color:'default',appearance:'translucent',accent:'balanced'}}})
  })
]);

const BY_ID=Object.freeze(Object.fromEntries(THEME_PRESETS.map(item=>[item.id,item])));

function mergeObject(base,patch){
  const output={...base};
  for(const [key,value] of Object.entries(patch||{})){
    if(value&&typeof value==='object'&&!Array.isArray(value)&&base&&base[key]&&typeof base[key]==='object'&&!Array.isArray(base[key]))output[key]=mergeObject(base[key],value);
    else output[key]=value;
  }
  return output;
}
function presetById(id){
  const preset=BY_ID[String(id||'')];
  if(!preset)throw new TypeError('Unknown Theme preset: '+id);
  return preset;
}
function applyThemePreset(id,current={}){
  const preset=presetById(id);
  const base=normalizeConfig(current);
  return normalizeConfig(mergeObject(base,preset.config));
}
function presetOptions(){
  return THEME_PRESETS.map(item=>Object.freeze({id:item.id,label:item.label,description:item.description}));
}

export {THEME_PRESETS,presetById,applyThemePreset,presetOptions};
