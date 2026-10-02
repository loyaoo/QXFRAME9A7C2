const EPSILON = 1e-9;
const TAU = Math.PI * 2;

const NEUTRAL_PRESETS = Object.freeze({
  neutral: Object.freeze({ hue: 0, chroma: 0 }),
  stone: Object.freeze({ hue: 65, chroma: 0.018 }),
  zinc: Object.freeze({ hue: 255, chroma: 0.012 }),
  mauve: Object.freeze({ hue: 325, chroma: 0.018 }),
  olive: Object.freeze({ hue: 112, chroma: 0.018 }),
  mist: Object.freeze({ hue: 230, chroma: 0.015 }),
  taupe: Object.freeze({ hue: 58, chroma: 0.018 })
});

const NEUTRAL_LIGHTNESS = Object.freeze([0.15,0.21,0.28,0.37,0.44,0.54,0.67,0.81,0.84,0.88,0.915,0.95,0.98]);
const NEUTRAL_CHROMA_WEIGHT = Object.freeze([0.35,0.52,0.68,0.84,1,1,0.9,0.72,0.6,0.48,0.34,0.2,0.08]);
const DARK_SCALE_POSITION = Object.freeze([0.22,0.40,0.60,0.79,1]);
const LIGHT_SCALE_POSITION = Object.freeze([0.18,0.33,0.50,0.64,0.75,0.84,0.92,1]);
const COLOR_CHROMA_WEIGHT = Object.freeze([0.55,0.74,0.88,0.96,1,0.92,0.82,0.69,0.55,0.42,0.30,0.18,0.10]);

