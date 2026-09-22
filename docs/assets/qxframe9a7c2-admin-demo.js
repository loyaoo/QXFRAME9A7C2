(function(){
  'use strict';
  var theme=window.QXFRAME9A7C2_DOCS_THEME;
  var Q=window.QXFRAME9A7C2;
  var C=Q&&Q.Components;
  var owners=[];
  function keep(owner){ if(owner&&typeof owner.destroy==='function') owners.push(owner); return owner; }
  function byId(id){ return document.getElementById(id); }
  function icon(name,stroke){ var n=document.createElement('span'); n.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+name+' is-line is-round is-stroke-'+(stroke||2); return n; }
  function menuIcon(name){ return function(){ return icon(name,2); }; }
  function actionItem(key,label,iconName,shortcut,extra){ var item=Object.assign({key:key,value:key,label:label},extra||{}); if(iconName)item.icon=icon(iconName,2); if(shortcut)item.shortcut=shortcut; return item; }
  function textNode(tag,cls,text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }

  function initTheme(){
    var button=document.querySelector('[data-admin-theme-toggle]');
    if(!theme||!button)return;
    function render(){ var dark=theme.getState().effectiveMode==='dark'; button.setAttribute('aria-label',dark?'切换到明亮主题':'切换到黑暗主题'); button.title=button.getAttribute('aria-label'); var node=button.querySelector('.qxframe9a7c2-icon'); if(node)node.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+(dark?'sun':'moon')+' is-line is-round is-stroke-2'; }
    button.addEventListener('click',function(){ var state=theme.getState(); theme.setState({mode:state.effectiveMode==='dark'?'light':'dark'}); render(); });
    window.addEventListener('qxframe9a7c2:docs-theme-change',render); render();
  }

  var menuOwner=null;
  function initNavigation(){
    if(!C||!C.Menu)return;
    var host=byId('admin-main-menu'); if(!host)return;
    var selected=host.getAttribute('data-admin-current')||'dashboard';
    var items=[
      {type:'group',key:'group-workbench',label:'工作台',items:[
        {key:'dashboard',label:'仪表盘',icon:menuIcon('chart'),href:'admin-dashboard-static.html'},
        {key:'content',label:'内容管理',icon:menuIcon('table'),items:[
          {key:'list',label:'内容列表',icon:menuIcon('list'),href:'admin-list-static.html',extra:'1284'},
          {key:'add',label:'新增内容',icon:menuIcon('plus'),href:'admin-form-static.html'},
          {key:'review',label:'审核队列',icon:menuIcon('check'),extra:'23'}]},
        {key:'media',label:'媒体资源',icon:menuIcon('image')},
        {key:'models',label:'数据模型',icon:menuIcon('database')}]},
      {type:'group',key:'group-system',label:'系统',items:[
        {key:'users',label:'用户与权限',icon:menuIcon('user')},
        {key:'settings',label:'系统设置',icon:menuIcon('setting')},
        {key:'jobs',label:'计划任务',icon:menuIcon('calendar')}]}];
    menuOwner=keep(C.Menu.create({container:host,items:items,mode:'inline',size:'md',selectedKey:selected,openKeys:['content'],inlineIndent:22,collapsedWidth:64,selectionAppearance:'highlight',onNavigate:function(detail){if(detail.href&&detail.href!=='#')window.location.href=detail.href;}}));
    var shell=document.querySelector('.admin-shell'), toggle=byId('admin-sider-toggle');
    if(toggle){
      toggle.addEventListener('click',function(){
        var next=!menuOwner.getState().collapsed;
        menuOwner.setCollapsed(next);
        shell&&shell.classList.toggle('is-sider-collapsed',next);
        toggle.setAttribute('aria-pressed',next?'true':'false');
        toggle.setAttribute('aria-label',next?'展开侧边栏':'切换窄栏图标模式');
        var glyph=toggle.querySelector('.qxframe9a7c2-icon'); if(glyph)glyph.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+(next?'unfold-more':'sidebar')+' is-line is-round is-stroke-2';
      });
    }
  }

  var globalSuggestions=[
    {key:'dashboard',value:'仪表盘',label:'仪表盘',href:'admin-dashboard-static.html'},
    {key:'content-list',value:'内容管理',label:'内容管理 · 内容列表',href:'admin-list-static.html'},
    {key:'content-add',value:'新增内容',label:'新增内容 · 创建文章/专题/商品',href:'admin-form-static.html'},
    {key:'media',value:'媒体资源',label:'媒体资源 · 图片 / 视频 / 音频'},
    {key:'models',value:'数据模型',label:'数据模型 · 字段与结构'},
    {key:'users',value:'用户与权限',label:'用户与权限 · 角色 / 权限'},
    {key:'settings',value:'系统设置',label:'系统设置 · 站点 / 缓存'}];
  function initGlobalAutocomplete(){ var host=byId('admin-global-search'); if(!C||!C.Autocomplete||!host)return; keep(C.Autocomplete.create({container:host,items:globalSuggestions,size:'sm',variant:'outlined',trigger:'focus',highlightFirst:true,matchOnly:true,clearable:true,prefix:icon('search',2),placeholder:'搜索内容、用户、菜单',onSelect:function(value,payload){if(payload&&payload.item&&payload.item.href)window.location.href=payload.item.href;}})); }
  function initUserDropdown(){ var trigger=byId('admin-user-trigger'); if(!C||!C.Dropdown||!trigger)return; keep(C.Dropdown.create({reference:trigger,trigger:'click',placement:'bottom-end',showArrow:true,selectable:false,items:[actionItem('profile','个人资料','user','⌘P'),actionItem('account','账户设置','setting'),{key:'user-divider',type:'divider'},actionItem('sign-out','退出登录','sign-out')]})); }
  function initDashboardDropdown(){ var trigger=byId('admin-dashboard-actions'); if(!C||!C.Dropdown||!trigger)return; keep(C.Dropdown.create({reference:trigger,trigger:'click',placement:'bottom-end',showArrow:true,selectable:false,items:[actionItem('new-content','新增内容','plus'),actionItem('upload-media','上传媒体','upload'),actionItem('refresh-index','刷新搜索索引','refresh'),{key:'dash-divider',type:'divider'},actionItem('export-report','导出仪表盘报告','download')],onSelect:function(detail){if(detail.key==='new-content')window.location.href='admin-form-static.html';}})); }

  var listRows=[
    ['CT-1001','秋季新品专题','专题页','已发布','产品运营','2026-09-19 08:42'],['CT-1002','胡桃木茶桌选购指南','文章','草稿','内容编辑','2026-09-18 20:15'],['CT-1003','TX-28 实木茶桌','商品','已发布','商品中心','2026-09-18 17:26'],['CT-1004','品牌故事','单页','审核中','品牌组','2026-09-18 15:08'],['CT-1005','九月活动规则','文章','已发布','活动运营','2026-09-18 11:36'],['CT-1006','门店展示图集','图集','已下线','媒体运营','2026-09-17 18:51'],['CT-1007','售后服务说明','单页','已发布','客服组','2026-09-17 13:20'],['CT-1008','2026 秋季招商资料','下载','草稿','渠道运营','2026-09-16 16:45'],['CT-1009','中秋门店活动','专题页','审核中','活动运营','2026-09-16 11:12'],['CT-1010','岩板茶桌保养指南','文章','已发布','内容编辑','2026-09-15 19:30'],['CT-1011','TX-36 商务茶桌','商品','已发布','商品中心','2026-09-15 15:44'],['CT-1012','品牌视觉规范','下载','草稿','品牌组','2026-09-15 10:26'],['CT-1013','门店地址更新','单页','已发布','渠道运营','2026-09-14 17:10'],['CT-1014','国庆活动预告','文章','审核中','活动运营','2026-09-14 13:08'],['CT-1015','展厅视频合集','图集','已下线','媒体运营','2026-09-13 18:22']
  ].map(function(r){return{id:r[0],title:r[1],type:r[2],status:r[3],owner:r[4],updated:r[5]};});
  var listState={keyword:'',type:'all',status:'all',date:'',tab:'all',page:1,pageSize:5};
  var listTable=null,listPagination=null;
  function statusBadge(status){ var cls=status==='已发布'?'is-success is-solid':status==='审核中'?'is-warning':status==='已下线'?'is-error':'is-default'; return textNode('span','qxframe9a7c2-badge '+cls,status); }
  function titleCell(row){ var wrap=textNode('div','admin-table-titlecell'); var avatar=textNode('span','qxframe9a7c2-avatar is-sm is-square',String(row.title).charAt(0)); var info=document.createElement('div'); info.append(textNode('strong','',row.title),textNode('span','', 'ID: '+row.id)); wrap.append(avatar,info); return wrap; }
  function rowActions(row){
    var wrap=textNode('div','admin-table-actions');
    var edit=textNode('a','qxframe9a7c2-button is-primary is-text is-sm','编辑'); edit.href='admin-form-static.html';
    var more=textNode('button','qxframe9a7c2-button is-default is-text is-sm','更多'); more.type='button';
    more.addEventListener('click',function(event){
      event.preventDefault(); event.stopPropagation();
      if(!more._dropdown){ more._dropdown=keep(C.Dropdown.create({reference:more,trigger:'manual',placement:'bottom-end',selectable:false,items:[actionItem('preview-'+row.id,'预览','eye'),actionItem('duplicate-'+row.id,'复制','copy'),actionItem('history-'+row.id,'版本记录','history'),{key:'divider-'+row.id,type:'divider'},actionItem('delete-'+row.id,'删除','close')]})); }
      more._dropdown.toggle('row-more',event);
    });
    wrap.append(edit,more); return wrap;
  }
  function filteredRows(){
    var keyword=listState.keyword.trim().toLowerCase();
    return listRows.filter(function(row){
      if(keyword&&[row.id,row.title,row.owner].join(' ').toLowerCase().indexOf(keyword)<0)return false;
      if(listState.type!=='all'&&row.type!==listState.type)return false;
      var status=listState.tab!=='all'?listState.tab:listState.status;
      if(status!=='all'&&row.status!==status)return false;
      if(listState.date&&row.updated.slice(0,10)!==listState.date)return false;
      return true;
    });
  }
  function syncList(){
    if(!listTable||!listPagination)return;
    var rows=filteredRows(); var max=Math.max(1,Math.ceil(rows.length/listState.pageSize)); if(listState.page>max)listState.page=max;
    listTable.updateOptions({items:rows,page:listState.page,pageSize:listState.pageSize});
    listPagination.updateOptions({count:rows.length,current:listState.page,pageSize:listState.pageSize});
    var info=byId('admin-list-page-info'); if(info)info.textContent='共 '+rows.length+' 条 · 第 '+listState.page+' / '+max+' 页';
  }
  function initListControls(){
    if(!C)return;
    var auto=byId('admin-list-autocomplete');
    if(auto)keep(C.Autocomplete.create({container:auto,items:listRows.map(function(r){return{key:r.id,value:r.title,label:r.title+' · '+r.id+' · '+r.owner};}),trigger:'focus',highlightFirst:true,matchOnly:false,clearable:true,prefix:icon('search',2),placeholder:'标题 / ID / 作者',onInput:function(value){listState.keyword=value||'';},onChange:function(value){listState.keyword=value||'';}}));
    var typeHost=byId('admin-list-type-select');
    if(typeHost)keep(C.Select.create({target:typeHost,value:'all',items:['all','专题页','文章','商品','单页','图集','下载'].map(function(v){return{key:v,value:v,label:v==='all'?'全部类型':v};}),clearable:false,searchable:true,onChange:function(v){listState.type=v||'all';listState.page=1;syncList();}}));
    var statusHost=byId('admin-list-status-select');
    if(statusHost)keep(C.Select.create({target:statusHost,value:'all',items:['all','已发布','草稿','审核中','已下线'].map(function(v){return{key:v,value:v,label:v==='all'?'全部状态':v};}),clearable:false,onChange:function(v){listState.status=v||'all';listState.page=1;syncList();}}));
    var dateHost=byId('admin-list-date-picker');
    if(dateHost)keep(C.DatePicker.create({target:dateHost,value:null,clearable:true,placeholder:'选择日期',onChange:function(v){listState.date=v&&v.getFullYear?String(v.getFullYear())+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0'):'';listState.page=1;syncList();}}));
    var form=document.querySelector('.admin-filter-form'); if(form){ var buttons=form.querySelectorAll('button'); if(buttons[0])buttons[0].addEventListener('click',function(){listState.page=1;syncList();}); if(buttons[1])buttons[1].addEventListener('click',function(){listState={keyword:'',type:'all',status:'all',date:'',tab:'all',page:1,pageSize:listState.pageSize}; window.location.reload();}); }
  }
  function initListTabs(){ var host=byId('admin-list-tabs'); if(!C||!C.Tabs||!host)return; keep(C.Tabs.create({container:host,size:'sm',type:'line',activeKey:'all',items:[{key:'all',label:'全部'},{key:'已发布',label:'已发布'},{key:'草稿',label:'草稿'},{key:'审核中',label:'审核中'},{key:'已下线',label:'已下线'}],onChange:function(key){listState.tab=key;listState.page=1;syncList();}})); }
  function initListTable(){
    var host=byId('admin-list-table'); if(!C||!C.Table||!host)return;
    listTable=keep(C.Table.create({container:host,items:filteredRows(),getKey:function(r){return r.id;},selectionMode:'multiple',page:1,pageSize:listState.pageSize,size:'md',hover:true,stickyHeader:true,keyboardNavigation:true,columns:[
      {key:'title',title:'标题',width:300,fixed:'start',sortable:true,render:function(v,row){return titleCell(row);}},
      {key:'type',title:'类型',width:110,filterOptions:['专题页','文章','商品','单页','图集','下载'].map(function(v){return{label:v,value:v};})},
      {key:'status',title:'状态',width:110,render:function(v){return statusBadge(v);}},
      {key:'owner',title:'负责人',width:120},
      {key:'updated',title:'更新时间',width:170,sortable:true,sortOrder:'desc'},
      {key:'actions',title:'操作',width:120,align:'end',fixed:'end',render:function(v,row){return rowActions(row);}}
    ],onSelectionChange:function(keys){var note=document.querySelector('.admin-toolbar-note');if(note)note.textContent='已选择 '+keys.length+' 项';}}));
    var pHost=byId('admin-list-pagination');
    if(pHost&&C.Pagination)listPagination=keep(C.Pagination.create({container:pHost,count:filteredRows().length,current:1,pageSize:listState.pageSize,pagerCount:7,showTotal:false,showSizeChanger:true,pageSizeOptions:[5,10,20],size:'sm',onChange:function(page,size){listState.page=page;listState.pageSize=size;listTable.setPageSize(size,{silent:true});listTable.setPage(page,{silent:true});syncList();}}));
    syncList();
  }
  function initListDropdowns(){ var batch=byId('admin-batch-trigger'); if(!C||!C.Dropdown||!batch)return; keep(C.Dropdown.create({reference:batch,trigger:'click',placement:'bottom-start',showArrow:true,selectable:false,submenuTrigger:'hover',items:[actionItem('publish','批量发布','check'),actionItem('move','移动分类','folder',null,{items:[actionItem('move-news','新闻中心','file'),actionItem('move-products','商品中心','database'),actionItem('move-campaign','活动专题','calendar')]}),actionItem('export','导出所选','download'),{key:'batch-divider',type:'divider'},actionItem('offline','批量下线','close')]})); }

  function enhanceControl(id,options){ var field=byId(id); if(!field||!C||!C.Control)return null; return keep(C.Control.enhance(field,Object.assign({size:'md',variant:'outlined',clearable:true},options||{}))); }
  function initFormTabs(){ var host=byId('admin-form-tabs'); if(!C||!C.Tabs||!host)return; keep(C.Tabs.create({container:host,size:'sm',type:'line',activeKey:'basic',items:[{key:'basic',label:'基础信息'},{key:'publish',label:'发布设置'},{key:'access',label:'权限'},{key:'seo',label:'SEO'}],onChange:function(key){var map={basic:'.admin-form-main .admin-form-card',publish:'.admin-form-side .admin-form-card',access:'.admin-form-side .admin-form-card:nth-child(2)',seo:'.admin-form-main .admin-form-card'};var target=document.querySelector(map[key]);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});}})); }
  function initFormControls(){
    if(!C)return;
    enhanceControl('admin-title-input',{name:'title',placeholder:'请输入内容标题'});
    enhanceControl('admin-slug-input',{name:'slug',prefix:'/content/'});
    enhanceControl('admin-summary-textarea',{name:'summary',editor:'textarea',count:true,maxLength:160,placeholder:'简要描述页面内容'});
    var typeHost=byId('admin-content-type-select'); if(typeHost)keep(C.Select.create({target:typeHost,name:'type',value:'topic',searchable:true,clearable:true,items:[{key:'topic',value:'topic',label:'专题页'},{key:'article',value:'article',label:'文章'},{key:'product',value:'product',label:'商品'},{key:'page',value:'page',label:'单页'}]}));
    var catHost=byId('admin-category-cascader'); if(catHost)keep(C.Cascader.create({target:catHost,name:'category',value:'season',clearable:true,items:[{key:'marketing',value:'marketing',label:'市场活动',items:[{key:'season',value:'season',label:'季节专题'},{key:'campaign',value:'campaign',label:'营销活动'}]},{key:'product',value:'product',label:'商品中心',items:[{key:'table',value:'table',label:'茶桌'},{key:'chair',value:'chair',label:'茶椅'}]}]}));
    var tags=byId('admin-tags-input'); if(tags)keep(C.TagInput.create({target:tags,name:'tags',value:[{key:'autumn',value:'autumn',label:'秋季新品'},{key:'topic',value:'topic',label:'专题'}],creatable:true,tokenSeparators:[',',';'],placeholder:'输入标签后回车'}));
    var date=byId('admin-publish-date'); if(date)keep(C.DatePicker.create({target:date,name:'publishAt',value:'2026-09-19',clearable:true,placeholder:'选择发布日期'}));
    var weight=byId('admin-weight-input'); if(weight)keep(C.InputNumber.create({target:weight,name:'weight',value:10,min:0,max:999,step:1,controls:true}));
    var upload=byId('admin-cover-upload'); if(upload)keep(C.Upload.create({target:upload,name:'cover',multiple:false,drag:true,autoUpload:false,listType:'text',accept:'image/*,video/*',beforeUpload:function(){return false;}}));
  }
  function initAuthorAutocomplete(){ var host=byId('admin-author-autocomplete'); if(!C||!C.Autocomplete||!host)return; keep(C.Autocomplete.create({container:host,items:[{key:'liao',value:'廖垚',label:'廖垚 · 超级管理员'},{key:'product',value:'产品运营',label:'产品运营 · 内容组'},{key:'editor',value:'内容编辑',label:'内容编辑 · 编辑组'},{key:'brand',value:'品牌组',label:'品牌组 · 品牌内容'},{key:'channel',value:'渠道运营',label:'渠道运营 · 渠道组'}],defaultValue:'廖垚',trigger:'focus',highlightFirst:true,matchOnly:true,clearable:true,prefix:icon('user',2),placeholder:'搜索作者'})); }
  function initFormDropdown(){ var trigger=byId('admin-save-more'); if(!C||!C.Dropdown||!trigger)return; keep(C.Dropdown.create({reference:trigger,trigger:'click',placement:'top-end',showArrow:true,selectable:false,items:[actionItem('preview','保存并预览','eye'),actionItem('template','另存为模板','copy'),actionItem('schedule','定时发布','calendar'),{key:'form-divider',type:'divider'},actionItem('discard','放弃修改','close')]})); }

  initTheme();
  if(!Q||!C)return;
  initNavigation(); initGlobalAutocomplete(); initUserDropdown(); initDashboardDropdown();
  initListControls(); initListTabs(); initListTable(); initListDropdowns();
  initFormTabs(); initFormControls(); initAuthorAutocomplete(); initFormDropdown();
  window.QXFRAME9A7C2_ADMIN_DEMO={getOwners:function(){return owners.slice();},getMenu:function(){return menuOwner;},getTable:function(){return listTable;},getPagination:function(){return listPagination;}};
})();
