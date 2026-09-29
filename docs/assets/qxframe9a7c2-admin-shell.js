(function(){
'use strict';
var Q=window.QXFRAME9A7C2,C=Q&&Q.Components,theme=window.QXFRAME9A7C2_DOCS_THEME;if(!Q||!C)return;
var shell=document.getElementById('qx-admin-shell'),menuHost=document.getElementById('qx-admin-menu'),tabsHost=document.getElementById('qx-admin-tabs'),stage=document.getElementById('qx-admin-stage');
var titleHost=document.getElementById('qx-admin-current-title'),searchHost=document.getElementById('qx-admin-global-search'),themeButton=document.getElementById('qx-admin-theme-toggle');
var owners=[],frames=new Map(),storageKey='qxframe9a7c2-admin-tabs-v1',menuOwner=null,searchOwner=null,tabsOwner=null,syncingTabs=false;
function own(x){if(x&&typeof x.destroy==='function')owners.push(x);return x}function icon(name){var n=document.createElement('span');n.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+name+' is-line is-round is-stroke-2';return n}function menuIcon(name){return function(){return icon(name)}}
var routes=[
{key:'dashboard',title:'仪表盘',group:'工作台',icon:'chart',href:'../admin-dashboard-static.html?embed=1',pinned:true},
{key:'monitor',title:'监控台',group:'工作台',icon:'chart',href:'views/monitor.html'},
{key:'workplace',title:'工作台',group:'工作台',icon:'user',href:'views/workplace.html'},
{key:'schedule',title:'排期中心',group:'工作台',icon:'calendar',href:'views/schedule.html'},
{key:'content-list',title:'内容列表',group:'内容',icon:'table',href:'../admin-list-static.html?embed=1'},
{key:'content-add',title:'新增内容',group:'内容',icon:'plus',href:'../admin-form-static.html?embed=1'},
{key:'media',title:'媒体资源',group:'内容',icon:'image',href:'views/media.html'},
{key:'orders',title:'订单中心',group:'业务',icon:'shopping-cart',href:'views/orders.html'},
{key:'products',title:'商品管理',group:'业务',icon:'table',href:'views/products.html'},
{key:'inventory',title:'库存中心',group:'业务',icon:'table',href:'views/inventory.html'},
{key:'customers',title:'客户中心',group:'业务',icon:'user',href:'views/customers.html'},
{key:'marketing',title:'营销中心',group:'业务',icon:'chart',href:'views/marketing.html'},
{key:'finance',title:'财务中心',group:'业务',icon:'file',href:'views/finance.html'},
{key:'table-list',title:'查询表格',group:'列表',icon:'table',href:'views/table-list.html'},
{key:'standard-list',title:'标准列表',group:'列表',icon:'file',href:'views/standard-list.html'},
{key:'card-list',title:'卡片列表',group:'列表',icon:'table',href:'views/card-list.html'},
{key:'search-list',title:'搜索列表',group:'列表',icon:'search',href:'views/search-list.html'},
{key:'basic-form',title:'基础表单',group:'表单',icon:'file',href:'views/basic-form.html'},
{key:'step-form',title:'分步表单',group:'表单',icon:'file',href:'views/step-form.html'},
{key:'advanced-form',title:'高级表单',group:'表单',icon:'file',href:'views/advanced-form.html'},
{key:'basic-detail',title:'基础详情',group:'详情',icon:'file',href:'views/basic-detail.html'},
{key:'advanced-detail',title:'高级详情',group:'详情',icon:'file',href:'views/advanced-detail.html'},
{key:'users',title:'用户管理',group:'组织',icon:'user',href:'views/users.html'},
{key:'roles',title:'角色与权限',group:'组织',icon:'lock',href:'views/roles.html'},
{key:'workflow',title:'流程编排',group:'组织',icon:'list',href:'views/workflow.html'},
{key:'search',title:'全局搜索',group:'工具',icon:'search',href:'views/search.html'},
{key:'developer-tools',title:'开发与诊断',group:'工具',icon:'setting',href:'views/developer-tools.html'},
{key:'logs',title:'操作日志',group:'系统',icon:'file',href:'views/logs.html'},
{key:'notifications',title:'通知中心',group:'系统',icon:'warning',href:'views/notifications.html'},
{key:'jobs',title:'任务中心',group:'系统',icon:'chart',href:'views/jobs.html'},
{key:'settings',title:'系统设置',group:'系统',icon:'setting',href:'views/settings.html'},
{key:'theme-center',title:'主题中心',group:'系统',icon:'setting',href:'views/theme-center.html'},
{key:'profile',title:'个人中心',group:'账户',icon:'id-card',href:'views/profile.html'},
{key:'account-settings',title:'账户设置',group:'账户',icon:'setting',href:'views/account-settings.html'},
{key:'result',title:'成功结果',group:'页面',icon:'check',href:'views/result.html'},
{key:'result-fail',title:'失败结果',group:'页面',icon:'close',href:'views/result-fail.html'},
{key:'403',title:'403 页面',group:'页面',icon:'warning',href:'views/403.html'},
{key:'404',title:'404 页面',group:'页面',icon:'warning',href:'views/404.html'},
{key:'500',title:'500 页面',group:'页面',icon:'close',href:'views/500.html'}
];
var byKey={};routes.forEach(function(r){byKey[r.key]=r});var state={tabs:['dashboard'],active:'dashboard'};
function restore(){try{var x=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(x&&Array.isArray(x.tabs)){state.tabs=x.tabs.filter(function(k){return byKey[k]});if(state.tabs.indexOf('dashboard')<0)state.tabs.unshift('dashboard');state.active=byKey[x.active]&&state.tabs.indexOf(x.active)>=0?x.active:state.tabs[0]}}catch(_){}}function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify(state))}catch(_){}}
restore();
function routeForHref(href){var clean=String(href||'').replace(/[?#].*$/,'');if(clean.indexOf('admin-dashboard-static.html')>=0)return byKey.dashboard;if(clean.indexOf('admin-list-static.html')>=0)return byKey['content-list'];if(clean.indexOf('admin-form-static.html')>=0)return byKey['content-add'];return routes.find(function(r){return r.href.replace(/[?#].*$/,'')===clean})||null}
function closeGlobalSearch(reason,event){return searchOwner&&typeof searchOwner.close==='function'?searchOwner.close(reason||'admin-shell',event||null):false}
function bindFrameInteraction(frame){try{var d=frame.contentDocument;if(!d)return;var close=function(e){closeGlobalSearch('iframe-interaction',e)};d.addEventListener('pointerdown',close,true);d.addEventListener('focusin',close,true)}catch(_){}}
function ensureFrame(key){var r=byKey[key];if(!r)return null;var f=frames.get(key);if(f)return f;f=document.createElement('iframe');f.className='qx-admin-frame';f.dataset.key=key;f.title=r.title;f.src=r.href;f.addEventListener('load',function(){broadcastTheme(f);bindFrameInteraction(f)});frames.set(key,f);stage.appendChild(f);return f}function destroyFrame(key){var f=frames.get(key);if(f){f.remove();frames.delete(key)}}
function tabItems(){return state.tabs.map(function(k){var r=byKey[k];return r?{key:k,label:r.title,closable:!r.pinned}:null}).filter(Boolean)}
function syncTabs(syncItems){state.tabs.forEach(ensureFrame);frames.forEach(function(f,k){f.classList.toggle('is-active',k===state.active)});var r=byKey[state.active];if(titleHost&&r)titleHost.textContent=r.title;if(!tabsOwner)return;syncingTabs=true;try{if(syncItems===true)tabsOwner.setItems(tabItems(),{silent:true,source:'admin-shell',reason:'sync-tabs'});tabsOwner.setActiveKey(state.active,{silent:true,source:'admin-shell',reason:'sync-active'});if(tabsOwner.refreshOverflow)tabsOwner.refreshOverflow()}finally{syncingTabs=false}}
function buildMenuItems(){var order=['工作台','内容','业务','列表','表单','详情','组织','工具','系统','账户','页面'];return order.map(function(g,i){var children=routes.filter(function(r){return r.group===g}).map(function(r){return{key:r.key,label:r.title,icon:menuIcon(r.icon)}});return children.length?{type:'group',key:'g'+i,label:g,items:children}:null}).filter(Boolean)}
function mountMenu(){menuOwner=own(C.Menu.create({container:menuHost,items:buildMenuItems(),mode:'inline',selectedKey:state.active,openKeys:[],collapsed:false,inlineIndent:22,selectionAppearance:'highlight',onNavigate:function(d){if(d&&byKey[d.key])navigate(d.key)}}))}
function mountTabs(){if(!tabsHost||!C.Tabs)return;tabsOwner=own(C.Tabs.create({container:tabsHost,items:tabItems(),activeKey:state.active,type:'line',size:'md',closable:true,overflow:true,edgeShadow:true,wheelPropagation:true,activationMode:'auto',onChange:function(k){if(!syncingTabs&&byKey[k])activate(k)},onBeforeEdit:function(d){return !!(d&&d.action==='remove'&&byKey[d.key]&&!byKey[d.key].pinned)},onEdit:function(k,a){if(!syncingTabs&&a==='remove')closeTab(String(k),true)}}));syncTabs(false)}
function activate(key,skipHash,forceItemSync){if(!byKey[key])return;closeGlobalSearch('route-activate');var added=state.tabs.indexOf(key)<0;if(added)state.tabs.push(key);state.active=key;persist();syncTabs(added||forceItemSync===true);if(menuOwner&&menuOwner.setSelectedKey)menuOwner.setSelectedKey(key,{silent:true,reason:'admin-route'});if(!skipHash&&location.hash!=='#/'+key)history.replaceState(null,'','#/'+key)}function navigate(key){activate(key)}
function closeTab(key,fromTabs){var r=byKey[key];if(!r||r.pinned)return;var i=state.tabs.indexOf(key);if(i<0)return;state.tabs.splice(i,1);destroyFrame(key);if(state.active===key){var os=fromTabs&&tabsOwner&&tabsOwner.getState?tabsOwner.getState():null,fb=os&&os.activeKey;state.active=byKey[fb]&&state.tabs.indexOf(fb)>=0?fb:(state.tabs[Math.max(0,i-1)]||'dashboard')}persist();activate(state.active,false,!fromTabs)}
function closeOthers(){state.tabs.slice().forEach(function(k){if(k!==state.active&&!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});persist();syncTabs(true)}function closeRight(){var i=state.tabs.indexOf(state.active);state.tabs.slice(i+1).forEach(function(k){if(!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});persist();syncTabs(true)}function closeAll(){state.tabs.slice().forEach(function(k){if(!byKey[k].pinned){state.tabs.splice(state.tabs.indexOf(k),1);destroyFrame(k)}});state.active='dashboard';persist();activate('dashboard',false,true)}function refreshActive(){var f=frames.get(state.active);if(f)f.src=f.src}
function currentMode(){if(!theme)return document.documentElement.classList.contains('qxframe9a7c2-theme-dark')?'dark':'light';var st=theme.getState();return st.effectiveMode||st.mode||'light'}function broadcastTheme(frame){var mode=currentMode(),target=frame?[frame]:Array.from(frames.values());target.forEach(function(f){try{f.contentWindow.postMessage({type:'qxframe9a7c2-admin:theme',mode:mode},'*')}catch(_){}})}function toggleTheme(){if(!theme)return;theme.setState({mode:currentMode()==='dark'?'light':'dark'});syncThemeIcon();broadcastTheme()}function syncThemeIcon(){if(!themeButton)return;themeButton.innerHTML='';themeButton.appendChild(icon(currentMode()==='dark'?'sun':'moon'))}
function mountSearch(){if(!searchHost||!C.Autocomplete)return;searchOwner=own(C.Autocomplete.create({container:searchHost,items:routes.map(function(r){return{key:r.key,value:r.title,label:r.group+' · '+r.title}}),clearable:true,matchOnly:true,highlightFirst:true,prefix:icon('search'),placeholder:'搜索菜单 / 页面',onSelect:function(value,payload){var key=payload&&payload.item&&payload.item.key;if(key)navigate(key)}}))}
function mountDropdowns(){var user=document.getElementById('qx-admin-user-trigger');if(user&&C.Dropdown)own(C.Dropdown.create({reference:user,trigger:'click',placement:'bottom-end',selectable:false,items:[{key:'profile',value:'profile',label:'个人中心'},{key:'settings',value:'settings',label:'系统设置'},{type:'divider',key:'d1'},{key:'login',value:'login',label:'退出登录'}],onSelect:function(d){if(d.key==='profile'||d.key==='settings')navigate(d.key);if(d.key==='login')location.href='login.html'}}));var more=document.getElementById('qx-admin-tabs-more');if(more&&C.Dropdown)own(C.Dropdown.create({reference:more,trigger:'click',placement:'bottom-end',selectable:false,items:[{key:'refresh',value:'refresh',label:'刷新当前页'},{type:'divider',key:'d2'},{key:'others',value:'others',label:'关闭其他标签'},{key:'right',value:'right',label:'关闭右侧标签'},{key:'all',value:'all',label:'关闭全部可关闭标签'}],onSelect:function(d){if(d.key==='refresh')refreshActive();if(d.key==='others')closeOthers();if(d.key==='right')closeRight();if(d.key==='all')closeAll()}}))}
function mountShellActions(){var collapse=document.getElementById('qx-admin-collapse'),mobile=document.getElementById('qx-admin-mobile-toggle'),mask=document.getElementById('qx-admin-mobile-mask'),collapsed=false;try{collapsed=localStorage.getItem('qxframe9a7c2-admin-collapsed')==='1'}catch(_){}function applyCollapsed(){shell.classList.toggle('is-collapsed',collapsed);if(menuOwner&&menuOwner.setCollapsed)menuOwner.setCollapsed(collapsed)}if(collapse)collapse.addEventListener('click',function(){collapsed=!collapsed;try{localStorage.setItem('qxframe9a7c2-admin-collapsed',collapsed?'1':'0')}catch(_){}applyCollapsed()});if(mobile)mobile.addEventListener('click',function(){shell.classList.add('is-mobile-open')});if(mask)mask.addEventListener('click',function(){shell.classList.remove('is-mobile-open')});if(stage)stage.addEventListener('pointerdown',function(e){closeGlobalSearch('stage-interaction',e)},true);var refresh=document.getElementById('qx-admin-refresh');if(refresh)refresh.addEventListener('click',refreshActive);if(themeButton)themeButton.addEventListener('click',toggleTheme);var full=document.getElementById('qx-admin-fullscreen');if(full)full.addEventListener('click',function(){if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();else if(document.exitFullscreen)document.exitFullscreen()});applyCollapsed()}
function routeFromHash(){var key=location.hash.replace(/^#\//,'');if(byKey[key])activate(key,true);else activate(state.active||'dashboard',true)}
window.addEventListener('hashchange',routeFromHash);window.addEventListener('message',function(e){var d=e.data||{};if(d.type!=='qxframe9a7c2-admin:navigate')return;var r=routeForHref(d.href);if(r)navigate(r.key)});window.addEventListener('pagehide',function(){owners.splice(0).forEach(function(o){try{o.destroy()}catch(_){}})});
mountMenu();mountSearch();mountTabs();mountDropdowns();mountShellActions();syncThemeIcon();routeFromHash();
})();