(function(){
'use strict';
var Q=window.QXFRAME9A7C2,C=Q&&Q.Components,theme=window.QXFRAME9A7C2_DOCS_THEME;
if(!Q||!C)return;
var shell=document.getElementById('qx-admin-shell'),menuHost=document.getElementById('qx-admin-menu'),tabsHost=document.getElementById('qx-admin-tabs'),stage=document.getElementById('qx-admin-stage');
var titleHost=document.getElementById('qx-admin-current-title'),searchHost=document.getElementById('qx-admin-global-search'),themeButton=document.getElementById('qx-admin-theme-toggle');
var owners=[],frames=new Map(),storageKey='qxframe9a7c2-admin-tabs-v1';
function own(x){if(x&&typeof x.destroy==='function')owners.push(x);return x}
function icon(name){var n=document.createElement('span');n.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+name+' is-line is-round is-stroke-2';return n}
function menuIcon(name){return function(){return icon(name)}}
var routes=[
 {key:'dashboard',title:'仪表盘',group:'工作台',icon:'chart',href:'../admin-dashboard-static.html?embed=1',pinned:true},
 {key:'content-list',title:'内容列表',group:'内容',icon:'table',href:'../admin-list-static.html?embed=1'},
 {key:'content-add',title:'新增内容',group:'内容',icon:'plus',href:'../admin-form-static.html?embed=1'},
 {key:'orders',title:'订单中心',group:'业务',icon:'shopping-cart',href:'views/orders.html'},
 {key:'users',title:'用户管理',group:'组织',icon:'user',href:'views/users.html'},
 {key:'roles',title:'角色与权限',group:'组织',icon:'lock',href:'views/roles.html'},
 {key:'media',title:'媒体资源',group:'内容',icon:'image',href:'views/media.html'},
 {key:'search',title:'全局搜索',group:'工具',icon:'search',href:'views/search.html'},
 {key:'logs',title:'操作日志',group:'系统',icon:'file',href:'views/logs.html'},
 {key:'settings',title:'系统设置',group:'系统',icon:'setting',href:'views/settings.html'},
 {key:'profile',title:'个人中心',group:'账户',icon:'id-card',href:'views/profile.html'},
 {key:'result',title:'结果页',group:'页面',icon:'check',href:'views/result.html'},
 {key:'404',title:'404 页面',group:'页面',icon:'warning',href:'views/404.html'},
 {key:'500',title:'500 页面',group:'页面',icon:'close',href:'views/500.html'}
];
var byKey={};routes.forEach(function(r){byKey[r.key]=r});
var state={tabs:['dashboard'],active:'dashboard'};
function restore(){try{var x=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(x&&Array.isArray(x.tabs)){state.tabs=x.tabs.filter(function(k){return byKey[k]});if(state.tabs.indexOf('dashboard')<0)state.tabs.unshift('dashboard');state.active=byKey[x.active]?x.active:state.tabs[0]}}catch(_){}}
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify(state))}catch(_){}}
restore();
function routeForHref(href){
 var clean=String(href||'').replace(/[?#].*$/,'');
 if(clean.indexOf('admin-dashboard-static.html')>=0)return byKey.dashboard;
 if(clean.indexOf('admin-list-static.html')>=0)return byKey['content-list'];
 if(clean.indexOf('admin-form-static.html')>=0)return byKey['content-add'];
 return routes.find(function(r){return r.href.replace(/[?#].*$/,'')===clean})||null;
}
function ensureFrame(key){
 var route=byKey[key];if(!route)return null;
 var frame=frames.get(key);if(frame)return frame;
 frame=document.createElement('iframe');frame.className='qx-admin-frame';frame.dataset.key=key;frame.title=route.title;frame.src=route.href;
 frame.addEventListener('load',function(){broadcastTheme(frame)});
 frames.set(key,frame);stage.appendChild(frame);return frame;
}
function destroyFrame(key){var frame=frames.get(key);if(frame){frame.remove();frames.delete(key)}}
function renderTabs(){
 tabsHost.innerHTML='';
 state.tabs.forEach(function(key){
   var route=byKey[key];if(!route)return;
   var tab=document.createElement('button');tab.type='button';tab.className='qx-admin-tab'+(key===state.active?' is-active':'');tab.dataset.key=key;
   var label=document.createElement('span');label.className='qx-admin-tab-label';label.textContent=route.title;tab.appendChild(label);
   if(!route.pinned){var close=document.createElement('span');close.className='qx-admin-tab-close';close.textContent='×';close.dataset.close=key;tab.appendChild(close)}
   tab.addEventListener('click',function(event){var closeKey=event.target&&event.target.dataset&&event.target.dataset.close;if(closeKey){event.stopPropagation();closeTab(closeKey);return}activate(key)});
   tabsHost.appendChild(tab);ensureFrame(key);
 });
 frames.forEach(function(frame,key){frame.classList.toggle('is-active',key===state.active)});
 var current=byKey[state.active];if(titleHost&&current)titleHost.textContent=current.title;
}
var menuOwner=null;
function buildMenuItems(){
 var order=['工作台','内容','业务','组织','工具','系统','账户','页面'];
 return order.map(function(group,i){
   var children=routes.filter(function(r){return r.group===group}).map(function(r){return{key:r.key,label:r.title,icon:menuIcon(r.icon)}});
   return children.length?{type:'group',key:'g'+i,label:group,items:children}:null;
 }).filter(Boolean);
}
function mountMenu(){
 menuOwner=own(C.Menu.create({container:menuHost,items:buildMenuItems(),mode:'inline',selectedKey:state.active,openKeys:[],collapsed:false,inlineIndent:22,selectionAppearance:'highlight',onNavigate:function(detail){if(detail&&byKey[detail.key])navigate(detail.key)}}));
}
function activate(key,skipHash){if(!byKey[key])return;if(state.tabs.indexOf(key)<0)state.tabs.push(key);state.active=key;persist();renderTabs();if(menuOwner&&menuOwner.setSelectedKey)menuOwner.setSelectedKey(key,{silent:true,reason:'admin-route'});if(!skipHash&&location.hash!=='#/'+key)history.replaceState(null,'','#/'+key)}
function navigate(key){activate(key)}
function closeTab(key){
 var route=byKey[key];if(!route||route.pinned)return;
 var index=state.tabs.indexOf(key);if(index<0)return;
 state.tabs.splice(index,1);destroyFrame(key);
 if(state.active===key)state.active=state.tabs[Math.max(0,index-1)]||'dashboard';
 persist();activate(state.active);
}
function closeOthers(){state.tabs.slice().forEach(function(k){if(k!==state.active&&!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});persist();renderTabs()}
function closeRight(){var index=state.tabs.indexOf(state.active);state.tabs.slice(index+1).forEach(function(k){if(!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});persist();renderTabs()}
function closeAll(){state.tabs.slice().forEach(function(k){if(!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});state.active='dashboard';persist();activate('dashboard')}
function refreshActive(){var frame=frames.get(state.active);if(frame)frame.src=frame.src}
function currentMode(){if(!theme)return document.documentElement.classList.contains('qxframe9a7c2-theme-dark')?'dark':'light';var st=theme.getState();return st.effectiveMode||st.mode||'light'}
function broadcastTheme(frame){var mode=currentMode();var target=frame?[frame]:Array.from(frames.values());target.forEach(function(f){try{f.contentWindow.postMessage({type:'qxframe9a7c2-admin:theme',mode:mode},'*')}catch(_){}})}
function toggleTheme(){if(!theme)return;theme.setState({mode:currentMode()==='dark'?'light':'dark'});syncThemeIcon();broadcastTheme()}
function syncThemeIcon(){if(!themeButton)return;themeButton.innerHTML='';themeButton.appendChild(icon(currentMode()==='dark'?'sun':'moon'))}
function mountSearch(){
 if(!searchHost||!C.Autocomplete)return;
 own(C.Autocomplete.create({container:searchHost,items:routes.map(function(r){return{key:r.key,value:r.title,label:r.group+' · '+r.title}}),clearable:true,matchOnly:true,highlightFirst:true,prefix:icon('search'),placeholder:'搜索菜单 / 页面',onSelect:function(value,payload){var key=payload&&payload.item&&payload.item.key;if(key)navigate(key)}}));
}
function mountDropdowns(){
 var user=document.getElementById('qx-admin-user-trigger');if(user&&C.Dropdown)own(C.Dropdown.create({reference:user,trigger:'click',placement:'bottom-end',selectable:false,items:[{key:'profile',value:'profile',label:'个人中心'},{key:'settings',value:'settings',label:'系统设置'},{type:'divider',key:'d1'},{key:'login',value:'login',label:'退出登录'}],onSelect:function(d){if(d.key==='profile'||d.key==='settings')navigate(d.key);if(d.key==='login')location.href='login.html'}}));
 var more=document.getElementById('qx-admin-tabs-more');if(more&&C.Dropdown)own(C.Dropdown.create({reference:more,trigger:'click',placement:'bottom-end',selectable:false,items:[{key:'refresh',value:'refresh',label:'刷新当前页'},{type:'divider',key:'d2'},{key:'others',value:'others',label:'关闭其他标签'},{key:'right',value:'right',label:'关闭右侧标签'},{key:'all',value:'all',label:'关闭全部可关闭标签'}],onSelect:function(d){if(d.key==='refresh')refreshActive();if(d.key==='others')closeOthers();if(d.key==='right')closeRight();if(d.key==='all')closeAll()}}));
}
function mountShellActions(){
 var collapse=document.getElementById('qx-admin-collapse'),mobile=document.getElementById('qx-admin-mobile-toggle'),mask=document.getElementById('qx-admin-mobile-mask');
 var collapsed=false;try{collapsed=localStorage.getItem('qxframe9a7c2-admin-collapsed')==='1'}catch(_){}
 function applyCollapsed(){shell.classList.toggle('is-collapsed',collapsed);if(menuOwner&&menuOwner.setCollapsed)menuOwner.setCollapsed(collapsed)}
 if(collapse)collapse.addEventListener('click',function(){collapsed=!collapsed;try{localStorage.setItem('qxframe9a7c2-admin-collapsed',collapsed?'1':'0')}catch(_){}applyCollapsed()});
 if(mobile)mobile.addEventListener('click',function(){shell.classList.add('is-mobile-open')});
 if(mask)mask.addEventListener('click',function(){shell.classList.remove('is-mobile-open')});
 var refresh=document.getElementById('qx-admin-refresh');if(refresh)refresh.addEventListener('click',refreshActive);
 if(themeButton)themeButton.addEventListener('click',toggleTheme);
 var full=document.getElementById('qx-admin-fullscreen');if(full)full.addEventListener('click',function(){if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();else if(document.exitFullscreen)document.exitFullscreen()});
 applyCollapsed();
}
function routeFromHash(){var key=location.hash.replace(/^#\//,'');if(byKey[key])activate(key,true);else activate(state.active||'dashboard',true)}
window.addEventListener('hashchange',routeFromHash);
window.addEventListener('message',function(event){
 var data=event.data||{};if(data.type!=='qxframe9a7c2-admin:navigate')return;
 var route=routeForHref(data.href);if(route)navigate(route.key);
});
window.addEventListener('pagehide',function(){owners.splice(0).forEach(function(o){try{o.destroy()}catch(_){}})});
mountMenu();mountSearch();mountDropdowns();mountShellActions();syncThemeIcon();renderTabs();routeFromHash();
})();