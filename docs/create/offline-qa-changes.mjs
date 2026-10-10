/** Active QA ONLY: seven source-paired small Button typography cards. */
const groups = [
  ['dividend-income','Dividend Income · 图标按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','关闭图标按钮','源主题 icon-sm 字号跟随 style 而非统一缩小 2px','__QA_BUNDLE_HEAD__']
  ]],
  ['payout-threshold','Payout Threshold · 图标按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','关闭图标按钮','14px / 12px 的上游 Button 字号在 8 种 Style 同步','__QA_BUNDLE_HEAD__']
  ]],
  ['preferences','Preferences · 图标按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','关闭图标按钮','QX Button 字号改为消费 Theme button-sm-font-size','__QA_BUNDLE_HEAD__']
  ]],
  ['savings-targets','Savings Targets · New Goal',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','New Goal','源文字尺寸恢复 14px（Nova 12.8px），同时修复按钮自然宽度','__QA_BUNDLE_HEAD__']
  ]],
  ['recent-transactions','Recent Transactions · 操作按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','View All','源字体大小与自然宽度随主题一致','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-card-content .qxframe9a7c2-button.is-sm.is-square','每行更多操作','表格中的五个小图标按钮使用同一 Theme 字号','__QA_BUNDLE_HEAD__']
  ]],
  ['transfer-funds','Transfer Funds · 图标按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','关闭图标按钮','源 icon-sm 字号恢复并保留 QX 自有主题尺寸','__QA_BUNDLE_HEAD__']
  ]],
  ['receiving-method','Receiving Method · 图标按钮',[
    ['.qxframe9a7c2-card-header-action .qxframe9a7c2-button.is-sm','关闭图标按钮','源 icon-sm 字体大小跟随 Style 与字体设置','__QA_BUNDLE_HEAD__']
  ]]
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
  if(!preview){document.querySelector('[data-create-item="01"]')?.click();if(!jump())setTimeout(jump,700)}else jump();
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
  panel.innerHTML='<div class="qa-toolbar-header"><strong>验收标注 · 离线专用</strong><span>Preview 01 · '+markedRegions+' 处</span></div>'+
    '<div class="qa-toolbar-buttons"><button type="button" data-qa-toggle></button><button type="button" data-qa-fold></button></div>'+
    '<div class="qa-toolbar-content"><p>橙色实线框是改动卡片；虚线框是具体改动区域。点击条目直接定位。</p><div data-qa-list></div>'+
    '<p class="qa-toolbar-caption">只标本轮：往期修改不再显示黄色边框。Preview 02 本批没有修改；关闭高亮可查看原貌。</p></div>';
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