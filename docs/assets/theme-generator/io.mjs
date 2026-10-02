import {parseConfig,normalizeConfig,serializeConfig} from './engine.mjs';

const LEGACY_PRESET_SEEDS=Object.freeze({
  nova:'#5b5bd6',
  ocean:'#2563eb',
  violet:'#7c3aed',
  emerald:'#059669',
  amber:'#d97706',
  rose:'#e11d48'
});
const LEGACY_BASE_MAP=Object.freeze({grey:'neutral',gray:'zinc',mixed:'neutral'});
const LEGACY_FONT_MAP=Object.freeze({inter:'inter',system:'system-ui',humanist:'humanist',serif:'serif',mono:'system-ui'});

function safeName(value){
  const name=String(value||'qxframe-theme').trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
  return name||'qxframe-theme';
}
function legacyRadius(value){
  const px=Number(value);
  if(!Number.isFinite(px))return 'medium';
  if(px<=0)return 'none';
  if(px<=3)return 'small';
  if(px<=6)return 'medium';
  return 'large';
}
function migrateLegacyConfig(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Imported Theme Config must be an object.');
  if(value.schema!=null)return normalizeConfig(value);
  const looksLegacy=['primarySeed','customPrimary','preset','base','font','radius','focusRing','mixRatio','mode'].some(key=>Object.prototype.hasOwnProperty.call(value,key));
  if(!looksLegacy)throw new TypeError('Theme Config is missing schema: 1 and does not match the supported legacy Theme Playground state.');
  const preset=String(value.preset||'').toLowerCase();
  const seed=String(value.primarySeed||value.customPrimary||LEGACY_PRESET_SEEDS[preset]||LEGACY_PRESET_SEEDS.nova);
  return normalizeConfig({
    schema:1,
    name:safeName(value.name||'migrated-theme'),
    style:'vega',
    baseColor:LEGACY_BASE_MAP[String(value.base||'grey').toLowerCase()]||'neutral',
    roles:{primary:seed},
    chart:{color:'primary'},
    typography:{body:LEGACY_FONT_MAP[String(value.font||'system').toLowerCase()]||'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14},
    radius:legacyRadius(value.radius),
    density:'default',
    components:{menu:{color:'default',appearance:'solid',accent:'subtle'}}
  });
}
function importConfigJson(text){
  let parsed;
  try{parsed=JSON.parse(String(text));}
  catch(error){throw new SyntaxError('Theme Config JSON is invalid: '+error.message);}
  return migrateLegacyConfig(parsed);
}
function exportArtifacts(theme){
  if(!theme||!theme.config||typeof theme.css!=='string')throw new TypeError('A generated Theme result is required.');
  const name=safeName(theme.config.name);
  return Object.freeze({
    css:Object.freeze({filename:'qxframe-theme-'+name+'.css',mime:'text/css',content:theme.css}),
    config:Object.freeze({filename:'qxframe-theme-'+name+'.json',mime:'application/json',content:serializeConfig(theme.config)})
  });
}
function sourceOfTruth(theme){
  return exportArtifacts(theme).config.content;
}

export {safeName,migrateLegacyConfig,importConfigJson,exportArtifacts,sourceOfTruth};
