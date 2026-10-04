import {generateThemeV2,serializeThemeV2,parseThemeV2} from './engine-v2.mjs';
import {SEMANTIC_STYLES,CORE_ROLES,OPTIONAL_ROLES,OVERRIDE_ROLES} from './semantic-engine.mjs';
import {PHYSICAL_TYPES} from './type-colors-v2.mjs';
import {DENSITIES,RADII,SPACINGS} from './geometry-engine-v2.mjs';
import {TYPOGRAPHY_PROFILES,TEXT_STYLE_PROFILES,CONTROL_APPEARANCE_PROFILES,BODY_FONTS,HEADING_FONTS,MONO_FONTS,BORDER_PROFILES,SHADOW_PROFILES,MOTION_PROFILES,SURFACE_PROFILES,SHAPE_POLICIES,SHAPE_FAMILIES} from './style-engine-v2.mjs';

const STYLE_LABELS=Object.freeze({vega:'Vega（均衡）',nova:'Nova（紧凑）',maia:'Maia（圆润宽松）',lyra:'Lyra（方正等宽）',mira:'Mira（高密度）',luma:'Luma（柔和抬升）',sera:'Sera（编辑风格）',rhea:'Rhea（圆润紧凑）'});
const ROLE_LABELS=Object.freeze({
  background:'页面背景',foreground:'页面前景文字',card:'卡片背景','card-foreground':'卡片前景文字',popover:'浮层背景','popover-foreground':'浮层前景文字',
  primary:'主色','primary-foreground':'主色上的文字',secondary:'次级操作色','secondary-foreground':'次级操作文字',muted:'弱化背景','muted-foreground':'弱化文字',accent:'强调色','accent-foreground':'强调色上的文字',
  success:'成功色','success-foreground':'成功色上的文字',warning:'警告色','warning-foreground':'警告色上的文字',error:'错误色','error-foreground':'错误色上的文字',info:'信息色','info-foreground':'信息色上的文字',
  border:'默认边界',input:'输入控件边界',ring:'焦点环',mask:'遮罩',inverse:'反转背景','inverse-foreground':'反转前景文字',shadow:'投影基色',thumb:'滑块手柄色',
  sidebar:'侧栏背景','sidebar-foreground':'侧栏前景文字','sidebar-primary':'侧栏主色','sidebar-primary-foreground':'侧栏主色文字','sidebar-accent':'侧栏强调色','sidebar-accent-foreground':'侧栏强调文字','sidebar-border':'侧栏边界','sidebar-ring':'侧栏焦点环',
  'chart-1':'图表色 1','chart-2':'图表色 2','chart-3':'图表色 3','chart-4':'图表色 4','chart-5':'图表色 5','shadow-color':'投影颜色覆盖',
  'action-background':'操作背景覆盖','action-hover-background':'操作悬停背景覆盖','action-foreground':'操作文字覆盖','control-background':'控件背景覆盖','control-border':'控件边界覆盖','control-foreground':'控件文字覆盖','surface-background':'容器背景覆盖','surface-foreground':'容器文字覆盖','popup-background':'浮层背景覆盖','popup-foreground':'浮层文字覆盖','navigation-highlight-background':'导航高亮背景覆盖','navigation-highlight-foreground':'导航高亮文字覆盖'
});
const TYPE_LABELS=Object.freeze({grey:'灰色',cyan:'青色',teal:'蓝绿色',green:'绿色',lime:'青柠色',yellow:'黄色',orange:'橙色',red:'红色',pink:'粉色',purple:'紫色',blue:'蓝色',azure:'天蓝色',white:'白色',black:'黑色'});
const SHAPE_LABELS=Object.freeze({choice:'选择控件',toggle:'开关',range:'范围控件',compact:'紧凑形态',identity:'身份/头像'});
const SIZE_LABELS=Object.freeze({xs:'超小',sm:'小',md:'中',lg:'大',xl:'超大'});

