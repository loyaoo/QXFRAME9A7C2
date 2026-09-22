(function(global,document){
'use strict';
var app=document.getElementById('qxframe9a7c2-theme-playground-app');
if(!app)return;
var catalog=global.QXFRAME9A7C2_DOCS_CATALOG||[];
var docsTheme=global.QXFRAME9A7C2_DOCS_THEME||null;
var STORAGE_KEY='qxframe9a7c2-theme-playground-v1';
var PRESETS=[
  {key:'nova',name:'Nova',seed:'#5b5bd6'},
  {key:'ocean',name:'Ocean',seed:'#2563eb'},
  {key:'violet',name:'Violet',seed:'#7c3aed'},
  {key:'emerald',name:'Emerald',seed:'#059669'},
  {key:'amber',name:'Amber',seed:'#d97706'},
  {key:'rose',name:'Rose',seed:'#e11d48'}
];
var BASES={
  mixed:{name:'Mixed · r2 曲线 × 强度',palette:null},
  grey:{name:'Grey · 纯灰',palette:'grey'},
  gray:{name:'Gray · 冷灰',palette:'gray'}
};
var FONTS={
  inter:{name:'Inter',value:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
  system:{name:'System',value:'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
  humanist:{name:'Humanist',value:'"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif'},
  serif:{name:'Serif',value:'Georgia, "Times New Roman", serif'},
  mono:{name:'Mono',value:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'}
};
var defaults={mode:'light',preset:'nova',primarySeed:'#5b5bd6',base:'mixed',mixRatio:100,font:'inter',radius:8,focusRing:2,query:'',category:'all',kind:'all',railCollapsed:false};
var state=loadState();
var componentRecords=new Map();
var observer=null;
var toastTimer=0;
var media=global.matchMedia?global.matchMedia('(prefers-color-scheme: dark)'):null;

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});}
function clamp(n,min,max){n=Number(n);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;}
function loadState(){try{var raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{};delete raw.customPrimary;if(!/^#[0-9a-f]{6}$/i.test(raw.primarySeed||'')){var old=PRESETS.find(function(x){return x.key===raw.preset;});raw.primarySeed=old?old.seed:defaults.primarySeed;}if(!BASES[raw.base])raw.base='mixed';var merged=Object.assign({},defaults,raw);if(docsTheme){var shared=docsTheme.getState();Object.assign(merged,{mode:shared.mode,preset:shared.preset,primarySeed:shared.primarySeed,base:shared.base,mixRatio:shared.mixRatio,font:shared.font,radius:shared.radius,focusRing:shared.focusRing});}return merged;}catch(_){var fallback=Object.assign({},defaults);if(docsTheme){var sharedFallback=docsTheme.getState();Object.assign(fallback,{mode:sharedFallback.mode,preset:sharedFallback.preset,primarySeed:sharedFallback.primarySeed,base:sharedFallback.base,mixRatio:sharedFallback.mixRatio,font:sharedFallback.font,radius:sharedFallback.radius,focusRing:sharedFallback.focusRing});}return fallback;}}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}}
function effectiveMode(){if(state.mode==='system')return media&&media.matches?'dark':'light';return state.mode==='dark'?'dark':'light';}
function preset(){return PRESETS.find(function(x){return x.key===state.preset;})||{key:'custom',name:'Custom',seed:state.primarySeed||defaults.primarySeed};}
function primary(){return /^#[0-9a-f]{6}$/i.test(state.primarySeed||'')?state.primarySeed:preset().seed;}
function base(){return BASES[state.base]||BASES.mixed;}
function font(){return FONTS[state.font]||FONTS.inter;}
function setPublic(name,value){var root=document.documentElement;if(value==null||value==='')root.style.removeProperty(name);else root.style.setProperty(name,value);}
function applyTheme(){
  var mode=effectiveMode(),root=document.documentElement,selectedBase=base();
  if(docsTheme){
    docsTheme.setState({mode:state.mode,preset:state.preset,primarySeed:primary(),base:state.base,mixRatio:state.mixRatio,font:state.font,radius:state.radius,focusRing:state.focusRing});
    var shared=docsTheme.getState();
    state.mode=shared.mode;state.preset=shared.preset;state.primarySeed=shared.primarySeed;state.base=shared.base;state.mixRatio=shared.mixRatio;state.font=shared.font;state.radius=shared.radius;state.focusRing=shared.focusRing;
    mode=shared.effectiveMode;selectedBase=base();
  }else{
    root.classList.toggle('qxframe9a7c2-theme-dark',mode==='dark');
    root.classList.toggle('qxframe9a7c2-theme-light',mode!=='dark');
    root.setAttribute('data-theme',mode);root.setAttribute('data-qxframe9a7c2-theme',mode);
    setPublic('--qxframe9a7c2-theme-primary',primary());setPublic('--qxframe9a7c2-theme-neutral-mix-ratio',clamp(state.mixRatio,0,100)+'%');
    for(var step=1;step<=13;step+=1){setPublic('--qxframe9a7c2-theme-primary-'+step,null);setPublic('--qxframe9a7c2-theme-neutral-'+step,selectedBase.palette?'rgb(var(--qxframe9a7c2-color-'+selectedBase.palette+'-'+step+'))':null);}
    setPublic('--qxframe9a7c2-theme-radius',clamp(state.radius,0,24)+'px');setPublic('--qxframe9a7c2-theme-font-family',font().value);setPublic('--qxframe9a7c2-theme-focus-ring-size',clamp(state.focusRing,1,4)+'px');
  }
  updateThemeControls();updateLiveBoard();updateExport();saveState();
}
function themeCss(){
  var selectedBase=base();
  var lines=[
    ':root {',
    '  --qxframe9a7c2-theme-primary: '+primary()+';',
    '  --qxframe9a7c2-theme-neutral-mix-ratio: '+clamp(state.mixRatio,0,100)+'%;',
    '  --qxframe9a7c2-theme-radius: '+clamp(state.radius,0,24)+'px;',
    '  --qxframe9a7c2-theme-font-family: '+font().value+';',
    '  --qxframe9a7c2-theme-focus-ring-size: '+clamp(state.focusRing,1,4)+'px;'
  ];
  if(selectedBase.palette){for(var step=1;step<=13;step+=1)lines.push('  --qxframe9a7c2-theme-neutral-'+step+': rgb(var(--qxframe9a7c2-color-'+selectedBase.palette+'-'+step+'));');}
  else lines.push('  /* Neutral omitted intentionally: the theme intermediary synthesizes the 13-tone MIX auxiliary palette from Grey + resolved Primary (统一可调比例). */');
  lines.push('}');return lines.join('\n');
}

function button(text,attrs){attrs=attrs||{};var b=document.createElement('button');b.type='button';b.className='qxframe9a7c2-button is-'+(attrs.color||'default')+' is-'+(attrs.appearance||'outlined')+' is-'+(attrs.size||'sm')+(attrs.extra?' '+attrs.extra:'');b.textContent=text;return b;}
function icon(name){var i=document.createElement('i');i.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+name+' is-line is-round is-stroke-3 is-sm';return i;}
function toast(message){var host=document.querySelector('[data-qxframe9a7c2-play-toast]');if(!host)return;host.textContent=String(message);host.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(function(){host.classList.remove('is-visible');},1800);}
function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).catch(function(){return fallbackCopy(text);});return fallbackCopy(text);}
function fallbackCopy(text){return new Promise(function(resolve,reject){try{var area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();var ok=document.execCommand('copy');area.remove();if(ok)resolve();else reject(new Error('copy failed'));}catch(error){reject(error);}});}
function baseOptions(){return Object.keys(BASES).map(function(key){return '<option value="'+key+'">'+esc(BASES[key].name)+'</option>';}).join('');}
function fontOptions(){return Object.keys(FONTS).map(function(key){return '<option value="'+key+'">'+esc(FONTS[key].name)+'</option>';}).join('');}
function categoryOptions(){var cats=[];catalog.forEach(function(x){if(cats.indexOf(x.category)<0)cats.push(x.category);});return '<option value="all">全部分类</option>'+cats.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join('');}
function renderShell(){
  var dynamicCount=catalog.filter(function(x){return x.api!=='CSS';}).length,staticCount=catalog.length-dynamicCount;
  app.innerHTML=''+
  '<div class="qxframe9a7c2-play-shell" data-qxframe9a7c2-play-shell>'+
    '<aside class="qxframe9a7c2-play-rail" data-qxframe9a7c2-play-rail>'+
      '<div class="qxframe9a7c2-play-rail-head">'+
        '<a class="qxframe9a7c2-play-brand" href="index.html"><span class="qxframe9a7c2-play-brand-mark">QXFRAME9A7C2</span><span class="qxframe9a7c2-play-brand-copy"><strong>Theme Playground</strong><span>all component live canvas</span></span></a>'+
        '<button class="qxframe9a7c2-play-icon-button" type="button" data-qxframe9a7c2-play-collapse><span class="qxframe9a7c2-icon qxframe9a7c2-icon-menu is-line is-round is-stroke-3 is-sm"></span></button>'+
      '</div>'+
      '<div class="qxframe9a7c2-play-settings">'+
        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>模式</small><strong data-qxframe9a7c2-mode-label>浅色</strong></span></div><div class="qxframe9a7c2-play-segments" data-qxframe9a7c2-mode-segments><button class="qxframe9a7c2-play-segment" data-value="light">Light</button><button class="qxframe9a7c2-play-segment" data-value="dark">Dark</button><button class="qxframe9a7c2-play-segment" data-value="system">System</button></div></section>'+
        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>Primary Seed</small><strong data-qxframe9a7c2-preset-label>Nova</strong></span><span class="qxframe9a7c2-play-setting-value" data-qxframe9a7c2-primary-value>#5b5bd6</span></div><div class="qxframe9a7c2-play-palette" data-qxframe9a7c2-preset-palette></div><div class="qxframe9a7c2-play-seed-row"><input class="qxframe9a7c2-play-seed-color" type="color" data-qxframe9a7c2-primary-color value="#5b5bd6"><input class="qxframe9a7c2-play-dark-input" type="text" data-qxframe9a7c2-primary-text value="#5b5bd6" spellcheck="false"></div><div class="qxframe9a7c2-play-palette-contract"><strong data-qxframe9a7c2-primary-family>Seed / optional 13 tones</strong><small>Primary 可只输入一个 Seed 自动解析 13 色，也可由项目 CSS 逐阶覆盖；Light/Dark 继续使用框架既有转换规则。</small></div></section>'+
        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>辅助色</small><strong>Neutral Palette</strong></span></div><select class="qxframe9a7c2-play-dark-select" data-qxframe9a7c2-base>'+baseOptions()+'</select></section>'+        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>MIX 强度</small><strong data-qxframe9a7c2-mix-label>100%</strong></span></div><div class="qxframe9a7c2-play-range-row"><input class="qxframe9a7c2-play-range" type="range" min="0" max="100" step="1" data-qxframe9a7c2-mix><span class="qxframe9a7c2-play-setting-value">0–100% · 100% = r2 原始 MIX</span></div></section>'+

        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>字体</small><strong>Theme Font</strong></span></div><select class="qxframe9a7c2-play-dark-select" data-qxframe9a7c2-font>'+fontOptions()+'</select></section>'+
        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>圆角</small><strong data-qxframe9a7c2-radius-label>8px</strong></span><span class="qxframe9a7c2-play-radius-preview" data-qxframe9a7c2-radius-preview></span></div><div class="qxframe9a7c2-play-range-row"><input class="qxframe9a7c2-play-range" type="range" min="0" max="24" step="1" data-qxframe9a7c2-radius><span class="qxframe9a7c2-play-setting-value">0–24</span></div></section>'+
        '<section class="qxframe9a7c2-play-setting"><div class="qxframe9a7c2-play-setting-head"><span class="qxframe9a7c2-play-setting-label"><small>Focus Ring</small><strong data-qxframe9a7c2-focus-label>2px</strong></span></div><div class="qxframe9a7c2-play-range-row"><input class="qxframe9a7c2-play-range" type="range" min="1" max="4" step="1" data-qxframe9a7c2-focus><span class="qxframe9a7c2-play-setting-value">1–4</span></div></section>'+
      '</div>'+
      '<div class="qxframe9a7c2-play-rail-actions"><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-qxframe9a7c2-reset>Reset</button><button class="qxframe9a7c2-button is-default is-solid is-sm" type="button" data-qxframe9a7c2-shuffle>Shuffle</button></div>'+
      '<details class="qxframe9a7c2-play-export"><summary>导出当前 Public Theme CSS</summary><textarea readonly data-qxframe9a7c2-export></textarea><div class="qxframe9a7c2-play-export-actions"><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-qxframe9a7c2-copy>Copy CSS</button></div></details>'+
    '</aside>'+
    '<main class="qxframe9a7c2-play-main">'+
      '<header class="qxframe9a7c2-play-toolbar">'+
        '<button class="qxframe9a7c2-play-icon-button qxframe9a7c2-play-mobile-menu" type="button" data-qxframe9a7c2-mobile-menu><span class="qxframe9a7c2-icon qxframe9a7c2-icon-menu is-line is-round is-stroke-3 is-sm"></span></button>'+
        '<a class="qxframe9a7c2-play-toolbar-home" href="index.html"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-arrow-left is-line is-round is-stroke-3 is-sm"></span><span>组件中心</span></a><a class="qxframe9a7c2-play-toolbar-home" href="tokens.html"><span>Tokens / 13-tone</span></a>'+
        '<div class="qxframe9a7c2-play-search-wrap"><span class="qxframe9a7c2-play-search-icon"></span><input class="qxframe9a7c2-form-input is-md" type="search" data-qxframe9a7c2-search placeholder="搜索 66 个组件、中文名称或能力…"></div>'+
        '<select class="qxframe9a7c2-form-select is-md" data-qxframe9a7c2-category>'+categoryOptions()+'</select>'+
        '<button class="qxframe9a7c2-button is-default is-outlined is-sm qxframe9a7c2-play-filter-button" type="button" data-qxframe9a7c2-kind="all">全部</button>'+
        '<button class="qxframe9a7c2-button is-default is-outlined is-sm qxframe9a7c2-play-filter-button" type="button" data-qxframe9a7c2-kind="dynamic">动态</button>'+
        '<button class="qxframe9a7c2-button is-default is-outlined is-sm qxframe9a7c2-play-filter-button" type="button" data-qxframe9a7c2-kind="static">静态</button>'+
        '<span class="qxframe9a7c2-play-count" data-qxframe9a7c2-count></span>'+
      '</header>'+
      '<div class="qxframe9a7c2-play-content">'+
        '<section class="qxframe9a7c2-play-intro">'+
          '<div class="qxframe9a7c2-play-hero"><div class="qxframe9a7c2-play-eyebrow">UNIFIED VISUAL SYSTEM · LIVE THEME CANVAS</div><h1>一个页面看完所有动态 / 静态组件</h1><p>左侧修改 Primary Seed、Neutral Policy、字体、圆角、Focus Ring 或 Light/Dark，右侧全部组件立即继承同一套 public theme contract。13-tone Primary / MIX Auxiliary / Neutral、semantic 与 foundation token 的逐项值请到 Tokens Reference 查看；这里专注跨组件 live canvas。</p><div class="qxframe9a7c2-play-hero-actions"><button class="qxframe9a7c2-button is-primary is-solid is-md" type="button" data-qxframe9a7c2-scroll-components>查看全部组件</button><button class="qxframe9a7c2-button is-default is-outlined is-md" type="button" data-qxframe9a7c2-copy-top>复制 Theme CSS</button></div><div class="qxframe9a7c2-play-stat-row"><span class="qxframe9a7c2-play-stat"><strong>'+catalog.length+'</strong><span>全部组件</span></span><span class="qxframe9a7c2-play-stat"><strong>'+dynamicCount+'</strong><span>动态 / Runtime</span></span><span class="qxframe9a7c2-play-stat"><strong>'+staticCount+'</strong><span>静态 / CSS</span></span></div></div>'+
          '<div class="qxframe9a7c2-play-token-board"><h2>Resolved preview</h2><div class="qxframe9a7c2-play-live-swatches" data-qxframe9a7c2-live-swatches></div><div class="qxframe9a7c2-play-type-sample"><strong>Designing with rhythm and hierarchy.</strong><span>Theme changes are projected through the same public token chain used by every component below.</span></div><div class="qxframe9a7c2-docs-control-row"><button class="qxframe9a7c2-button is-primary is-solid is-md" type="button">Primary</button><button class="qxframe9a7c2-button is-default is-outlined is-md" type="button">Secondary</button><input class="qxframe9a7c2-form-input is-md" value="Native field"></div></div>'+
        '</section>'+
        '<section id="all-components"><div class="qxframe9a7c2-play-section-head"><div><h2>All Components</h2><p>默认每个组件挂载第一个 canonical live demo；需要时可在卡片底部展开全部示例。</p></div></div><div class="qxframe9a7c2-play-grid" data-qxframe9a7c2-grid></div></section>'+
      '</div>'+
    '</main>'+
  '</div><div class="qxframe9a7c2-play-toast" data-qxframe9a7c2-play-toast></div>';
  var searchIcon=document.querySelector('.qxframe9a7c2-play-search-icon');if(searchIcon)searchIcon.appendChild(icon('search'));
  renderPresetPalette();
  renderCards();
  wireShell();
}
function renderPresetPalette(){var host=document.querySelector('[data-qxframe9a7c2-preset-palette]');if(!host)return;host.innerHTML='';PRESETS.forEach(function(p){var b=document.createElement('button');b.type='button';b.className='qxframe9a7c2-play-swatch';b.style.setProperty('--swatch',p.seed);b.title=p.name+' · '+p.seed;b.dataset.preset=p.key;b.addEventListener('click',function(){state.preset=p.key;state.primarySeed=p.seed;applyTheme();});host.appendChild(b);});}
function cardKind(meta){return meta.api==='CSS'?'static':'dynamic';}
function renderCards(){var grid=document.querySelector('[data-qxframe9a7c2-grid]');if(!grid)return;grid.innerHTML='';catalog.forEach(function(meta){var currentChange=meta.docsChange||null;var card=document.createElement('article');card.className='qxframe9a7c2-play-card'+(currentChange?' is-release-highlight':'');card.id='component-'+meta.slug;card.dataset.name=meta.name;card.dataset.slug=meta.slug;card.dataset.category=meta.category;card.dataset.kind=cardKind(meta);if(currentChange){card.dataset.releaseHighlight=currentChange.version||'';card.dataset.releaseChange=currentChange.summary||'';}card.dataset.search=[meta.name,meta.cn,meta.description,meta.category].concat(meta.features||[]).join(' ').toLowerCase();card.innerHTML='<header class="qxframe9a7c2-play-card-head"><div class="qxframe9a7c2-play-card-title"><div class="qxframe9a7c2-play-card-title-row"><strong>'+esc(meta.name)+'</strong><span class="qxframe9a7c2-play-kind '+(cardKind(meta)==='dynamic'?'is-dynamic':'')+'">'+(cardKind(meta)==='dynamic'?'动态':'静态')+'</span>'+(currentChange?'<span class="qxframe9a7c2-play-release-badge" title="'+esc(currentChange.summary||currentChange.label||'Updated docs')+'">'+esc([currentChange.version,currentChange.label].filter(Boolean).join(' · '))+'</span>':'')+'</div><small>'+esc(meta.cn)+' · '+esc(meta.category)+'</small></div><a class="qxframe9a7c2-play-card-link" href="components/'+esc(meta.slug)+'.html"><span>完整文档</span><span class="qxframe9a7c2-icon qxframe9a7c2-icon-external-link is-line is-round is-stroke-3 is-xs"></span></a></header><div class="qxframe9a7c2-play-card-body" data-qxframe9a7c2-card-body><div class="qxframe9a7c2-play-example"><div class="qxframe9a7c2-play-example-title"><strong>Loading canonical demo…</strong><span>'+esc(meta.description)+'</span></div></div></div><footer class="qxframe9a7c2-play-card-foot"><span class="qxframe9a7c2-play-card-log" data-qxframe9a7c2-card-log>等待进入视口后挂载</span><button class="qxframe9a7c2-button is-default is-text is-sm qxframe9a7c2-play-card-toggle" type="button" data-qxframe9a7c2-card-toggle hidden>展开全部</button></footer>';
    grid.appendChild(card);componentRecords.set(meta.slug,{meta:meta,card:card,specs:null,instances:[],expanded:false,mounted:false});
  });
  setupObserver();applyFilters();
}
function setupObserver(){if(observer)observer.disconnect();if('IntersectionObserver' in global){observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){var rec=componentRecords.get(entry.target.dataset.slug);if(rec&&!rec.mounted)mountRecord(rec);observer.unobserve(entry.target);}});},{rootMargin:'600px 0px'});componentRecords.forEach(function(rec){observer.observe(rec.card);});}else componentRecords.forEach(function(rec){mountRecord(rec);});}
function makeCtx(rec,specs){return {meta:rec.meta,example:function(spec){specs.push(spec);return spec;},log:function(message){var host=rec.card.querySelector('[data-qxframe9a7c2-card-log]');if(host)host.textContent=String(message);},track:function(instance){if(instance&&typeof instance==='object')rec.instances.push(instance);return instance;},refresh:function(){},q:function(){return global.QXFRAME9A7C2||null;},button:function(text,fn){var b=button(text,{appearance:'outlined',size:'sm'});if(typeof fn==='function')b.addEventListener('click',function(event){try{fn(event);}catch(error){var host=rec.card.querySelector('[data-qxframe9a7c2-card-log]');if(host)host.textContent='Action error: '+error.message;}});return b;},row:function(){var row=document.createElement('div');row.className='qxframe9a7c2-docs-control-row';return row;}};}
function destroyRecord(rec){while(rec.instances.length){var inst=rec.instances.pop();try{if(inst&&typeof inst.destroy==='function')inst.destroy('theme-playground-remount');}catch(_){}}var body=rec.card.querySelector('[data-qxframe9a7c2-card-body]');if(body)body.innerHTML='';}
function mountRecord(rec){if(!global.QXFRAME9A7C2ComponentDemos||typeof global.QXFRAME9A7C2ComponentDemos.mount!=='function'){setTimeout(function(){mountRecord(rec);},0);return;}var specs=[];try{global.QXFRAME9A7C2ComponentDemos.mount(rec.meta.name,makeCtx(rec,specs));rec.specs=specs;rec.mounted=true;renderRecord(rec);}catch(error){rec.mounted=true;var body=rec.card.querySelector('[data-qxframe9a7c2-card-body]');if(body)body.innerHTML='<div class="qxframe9a7c2-play-card-error">'+esc(error&&error.stack||error)+'</div>';var log=rec.card.querySelector('[data-qxframe9a7c2-card-log]');if(log)log.textContent='Demo mount failed';}}
function renderRecord(rec){destroyRecord(rec);var body=rec.card.querySelector('[data-qxframe9a7c2-card-body]'),toggle=rec.card.querySelector('[data-qxframe9a7c2-card-toggle]'),log=rec.card.querySelector('[data-qxframe9a7c2-card-log]');if(!body)return;var specs=rec.specs||[];if(!specs.length){body.innerHTML='<div class="qxframe9a7c2-play-card-error">No canonical demo registered for '+esc(rec.meta.name)+'.</div>';if(log)log.textContent='No demo spec';return;}var selected=rec.expanded?specs:specs.slice(0,1);selected.forEach(function(spec){var section=document.createElement('section');section.className='qxframe9a7c2-play-example';section.innerHTML='<div class="qxframe9a7c2-play-example-title"><strong>'+esc(spec.title||rec.meta.name)+'</strong><span>'+esc(spec.description||'')+'</span></div><div class="qxframe9a7c2-play-example-live '+(spec.column?'is-column':'')+'"><div class="qxframe9a7c2-play-demo-host"></div></div>';body.appendChild(section);var host=section.querySelector('.qxframe9a7c2-play-demo-host');try{spec.mount(host);}catch(error){host.innerHTML='<div class="qxframe9a7c2-play-card-error">'+esc(error&&error.stack||error)+'</div>';if(log)log.textContent='Demo error · '+String(spec.title||rec.meta.name);}});if(toggle){toggle.hidden=specs.length<=1;toggle.textContent=rec.expanded?'收起':'展开全部 '+specs.length+' 个';toggle.onclick=function(){rec.expanded=!rec.expanded;rec.card.classList.toggle('is-expanded',rec.expanded);renderRecord(rec);};}if(log&&log.textContent.indexOf('error')<0&&log.textContent.indexOf('Error')<0)log.textContent=(rec.expanded?specs.length:1)+'/'+specs.length+' canonical demo'+(specs.length>1?'s':'')+' mounted';}
function applyFilters(){var q=String(state.query||'').trim().toLowerCase(),visible=0;componentRecords.forEach(function(rec){var meta=rec.meta,kind=cardKind(meta),show=(!q||rec.card.dataset.search.indexOf(q)>=0)&&(state.category==='all'||meta.category===state.category)&&(state.kind==='all'||kind===state.kind);rec.card.hidden=!show;if(show)visible+=1;});var count=document.querySelector('[data-qxframe9a7c2-count]');if(count)count.textContent=visible+' / '+catalog.length+' 组件';document.querySelectorAll('[data-qxframe9a7c2-kind]').forEach(function(b){b.classList.toggle('is-active',b.dataset.qxKind===state.kind);});if(!visible){var grid=document.querySelector('[data-qxframe9a7c2-grid]');if(grid&&!grid.querySelector('.qxframe9a7c2-play-empty')){var empty=document.createElement('div');empty.className='qxframe9a7c2-play-empty';empty.textContent='没有匹配的组件。';grid.appendChild(empty);}}else{var e=document.querySelector('.qxframe9a7c2-play-empty');if(e)e.remove();}saveState();}
function updateThemeControls(){
  var mode=effectiveMode(),p=preset(),pv=primary();
  document.querySelectorAll('[data-qxframe9a7c2-mode-segments] .qxframe9a7c2-play-segment').forEach(function(b){b.classList.toggle('is-active',b.dataset.value===state.mode);});
  var modeLabel=document.querySelector('[data-qxframe9a7c2-mode-label]');if(modeLabel)modeLabel.textContent=state.mode==='system'?'跟随系统 · '+(mode==='dark'?'Dark':'Light'):(mode==='dark'?'深色':'浅色');
  document.querySelectorAll('[data-preset]').forEach(function(b){var item=PRESETS.find(function(x){return x.key===b.dataset.preset;});b.classList.toggle('is-active',b.dataset.preset===state.preset&&item&&item.seed.toLowerCase()===pv.toLowerCase());if(item)b.style.setProperty('--swatch',item.seed);});
  var presetLabel=document.querySelector('[data-qxframe9a7c2-preset-label]');if(presetLabel)presetLabel.textContent=p.name;
  var pvHost=document.querySelector('[data-qxframe9a7c2-primary-value]');if(pvHost)pvHost.textContent=pv;
  var familyHost=document.querySelector('[data-qxframe9a7c2-primary-family]');if(familyHost)familyHost.textContent='Seed / optional 13 tones';
  var seedColor=document.querySelector('[data-qxframe9a7c2-primary-color]');if(seedColor)seedColor.value=pv;
  var seedText=document.querySelector('[data-qxframe9a7c2-primary-text]');if(seedText)seedText.value=pv;
  var baseSel=document.querySelector('[data-qxframe9a7c2-base]');if(baseSel)baseSel.value=state.base;
  var mix=document.querySelector('[data-qxframe9a7c2-mix]');if(mix){mix.value=state.mixRatio;mix.disabled=state.base!=='mixed';}var mixLabel=document.querySelector('[data-qxframe9a7c2-mix-label]');if(mixLabel)mixLabel.textContent=state.mixRatio+'%'+(state.mixRatio===100?' · r2':'');
  var fontSel=document.querySelector('[data-qxframe9a7c2-font]');if(fontSel)fontSel.value=state.font;
  var radius=document.querySelector('[data-qxframe9a7c2-radius]');if(radius)radius.value=state.radius;
  var radiusLabel=document.querySelector('[data-qxframe9a7c2-radius-label]');if(radiusLabel)radiusLabel.textContent=state.radius+'px';
  var radiusPreview=document.querySelector('[data-qxframe9a7c2-radius-preview]');if(radiusPreview)radiusPreview.style.setProperty('--radius',state.radius+'px');
  var focus=document.querySelector('[data-qxframe9a7c2-focus]');if(focus)focus.value=state.focusRing;
  var focusLabel=document.querySelector('[data-qxframe9a7c2-focus-label]');if(focusLabel)focusLabel.textContent=state.focusRing+'px';
}
function updateLiveBoard(){var host=document.querySelector('[data-qxframe9a7c2-live-swatches]');if(!host)return;var tokens=[['Accent','--_qxframe9a7c2-semantic-accent'],['Surface','--_qxframe9a7c2-semantic-surface'],['Muted','--_qxframe9a7c2-semantic-surface-muted'],['Border','--_qxframe9a7c2-semantic-border'],['Text','--_qxframe9a7c2-semantic-text'],['Focus','--_qxframe9a7c2-semantic-focus']];host.innerHTML=tokens.map(function(x){return '<span class="qxframe9a7c2-play-live-swatch"><i style="--tone:var('+x[1]+')"></i><small>'+x[0]+'</small></span>';}).join('');}
function updateExport(){var area=document.querySelector('[data-qxframe9a7c2-export]');if(area)area.value=themeCss();}
function wireShell(){
  var shell=document.querySelector('[data-qxframe9a7c2-play-shell]');
  document.querySelectorAll('[data-qxframe9a7c2-mode-segments] .qxframe9a7c2-play-segment').forEach(function(b){b.addEventListener('click',function(){state.mode=b.dataset.value;applyTheme();});});
  var seedColor=document.querySelector('[data-qxframe9a7c2-primary-color]');if(seedColor)seedColor.addEventListener('input',function(){state.primarySeed=this.value;state.preset='custom';applyTheme();});
  var seedText=document.querySelector('[data-qxframe9a7c2-primary-text]');if(seedText){seedText.addEventListener('change',function(){var value=String(this.value||'').trim();if(/^#[0-9a-f]{6}$/i.test(value)){state.primarySeed=value;state.preset='custom';applyTheme();}else{this.value=primary();toast('请输入 6 位 HEX，例如 #2563eb');}});}
  var baseSel=document.querySelector('[data-qxframe9a7c2-base]');if(baseSel)baseSel.addEventListener('change',function(){state.base=this.value;applyTheme();});
  var mix=document.querySelector('[data-qxframe9a7c2-mix]');if(mix)mix.addEventListener('input',function(){state.mixRatio=clamp(this.value,0,100);applyTheme();});
  var fontSel=document.querySelector('[data-qxframe9a7c2-font]');if(fontSel)fontSel.addEventListener('change',function(){state.font=this.value;applyTheme();});
  var radius=document.querySelector('[data-qxframe9a7c2-radius]');if(radius)radius.addEventListener('input',function(){state.radius=clamp(this.value,0,24);applyTheme();});
  var focus=document.querySelector('[data-qxframe9a7c2-focus]');if(focus)focus.addEventListener('input',function(){state.focusRing=clamp(this.value,1,4);applyTheme();});
  var reset=document.querySelector('[data-qxframe9a7c2-reset]');if(reset)reset.addEventListener('click',function(){state=Object.assign({},defaults,{query:state.query,category:state.category,kind:state.kind});applyTheme();toast('主题已重置');});
  var shuffle=document.querySelector('[data-qxframe9a7c2-shuffle]');if(shuffle)shuffle.addEventListener('click',function(){var picked=PRESETS[Math.floor(Math.random()*PRESETS.length)];state.preset=picked.key;state.primarySeed=picked.seed;var bases=Object.keys(BASES),fonts=Object.keys(FONTS);state.base=bases[Math.floor(Math.random()*bases.length)];state.font=fonts[Math.floor(Math.random()*fonts.length)];state.radius=[0,4,6,8,10,12,16,20][Math.floor(Math.random()*8)];state.focusRing=[1,2,3][Math.floor(Math.random()*3)];applyTheme();toast('已随机生成一组主题');});
  function doCopy(){copyText(themeCss()).then(function(){toast('Public Theme CSS 已复制');},function(){toast('复制失败，请从左侧导出框手动复制');});}
  var copy=document.querySelector('[data-qxframe9a7c2-copy]');if(copy)copy.addEventListener('click',doCopy);var copyTop=document.querySelector('[data-qxframe9a7c2-copy-top]');if(copyTop)copyTop.addEventListener('click',doCopy);
  var collapse=document.querySelector('[data-qxframe9a7c2-play-collapse]');if(collapse)collapse.addEventListener('click',function(){if(global.innerWidth<=980){shell.classList.remove('is-mobile-rail-open');return;}state.railCollapsed=!state.railCollapsed;shell.classList.toggle('is-rail-collapsed',state.railCollapsed);saveState();});
  var mobile=document.querySelector('[data-qxframe9a7c2-mobile-menu]');if(mobile)mobile.addEventListener('click',function(){shell.classList.toggle('is-mobile-rail-open');});
  var search=document.querySelector('[data-qxframe9a7c2-search]');if(search){search.value=state.query||'';search.addEventListener('input',function(){state.query=this.value;applyFilters();});}
  var category=document.querySelector('[data-qxframe9a7c2-category]');if(category){category.value=state.category;category.addEventListener('change',function(){state.category=this.value;applyFilters();});}
  document.querySelectorAll('[data-qxframe9a7c2-kind]').forEach(function(b){b.addEventListener('click',function(){state.kind=this.dataset.qxKind;applyFilters();});});
  var scroll=document.querySelector('[data-qxframe9a7c2-scroll-components]');if(scroll)scroll.addEventListener('click',function(){var target=document.getElementById('all-components');if(target)target.scrollIntoView({behavior:'smooth',block:'start'});});
  if(state.railCollapsed&&global.innerWidth>980)shell.classList.add('is-rail-collapsed');
  if(media&&typeof media.addEventListener==='function')media.addEventListener('change',function(){if(state.mode==='system')applyTheme();});
}
function cleanup(){componentRecords.forEach(function(rec){destroyRecord(rec);});if(observer)observer.disconnect();}
function boot(){renderShell();applyTheme();applyFilters();global.addEventListener('pagehide',cleanup,{once:true});global.QXFRAME9A7C2_THEME_PLAYGROUND=Object.freeze({getState:function(){return Object.assign({},state);},setTheme:function(next){next=Object.assign({},next||{});delete next.customPrimary;if(next.preset){var item=PRESETS.find(function(x){return x.key===next.preset;});if(item&&!next.primarySeed)next.primarySeed=item.seed;}Object.assign(state,next);applyTheme();return Object.assign({},state);},exportCSS:themeCss});}
function waitForDemos(){if(global.QXFRAME9A7C2ComponentDemos&&typeof global.QXFRAME9A7C2ComponentDemos.mount==='function'){boot();return;}setTimeout(waitForDemos,0);}
if(global.QXFRAME9A7C2){app.innerHTML='<div class="qxframe9a7c2-play-loading">Loading all QXFRAME9A7C2 components…</div>';waitForDemos();}else app.innerHTML='<div class="qxframe9a7c2-play-loading">QXFRAME9A7C2 dist runtime is required.</div>';
})(window,document);
