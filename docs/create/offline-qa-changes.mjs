/** Stage5 2026-10-12 current menu/ColorPanel/Overlay batch: 10 Cards, 13 regions. */
const groups = [
 ['platform-tree','TreeSelect Popup Hover',[
  ['[data-pv3-component="workspace-tree-select"]','TreeSelect','仅 Selected 使用菜单强调色，Hover 使用浅色','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['release-planner','DatePicker / TimePicker',[
  ['[data-pv3-component="release-date"]','DatePicker','CalendarPanel Hover 浅色、Selected 保留强调色','__QA_BUNDLE_HEAD__'],
  ['[data-pv3-component="release-time"]','TimePicker','WheelPanel 中线边框恢复中性角色','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['order-routing','Select / Cascader',[
  ['[data-pv3-component="routing-select"]','Select','选项悬停与选中分色','__QA_BUNDLE_HEAD__'],
  ['[data-pv3-component="routing-cascader"]','Cascader','级联项悬停使用浅色角色','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['contact-lookup','Autocomplete',[
  ['[data-pv3x-widget="contact-lookup"]','Autocomplete','下拉项悬停不使用饱和强调色','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['quick-action-menu','Dropdown',[
  ['[data-pv3x-widget="quick-action-menu"]','Dropdown','菜单项悬停与选中分色','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['navigation-workspace','Menu',[
  ['.qxframe9a7c2-menu','Menu','反色菜单强调模式的浅色 Hover','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['brand-studio','ColorPicker',[
  ['[data-pv3-component="brand-color"]','ColorPicker','复用 ColorPanel 中性边框，不重绘输入/格式按钮','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['palette-laboratory','ColorPanel',[
  ['.qxframe9a7c2-color-panel-fields','ColorPanel Fields','格式、输入、吸管按钮共用字段边框','__QA_BUNDLE_HEAD__'],
  ['.qxframe9a7c2-color-panel-sliders','ColorPanel Range','原生 range 轨道和滑块同 Slider 尺寸形状','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['danger-dialog','Modal',[
  ['[data-pv3x-widget="danger-dialog"]','Modal','同步 mask 和 dialog 退出，减轻缩放冲击','__QA_BUNDLE_HEAD__']
 ],'03'],
 ['account-drawer','Drawer',[
  ['[data-pv3x-widget="account-drawer"]','Drawer','同步 panel 与 mask 退场，不二次闪烁','__QA_BUNDLE_HEAD__']
 ],'03']
];
const key='qxframe9a7c2-qa-show', foldkey='qxframe9a7c2-qa-fold';
let visible=true, folded=false;
try{visible=localStorage.getItem(key)!=='0';folded=localStorage.getItem(foldkey)==='1'}catch(_){ }
const preview=!!document.body.dataset.createPreview;
const embedded=window.parent!==window;
function mark(){
  if(!preview)return;
  document.body.classList.toggle('qa-annotated',visible);
  for(const [id,name,changes] of groups){
    const card=document.querySelector('[data-card="'+id+'"]');
    if(!card)continue;
    card.classList.add('qa-changed-card');
    card.dataset.qaCardLabel='已改 '+changes.length+' 处';
    for(const [selector,label,summary,commit] of changes)
      for(const el of card.querySelectorAll(selector)){
        el.classList.add('qa-changed-region');
        el.title='[离线验收] '+label+'：'+summary+' ('+commit+')';
      }
  }
}
function setVisible(v,persist=true){
  visible=!!v;
  document.documentElement.classList.toggle('qa-annotated-enabled',visible);
  mark();
  if(persist)try{localStorage.setItem(key,visible?'1':'0')}catch(_){ }
  const b=document.querySelector('[data-qa-toggle]');
  if(b)b.textContent=visible?'关闭高亮 · 原貌对比':'开启修改标注';
  const frame=document.querySelector('[data-create-frame]');
  if(frame?.contentWindow)try{frame.contentWindow.postMessage({qxQaVisible:visible},location.origin)}catch(_){ }
}
function getDoc(){
  if(preview)return document;
  try{return document.querySelector('[data-create-frame]')?.contentDocument}catch(_){return null}
}
function locate(group,change){
  const [id]=group,[selector]=change;
  const jump=()=>{
    const card=getDoc()?.querySelector('[data-card="'+id+'"]');
    const node=card?.querySelector(selector)||card;
    if(!node)return false;
    node.scrollIntoView({behavior:'smooth',block:'center'});
    node.classList.add('qa-jump-flash');
    setTimeout(()=>node.classList.remove('qa-jump-flash'),1800);
    return true;
  };
  if(!preview){document.querySelector('[data-create-item="'+((group[3]==='03'?'03':group[3]==='02'?'02':'01'))+'"]')?.click();if(!jump())setTimeout(jump,700)}else jump();
}
function toggleFold(v){
  folded=!!v;
  document.querySelector('[data-qa-toolbar]')?.classList.toggle('qa-panel-collapsed',folded);
  const b=document.querySelector('[data-qa-fold]');if(b)b.textContent=folded?'展开变更清单':'收起清单';
  try{localStorage.setItem(foldkey,folded?'1':'0')}catch(_){ }
}
function mount(){
  if(embedded)return;
  const panel=document.createElement('section');
  panel.className='qa-offline-toolbar';panel.dataset.qaToolbar='';
  const markedRegions=groups.reduce((count,g)=>count+g[2].length,0);
  panel.innerHTML='<div class="qa-toolbar-header"><strong>验收标注 · 离线专用</strong><span>'+(markedRegions?'Preview '+(document.body.dataset.createPreview || (document.querySelector('[data-card="book-appointment"]')?'02':'01'))+' · '+markedRegions+' 处':'本轮无 Preview 卡片高亮')+'</span></div>'+
    '<div class="qa-toolbar-buttons"><button type="button" data-qa-toggle></button><button type="button" data-qa-fold></button></div>'+
    '<div class="qa-toolbar-content"><p>橙色实线框是改动卡片；虚线框是具体改动区域。点击条目直接定位。</p><div data-qa-list></div>'+
    '<p class="qa-toolbar-caption">只标本轮：Menu Hover、Picker 边框、ColorPanel Range、Modal/Drawer 动画；只保留本轮改动高亮。
  document.body.append(panel);
  const list=panel.querySelector('[data-qa-list]');
  for(const group of groups){
    const section=document.createElement('section');section.className='qa-change-group';
    const title=document.createElement('strong');title.textContent=group[1];section.append(title);
    for(const change of group[2]){
      const button=document.createElement('button');button.type='button';button.className='qa-change-row';
      button.textContent=change[1]+' · '+change[3];button.title=change[2];
      button.addEventListener('click',()=>locate(group,change));section.append(button);
      const note=document.createElement('p');note.className='qa-change-summary';note.textContent=change[2];section.append(note);
    }
    list.append(section);
  }
  panel.querySelector('[data-qa-toggle]').addEventListener('click',()=>setVisible(!visible));
  panel.querySelector('[data-qa-fold]').addEventListener('click',()=>toggleFold(!folded));
  toggleFold(folded);
}
window.addEventListener('message',e=>{if(e.origin===location.origin&&typeof e.data?.qxQaVisible==='boolean')setVisible(e.data.qxQaVisible,false)});
window.addEventListener('storage',e=>{if(e.key===key)setVisible(e.newValue!=='0',false)});
function init(){
  mount();setVisible(visible,false);
  if(preview){
    let pending=false;
    new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;mark()},100)})
      .observe(document.body,{childList:true,subtree:true});
  }else document.querySelector('[data-create-frame]')?.addEventListener('load',()=>setVisible(visible,false));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();