// Documentation editor only. Production components do not import the generator.
export function mountThemeStudioV2(panel){
  if(!panel||panel.dataset.v2Mounted)return null;panel.dataset.v2Mounted='true';
  const key='qxframe9a7c2-theme-studio-v2';let input={},result;
  try{const saved=localStorage.getItem(key);if(saved){generateThemeV2(JSON.parse(saved));input=JSON.parse(saved);}}catch{}
  const sheet=document.createElement('style');sheet.dataset.themeStudioV2Sheet='';document.head.appendChild(sheet);
  const labels={tight:'极紧凑',compact:'紧凑',standard:'标准',roomy:'宽松',editorial:'编辑式',outline:'描边',tinted:'着色描边','tinted-subtle':'轻着色描边',soft:'柔和填充',underline:'下划线',normal:'正常',none:'无',hairline:'细线（1px）',strong:'强调',subtle:'轻微',soft:'柔和填充',elevated:'抬升',snappy:'快速',relaxed:'舒缓',default:'默认',outlined:'描边',borderless:'无边界',follow:'跟随主题圆角',intrinsic:'固有语义形态',square:'直角','system-ui':'系统无衬线',inter:'Inter 字体',humanist:'人文无衬线',serif:'衬线字体',inherit:'跟随正文','ui-monospace':'系统等宽','system-mono':'系统代码字体'};
  const labelFor=value=>STYLE_LABELS[value]??TYPE_LABELS[value]??labels[value]??value;
  const options=values=>values.map(v=>'<option value="'+v+'">'+labelFor(v)+'</option>').join('');
  const roleOptions=()=>[...CORE_ROLES,...OPTIONAL_ROLES,...OVERRIDE_ROLES.map(v=>'override-'+v)].map(value=>{const raw=value.startsWith('override-')?value.slice(9):value;const prefix=value.startsWith('override-')?'高级覆盖 · ':'';let label=ROLE_LABELS[raw];if(!label&&raw.startsWith('type-')){const physical=raw.replace(/^type-/,'').replace(/-foreground$/,'');label=(TYPE_LABELS[physical]??physical)+(raw.endsWith('-foreground')?'前景文字':'实体色');}return '<option value="'+value+'">'+prefix+(label??raw)+'</option>';}).join('');
  panel.innerHTML=`<header><h2>主题生成器</h2><p>风格负责给出协调默认值；控件密度、圆角、容器留白、排版、边界、投影、动效和特殊形态都可以单独调整。</p></header>
    <div class="qxframe9a7c2-v2-editor-options">
      <label>视觉风格<select data-v2-option="style">${options(SEMANTIC_STYLES)}</select></label>
      <label>控件密度<select data-v2-option="density">${options(DENSITIES)}</select></label>
      <label>圆角程度<select data-v2-option="radius">${options(RADII)}</select></label>
      <label>容器留白<select data-v2-option="spacing">${options(SPACINGS)}</select></label>
    </div>
    <details open><summary>非颜色外观</summary><div class="qxframe9a7c2-v2-editor-options">
      <label>排版密度<select data-v2-appearance="typography">${options(TYPOGRAPHY_PROFILES)}</select></label>
      <label>文字风格<select data-v2-appearance="textStyle">${options(TEXT_STYLE_PROFILES)}</select></label>
      <label>控件外观<select data-v2-appearance="controlAppearance">${options(CONTROL_APPEARANCE_PROFILES)}</select></label>
      <label>正文字体<select data-v2-appearance="fontBody">${options(BODY_FONTS)}</select></label>
      <label>标题字体<select data-v2-appearance="fontHeading">${options(HEADING_FONTS)}</select></label>
      <label>等宽字体<select data-v2-appearance="fontMono">${options(MONO_FONTS)}</select></label>
      <label>边界强度<select data-v2-appearance="border">${options(BORDER_PROFILES)}</select></label>
      <label>投影强度<select data-v2-appearance="shadow">${options(SHADOW_PROFILES)}</select></label>
      <label>动效节奏<select data-v2-appearance="motion">${options(MOTION_PROFILES)}</select></label>
      <label>表面形态<select data-v2-appearance="surface">${options(SURFACE_PROFILES)}</select></label>
    </div><div class="qxframe9a7c2-v2-editor-options">
      ${SHAPE_FAMILIES.map(f=>'<label>'+SHAPE_LABELS[f]+'形态<select data-v2-shape="'+f+'">'+options(SHAPE_POLICIES)+'</select></label>').join('')}
    </div></details>
    <div class="qxframe9a7c2-v2-editor-options">
      <button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="css">下载 CSS</button>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="json">下载配置</button>
      <label>导入配置<input type="file" accept=".json,application/json" data-v2-import></label>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="reset">恢复默认</button>
    </div>
    <p data-v2-status></p><p data-v2-statistics></p>
    <details><summary>颜色与可选覆盖</summary><div class="qxframe9a7c2-v2-editor-options">
      <label>明暗模式<select data-v2-color-mode><option value="light">浅色</option><option value="dark">深色</option></select></label>
      <label>颜色用途<select data-v2-color-role>${roleOptions()}</select></label>
      <label>完整颜色值<input type="text" data-v2-color-value placeholder="例如：oklch(.6 .2 260) 或 rgb(37 99 235)"></label>
      <button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="color">应用</button>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="remove-color">恢复默认关联</button>
    </div></details>
    <details><summary>高级配置 JSON</summary><textarea data-v2-json rows="12"></textarea><button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="apply-json">应用 JSON</button></details>
    <div id="theme-v2-studio-preview" class="qxframe9a7c2-v2-preview"></div>`;
  const get=selector=>panel.querySelector(selector),status=(text,error=false)=>{get('[data-v2-status]').textContent=text;get('[data-v2-status]').dataset.error=String(error);};
  const value=selector=>get(selector).value;
  function colorField(){
    const mode=value('[data-v2-color-mode]'),role=value('[data-v2-color-role]'),override=role.startsWith('override-');
    get('[data-v2-color-value]').value=(override?result.config.overrides[mode][role.slice(9)]:result.config.colors[mode][role])??'';
  }
  const switchHtml=size=>'<label class="qxframe9a7c2-switch is-'+size+'"><input class="qxframe9a7c2-switch-input" type="checkbox"><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></label>';
  function render(next=input){
    const generated=generateThemeV2(next);input=next;result=generated;
    sheet.textContent='@scope (#theme-v2-studio-preview) {\n'+result.css+'\n}';
    get('[data-v2-option="style"]').value=result.config.style;
    for(const [option,selected]of Object.entries(result.config.options))get('[data-v2-option="'+option+'"]').value=selected;
    for(const [option,selected]of Object.entries(result.config.appearance)){if(option==='shape')continue;get('[data-v2-appearance="'+option+'"]').value=selected;}
    for(const [family,selected]of Object.entries(result.config.appearance.shape))get('[data-v2-shape="'+family+'"]').value=selected;
    const stats=result.statistics;get('[data-v2-statistics]').textContent=stats.colorNames+' 个完整颜色 · '+stats.geometryNames+' 个默认尺寸输入 · '+stats.styleNames+' 个非颜色输入 · '+stats.overrideDeclarations+' 个高级覆盖 · CSS '+new TextEncoder().encode(result.css).length+' 字节';
    get('[data-v2-json]').value=serializeThemeV2(result.config);colorField();
    get('#theme-v2-studio-preview').innerHTML=['light','dark'].map(mode=>'<section data-qxframe9a7c2-theme="'+mode+'" data-qxframe9a7c2-style="'+result.config.style+'"><h3>'+(mode==='light'?'浅色模式':'深色模式')+'</h3><div class="qxframe9a7c2-card"><div class="qxframe9a7c2-card-body"><h4 class="qxframe9a7c2-card-title">工作区</h4><p class="qxframe9a7c2-card-description">风格默认值与手动调整值使用同一条 CSS 消费链。</p><div class="qxframe9a7c2-typography-kpi">128.4k</div><code>QXFRAME / 代码字体</code>'+['xs','sm','md','lg','xl'].map(size=>'<div class="qxframe9a7c2-v2-preview-row"><button class="qxframe9a7c2-button is-primary is-solid is-'+size+'">'+SIZE_LABELS[size]+'</button><div class="qxframe9a7c2-input is-'+size+'"><input class="qxframe9a7c2-input-control" placeholder="输入文字"></div>'+switchHtml(size)+'</div>').join('')+'<div class="qxframe9a7c2-v2-preview-row">'+[['success','成功'],['warning','警告'],['error','错误'],['info','信息']].map(pair=>'<span class="qxframe9a7c2-tag is-colored is-'+pair[0]+'">'+pair[1]+'</span>').join('')+'</div><div class="qxframe9a7c2-v2-preview-row">'+PHYSICAL_TYPES.map(type=>'<span class="qxframe9a7c2-badge is-solid is-'+type+'" data-v2-physical-type="'+type+'">'+(TYPE_LABELS[type]??type)+'</span>').join('')+'</div><div class="qxframe9a7c2-v2-preview-row"><input class="qxframe9a7c2-form-check-input" type="checkbox" checked><input class="qxframe9a7c2-form-check-input" type="radio" checked><span>原生选择控件</span></div><button class="qxframe9a7c2-button is-outlined"><span>多行内容<br>随内容自然增长</span></button></div></div><div class="qxframe9a7c2-popup-surface">公共浮层表面</div></section>').join('');
    try{localStorage.setItem(key,JSON.stringify(input));}catch{}
    status('预览已更新。');return result;
  }
  const run=callback=>{try{callback();}catch(error){status(error.message,true);}};
  panel.querySelectorAll('[data-v2-option]').forEach(control=>control.addEventListener('change',()=>run(()=>{
    const next=structuredClone(input),option=control.dataset.v2Option;
    if(option==='style'){next.style=control.value;delete next.options;delete next.geometry;delete next.appearance;}
    else{next.options={...result.config.options,[option]:control.value};delete next.geometry;}
    render(next);
  })));
  panel.querySelectorAll('[data-v2-appearance]').forEach(control=>control.addEventListener('change',()=>run(()=>{const next=structuredClone(input);next.appearance={...result.config.appearance,[control.dataset.v2Appearance]:control.value};render(next);}))); 
  panel.querySelectorAll('[data-v2-shape]').forEach(control=>control.addEventListener('change',()=>run(()=>{const next=structuredClone(input);next.appearance={...result.config.appearance,shape:{...result.config.appearance.shape,[control.dataset.v2Shape]:control.value}};render(next);}))); 
  function colorChange(remove){
    const next=structuredClone(input),mode=value('[data-v2-color-mode]'),role=value('[data-v2-color-role]'),override=role.startsWith('override-'),section=override?'overrides':'colors',name=override?role.slice(9):role;
    next[section]??={};next[section][mode]??={};
    if(remove)delete next[section][mode][name];else next[section][mode][name]=value('[data-v2-color-value]');
    render(next);
  }
  function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
  panel.addEventListener('click',event=>{const action=event.target.closest('[data-v2-action]')?.dataset.v2Action;if(!action)return;run(()=>{
    if(action==='reset')render({});
    if(action==='color'||action==='remove-color')colorChange(action==='remove-color');
    if(action==='apply-json')render(parseThemeV2(value('[data-v2-json]')).config);
    if(action==='css')download(result.css,'text/css','qxframe-theme.css');
    if(action==='json')download(serializeThemeV2(result.config),'application/json','qxframe-theme.json');
  });});
  get('[data-v2-import]').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{render(parseThemeV2(await file.text()).config);}catch(error){status(error.message,true);}event.target.value='';});
  for(const selector of ['[data-v2-color-mode]','[data-v2-color-role]'])get(selector).addEventListener('change',colorField);
  render();
  return Object.freeze({getTheme:()=>structuredClone(result),apply:next=>render(next),reset:()=>render({})});
}
if(typeof document!=='undefined'){
  const panel=document.querySelector('[data-theme-studio-v2]');
  if(panel)window.QXFRAME9A7C2_THEME_STUDIO_V2=mountThemeStudioV2(panel);
}
