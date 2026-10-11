/* QXFRAME Preview 03: compose the framework's real runtime components, not faux screenshots.
 * Component usage follows docs/assets/qxframe9a7c2-admin-views.js and src/components.
 * All actions are local demonstrations; no service, payment or account mutation. */
(function () {
'use strict';
var Q=window.QXFRAME9A7C2, C=Q&&Q.Components;
if(!C)return;
var live={},owned=[],mountErrors=[];
function host(id){return document.querySelector('[data-pv3-component="'+id+'"]');}
function card(id){return document.querySelector('[data-card="'+id+'"]');}
function mount(id,type,opts){
  var node=host(id);if(!node)return;
  try{
    if(!C[type]||typeof C[type].create!=='function')throw new Error(type+' runtime unavailable');
    var instance=C[type].create(Object.assign({container:node},opts||{}));
    if(instance){live[id]=instance;owned.push(instance);}
    if(!node.children.length)throw new Error(type+' rendered no content');
  }catch(error){
    mountErrors.push({component:id,type:type,message:String(error&&error.message||error)});
    node.textContent='Component unavailable: '+type;
    node.classList.add('pv3-runtime-error');
  }
}
function note(id,message){
  var el=card(id)&&card(id).querySelector('[data-pv3-status]');
  if(el){el.textContent=message;el.hidden=false;}
}
function items(values){return values.map(function(v){return {key:v[0],value:v[0],label:v[1]};});}
var org=[
  {key:'workspaces',value:'workspaces',label:'Company',items:[
    {key:'product',value:'product',label:'Product',items:[{key:'web',value:'web',label:'Web app'},{key:'mobile',value:'mobile',label:'Mobile'}]},
    {key:'operations',value:'operations',label:'Operations',items:[{key:'finance',value:'finance',label:'Finance'},{key:'support',value:'support',label:'Support'}]}
  ]},
  {key:'partners',value:'partners',label:'Partners',items:[{key:'agency',value:'agency',label:'Agency'}]}
];
// UMD Components exposes TreeSelect but not the standalone Tree constructor; QX JSON uses Tree internally.
mount('workspace-tree','JSON',{data:{Company:{Product:{'Web app':'Production',Mobile:'Canary'},Operations:{Finance:'Restricted',Support:'Standard'}},Partners:{Agency:'Limited'}},collapsed:false,toolbar:false,copy:false});
mount('workspace-tree-select','TreeSelect',{items:org,defaultValue:['web','finance'],multiple:true,searchable:true,clearable:true,maxVisibleTags:2,expandedKeys:['workspaces','product']});
mount('member-transfer','Transfer',{items:items([['a','Alex Morgan'],['b','Sam Patel'],['c','Taylor Chen'],['d','Jordan Lee'],['e','Jamie Park']]),value:['a','c'],titles:['Available','Assigned'],searchable:true,sortable:true});
mount('onboarding-steps','Steps',{current:1,clickable:true,items:[{title:'Profile'},{title:'Review'},{title:'Provision'},{title:'Finish'}]});
mount('onboarding-progress','Progress',{percent:67,status:'active',type:'line'});
mount('service-circle','Progress',{type:'circle',percent:99,status:'success',showInfo:true});
mount('service-progress','Progress',{type:'line',percent:84,status:'active'});
mount('brand-color','ColorPicker',{value:'#2869E6',showAlpha:false,presets:['#2869E6','#12A594','#E54D2E','#7C3AED'],onChange:function(value){
 var el=card('brand-studio').querySelector('[data-pv3-brand-preview]');
 if(el&&typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))el.style.setProperty('--pv3-brand-color',value);
}});
var rules=[{id:'G-001',rule:'MFA enforced',owner:'Security'},{id:'G-002',rule:'Expense cap',owner:'Finance'},{id:'G-003',rule:'Audit trail',owner:'Legal'},{id:'G-004',rule:'SSO only',owner:'Security'},{id:'G-005',rule:'Data retention',owner:'Legal'}];
mount('governance-table','Table',{items:rules.slice(0,3),getKey:function(r){return r.id;},size:'sm',hover:true,columns:[{key:'rule',title:'Policy'},{key:'owner',title:'Owner'}]});
mount('governance-pager','Pagination',{current:1,count:rules.length,pageSize:3,simple:true,size:'sm',onChange:function(page){
  var table=live['governance-table'];if(table&&typeof table.updateOptions==='function')table.updateOptions({items:rules.slice((page-1)*3,page*3)});
}});
mount('release-date','DatePicker',{value:'2026-10-22',clearable:true,placeholder:'Select date'});
mount('release-time','TimePicker',{value:'21:30:00',showSecond:false,clearable:true,placeholder:'Select time'});
mount('routing-cascader','Cascader',{items:[{key:'us',value:'us',label:'United States',items:[{key:'east',value:'east',label:'East',items:[{key:'ny',value:'ny',label:'New York'},{key:'bos',value:'bos',label:'Boston'}]},{key:'west',value:'west',label:'West',items:[{key:'sf',value:'sf',label:'San Francisco'}]}]},{key:'eu',value:'eu',label:'Europe',items:[{key:'de',value:'de',label:'Germany'},{key:'fr',value:'fr',label:'France'}]}],searchable:true,clearable:true,placeholder:'Select territory'});
mount('routing-select','Select',{items:items([['standard','Standard'],['express','Express'],['critical','Critical']]),value:'standard'});
mount('finance-steps','Steps',{current:1,size:'sm',items:[{title:'Draft'},{title:'Finance'},{title:'Sign-off'}]});
mount('finance-amount','InputNumber',{defaultValue:'18000',min:'100',max:'50000',step:'500',mode:'button'});
mount('customer-rate','Rate',{defaultValue:4.5,count:5,half:true,size:'lg'});
mount('customer-tags','TagInput',{value:[{key:'service',value:'service',label:'Customer care'},{key:'delivery',value:'delivery',label:'Delivery'}],creatable:true,tokenSeparators:[',',';'],placeholder:'Add issue theme'});
mount('inventory-quantity','InputNumber',{defaultValue:'240',min:'0',max:'10000',step:'20',mode:'button'});
mount('inventory-progress','Progress',{percent:62,status:'active'});
mount('api-json','JSON',{data:{service:'order-routing',environment:'production',health:'ok',latencyMs:86,regions:['us-east','eu-central'],features:{audit:true,retry:3}},collapsed:false,toolbar:true});
mount('campaign-carousel','Carousel',{items:[{key:'launch',content:'Launch Week · Q4 Commerce'},{key:'pro',content:'Enterprise Workspace'},{key:'growth',content:'Growth Campaign 2026'}],effect:'slide',dots:true,arrows:true,loop:true,autoplay:false});
mount('campaign-tags','Tags',{items:items([['live','Live'],['brand','Brand'],['q4','Q4'],['sales','Conversion']]),value:['live','brand'],checkable:true,closable:false});
mount('otp-input','InputOTP',{length:6,accept:'digits',value:'',mask:false});
mount('support-tags','Tags',{items:items([['urgent','Urgent'],['assigned','Assigned'],['resolved','Resolved']]),value:['urgent'],checkable:true,closable:false});
mount('usage-progress','Progress',{percent:84,type:'line',status:'active'});
mount('usage-slider','Slider',{min:0,max:100,defaultValue:20,step:5,onChange:function(value){var el=card('usage-meter').querySelector('[data-pv3-usage-value]');if(el)el.textContent='Additional reservation: '+value+'%';}});
mount('automation-collapse','Collapse',{defaultValue:['a'],accordion:true,items:[{key:'a',label:'Trigger: high-value order',content:'When amount exceeds $10,000, create a finance review.'},{key:'b',label:'Condition: customer tier',content:'Enterprise customer orders receive priority routing.'},{key:'c',label:'Action: notify reviewer',content:'Create local audit event and mark for human approval.'}]});
mount('automation-owner','TreeSelect',{items:org,defaultValue:'finance',searchable:true,clearable:true});
mount('incident-steps','Steps',{current:1,items:[{title:'Detect'},{title:'Triage'},{title:'Mitigate'},{title:'Close'}],size:'sm',clickable:true});
mount('incident-progress','Progress',{percent:45,status:'active'});
function number(id,fallback){var x=live[id];try{var state=x&&(x.getState&&x.getState());var value=state&&(state.value??state.stringValue);return Number(value??fallback)}catch(_){return Number(fallback)}}
function value(id,fallback){var x=live[id];try{var s=x&&x.getState&&x.getState();return s&&('value' in s)?s.value:fallback}catch(_){return fallback}}
function csv(rows){var str='Policy,Owner\n'+rows.map(r=>[r.rule,r.owner].join(',')).join('\n');var blob=new Blob([str],{type:'text/csv'});var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download='qxframe-governance-demo.csv';a.click();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
var actions={
'scope-preview':function(){note('platform-tree','Workspace scope is previewed locally. No organization permission was changed.');},
'access-review':function(){var s=live['member-transfer']&&live['member-transfer'].getState();note('workforce-access','Assignment draft: '+JSON.stringify(s&&s.value||[])+'; no team access changed.');},
'onboarding-next':function(){var st=live['onboarding-steps'];if(st&&st.next){st.next();var n=st.getState().current;live['onboarding-progress'].setPercent(Math.min(100,(n+1)*25));note('onboarding-flow','Moved local onboarding draft to stage '+(n+1)+' of 4.');}},
'service-inspect':function(){note('service-health','Search index P95 was 318ms in this sample; no live telemetry connected.');},
'brand-copy':function(){note('brand-studio','Brand swatch adjusted in this local demonstration. Export the theme CSS from Create for real projects.');},
'governance-export':function(){csv(rules);note('plan-governance','Downloaded 5 demonstration policy rows as CSV.');},
'release-stage':function(){note('release-planner','Schedule draft checked locally; no production deploy is queued.');},
'routing-quote':function(){note('order-routing','Sample service target: 48h. No delivery quotation was requested.');},
'finance-submit':function(){var n=number('finance-amount',18000);note('finance-approval',n>50000?'Amount exceeds $50,000 approval limit.':'$'+n.toLocaleString()+' passes the local budget limit. No approval was submitted.');},
'quality-report':function(){note('customer-quality','Customer feedback summary generated from sample ratings and tags only.');},
'inventory-plan':function(){var n=number('inventory-quantity',240);note('inventory-control','Local replenishment plan: '+n+' units. No purchase order was created.');},
'api-refresh':function(){var json=live['api-json'];if(json&&json.setData)json.setData({service:'order-routing',environment:'production',health:'ok',latencyMs:92,regions:['us-east','eu-central'],features:{audit:true,retry:3}});note('data-inspector','Refreshed local mock response; no API request sent.');},
'campaign-preview':function(){note('marketing-creative','Live campaign assets are illustrative; carousel arrows navigate local content.');},
'otp-verify':function(){var v=String(value('otp-input','')||'');note('identity-otp',v==='246810'?'Verification passed (local demo only).':'Enter the demonstration code 246810; no SMS is sent.');},
'support-assign':function(){note('support-triage','Two sample cases selected for local triage; no ticket has been reassigned.');},
'usage-save':function(){note('usage-meter','Capacity forecast updated locally; no billing or quota changed.');},
'automation-test':function(){note('rules-automation','Dry test: if order amount is $12,000, assign Finance review. No automation executed.');},
'incident-advance':function(){var st=live['incident-steps'];if(st&&st.next){st.next();var n=st.getState().current;live['incident-progress'].setPercent(Math.min(100,(n+1)*25));note('incident-response','Local incident workflow is at stage '+(n+1)+' of 4; no alert was dispatched.');}}
};
document.querySelectorAll('[data-pv3-action]').forEach(function(button){button.addEventListener('click',function(){try{actions[button.dataset.pv3Action]?.()}catch(error){note(button.closest('[data-card]').dataset.card,'This local demo action could not complete: '+String(error.message||error));}})});
window.QXFRAME9A7C2_PREVIEW3={componentCount:Object.keys(live).length,cardCount:document.querySelectorAll('[data-card]').length,mountErrors:mountErrors,instances:live};
window.addEventListener('pagehide',function(){owned.splice(0).forEach(function(x){try{x.destroy&&x.destroy()}catch(_){}})});
})();