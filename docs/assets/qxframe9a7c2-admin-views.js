(function(){
'use strict';
var Q=window.QXFRAME9A7C2,C=Q&&Q.Components,theme=window.QXFRAME9A7C2_DOCS_THEME,owners=[];
if(!Q||!C)return;
function own(x){if(x&&typeof x.destroy==='function')owners.push(x);return x}
function byId(id){return document.getElementById(id)}
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

var login=document.getElementById('admin-login-form');if(login)login.addEventListener('submit',function(e){e.preventDefault();window.location.href='index.html#/dashboard'});var register=document.getElementById('admin-register-form');if(register)register.addEventListener('submit',function(e){e.preventDefault();window.location.href='register-result.html'});
window.addEventListener('pagehide',function(){owners.splice(0).forEach(function(o){try{o.destroy()}catch(_){}})});
})();