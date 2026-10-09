/** Offline QA: current-round only. */
const groups = [
  ['payout-threshold','Payout Threshold · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="payout-notes"])','Notes','点击 Notes 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['savings-targets','Savings Targets / Buy Investment · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="investment-amount"])','Amount to Invest','点击 Amount to Invest 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="investment-order-type"])','Order Type','点击 Order Type 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['account-access','Account Access · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="email-address"])','Email Address','点击 Email Address 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="current-password"])','Current Password','点击 Current Password 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['transfer-funds','Transfer Funds · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="transfer-amount"])','Amount to Transfer','点击 Amount to Transfer 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['receiving-method','Receiving Method · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="account-holder"])','Account Holder Name','点击 Account Holder Name 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="iban"])','IBAN / Account Number','点击 IBAN / Account Number 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['new-milestone','New Milestone · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="goal-name"])','Goal Name','点击 Goal Name 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="target-amount"])','Target Amount','点击 Target Amount 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="target-date"])','Target Date','点击 Target Date 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
  ]],
  ['social-links','Social Links · 原生字段标签',[
    ['.qxframe9a7c2-form-field:has(label[for="spotify-url"])','Spotify Artist URL','点击 Spotify Artist URL 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="instagram-handle"])','Instagram Handle','点击 Instagram Handle 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="soundcloud-url"])','SoundCloud URL','点击 SoundCloud URL 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__'],
    ['.qxframe9a7c2-form-field:has(label[for="website-url"])','Website','点击 Website 标签聚焦对应原生输入控件','__QA_BUNDLE_HEAD__']
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