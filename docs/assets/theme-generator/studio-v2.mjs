import {generateThemeV2,serializeThemeV2,parseThemeV2} from './engine-v2.mjs';
import {SEMANTIC_STYLES,CORE_ROLES,OPTIONAL_ROLES,OVERRIDE_ROLES} from './semantic-engine.mjs';
import {DENSITIES,RADII,SPACINGS} from './geometry-engine-v2.mjs';

// Documentation editor only. Production components do not import the generator.
export function mountThemeStudioV2(panel){
  if(!panel||panel.dataset.v2Mounted)return null;panel.dataset.v2Mounted='true';
  const key='qxframe9a7c2-theme-studio-v2';let input={},result;
  try{const saved=localStorage.getItem(key);if(saved){generateThemeV2(JSON.parse(saved));input=JSON.parse(saved);}}catch{}
  const sheet=document.createElement('style');sheet.dataset.themeStudioV2Sheet='';document.head.appendChild(sheet);
  const labels={tight:'极紧凑',compact:'紧凑',standard:'标准',roomy:'宽松',normal:'正常',none:'无圆角'};
  const options=values=>values.map(v=>'<option value="'+v+'">'+(labels[v]??v)+'</option>').join('');
  panel.innerHTML=`<header><h2>Theme v2 Studio</h2><p>选择风格、控件密度、圆角和容器留白，预览五档组件。当前为验证版。</p></header>
    <div class="qxframe9a7c2-v2-editor-options">
      <label>Style<select data-v2-option="style">${options(SEMANTIC_STYLES)}</select></label>
      <label>控件密度<select data-v2-option="density">${options(DENSITIES)}</select></label>
      <label>圆角<select data-v2-option="radius">${options(RADII)}</select></label>
      <label>容器留白<select data-v2-option="spacing">${options(SPACINGS)}</select></label>
    </div>
    <div class="qxframe9a7c2-v2-editor-options">
      <button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="css">下载 CSS</button>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="json">下载配置</button>
      <label>导入 JSON<input type="file" accept=".json,application/json" data-v2-import></label>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="reset">恢复默认</button>
    </div>
    <p data-v2-status></p><p data-v2-statistics></p>
    <details><summary>颜色与可选覆盖</summary><div class="qxframe9a7c2-v2-editor-options">
      <label>模式<select data-v2-color-mode><option>light</option><option>dark</option></select></label>
      <label>用途<select data-v2-color-role>${options([...CORE_ROLES,...OPTIONAL_ROLES,...OVERRIDE_ROLES.map(v=>'override-'+v)])}</select></label>
      <label>完整颜色<input type="text" data-v2-color-value placeholder="oklch(.6 .2 260) 或 rgb(37 99 235)"></label>
      <button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="color">应用</button>
      <button class="qxframe9a7c2-button is-outlined" data-v2-action="remove-color">恢复此项关联</button>
    </div></details>
    <details><summary>配置 JSON</summary><textarea data-v2-json rows="12"></textarea><button class="qxframe9a7c2-button is-primary is-solid" data-v2-action="apply-json">应用 JSON</button></details>
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
    // Keep the new preview isolated from the existing schema-1 Studio/gallery.
    sheet.textContent='@scope (#theme-v2-studio-preview) {\n'+result.css+'\n}';
    get('[data-v2-option="style"]').value=result.config.style;
    for(const [option,selected]of Object.entries(result.config.options))get('[data-v2-option="'+option+'"]').value=selected;
    const stats=result.statistics;get('[data-v2-statistics]').textContent=stats.colorNames+' 个完整颜色 · '+stats.geometryNames+' 个 md 输入 · '+stats.overrideDeclarations+' 个覆盖 · CSS '+new TextEncoder().encode(result.css).length+' 字节';
    get('[data-v2-json]').value=serializeThemeV2(result.config);colorField();
    get('#theme-v2-studio-preview').innerHTML=['light','dark'].map(mode=>'<section data-qxframe9a7c2-visual="2" data-qxframe9a7c2-theme="'+mode+'" data-qxframe9a7c2-style="'+result.config.style+'"><h3>'+mode+'</h3><div class="qxframe9a7c2-card"><div class="qxframe9a7c2-card-body"><h4 class="qxframe9a7c2-card-title">Workspace</h4><p class="qxframe9a7c2-card-description">控件密度与表面留白各自独立。</p>'+['xs','sm','md','lg','xl'].map(size=>'<div class="qxframe9a7c2-v2-preview-row"><button class="qxframe9a7c2-button is-primary is-solid is-'+size+'">'+size+'</button><div class="qxframe9a7c2-input is-'+size+'"><input class="qxframe9a7c2-input-control" placeholder="输入文字"></div>'+switchHtml(size)+'</div>').join('')+'<div class="qxframe9a7c2-v2-preview-row">'+['success','warning','error','info'].map(type=>'<span class="qxframe9a7c2-tag is-colored is-'+type+'">'+type+'</span>').join('')+'</div><div class="qxframe9a7c2-v2-preview-row"><input class="qxframe9a7c2-form-check-input" type="checkbox" checked><input class="qxframe9a7c2-form-check-input" type="radio" checked><span>Native Choice</span></div><button class="qxframe9a7c2-button is-outlined"><span>多行内容<br>随内容增长</span></button></div></div><div class="qxframe9a7c2-popup-surface">Popup 表面</div></section>').join('');
    try{localStorage.setItem(key,JSON.stringify(input));}catch{}
    status('预览已更新。');return result;
  }
  const run=callback=>{try{callback();}catch(error){status(error.message,true);}};
  panel.querySelectorAll('[data-v2-option]').forEach(control=>control.addEventListener('change',()=>run(()=>{
    const next=structuredClone(input),option=control.dataset.v2Option;
    if(option==='style'){next.style=control.value;delete next.options;delete next.geometry;}
    else{next.options={...result.config.options,[option]:control.value};delete next.geometry;}
    render(next);
  })));
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
    if(action==='css')download(result.css,'text/css','qx-theme-v2.css');
    if(action==='json')download(serializeThemeV2(result.config),'application/json','qx-theme-v2.json');
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
