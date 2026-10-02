import {
  parseColor,
  colorToCss,
  colorToTuple,
  generateColorScale,
  generateNeutralScale,
  chooseOnColor,
  contrastRatio,
  mixSrgb,
  mixOklab,
  chartPalette
} from './color-engine.mjs';

const ROLE_NAMES=Object.freeze(['primary','success','warning','error','info']);
const COLOR_PALETTE_NAMES=Object.freeze(['red','orange','yellow','lime','green','teal','cyan','blue','purple','pink','grey']);
const EXTRA_AXIS_PALETTES=Object.freeze(['gray','azure']);
const DEFAULT_ROLE_VALUES=Object.freeze({primary:'blue',success:'green',warning:'orange',error:'red',info:'cyan'});

function isObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function publicToAbstract(name){
  if(!/^--qxframe9a7c2-/.test(name)||/^--_qxframe9a7c2-/.test(name))throw new TypeError('Expected a public QXFRAME token: '+name);
  return 'p.'+name.slice('--qxframe9a7c2-'.length);
}
function abstractToPublic(name){
  if(!/^p\.[a-z0-9-]+$/i.test(name))throw new TypeError('Expected an abstract public symbol: '+name);
  return '--qxframe9a7c2-'+name.slice(2);
}
function setPublic(tokenMaps,schema,changed,name,lightValue,darkValue=lightValue){
  if(!schema.tokenSet.has(name)&&!schema.optionalSet.has(name))return false;
  tokenMaps.light[name]=String(lightValue);
  tokenMaps.dark[name]=String(darkValue);
  changed.light.set(publicToAbstract(name),String(lightValue));
  changed.dark.set(publicToAbstract(name),String(darkValue));
  return true;
}
function tupleToken(tokenMaps,mode,name){
  const value=String(tokenMaps[mode][name]||'').trim();
  if(!value)throw new TypeError('Missing palette token: '+name);
  parseColor('rgb('+value+')');
  return value;
}
function seedFromPalette(tokenMaps,mode,name){
  if(name==='white'||name==='black')return parseColor('rgb('+tupleToken(tokenMaps,mode,'--qxframe9a7c2-palette-'+name)+')');
  const token='--qxframe9a7c2-palette-'+name+'-5';
  return parseColor('rgb('+tupleToken(tokenMaps,mode,token)+')');
}
function looksLikeColor(value){
  const text=String(value||'').trim();
  return /^#|^rgba?\(|^hsla?\(|^okl(?:ab|ch)\(|^color\(/i.test(text);
}
function roleSeed(value,tokenMaps,mode){
  const text=String(value).trim().toLowerCase();
  if(looksLikeColor(value))return parseColor(value);
  if(COLOR_PALETTE_NAMES.includes(text)||EXTRA_AXIS_PALETTES.includes(text)||text==='white'||text==='black')return seedFromPalette(tokenMaps,mode,text);
  throw new TypeError('Unsupported Theme role source: '+value);
}
function paletteDependsOnConfig(name,config,neutralChanged){
  if(name==='grey')return neutralChanged;
  return Object.prototype.hasOwnProperty.call(config.palette,name)&&config.palette[name]!=null;
}
function neutralCustomization(config){
  return config.baseColor!=='neutral'||config.palette.grey!=null;
}
function recipeCustomization(config){
  if(neutralCustomization(config))return true;
  if(Object.values(config.palette).some(value=>value!=null))return true;
  if(ROLE_NAMES.some(name=>config.roles[name]!==DEFAULT_ROLE_VALUES[name]))return true;
  return false;
}
function colorCustomization(config){
  return recipeCustomization(config)||config.chart.preset!=='balanced';
}
function applyScaleTokens(tokenMaps,schema,changed,prefix,scale,tuple){
  scale.forEach((item,index)=>{
    const name=prefix+(index+1);
    const value=tuple?colorToTuple(item):colorToCss(item);
    setPublic(tokenMaps,schema,changed,name,value);
  });
}
function applyPaletteConfig(tokenMaps,schema,config,changed){
  const neutralChanged=neutralCustomization(config);
  if(neutralChanged){
    if(config.baseColor==='custom'&&!config.palette.grey)throw new TypeError('baseColor "custom" requires palette.grey.');
    const neutral=generateNeutralScale(
      config.baseColor==='custom'||config.baseColor==='neutral'?'neutral':config.baseColor,
      config.palette.grey||null
    );
    applyScaleTokens(tokenMaps,schema,changed,'--qxframe9a7c2-palette-grey-',neutral,true);
    applyScaleTokens(tokenMaps,schema,changed,'--qxframe9a7c2-theme-neutral-',neutral,false);
  }
  for(const name of COLOR_PALETTE_NAMES){
    if(name==='grey')continue;
    const seed=config.palette[name];
    if(seed==null)continue;
    const scale=generateColorScale(seed);
    applyScaleTokens(tokenMaps,schema,changed,'--qxframe9a7c2-palette-'+name+'-',scale,true);
    const seedCss=colorToCss(scale[4]);
    setPublic(tokenMaps,schema,changed,'--qxframe9a7c2-theme-'+name,seedCss);
  }
  return neutralChanged;
}
function applyRoleConfig(tokenMaps,schema,config,changed,neutralChanged){
  for(const role of ROLE_NAMES){
    const source=config.roles[role];
    const sourceName=String(source).toLowerCase();
    const changedByRole=source!==DEFAULT_ROLE_VALUES[role];
    const changedByPalette=!looksLikeColor(source)&&paletteDependsOnConfig(sourceName,config,neutralChanged);
    if(!changedByRole&&!changedByPalette)continue;
    const seed=roleSeed(source,tokenMaps,'light');
    const seedCss=colorToCss(seed);
    setPublic(tokenMaps,schema,changed,'--qxframe9a7c2-theme-'+role,seedCss);
    if(role==='primary'){
      const scale=generateColorScale(seed);
      applyScaleTokens(tokenMaps,schema,changed,'--qxframe9a7c2-theme-primary-',scale,false);
      setPublic(tokenMaps,schema,changed,'--qxframe9a7c2-theme-primary-foreground',chooseOnColor(seed).css);
    }
  }
}
function normalizeOnColors(tokenMaps,schema,changed){
  const primaryName='--qxframe9a7c2-theme-primary';
  const foregroundName='--qxframe9a7c2-theme-primary-foreground';
  if(!schema.tokenSet.has(foregroundName))return;
  const light=chooseOnColor(tokenMaps.light[primaryName]).css;
  const dark=chooseOnColor(tokenMaps.dark[primaryName]).css;
  setPublic(tokenMaps,schema,changed,foregroundName,light,dark);
}
function sharedStatusForeground(tokenMaps,mode){
  const dark=parseColor('rgb('+tupleToken(tokenMaps,mode,'--qxframe9a7c2-palette-black')+')');
  const light=parseColor('rgb('+tupleToken(tokenMaps,mode,'--qxframe9a7c2-palette-white')+')');
  const backgrounds=['success','warning','error','info'].map(role=>parseColor(tokenMaps[mode]['--qxframe9a7c2-theme-'+role]));
  const score=candidate=>Math.min(...backgrounds.map(background=>contrastRatio(background,candidate)));
  return colorToCss(score(dark)>=score(light)?dark:light);
}
function bindSemanticOnColors(tokenMaps,schema,changed){
  const accent='--qxframe9a7c2-semantic-on-accent';
  const status='--qxframe9a7c2-semantic-on-status';
  if(schema.optionalSet.has(accent)){
    setPublic(tokenMaps,schema,changed,accent,
      tokenMaps.light['--qxframe9a7c2-theme-primary-foreground'],
      tokenMaps.dark['--qxframe9a7c2-theme-primary-foreground']);
  }
  if(schema.optionalSet.has(status)){
    setPublic(tokenMaps,schema,changed,status,
      sharedStatusForeground(tokenMaps,'light'),
      sharedStatusForeground(tokenMaps,'dark'));
  }
}
function applyChartConfig(tokenMaps,schema,config,changed){
  if(config.chart.preset==='balanced')return;
  const anchors={cool:'#2563eb',warm:'#d97706',mixed:'#7c3aed',mono:'#52525b',balanced:'#5b5bd6'};
  const seed=anchors[config.chart.preset]||anchors.balanced;
  const light=chartPalette(config.chart.preset,seed,8,'light');
  const dark=chartPalette(config.chart.preset,seed,8,'dark');
  for(let i=0;i<8;i+=1)setPublic(tokenMaps,schema,changed,'--qxframe9a7c2-theme-chart-'+(i+1),colorToCss(light[i]),colorToCss(dark[i]));
}
function validateRecipeData(data){
  if(!isObject(data)||Number(data.schema)!==1)throw new TypeError('Theme color recipe schema 1 is required.');
  if(!Array.isArray(data.axes)||!data.axes.includes('bare'))throw new TypeError('Theme color recipes must include the bare axis.');
  if(!Array.isArray(data.roles)||!isObject(data.recipes)||!isObject(data.recipes.light)||!isObject(data.recipes.dark))throw new TypeError('Theme color recipe data is incomplete.');
  for(const role of data.roles){
    if(!role||typeof role.target!=='string'||typeof role.expression!=='string'||typeof role.axisDependent!=='boolean')throw new TypeError('Invalid Theme color role recipe.');
    if(!/^--qxframe9a7c2-theme-color-/.test(role.target))throw new TypeError('Color role target is outside the public Theme color namespace: '+role.target);
  }
  return data;
}
function findMatchingParen(text,openIndex){
  let depth=0;
  for(let i=openIndex;i<text.length;i+=1){
    if(text[i]==='(')depth+=1;
    else if(text[i]===')'){depth-=1;if(depth===0)return i;}
  }
  throw new TypeError('Unbalanced recipe expression: '+text);
}
function splitTopLevel(text,delimiter=','){
  const parts=[];let depth=0,last=0;
  for(let i=0;i<text.length;i+=1){
    const ch=text[i];
    if(ch==='(')depth+=1;
    else if(ch===')')depth-=1;
    else if(ch===delimiter&&depth===0){parts.push(text.slice(last,i).trim());last=i+1;}
  }
  parts.push(text.slice(last).trim());
  return parts;
}
function splitVarBody(body){
  const parts=splitTopLevel(body,',');
  const name=parts.shift();
  return {name:name.trim(),fallback:parts.length?parts.join(',').trim():null};
}
function stringifyResolved(value){
  if(value&&typeof value==='object'&&['r','g','b'].every(key=>Number.isFinite(value[key])))return colorToCss(value);
  return String(value);
}
function calcPercent(text){
  let value=text;
  const pattern=/calc\(\s*(-?\d+(?:\.\d+)?)%\s*-\s*(-?\d+(?:\.\d+)?)%\s*\)/g;
  let previous;
  do{
    previous=value;
    value=value.replace(pattern,(_,a,b)=>(Number(a)-Number(b))+'%');
  }while(value!==previous);
  return value;
}
function parseStop(text,evaluate){
  const value=calcPercent(text.trim());
  let depth=0,split=-1;
  for(let i=value.length-1;i>=0;i-=1){
    const ch=value[i];
    if(ch===')')depth+=1;
    else if(ch==='(')depth-=1;
    else if(/\s/.test(ch)&&depth===0){split=i;break;}
  }
  let colorText=value,weight=null;
  if(split>=0){
    const tail=value.slice(split).trim();
    if(/^-?\d+(?:\.\d+)?%$/.test(tail)){colorText=value.slice(0,split).trim();weight=Number(tail.slice(0,-1))/100;}
  }
  const colorValue=evaluate(colorText);
  if(!colorValue||typeof colorValue!=='object'||!['r','g','b'].every(key=>Number.isFinite(colorValue[key])))throw new TypeError('Color mix stop did not resolve to a color: '+text);
  return {color:colorValue,weight};
}
function mixColorExpression(text,evaluate){
  const body=text.slice('color-mix('.length,-1).trim();
  const parts=splitTopLevel(body,',');
  if(parts.length!==3||!/^in\s+(srgb|oklab)$/i.test(parts[0]))throw new TypeError('Unsupported color-mix recipe: '+text);
  const space=parts[0].trim().split(/\s+/)[1].toLowerCase();
  const a=parseStop(parts[1],evaluate),b=parseStop(parts[2],evaluate);
  let wa=a.weight,wb=b.weight;
  if(wa==null&&wb==null){wa=0.5;wb=0.5;}
  else if(wa==null)wa=1-wb;
  else if(wb==null)wb=1-wa;
  if(!Number.isFinite(wa)||!Number.isFinite(wb)||wa<0||wb<0||wa+wb<=0)throw new TypeError('Invalid color-mix weights: '+text);
  const total=wa+wb,alphaScale=total<1?total:1;
  wa/=total;wb/=total;
  const mixed=space==='oklab'?mixOklab(a.color,b.color,wa):mixSrgb(a.color,b.color,wa);
  return parseColor({r:mixed.r,g:mixed.g,b:mixed.b,a:mixed.a*alphaScale});
}
function createEvaluator(bindings){
  const cache=new Map(),active=new Set();
  function resolveSymbol(name){
    if(cache.has(name))return cache.get(name);
    if(!Object.prototype.hasOwnProperty.call(bindings,name))return undefined;
    if(active.has(name))throw new TypeError('Theme recipe cycle detected at '+name);
    active.add(name);
    const result=evaluate(bindings[name]);
    active.delete(name);cache.set(name,result);
    return result;
  }
  function replaceVars(text){
    let output='',cursor=0;
    while(true){
      const start=text.indexOf('var(',cursor);
      if(start<0){output+=text.slice(cursor);break;}
      output+=text.slice(cursor,start);
      const end=findMatchingParen(text,start+3);
      const body=text.slice(start+4,end);
      const spec=splitVarBody(body);
      let resolved=resolveSymbol(spec.name);
      if(resolved===undefined&&spec.fallback!=null)resolved=evaluate(spec.fallback);
      if(resolved===undefined)throw new TypeError('Unbound Theme recipe symbol: '+spec.name);
      output+=stringifyResolved(resolved);
      cursor=end+1;
    }
    return output;
  }
  function evaluate(input){
    if(input&&typeof input==='object'&&['r','g','b'].every(key=>Number.isFinite(input[key])))return parseColor(input);
    let text=String(input).trim();
    if(!text)throw new TypeError('Empty Theme recipe expression.');
    if(text.includes('var('))text=replaceVars(text);
    text=calcPercent(text);
    if(text.startsWith('color-mix(')&&text.endsWith(')'))return mixColorExpression(text,evaluate);
    if(/^(?:#|rgba?\(|hsla?\(|okl(?:ab|ch)\(|color\(|black$|white$|transparent$)/i.test(text))return parseColor(text);
    if(/^-?\d+(?:\.\d+)?%$/.test(text))return text;
    if(/^\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?$/.test(text))return text;
    throw new TypeError('Unsupported resolved Theme recipe expression: '+text);
  }
  return Object.freeze({evaluate,resolveSymbol});
}
function roleTargetForAxis(role,axis){
  return axis==='bare'?role.target:role.target+'-'+axis;
}
function syncModeSpecificTarget(tokenMaps,schema,mode,target,value){
  const marker='--qxframe9a7c2-theme-color-';
  if(!target.startsWith(marker))return;
  const suffix=target.slice(marker.length);
  const light='--qxframe9a7c2-theme-light-color-'+suffix;
  const dark='--qxframe9a7c2-theme-dark-color-'+suffix;
  if(schema.tokenSet.has(light)){tokenMaps.light[light]=value.light;tokenMaps.dark[light]=value.light;}
  if(schema.tokenSet.has(dark)){tokenMaps.light[dark]=value.dark;tokenMaps.dark[dark]=value.dark;}
}
function expandFrozenColorRecipes(tokenMaps,schema,recipeData,changed){
  const data=validateRecipeData(recipeData);
  const produced={light:new Map(),dark:new Map()};
  for(const mode of ['light','dark']){
    for(const role of data.roles){
      const axes=role.axisDependent?data.axes:['bare'];
      for(const axis of axes){
        const target=roleTargetForAxis(role,axis);
        if(!schema.tokenSet.has(target))continue;
        const base=data.recipes[mode][axis];
        if(!base)throw new TypeError('Missing '+mode+'/'+axis+' Theme color recipe map.');
        const bindings={...base,...Object.fromEntries(changed[mode])};
        if(role.expression.includes('var(r.accent-seed)')&&!Object.prototype.hasOwnProperty.call(bindings,'r.accent-seed')){
          // The frozen recipe intentionally leaves this axis unbound. Preserve the
          // manifest default instead of inventing a semantic mapping in Generator.
          continue;
        }
        const evaluator=createEvaluator(bindings);
        const result=evaluator.evaluate(role.expression);
        if(!result||typeof result!=='object')throw new TypeError('Theme color role did not resolve to a color: '+target);
        const css=colorToCss(result);
        tokenMaps[mode][target]=css;
        produced[mode].set(target,css);
      }
    }
  }
  const targets=new Set([...produced.light.keys(),...produced.dark.keys()]);
  for(const target of targets){
    const light=produced.light.get(target)||tokenMaps.light[target];
    const dark=produced.dark.get(target)||tokenMaps.dark[target];
    syncModeSpecificTarget(tokenMaps,schema,'both',target,{light,dark});
  }
  return produced;
}
function applyColorConfiguration(tokenMaps,schema,recipeData,config){
  if(!tokenMaps||!tokenMaps.light||!tokenMaps.dark)throw new TypeError('Theme token maps are required.');
  const changed={light:new Map(),dark:new Map()};
  const neutralChanged=applyPaletteConfig(tokenMaps,schema,config,changed);
  applyRoleConfig(tokenMaps,schema,config,changed,neutralChanged);
  normalizeOnColors(tokenMaps,schema,changed);
  bindSemanticOnColors(tokenMaps,schema,changed);
  applyChartConfig(tokenMaps,schema,config,changed);
  const recipeExpanded=recipeCustomization(config);
  const customized=colorCustomization(config);
  let produced={light:new Map(),dark:new Map()};
  if(recipeExpanded)produced=expandFrozenColorRecipes(tokenMaps,schema,recipeData,changed);
  return Object.freeze({
    customized,
    recipeExpanded,
    changedPublicInputs:Object.freeze({
      light:Object.freeze([...changed.light.keys()]),
      dark:Object.freeze([...changed.dark.keys()])
    }),
    generatedColorTargets:Object.freeze({
      light:Object.freeze([...produced.light.keys()]),
      dark:Object.freeze([...produced.dark.keys()])
    })
  });
}

export {
  DEFAULT_ROLE_VALUES,
  validateRecipeData,
  createEvaluator,
  colorCustomization,
  recipeCustomization,
  applyColorConfiguration,
  expandFrozenColorRecipes,
  publicToAbstract,
  abstractToPublic
};