function clamp(value,min=0,max=1){
  const n=Number(value);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;
}
function mod(value,base){
  const result=value%base;
  return result<0?result+base:result;
}
function round(value,digits=6){
  const factor=10**digits;
  return Math.round((Number(value)+Number.EPSILON)*factor)/factor;
}
function color(r,g,b,a=1){
  return Object.freeze({r:clamp(r),g:clamp(g),b:clamp(b),a:clamp(a)});
}
function srgbToLinear(channel){
  const c=clamp(channel);
  return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
}
function linearToSrgb(channel){
  const c=Number(channel);
  return c<=0.0031308?12.92*c:1.055*Math.max(c,0)**(1/2.4)-0.055;
}
function rgbToOklab(input){
  const source=input&&typeof input==='object'&&['r','g','b'].every(key=>Number.isFinite(input[key]))?input:parseColor(input);
  const l=srgbToLinear(source.r),m=srgbToLinear(source.g),s=srgbToLinear(source.b);
  const x=0.4122214708*l+0.5363325363*m+0.0514459929*s;
  const y=0.2119034982*l+0.6806995451*m+0.1073969566*s;
  const z=0.0883024619*l+0.2817188376*m+0.6299787005*s;
  const lx=Math.cbrt(x),ly=Math.cbrt(y),lz=Math.cbrt(z);
  return Object.freeze({
    l:0.2104542553*lx+0.793617785*ly-0.0040720468*lz,
    a:1.9779984951*lx-2.428592205*ly+0.4505937099*lz,
    b:0.0259040371*lx+0.7827717662*ly-0.808675766*lz,
    alpha:source.a
  });
}
function oklabToRgbRaw(lab){
  const l_=lab.l+0.3963377774*lab.a+0.2158037573*lab.b;
  const m_=lab.l-0.1055613458*lab.a-0.0638541728*lab.b;
  const s_=lab.l-0.0894841775*lab.a-1.291485548*lab.b;
  const l=l_**3,m=m_**3,s=s_**3;
  return {
    r:linearToSrgb(+4.0767416621*l-3.3077115913*m+0.2309699292*s),
    g:linearToSrgb(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
    b:linearToSrgb(-0.0041960863*l-0.7034186147*m+1.707614701*s),
    a:clamp(lab.alpha==null?1:lab.alpha)
  };
}
function oklabToOklch(lab){
  const c=Math.sqrt(lab.a*lab.a+lab.b*lab.b);
  return Object.freeze({
    l:lab.l,
    c,
    h:c<EPSILON?0:mod(Math.atan2(lab.b,lab.a)*180/Math.PI,360),
    alpha:lab.alpha
  });
}
function oklchToOklab(lch){
  const radians=mod(lch.h,360)*Math.PI/180;
  return Object.freeze({
    l:lch.l,
    a:lch.c*Math.cos(radians),
    b:lch.c*Math.sin(radians),
    alpha:lch.alpha
  });
}
function inGamutRaw(rgb){
  return rgb.r>=-EPSILON&&rgb.r<=1+EPSILON&&rgb.g>=-EPSILON&&rgb.g<=1+EPSILON&&rgb.b>=-EPSILON&&rgb.b<=1+EPSILON;
}
function gamutMapOklch(input){
  const l=clamp(input.l),h=mod(Number(input.h)||0,360),alpha=clamp(input.alpha==null?1:input.alpha);
  let c=Math.max(0,Number(input.c)||0);
  let raw=oklabToRgbRaw(oklchToOklab({l,c,h,alpha}));
  if(inGamutRaw(raw)) return color(raw.r,raw.g,raw.b,alpha);
  let low=0,high=c,best=null;
  for(let i=0;i<28;i+=1){
    const mid=(low+high)/2;
    const candidate=oklabToRgbRaw(oklchToOklab({l,c:mid,h,alpha}));
    if(inGamutRaw(candidate)){low=mid;best=candidate;}else high=mid;
  }
  raw=best||oklabToRgbRaw(oklchToOklab({l,c:0,h,alpha}));
  return color(raw.r,raw.g,raw.b,alpha);
}
function rgbToOklch(input){return oklabToOklch(rgbToOklab(input));}

function parseAlpha(text){
  if(text==null||text==='')return 1;
  const value=String(text).trim();
  return value.endsWith('%')?clamp(parseFloat(value)/100):clamp(parseFloat(value));
}
function parseRgbComponent(text){
  const value=String(text).trim();
  return value.endsWith('%')?clamp(parseFloat(value)/100):clamp(parseFloat(value)/255);
}
function parseAngle(text){
  const value=String(text).trim().toLowerCase();
  const number=parseFloat(value);
  if(!Number.isFinite(number))throw new TypeError('Invalid color angle: '+text);
  if(value.endsWith('turn'))return mod(number*360,360);
  if(value.endsWith('rad'))return mod(number*180/Math.PI,360);
  if(value.endsWith('grad'))return mod(number*0.9,360);
  return mod(number,360);
}
function parsePercent01(text,label){
  const value=String(text).trim();
  const number=parseFloat(value);
  if(!Number.isFinite(number))throw new TypeError('Invalid '+label+': '+text);
  return value.endsWith('%')?clamp(number/100):clamp(number);
}
function splitFunctionArgs(body){
  const slash=body.indexOf('/');
  const alpha=slash>=0?body.slice(slash+1).trim():null;
  const main=(slash>=0?body.slice(0,slash):body).trim().replace(/,/g,' ');
  return {parts:main.split(/\s+/).filter(Boolean),alpha};
}
function parseHex(text){
  const hex=text.slice(1);
  if(![3,4,6,8].includes(hex.length))throw new TypeError('Invalid HEX color: '+text);
  const expand=hex.length<=4?Array.from(hex,ch=>ch+ch).join(''):hex;
  const r=parseInt(expand.slice(0,2),16)/255,g=parseInt(expand.slice(2,4),16)/255,b=parseInt(expand.slice(4,6),16)/255;
  const a=expand.length===8?parseInt(expand.slice(6,8),16)/255:1;
  return color(r,g,b,a);
}
function hslToRgb(h,s,l,a=1){
  const hue=mod(h,360)/360;
  if(s<EPSILON)return color(l,l,l,a);
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const channel=t=>{
    t=mod(t,1);
    if(t<1/6)return p+(q-p)*6*t;
    if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;
    return p;
  };
  return color(channel(hue+1/3),channel(hue),channel(hue-1/3),a);
}
function parseColor(value){
  if(value&&typeof value==='object'&&['r','g','b'].every(key=>Number.isFinite(value[key])))return color(value.r,value.g,value.b,value.a==null?1:value.a);
  const text=String(value||'').trim().toLowerCase();
  if(!text)throw new TypeError('Color value is empty.');
  if(text==='transparent')return color(0,0,0,0);
  if(text==='black')return color(0,0,0,1);
  if(text==='white')return color(1,1,1,1);
  if(text.startsWith('#'))return parseHex(text);
  const srgb=/^color\(srgb\s+([^)]*)\)$/.exec(text);
  if(srgb){
    const args=splitFunctionArgs(srgb[1]);
    if(args.parts.length!==3)throw new TypeError('Invalid color(srgb) syntax: '+value);
    return color(parseFloat(args.parts[0]),parseFloat(args.parts[1]),parseFloat(args.parts[2]),parseAlpha(args.alpha));
  }
  const match=/^([a-z]+)\((.*)\)$/.exec(text);
  if(!match)throw new TypeError('Unsupported color syntax: '+value);
  const fn=match[1],args=splitFunctionArgs(match[2]);
  if((fn==='rgb'||fn==='rgba')&&args.parts.length===3){
    return color(parseRgbComponent(args.parts[0]),parseRgbComponent(args.parts[1]),parseRgbComponent(args.parts[2]),parseAlpha(args.alpha));
  }
  if((fn==='hsl'||fn==='hsla')&&args.parts.length===3){
    return hslToRgb(parseAngle(args.parts[0]),parsePercent01(args.parts[1],'HSL saturation'),parsePercent01(args.parts[2],'HSL lightness'),parseAlpha(args.alpha));
  }
  if(fn==='oklab'&&args.parts.length===3){
    const l=parsePercent01(args.parts[0],'OKLab lightness');
    const a=parseFloat(args.parts[1]),b=parseFloat(args.parts[2]);
    if(!Number.isFinite(a)||!Number.isFinite(b))throw new TypeError('Invalid OKLab channels: '+value);
    const raw=oklabToRgbRaw({l,a,b,alpha:parseAlpha(args.alpha)});
    if(inGamutRaw(raw))return color(raw.r,raw.g,raw.b,raw.a);
    const lch=oklabToOklch({l,a,b,alpha:raw.a});
    return gamutMapOklch(lch);
  }
  if(fn==='oklch'&&args.parts.length===3){
    const l=parsePercent01(args.parts[0],'OKLCH lightness');
    const c=parseFloat(args.parts[1]),h=parseAngle(args.parts[2]);
    if(!Number.isFinite(c)||c<0)throw new TypeError('Invalid OKLCH chroma: '+value);
    return gamutMapOklch({l,c,h,alpha:parseAlpha(args.alpha)});
  }
  throw new TypeError('Unsupported color syntax: '+value);
}

