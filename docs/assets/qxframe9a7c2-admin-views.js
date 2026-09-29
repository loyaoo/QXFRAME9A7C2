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
document.querySelectorAll('[data-qx-select]').forEach(function(host){if(!C.Select)return;var values=String(host.dataset.qxSelect||'').split('|').filter(Boolean);own(C.Select.create({container:host,value:values[0]||null,clearable:false,items:values.map(function(v,i){var p=v.split(':');return{key:String(i),value:p[0],label:p[1]||p[0]}})}))});
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
var login=document.getElementById('admin-login-form');if(login)login.addEventListener('submit',function(e){e.preventDefault();window.location.href='index.html#/dashboard'});
window.addEventListener('pagehide',function(){owners.splice(0).forEach(function(o){try{o.destroy()}catch(_){}})});
})();