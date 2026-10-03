// Serialized into the mandatory Chromium acceptance probe. Expectations are
// physical design acceptance values, independent of the CSS expressions.
export function geometryBrowserProbe(scope,host,configs){
  const failures=[],sizes=['xs','sm','md','lg','xl'],heights={tight:[20,24,28,32,36],compact:[24,28,32,36,40],standard:[28,32,36,40,44],roomy:[32,36,40,44,48]};
  const p='--qxframe9a7c2-theme-v2-',num=(node,key)=>parseFloat(getComputedStyle(node)[key]);let checks=0;
  const eq=(id,actual,expected)=>{checks++;if(Math.abs(actual-expected)>1e-6||!Number.isFinite(actual))failures.push({id,actual,expected});};
  const apply=config=>{scope.setAttribute('data-qxframe9a7c2-style',config.style);for(const [role,value]of Object.entries(config.geometry))scope.style.setProperty(p+role,value);};
  const values=config=>Object.fromEntries(Object.entries(config.geometry).map(([key,value])=>[key,parseFloat(value)*16]));
  for(const config of configs){
    apply(config);const md=values(config),id=config.style+'/'+Object.values(config.options).join('/');
    for(const [i,size]of sizes.entries()){
      host.innerHTML='<div class="qxframe9a7c2-card is-'+size+'"><div class="qxframe9a7c2-card-body"><button class="qxframe9a7c2-button is-'+size+'">Text</button><button class="qxframe9a7c2-button independent">Child</button><div class="qxframe9a7c2-input is-'+size+'"><input class="qxframe9a7c2-input-control"></div></div></div><div class="qxframe9a7c2-switch is-'+size+'"><input class="qxframe9a7c2-switch-input" type="checkbox"><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></div><div class="qxframe9a7c2-slider is-'+size+'"><div class="qxframe9a7c2-slider-rail"></div><button class="qxframe9a7c2-slider-handle"></button></div><div class="qxframe9a7c2-progress is-'+size+'"><div class="qxframe9a7c2-progress-inner"></div><div class="qxframe9a7c2-progress-circle-holder"></div></div>';
      const get=selector=>host.querySelector('.qxframe9a7c2-'+selector),button=get('button'),t=i-2;
      eq(id+'/'+size+'/button-min',num(button,'minHeight'),heights[config.options.density][i]);
      eq(id+'/'+size+'/button-rendered',button.getBoundingClientRect().height,heights[config.options.density][i]);
      eq(id+'/'+size+'/input-rendered',get('input').getBoundingClientRect().height,heights[config.options.density][i]);
      eq(id+'/'+size+'/nested-default-md',num(host.querySelector('.independent'),'minHeight'),heights[config.options.density][2]);
      eq(id+'/'+size+'/control-radius',num(button,'borderTopLeftRadius'),Math.floor(md['radius-action-md']*(1+t*.125)/2+.5)*2);
      eq(id+'/'+size+'/card-radius',num(get('card'),'borderTopLeftRadius'),Math.floor(md['radius-surface-md']*(1+t*.125)/2+.5)*2);
      eq(id+'/'+size+'/card-padding',num(get('card-body'),'paddingLeft'),Math.floor(md['surface-padding-md']*(1+t*.125)/2+.5)*2);
      const track=get('switch-track'),thumb=get('switch-thumb'),input=get('switch-input'),h=md['switch-height-md']+t*2,w=md['switch-width-md']+t*4,inset=md['switch-inset-md'];
      eq(id+'/'+size+'/switch-height',track.getBoundingClientRect().height,h);eq(id+'/'+size+'/switch-width',track.getBoundingClientRect().width,w);
      eq(id+'/'+size+'/thumb-height',thumb.getBoundingClientRect().height,h-2*inset);
      for(const border of [0,1]){
        track.style.setProperty('--_qxframe9a7c2-switch-track-border-width',border+'px');
        input.checked=false;eq(id+'/'+size+'/off-inset/'+border,thumb.getBoundingClientRect().left-track.getBoundingClientRect().left,inset);
        input.checked=true;eq(id+'/'+size+'/on-inset/'+border,track.getBoundingClientRect().right-thumb.getBoundingClientRect().right,inset);
      }
      eq(id+'/'+size+'/slider-track',get('slider-rail').getBoundingClientRect().height,Math.max(2,md['slider-track-md']+t*2));
      eq(id+'/'+size+'/slider-thumb',get('slider-handle').getBoundingClientRect().height,md['slider-thumb-md']+t*2);
      eq(id+'/'+size+'/progress-track',get('progress-inner').getBoundingClientRect().height,Math.max(2,md['progress-track-md']+t*2));
      eq(id+'/'+size+'/progress-ring',get('progress-circle-holder').getBoundingClientRect().width,Math.floor(md['progress-ring-md']*(1+t*.25)/2+.5)*2);
    }
  }
  // Local md input changes all sizes, then deleting it restores the shared input.
  apply(configs.find(c=>c.style==='vega'&&c.options.density==='standard'&&c.options.radius==='sm'&&c.options.spacing==='normal'));
  for(const [i,size]of sizes.entries()){
    host.innerHTML='<button class="qxframe9a7c2-button is-'+size+'">One</button>';const node=host.firstChild;
    node.style.setProperty(p+'control-min-block-md','2.5rem');eq('local-md/'+size,num(node,'minHeight'),[32,36,40,44,48][i]);
    node.style.removeProperty(p+'control-min-block-md');eq('delete-local-md/'+size,num(node,'minHeight'),[28,32,36,40,44][i]);
  }
  host.innerHTML='<button class="qxframe9a7c2-button"><span>First<br>Second</span></button>';eq('multiline-content-growth',host.firstChild.getBoundingClientRect().height,54);
  for(const mixed of [false,true]){
    host.innerHTML='<div class="qxframe9a7c2-button-group is-xl '+(mixed?'is-mixed-size':'')+'"><button class="qxframe9a7c2-button is-xs">First</button><button class="qxframe9a7c2-button">Second</button></div>';
    for(const [i,node]of [...host.querySelectorAll('button')].entries())eq('connected/'+mixed+'/'+i,num(node,'minHeight'),mixed?(i===0?28:36):44);
  }
  for(const role of Object.keys(configs[0].geometry))scope.style.removeProperty(p+role);
  return {configurations:configs.length,sizesPerConfiguration:5,checks,failures,tolerance:'1e-6 CSS px; even reference geometry, 1px border exception'};
}