function colorToCss(input){
  const c=parseColor(input);
  const channels=[c.r,c.g,c.b].map(v=>Math.round(clamp(v)*255));
  if(c.a>=1-EPSILON)return 'rgb('+channels.join(', ')+')';
  return 'rgba('+channels.join(', ')+', '+round(c.a,4)+')';
}
function colorToTuple(input){
  const c=parseColor(input);
  return [c.r,c.g,c.b].map(v=>Math.round(clamp(v)*255)).join(', ');
}
function colorToHex(input){
  const c=parseColor(input);
  const hex=n=>Math.round(clamp(n)*255).toString(16).padStart(2,'0');
  return '#'+hex(c.r)+hex(c.g)+hex(c.b);
}

function generateColorScale(seed){
  const base=rgbToOklch(parseColor(seed));
  const seedL=clamp(base.l,0.28,0.86);
  const lowerFloor=Math.min(0.13,seedL*0.42);
  const upperCeiling=Math.max(0.965,seedL+0.08);
  const lightness=[];
  for(let i=0;i<5;i+=1)lightness.push(lowerFloor+(seedL-lowerFloor)*DARK_SCALE_POSITION[i]);
  for(let i=0;i<8;i+=1)lightness.push(seedL+(upperCeiling-seedL)*LIGHT_SCALE_POSITION[i]);
  const maxC=Math.max(0.025,base.c);
  return Object.freeze(lightness.map((l,index)=>gamutMapOklch({
    l:clamp(l,0.03,0.99),
    c:maxC*COLOR_CHROMA_WEIGHT[index],
    h:base.h,
    alpha:1
  })));
}
function neutralSpec(preset,customSeed){
  if(customSeed){
    const lch=rgbToOklch(parseColor(customSeed));
    return {hue:lch.h,chroma:Math.min(0.026,Math.max(0.004,lch.c*0.2))};
  }
  const spec=NEUTRAL_PRESETS[preset];
  if(!spec)throw new TypeError('Unknown neutral preset: '+preset);
  return spec;
}
function generateNeutralScale(preset='neutral',customSeed=null){
  const spec=neutralSpec(preset,customSeed);
  return Object.freeze(NEUTRAL_LIGHTNESS.map((l,index)=>gamutMapOklch({
    l,
    c:spec.chroma*NEUTRAL_CHROMA_WEIGHT[index],
    h:spec.hue,
    alpha:1
  })));
}
function relativeLuminance(input){
  const c=parseColor(input);
  return 0.2126*srgbToLinear(c.r)+0.7152*srgbToLinear(c.g)+0.0722*srgbToLinear(c.b);
}
function contrastRatio(a,b){
  const l1=relativeLuminance(a),l2=relativeLuminance(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
function chooseOnColor(background,options={}){
  const dark=parseColor(options.dark||'#0a0a0a');
  const light=parseColor(options.light||'#ffffff');
  const bg=parseColor(background);
  const darkRatio=contrastRatio(bg,dark),lightRatio=contrastRatio(bg,light);
  const selected=darkRatio>=lightRatio?dark:light;
  const ratio=Math.max(darkRatio,lightRatio);
  const minimum=Number.isFinite(options.minimum)?options.minimum:4.5;
  return Object.freeze({color:selected,css:colorToCss(selected),ratio:round(ratio,3),passes:ratio>=minimum});
}
function mixSrgb(a,b,weightA=0.5){
  const ca=parseColor(a),cb=parseColor(b),wa=clamp(weightA),wb=1-wa;
  const alpha=ca.a*wa+cb.a*wb;
  if(alpha<EPSILON)return color(0,0,0,0);
  return color(
    (ca.r*ca.a*wa+cb.r*cb.a*wb)/alpha,
    (ca.g*ca.a*wa+cb.g*cb.a*wb)/alpha,
    (ca.b*ca.a*wa+cb.b*cb.a*wb)/alpha,
    alpha
  );
}
function mixOklab(a,b,weightA=0.5){
  const ca=parseColor(a),cb=parseColor(b),wa=clamp(weightA),wb=1-wa;
  const alpha=ca.a*wa+cb.a*wb;
  if(alpha<EPSILON)return color(0,0,0,0);
  const la=rgbToOklab(ca),lb=rgbToOklab(cb);
  const lab={
    l:(la.l*ca.a*wa+lb.l*cb.a*wb)/alpha,
    a:(la.a*ca.a*wa+lb.a*cb.a*wb)/alpha,
    b:(la.b*ca.a*wa+lb.b*cb.a*wb)/alpha,
    alpha
  };
  const raw=oklabToRgbRaw(lab);
  if(inGamutRaw(raw))return color(raw.r,raw.g,raw.b,alpha);
  return gamutMapOklch(oklabToOklch(lab));
}
function interpolateHue(a,b,t){
  const delta=mod(b-a+180,360)-180;
  return mod(a+delta*t,360);
}
function chartPalette(seed='#165dff',count=8,mode='light'){
  const n=Math.max(1,Math.min(12,Math.trunc(Number(count)||8)));
  const base=rgbToOklch(parseColor(seed));
  const lightness=[0.88,0.78,0.69,0.61,0.54,0.47,0.40,0.33,0.28,0.23,0.18,0.13];
  const chromaWeight=[0.52,0.72,0.9,1,0.96,0.88,0.78,0.68,0.58,0.48,0.38,0.28];
  const maxC=Math.max(0.018,base.c);
  const result=[];
  for(let i=0;i<n;i+=1){
    result.push(gamutMapOklch({
      l:lightness[i],
      c:maxC*chromaWeight[i],
      h:base.h,
      alpha:1
    }));
  }
  return Object.freeze(result);
}

function scaleToTuples(scale){return Object.freeze(scale.map(colorToTuple));}
function scaleToCss(scale){return Object.freeze(scale.map(colorToCss));}

export {
  NEUTRAL_PRESETS,
  parseColor,
  colorToCss,
  colorToTuple,
  colorToHex,
  rgbToOklab,
  oklabToOklch,
  oklchToOklab,
  rgbToOklch,
  gamutMapOklch,
  generateColorScale,
  generateNeutralScale,
  relativeLuminance,
  contrastRatio,
  chooseOnColor,
  mixSrgb,
  mixOklab,
  chartPalette,
  scaleToTuples,
  scaleToCss
};
