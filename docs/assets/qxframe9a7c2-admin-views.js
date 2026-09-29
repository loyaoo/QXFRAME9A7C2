(function(){
'use strict';
var Q=window.QXFRAME9A7C2,C=Q&&Q.Components,theme=window.QXFRAME9A7C2_DOCS_THEME,owners=[];
if(!Q||!C)return;
function own(x){if(x&&typeof x.destroy==='function')owners.push(x);return x}
function byId(id){return document.getElementById(id)}
function slot(host,cls){var n=document.createElement('div');if(cls)n.className=cls;host.appendChild(n);return n}
function button(text,cls){var b=document.createElement('button');b.type='button';b.className=cls||'qxframe9a7c2-button is-default is-outlined is-sm';b.textContent=text;return b}
function heading(host,textValue){var n=document.createElement('strong');n.className='qx-admin-inline-title';n.textContent=textValue;host.appendChild(n);return n}
function appendCard(title,id){var root=document.body.firstElementChild;if(!root)return null;var a=document.createElement('article');a.className='qxframe9a7c2-col-24 qxframe9a7c2-card qx-admin-view-card';var h=document.createElement('header');h.className='qxframe9a7c2-card-header';var t=document.createElement('div');t.className='qxframe9a7c2-card-title';t.textContent=title;h.appendChild(t);var b=document.createElement('div');b.className='qxframe9a7c2-card-body';var host=document.createElement('div');host.id=id;host.className='qx-admin-component-host';b.appendChild(host);a.appendChild(h);a.appendChild(b);root.appendChild(a);return host}
function demoImage(label,color){var svg='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" rx="24" fill="'+color+'"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">'+label+'</text></svg>';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}

function icon(name){var n=document.createElement('span');n.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+name+' is-line is-round is-stroke-2';return n}
function badge(text,tone){var n=document.createElement('span');n.className='qxframe9a7c2-badge '+(tone||'is-default');n.textContent=text;return n}
function route(key){if(window.parent!==window)window.parent.postMessage({type:'qxframe9a7c2-admin:navigate',href:key},'*')}
document.addEventListener('click',function(e){var n=e.target;while(n&&n!==document&&!n.dataset.adminRoute)n=n.parentNode;if(n&&n.dataset&&n.dataset.adminRoute){e.preventDefault();route(n.dataset.adminRoute)}});
window.addEventListener('message',function(e){var d=e.data||{};if(d.type==='qxframe9a7c2-admin:theme'&&theme&&d.mode)theme.setState({mode:d.mode})});
document.querySelectorAll('[data-qx-control]').forEach(function(el){if(C.Control)own(C.Control.enhance(el,{size:'md',variant:'outlined',clearable:el.dataset.clearable!=='false'}))});
document.querySelectorAll('[data-qx-select]').forEach(function(host){if(!C.Select)return;var values=String(host.dataset.qxSelect||'').split('|').filter(Boolean);own(C.Select.create({container:host,value:(values[0]||'').split(':')[0]||null,clearable:false,items:values.map(function(v,i){var p=v.split(':');return{key:String(i),value:p[0],label:p[1]||p[0]}})}))});
document.querySelectorAll('[data-qx-date]').forEach(function(host){if(C.DatePicker)own(C.DatePicker.create({container:host,clearable:true,placeholder:host.dataset.placeholder||'选择日期'}))});
function mountTable(id,rows,columns,options){var host=byId(id);if(!host||!C.Table)return null;return own(C.Table.create(Object.assign({container:host,items:rows,getKey:function(r){return r.id},size:'md',hover:true,stickyHeader:true,keyboardNavigation:true,columns:columns},options||{})))}
var view=document.body.dataset.qxAdminView;
if(view==='users'){
 var rows=[['U1001','廖垚','超级管理员','正常','2026-09-29 09:18'],['U1002','产品运营','运营编辑','正常','2026-09-29 08:42'],['U1003','内容编辑','内容编辑','正常','2026-09-28 22:10'],['U1004','渠道运营','渠道经理','正常','2026-09-28 18:31'],['U1005','品牌组','品牌编辑','停用','2026-09-27 14:08'],['U1006','客服组','客服','正常','2026-09-26 20:17']].map(function(r){return{id:r[0],name:r[1],role:r[2],status:r[3],last:r[4]}});
 mountTable('users-table',rows,[{key:'name',title:'用户',width:220,render:function(v,row){var d=document.createElement('div');d.textContent=row.name+' · '+row.id;return d}},{key:'role',title:'角色',width:150},{key:'status',title:'状态',width:100,render:function(v){return badge(v,v==='正常'?'is-success is-solid':'is-default')}},{key:'last',title:'最后登录',width:170},{key:'actions',title:'操作',width:120,align:'end',render:function(){var b=document.createElement('button');b.className='qxframe9a7c2-button is-primary is-text is-sm';b.textContent='编辑';return b}}],{selectionMode:'multiple'});
}
if(view==='orders'){
 var rows=[['SO-260929-001','企业采购 · 茶桌套装','¥28,680','待发货','杭州','2026-09-29 09:31'],['SO-260929-002','TX-36 商务茶桌','¥8,960','已支付','上海','2026-09-29 08:55'],['SO-260928-021','门店展示组合','¥16,420','运输中','苏州','2026-09-28 20:16'],['SO-260928-020','胡桃木茶桌','¥6,980','已完成','宁波','2026-09-28 18:02'],['SO-260928-019','定制会议桌','¥38,600','售后中','深圳','2026-09-28 15:44']].map(function(r){return{id:r[0],goods:r[1],amount:r[2],status:r[3],city:r[4],time:r[5]}});
 mountTable('orders-table',rows,[{key:'id',title:'订单号',width:170,fixed:'start'},{key:'goods',title:'商品 / 项目',width:250},{key:'amount',title:'金额',width:120},{key:'status',title:'状态',width:110,render:function(v){return badge(v,v==='已完成'?'is-success is-solid':v==='售后中'?'is-error':'is-warning')}},{key:'city',title:'城市',width:90},{key:'time',title:'下单时间',width:170},{key:'actions',title:'操作',width:100,align:'end',fixed:'end',render:function(){var b=document.createElement('button');b.className='qxframe9a7c2-button is-primary is-text is-sm';b.textContent='详情';return b}}]);
}
if(view==='logs'){
 var rows=[['LG-9081','管理员','发布内容','秋季新品专题','成功','2026-09-29 09:44:18'],['LG-9080','产品运营','更新商品','TX-36 商务茶桌','成功','2026-09-29 09:31:52'],['LG-9079','系统任务','刷新索引','search-v4','成功','2026-09-29 09:20:06'],['LG-9078','渠道运营','导出数据','门店清单.xlsx','成功','2026-09-29 08:58:43'],['LG-9077','内容编辑','删除草稿','旧版活动页','失败','2026-09-29 08:37:12']].map(function(r){return{id:r[0],actor:r[1],action:r[2],target:r[3],status:r[4],time:r[5]}});
 mountTable('logs-table',rows,[{key:'time',title:'时间',width:180},{key:'actor',title:'操作者',width:120},{key:'action',title:'动作',width:140},{key:'target',title:'对象',width:260},{key:'status',title:'结果',width:90,render:function(v){return badge(v,v==='成功'?'is-success':'is-error')}},{key:'id',title:'日志 ID',width:120}]);
}
if(view==='media'){
 var host=byId('media-upload');if(host&&C.Upload)own(C.Upload.create({container:host,multiple:true,drag:true,autoUpload:false,listType:'text',accept:'image/*,video/*,audio/*',beforeUpload:function(){return false}}));
}
if(view==='search'){
 var host=byId('search-autocomplete');if(host&&C.Autocomplete)own(C.Autocomplete.create({container:host,items:[{key:'content-list',value:'内容管理',label:'内容 · 内容管理'},{key:'users',value:'用户管理',label:'组织 · 用户管理'},{key:'orders',value:'订单中心',label:'业务 · 订单中心'},{key:'settings',value:'系统设置',label:'系统 · 系统设置'}],clearable:true,matchOnly:false,highlightFirst:true,prefix:icon('search'),placeholder:'搜索内容、用户、订单或设置'}));
}
if(view==='settings'){
 var locale=byId('settings-locale');if(locale&&C.Select)own(C.Select.create({container:locale,value:'zh-CN',clearable:false,items:[{key:'zh-CN',value:'zh-CN',label:'简体中文'},{key:'en-US',value:'en-US',label:'English'}]}));
}

if(view==='monitor'){
 var rows=[['API-01','Web API','us-west','正常','86ms'],['SRCH-02','Search','us-east','告警','318ms'],['MQ-01','Queue','ap-east','正常','24 jobs'],['OSS-01','Storage','cn-east','正常','99.97%']].map(function(r){return{id:r[0],service:r[1],region:r[2],status:r[3],metric:r[4]}});
 mountTable('monitor-table',rows,[{key:'service',title:'服务',width:150},{key:'region',title:'区域',width:110},{key:'status',title:'状态',width:90,render:function(v){return badge(v,v==='正常'?'is-success':'is-error')}},{key:'metric',title:'当前指标',width:120}]);
}
if(view==='products'){
 var rows=[['SPU-10028','TX-36 商务茶桌','桌类','¥8,960','在售','186'],['SPU-10031','胡桃木会议桌','桌类','¥12,800','在售','42'],['SPU-10035','商务会客椅','椅类','¥1,280','待审核','96'],['SPU-10042','门店展示组合','套装','¥16,420','草稿','18'],['SPU-10051','定制会议组合','套装','¥38,600','已下架','0']].map(function(r){return{id:r[0],name:r[1],category:r[2],price:r[3],status:r[4],stock:r[5]}});
 mountTable('products-table',rows,[{key:'id',title:'SPU',width:130,fixed:'start'},{key:'name',title:'商品',width:220},{key:'category',title:'分类',width:100},{key:'price',title:'价格',width:110},{key:'stock',title:'库存',width:90},{key:'status',title:'状态',width:100,render:function(v){return badge(v,v==='在售'?'is-success':v==='待审核'?'is-warning':'is-default')}},{key:'actions',title:'操作',width:100,align:'end',fixed:'end',render:function(){var b=document.createElement('button');b.className='qxframe9a7c2-button is-primary is-text is-sm';b.textContent='编辑';return b}}],{selectionMode:'multiple'});
}
if(view==='inventory'){
 var rows=[['SKU-3601','TX-36 商务茶桌','华东仓','186','28','158'],['SKU-3602','TX-36 商务茶桌','华南仓','92','12','80'],['SKU-4401','胡桃木会议桌','华东仓','42','8','34'],['SKU-5103','商务会客椅','华北仓','96','18','78'],['SKU-6208','门店展示组合','华东仓','18','6','12']].map(function(r){return{id:r[0],name:r[1],warehouse:r[2],onhand:r[3],reserved:r[4],available:r[5]}});
 mountTable('inventory-table',rows,[{key:'id',title:'SKU',width:120},{key:'name',title:'商品',width:220},{key:'warehouse',title:'仓库',width:110},{key:'onhand',title:'现有',width:90},{key:'reserved',title:'预占',width:90},{key:'available',title:'可售',width:90}]);
}
if(view==='customers'){
 var rows=[['C-28001','杭州木作空间有限公司','企业','A','¥286K','今天 10:18'],['C-28002','上海静安门店','门店','A','¥128K','今天 09:42'],['C-28003','苏州生活馆','门店','B','¥68K','昨天'],['C-28004','North Retail Group','企业','S','¥1.26M','昨天'],['C-28005','个人客户 0821','个人','C','¥8.6K','3 天前']].map(function(r){return{id:r[0],name:r[1],type:r[2],level:r[3],value:r[4],last:r[5]}});
 mountTable('customers-table',rows,[{key:'name',title:'客户',width:240},{key:'type',title:'类型',width:90},{key:'level',title:'等级',width:80},{key:'value',title:'累计成交',width:120},{key:'last',title:'最近互动',width:140},{key:'actions',title:'操作',width:90,align:'end',render:function(){var b=document.createElement('button');b.className='qxframe9a7c2-button is-primary is-text is-sm';b.textContent='详情';return b}}]);
}
if(view==='finance'){
 var rows=[['SET-260929-01','线上商城','销售结算','¥186,420','待结算','2026-09-30'],['SET-260929-02','企业采购','销售结算','¥128,680','已结算','2026-09-29'],['REF-260929-08','线上商城','退款','-¥8,960','处理中','2026-09-29'],['SET-260928-07','线下门店','销售结算','¥96,280','已结算','2026-09-28']].map(function(r){return{id:r[0],channel:r[1],type:r[2],amount:r[3],status:r[4],date:r[5]}});
 mountTable('finance-table',rows,[{key:'id',title:'流水号',width:150},{key:'channel',title:'渠道',width:120},{key:'type',title:'类型',width:100},{key:'amount',title:'金额',width:120},{key:'status',title:'状态',width:100,render:function(v){return badge(v,v==='已结算'?'is-success':v==='处理中'?'is-warning':'is-default')}},{key:'date',title:'日期',width:120}]);
}
if(view==='table-list'){
 var rows=[['T-1024','库存盘点','仓储经理','进行中','78%','2026-10-02'],['T-1025','秋季专题复盘','产品运营','待开始','0%','2026-10-05'],['T-1026','客户分层刷新','CRM 运营','已完成','100%','2026-09-28'],['T-1027','商品价格审计','商品组','已暂停','46%','2026-10-06']].map(function(r){return{id:r[0],name:r[1],owner:r[2],status:r[3],progress:r[4],deadline:r[5]}});
 mountTable('table-list-table',rows,[{key:'id',title:'任务 ID',width:110,fixed:'start'},{key:'name',title:'任务名称',width:220},{key:'owner',title:'负责人',width:120},{key:'status',title:'状态',width:100,render:function(v){return badge(v,v==='已完成'?'is-success':v==='进行中'?'is-primary':'is-default')}},{key:'progress',title:'进度',width:100},{key:'deadline',title:'截止日期',width:120},{key:'actions',title:'操作',width:100,align:'end',fixed:'end',render:function(){var b=document.createElement('button');b.className='qxframe9a7c2-button is-primary is-text is-sm';b.textContent='查看';return b}}],{selectionMode:'multiple'});
}
if(view==='advanced-detail'){
 var rows=[['D1','样板门店设计','设计组','已完成'],['D2','首批物料生产','供应链','已完成'],['D3','上海门店施工','项目组','进行中'],['D4','杭州/苏州物料配送','物流组','进行中'],['D5','第二批门店施工','项目组','待开始']].map(function(r){return{id:r[0],item:r[1],owner:r[2],status:r[3]}});
 mountTable('advanced-detail-table',rows,[{key:'item',title:'交付项',width:220},{key:'owner',title:'负责人',width:120},{key:'status',title:'状态',width:100,render:function(v){return badge(v,v==='已完成'?'is-success':v==='进行中'?'is-primary':'is-default')}}]);
}

if(view==='schedule'){
 var cal=byId('schedule-calendar'),period=byId('schedule-period'),dates=byId('schedule-dates'),times=byId('schedule-times');
 if(cal&&C.Calendar)own(C.Calendar.create({container:cal,value:'2026-09-29',disabledDate:function(d){return d.getDay()===0;}}));
 if(period&&C.PeriodPanel){[['month','2026-09'],['quarter','2026-Q3'],['year','2026']].forEach(function(x){var h=slot(period,'qx-admin-inline-block');heading(h,x[0]==='month'?'月份':x[0]==='quarter'?'季度':'年份');own(C.PeriodPanel.create({container:h,unit:x[0],value:x[1]}));});}
 if(dates&&C.DatePicker){
   var a=slot(dates,'qx-admin-inline-block');heading(a,'单日期');own(C.DatePicker.create({container:a,value:'2026-09-29',clearable:true}));
   var b=slot(dates,'qx-admin-inline-block');heading(b,'范围 · 双 Control');own(C.DatePicker.create({container:b,selection:'range',rangeControl:'dual',value:['2026-09-29','2026-10-06'],needConfirm:true,showCancel:true}));
   var c2=slot(dates,'qx-admin-inline-block');heading(c2,'范围 · Segments');own(C.DatePicker.create({container:c2,selection:'range',rangeControl:'segments',value:['2026-10-01','2026-10-15']}));
   var d=slot(dates,'qx-admin-inline-block');heading(d,'多选日期');own(C.DatePicker.create({container:d,selection:'multiple',value:['2026-10-02','2026-10-09','2026-10-16']}));
 }
 if(times){
   if(C.TimePicker){var tp=slot(times,'qx-admin-inline-block');heading(tp,'会议时间');own(C.TimePicker.create({container:tp,value:'09:30:00',minuteStep:5}));var tp2=slot(times,'qx-admin-inline-block');heading(tp2,'确认后提交');own(C.TimePicker.create({container:tp2,value:'13:15:00',use12Hours:true,needConfirm:true,showCancel:true}));}
   if(C.TimePanel){var tpanel=slot(times,'qx-admin-inline-block');heading(tpanel,'只读时间面板');own(C.TimePanel.create({container:tpanel,value:'13:15:00',use12Hours:true,readOnly:true}));}
   if(C.WheelPicker){var wh=slot(times,'qx-admin-inline-block');heading(wh,'财年 / 月份轮选');own(C.WheelPicker.create({container:wh,columns:[{key:'year',label:'Year',items:['2026','2027','2028'].map(function(v){return{key:v,value:v,label:v};})},{key:'month',label:'Month',items:['01','02','03','04','05','06','07','08','09','10','11','12'].map(function(v){return{key:v,value:v,label:v};})}],value:['2026','10'],needConfirm:true,showCancel:true}));}
 }
}
if(view==='workflow'){
 var tree=byId('workflow-tree'),transfer=byId('workflow-transfer'),steps=byId('workflow-steps'),sc=byId('workflow-sort-collapse');
 var treeItems=[{key:'ops',value:'ops',label:'运营中心',items:[{key:'content',value:'content',label:'内容组'},{key:'growth',value:'growth',label:'增长组'}]},{key:'product',value:'product',label:'商品中心',items:[{key:'merch',value:'merch',label:'商品组'},{key:'supply',value:'supply',label:'供应链'}]}];
 if(tree){
   if(C.Tree){var th=slot(tree,'qx-admin-inline-block');heading(th,'组织树');own(C.Tree.create({container:th,items:treeItems,value:'content',checkable:true,checkedKeys:['content'],expandedKeys:['ops','product'],showLine:true,expandOnRowClick:true}));}
   if(C.TreeSelect){var ts=slot(tree,'qx-admin-inline-block');heading(ts,'审批组织');own(C.TreeSelect.create({container:ts,items:treeItems,defaultValue:['content','supply'],multiple:true,searchable:true,clearable:true,expandedKeys:['ops','product'],maxVisibleTags:1}));}
   if(C.Cascader){var ca=slot(tree,'qx-admin-inline-block');heading(ca,'区域范围');own(C.Cascader.create({container:ca,items:[{key:'cn',value:'cn',label:'中国',items:[{key:'east',value:'east',label:'华东',items:[{key:'sh',value:'sh',label:'上海'},{key:'hz',value:'hz',label:'杭州'}]},{key:'south',value:'south',label:'华南',items:[{key:'sz',value:'sz',label:'深圳'}]}]}],multiple:true,clearable:true,maxVisibleTags:1}));}
 }
 if(transfer&&C.Transfer)own(C.Transfer.create({container:transfer,items:[{key:'u1',value:'u1',label:'产品运营'},{key:'u2',value:'u2',label:'内容编辑'},{key:'u3',value:'u3',label:'仓储经理'},{key:'u4',value:'u4',label:'财务审核'},{key:'u5',value:'u5',label:'客服主管'}],value:['u2','u4'],titles:['可选成员','审批成员'],searchable:true,sortable:true,pagination:{pageSize:3,hideOnSinglePage:false}}));
 if(steps&&C.Steps){var st=slot(steps,'qx-admin-inline-block');heading(st,'标准审批');own(C.Steps.create({container:st,current:1,percent:68,clickable:true,items:[{title:'发起',description:'填写申请'},{title:'审核',subTitle:'68%',description:'业务复核'},{title:'执行',description:'落地变更'},{title:'归档',description:'记录结果'}]}));var nav=slot(steps,'qx-admin-inline-block');heading(nav,'导航步骤');own(C.Steps.create({container:nav,type:'navigation',size:'sm',current:0,clickable:true,items:[{title:'配置'},{title:'规则'},{title:'发布'}]}));}
 if(sc){
   if(C.Sort){var sh=slot(sc,'qx-admin-inline-block');heading(sh,'阶段排序');own(C.Sort.create({container:sh,items:[{key:'design',label:'设计'},{key:'review',label:'复核'},{key:'release',label:'发布'},{key:'archive',label:'归档'}]}));}
   if(C.Collapse){var ch=slot(sc,'qx-admin-inline-block');heading(ch,'规则说明');own(C.Collapse.create({container:ch,defaultValue:['a'],accordion:true,items:[{key:'a',label:'通过条件',content:'全部必审节点通过后进入执行。'},{key:'b',label:'驳回条件',content:'任一必审节点驳回即退回发起人。'},{key:'c',label:'超时策略',content:'超过 24 小时自动提醒负责人。'}]}));}
   if(C.Item){var ih=slot(sc,'qx-admin-inline-row');heading(ih,'Item 选择投影');['checkbox','check-start','check-end','highlight'].forEach(function(a2){var n=document.createElement('div');n.className='qxframe9a7c2-item-surface';n.textContent=a2;C.Item.applySelectionAppearance(n,a2);C.Item.syncState(n,{selected:true});var ind=C.Item.createSelectionIndicator({appearance:a2,checked:true});if(ind)n.insertBefore(ind,n.firstChild);ih.appendChild(n);});}
 }
}
if(view==='theme-center'){
 var colors=byId('theme-colors'),controls=byId('theme-controls'),preview=byId('theme-preview');
 if(colors){
   if(C.ColorPicker){var cp=slot(colors,'qx-admin-inline-block');heading(cp,'品牌色');own(C.ColorPicker.create({container:cp,value:'#1677FF',showAlpha:true,presets:['#1677FF','#52C41A','#FAAD14','#F5222D']}));var cp2=slot(colors,'qx-admin-inline-block');heading(cp2,'确认会话');own(C.ColorPicker.create({container:cp2,value:'#722ED1',needConfirm:true,showCancel:true,presets:['#722ED1','#13C2C2','#EB2F96']}));var cp3=slot(colors,'qx-admin-inline-block');heading(cp3,'仅色块');own(C.ColorPicker.create({container:cp3,value:'#13C2C2',swatchOnly:true,presets:['#13C2C2','#1677FF','#52C41A']}));}
   if(C.ColorPanel){var panel=slot(colors,'qx-admin-inline-block');heading(panel,'高级调色');own(C.ColorPanel.create({container:panel,value:'rgb(26, 74, 184)',format:'rgb',showAlpha:true,presets:['#1677FF','#52C41A','#FAAD14','#F5222D','#722ED1']}));}
 }
 if(controls){
   if(C.Slider){var sl=slot(controls,'qx-admin-inline-block');heading(sl,'内容密度');own(C.Slider.create({container:sl,defaultValue:60,min:0,max:100,step:5,marks:{0:'紧凑',50:'默认',100:'宽松'}}));var range=slot(controls,'qx-admin-inline-block');heading(range,'字号范围');own(C.Slider.create({container:range,range:true,defaultValue:[14,20],min:12,max:24,step:1}));}
   if(C.InputNumber){var num=slot(controls,'qx-admin-inline-block');heading(num,'基础间距');own(C.InputNumber.create({target:num,defaultValue:'8',min:'4',max:'24',step:'1',stringMode:true,suffix:'px',mode:'button'}));}
   var native=slot(controls,'qx-admin-native-options');native.innerHTML='<label class="qxframe9a7c2-form-check"><input class="qxframe9a7c2-form-check-input" type="radio" name="theme-density" checked><span class="qxframe9a7c2-form-check-label">跟随系统</span></label><label class="qxframe9a7c2-form-check"><input class="qxframe9a7c2-form-check-input" type="radio" name="theme-density"><span class="qxframe9a7c2-form-check-label">固定紧凑</span></label><label class="qxframe9a7c2-form-check"><input class="qxframe9a7c2-form-check-input" type="checkbox" checked><span class="qxframe9a7c2-form-check-label">显示动画</span></label><label class="qxframe9a7c2-form-check"><input class="qxframe9a7c2-form-check-input" type="checkbox" disabled><span class="qxframe9a7c2-form-check-label">锁定企业字体</span><small class="qxframe9a7c2-form-check-description">由组织策略控制</small></label><label class="qxframe9a7c2-switch"><input class="qxframe9a7c2-switch-input" type="checkbox" checked><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span><span>启用阴影</span></label>';
 }
 if(preview){
   var br=slot(preview,'qx-admin-inline-row');[['Primary','is-primary is-solid'],['Outlined','is-default is-outlined'],['Dashed','is-primary is-dashed'],['Filled','is-primary is-filled'],['Plain','is-primary is-plain'],['Text','is-primary is-text'],['Link','is-primary is-link']].forEach(function(x){var b=button(x[0],'qxframe9a7c2-button '+x[1]+' is-md is-ripple');br.appendChild(b);});
   var tipBtn=button('Tooltip','qxframe9a7c2-button is-default is-outlined is-md'),popBtn=button('Popover','qxframe9a7c2-button is-default is-outlined is-md');br.appendChild(tipBtn);br.appendChild(popBtn);
   if(C.Tooltip)own(C.Tooltip.create({reference:tipBtn,content:'键盘与鼠标都使用框架 Tooltip',placement:'top',showArrow:true,fresh:true}));
   if(C.Popover)own(C.Popover.create({reference:popBtn,title:'预览说明',content:'此处组合展示当前主题配置。',trigger:'click',placement:'bottom-start'}));
 }
}
if(view==='developer-tools'){
 var jh=byId('dev-json'),vh=byId('dev-virtual'),oh=byId('dev-options'),mh=byId('dev-motion');
 if(jh&&C.JSON){var ja=slot(jh,'qx-admin-inline-block');heading(ja,'只读配置');own(C.JSON.create({container:ja,data:{api:'/v1',retry:3,cache:true,features:{search:true,media:true}},collapsed:false}));var jb=slot(jh,'qx-admin-inline-block');heading(jb,'可编辑草稿');own(C.JSON.create({container:jb,data:{level:'info',sampleRate:1,retention:30},editable:true}));}
 if(vh&&C.VirtualList){var data=Array.from({length:300},function(_,i){return{key:'log-'+i,label:(i+1)+' · worker-'+String(i%8+1)+' · '+(i%11===0?'WARN':'INFO')+' · request completed'}});own(C.VirtualList.create({container:vh,items:data,estimateSize:34,height:260,overscan:6,itemRender:function(item){return item.label;}}));}
 if(oh){
   if(C.OptionList){var op=slot(oh,'qx-admin-inline-block');heading(op,'命令列表');own(C.OptionList.create({container:op,items:[{key:'build',value:'build',label:'构建 release'},{key:'verify',value:'verify',label:'运行验证'},{key:'deploy',value:'deploy',label:'部署 Pages'},{key:'lock',value:'lock',label:'冻结发布',disabled:true}],value:'verify'}));}
   if(C.Scroll){var box=slot(oh,'qx-admin-scroll-box');box.innerHTML='<div style="min-width:720px;padding:14px">横向诊断输出 · commit → build → verify → package → deploy → pages → smoke → done</div>';own(C.Scroll.create({container:box,axis:'x',scrollbarVisibility:'auto',edgeShadow:true}));}
 }
 if(mh){
   var triggerBtn=button('打开底层 Trigger','qxframe9a7c2-button is-default is-outlined is-md'),floating=document.createElement('div');floating.className='qx-admin-trigger-floating';floating.textContent='Trigger 管理定位与关闭策略';mh.appendChild(triggerBtn);document.body.appendChild(floating);if(C.Trigger)own(C.Trigger.create({reference:triggerBtn,floating:floating,trigger:'click',placement:'bottom-start'}));
   var motionRow=slot(mh,'qx-admin-inline-row'),toggle=button('Transition Toggle','qxframe9a7c2-button is-primary is-outlined is-md'),motionBox=document.createElement('div');motionBox.className='qx-admin-motion-box';motionBox.textContent='Presence';motionRow.appendChild(toggle);motionRow.appendChild(motionBox);
   if(Q.DOMHeadless&&Q.DOMHeadless.Transition){var tr=own(Q.DOMHeadless.Transition.create({element:motionBox,transition:'fadeUp',visible:true,appear:false}));var visible=true;toggle.addEventListener('click',function(){visible=!visible;tr.setVisible(visible,{reason:'admin-dev'});});}
   if(Q.DOMHeadless&&Q.DOMHeadless.TransitionGroup){var list=document.createElement('div');list.className='qx-admin-transition-list';mh.appendChild(list);var group=own(Q.DOMHeadless.TransitionGroup.create({container:list,transition:'fadeRight',appear:false,move:false})),seq=3,items=[1,2].map(function(i){var el=document.createElement('div');el.className='qx-admin-motion-item';el.textContent='Task '+i;return{key:'task-'+i,element:el};});group.sync(items,{reason:'initial'});var add=button('Add transition item','qxframe9a7c2-button is-default is-outlined is-sm');mh.appendChild(add);add.addEventListener('click',function(){var i=seq++,el=document.createElement('div');el.className='qx-admin-motion-item';el.textContent='Task '+i;items.push({key:'task-'+i,element:el});group.sync(items,{reason:'add'});});}
   if(C.Loading){var target=slot(mh,'qx-admin-loading-target');target.textContent='诊断目标区域';var load=own(C.Loading.create({target:target,fullscreen:false,open:false,delay:0,text:'正在诊断',progress:62,blocking:true}));var lb=button('运行 Loading','qxframe9a7c2-button is-default is-outlined is-sm');mh.appendChild(lb);lb.addEventListener('click',function(){load.open();setTimeout(function(){load.close();},700);});}
   if(C.Result){var rh=slot(mh,'qx-admin-inline-block');own(C.Result.create({container:rh,name:'success',visible:true,title:'诊断环境正常',subtitle:'Result 作为诊断结果的语义输出。'}));}
   var nr=slot(mh,'qx-admin-inline-row'),mb=button('Message','qxframe9a7c2-button is-default is-outlined is-sm'),nb=button('Notification','qxframe9a7c2-button is-default is-outlined is-sm');nr.appendChild(mb);nr.appendChild(nb);mb.addEventListener('click',function(){if(C.Message)C.Message.success('诊断任务已启动',{duration:2200});});nb.addEventListener('click',function(){if(C.Notification)C.Notification.info({title:'构建完成',content:'release artifact 已生成。',placement:'top-right',duration:3000,showProgress:true});});
   var empty=slot(mh,'qx-admin-inline-block');empty.innerHTML='<div class="qxframe9a7c2-empty is-simple"><div class="qxframe9a7c2-empty-image is-default"></div><div class="qxframe9a7c2-empty-description">当前没有失败任务</div></div>';
 }
}
var login=document.getElementById('admin-login-form');if(login)login.addEventListener('submit',function(e){e.preventDefault();window.location.href='index.html#/dashboard'});var register=document.getElementById('admin-register-form');if(register)register.addEventListener('submit',function(e){e.preventDefault();window.location.href='register-result.html'});
window.addEventListener('pagehide',function(){owners.splice(0).forEach(function(o){try{o.destroy()}catch(_){}})});
})();