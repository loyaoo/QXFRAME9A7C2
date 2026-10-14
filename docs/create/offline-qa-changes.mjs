/** Stage5 current-round screenshot-fix acceptance annotations. Previous WheelPanel guide-z-order highlights cleared. */
const groups = [
  ['release-planner','DatePicker / TimePicker Popup',[
    ['[data-pv3-component="release-date"]','DatePicker / TimePicker Popup','Range Calendar gap 0, intrinsic width and proper Presets edge','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['navigation-workspace','Menu default transparent',[
    ['[data-pv3x-widget="navigation-workspace"]','Menu default transparent','No default Menu surface fill; Popup keeps its own background','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['alerts-center','Alert feedback surface',[
    ['[data-pv3x-widget="alerts-center"]','Alert feedback surface','Theme border and configurable Card shadow restored','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['compliance-flags','Semantic Badge',[
    ['.qxframe9a7c2-badge.is-error','Semantic Badge','Badge accent fill/ink restored without Theme neutral repaint','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['order-routing','Cascader Choice',[
    ['[data-pv3-component="routing-cascader"]','Cascader Choice','Unchecked expanded branch checkbox remains empty','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['quick-action-menu','Dropdown Choice/group',[
    ['[data-pv3x-widget="quick-action-menu"]','Dropdown Choice/group','Open unselected checkbox remains empty; group header neutral','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['finance-approval','Steps connector flow',[
    ['[data-pv3-component="finance-steps"]','Steps connector flow','Step rail stays in flow beside titles, not over text','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['approval-queue-item','Item leading alignment',[
    ['.qxframe9a7c2-item-surface','Item leading alignment','Leading icon/checkbox and text stay side by side','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['customer-quality','Tags Add theme',[
    ['[data-pv3-component="customer-tags"]','Tags Add theme','AddTag inherits Tag height/radius/Theme surface','__QA_BUNDLE_HEAD__']
  ],'03'],
  ['asset-preview','ImagePreview mask/close',[
    ['[data-pv3x-widget="asset-preview"]','ImagePreview mask/close','Dark adjustable mask; close Hover matches toolbar','__QA_BUNDLE_HEAD__']
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
    const card=id==='overview-metrics'?document.querySelector('.pv3-overview'):document.querySelector('[data-card="'+id+'"]');
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
    const card=id==='overview-metrics'?getDoc()?.querySelector('.pv3-overview'):getDoc()?.querySelector('[data-card="'+id+'"]');
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
    '<p class="qa-toolbar-caption">只标本轮：DatePicker、Menu、Alert、Badge、Cascader、Dropdown、Steps、Item、Tags、ImagePreview 截图整改。上一轮 WheelPanel 高亮已清除。</p></div>';
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