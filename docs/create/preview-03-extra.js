/* Preview03 full QX docs component coverage: 48 additional business Cards.
 * All framework-backed components use the QX runtime. Static CSS primitives
 * use framework classes and native browser controls; no simulated QX classes.
 */
(function(){
'use strict';
var Q=window.QXFRAME9A7C2,C=Q&&Q.Components,report=window.QXFRAME9A7C2_PREVIEW3;
if(!C||!report)return;
var mounted=[],errors=[],functional=[],cssNative=[],counter=0;
function card(id){return document.querySelector('[data-card="'+id+'"]')}
function el(id){return card(id)&&card(id).querySelector('[data-pv3x-widget]')}
function button(id,label){
 var b=document.createElement('button');b.type='button';b.className='qxframe9a7c2-button is-default is-outlined is-sm';
 var span=document.createElement('span');span.className='qxframe9a7c2-button-label';span.textContent=label;b.append(span);
 var root=el(id)||card(id).querySelector('.pv3-content');root.append(b);return b;
}
function status(id,text){
 var s=card(id)&&card(id).querySelector('[data-pv3x-status]');
 if(s){s.textContent=text;s.hidden=false}
}
function mount(id,type,opts){
 var target=el(id);
 if(!target)return null;
 try{
   var Factory=C[type]||(Q.BuildingBlocks&&Q.BuildingBlocks[type]);
   if(!Factory||typeof Factory.create!=='function')throw new Error(type+' has no public create');
   var config=Object.assign({container:target},opts||{});
   var x=Factory.create(config);
   if(!x)throw new Error(type+' returned no QX instance');
   mounted.push({id:id,type:type,instance:x});functional.push(type);
   return x;
 }catch(e){errors.push({id:id,type:type,message:String(e&&e.message||e)});target.textContent='Unable to mount '+type;return null;}
}
function item(key,label){return {key:key,value:key,label:label}}
function simple(id,type,items,options){return mount(id,type,Object.assign({items:items.map((x,i)=>item(String(i),x))},options||{}))}
function noteAction(id,text){button(id,'View details').addEventListener('click',function(){status(id,text+' · This is a local QX demonstration.')})}
var samples={
 contacts:[item('alpha','Alex Morgan · Account Lead'),item('beta','Sam Patel · Billing'),item('gamma','Taylor Chen · Customer Care')],
 commands:[item('publish','Publish batch'),item('approve','Approve review'),item('export','Export report')]
};
mount('contact-lookup','Autocomplete',{items:samples.contacts,clearable:true,matchOnly:false,highlightFirst:true,placeholder:'Search customers'});
mount('capacity-calendar','Calendar',{value:'2026-10-22'});
mount('palette-laboratory','ColorPanel',{value:'#2869e6',format:'hex',showAlpha:true,presets:['#2869e6','#12a594','#e54d2e','#7c3aed']});
var drbtn=button('account-drawer','Edit workspace');
try{if(C.Drawer&&typeof C.Drawer.create==='function'){var drawer=C.Drawer.create({autoOpen:false,placement:'right',title:'Workspace settings',content:'Sample admin settings. Changes are local and not sent to any backend.'});mounted.push({id:'account-drawer',type:'Drawer',instance:drawer});functional.push('Drawer');drbtn.addEventListener('click',function(){drawer.open('preview03')})}else throw new Error('Drawer API unavailable')}catch(e){errors.push({id:'account-drawer',type:'Drawer',message:String(e.message||e)})}
var dropBtn=button('quick-action-menu','Open actions');
try{if(C.Dropdown&&typeof C.Dropdown.create==='function'){var dropdown=C.Dropdown.create({reference:dropBtn,items:samples.commands,trigger:'click',placement:'bottom-start'});mounted.push({id:'quick-action-menu',type:'Dropdown',instance:dropdown});functional.push('Dropdown')}else throw new Error('Dropdown API unavailable')}catch(e){errors.push({id:'quick-action-menu',type:'Dropdown',message:String(e.message||e)})}
var asset=el('asset-preview');if(asset)asset.style.cssText='width:100%;min-height:9rem';
var svg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="#233a6f"/><rect x="20" y="18" width="440" height="234" rx="14" fill="#416bd0"/><circle cx="367" cy="98" r="38" fill="#8ab6f9"/><path d="M0 210L105 132 202 201 298 120 480 210V270H0Z" fill="#1f366b"/><text x="32" y="62" fill="white" font-size="30" font-family="sans-serif">QX / Creative</text></svg>';
mount('asset-preview','Image',{src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),alt:'Demo campaign creative',preview:true,rounded:true});
simple('activity-timeline','List',['10:24 · Index rebuilt','10:19 · Report synced','09:50 · Policy approved'],{selectionAppearance:'highlight'});
var task=el('task-processing');var loadBtn=button('task-processing','Run diagnostic');
try{if(C.Loading&&typeof C.Loading.create==='function'){var loading=C.Loading.create({target:task,fullscreen:false,open:false,delay:0,text:'Running diagnostic',progress:78,blocking:true});mounted.push({id:'task-processing',type:'Loading',instance:loading});functional.push('Loading');loadBtn.addEventListener('click',function(){loading.open();status('task-processing','Running local progress demonstration.');setTimeout(function(){loading.close();status('task-processing','Demo diagnostic completed.')},700)})}else throw new Error('Loading API unavailable')}catch(e){errors.push({id:'task-processing',type:'Loading',message:String(e.message||e)})}
simple('navigation-workspace','Menu',['Overview','Teams','Campaigns','Billing'],{});
var messageBtn=button('inbox-notice','Show message');
messageBtn.addEventListener('click',function(){if(C.Message&&typeof C.Message.success==='function'){C.Message.success('Message preview only',{duration:2000});functional.push('Message')}status('inbox-notice','Notification shown locally; no message sent.')});
var modalBtn=button('danger-dialog','Review access change');
try{if(C.Modal&&typeof C.Modal.create==='function'){var modal=C.Modal.create({autoOpen:false,title:'Review access change',content:'This is a local QX Modal. No access privileges will be changed.',buttons:[{content:'Cancel',role:'cancel'},{content:'Continue',role:'confirm'}]});mounted.push({id:'danger-dialog',type:'Modal',instance:modal});functional.push('Modal');modalBtn.addEventListener('click',function(){modal.open('preview03')})}else throw new Error('Modal API unavailable')}catch(e){errors.push({id:'danger-dialog',type:'Modal',message:String(e.message||e)})}
var notifBtn=button('alerts-center','Show notification');
notifBtn.addEventListener('click',function(){if(C.Notification&&typeof C.Notification.info==='function'){C.Notification.info('Demo alert: batch review is ready.',{duration:2000});functional.push('Notification')}status('alerts-center','QX notification requested; no incident created.')});
simple('command-palette','OptionList',['Deploy review','Export CSV','Refresh chart','Audit events'],{value:'0'});
mount('fiscal-periods','PeriodPanel',{unit:'quarter',value:'2026-Q4'});
var deleteBtn=button('delete-policy','Request deletion');
try{if(C.Popconfirm&&typeof C.Popconfirm.create==='function'){var popconfirm=C.Popconfirm.create({reference:deleteBtn,title:'Discard this policy draft?',content:'Demo only. Nothing will be deleted.',danger:true,confirmText:'Discard',cancelText:'Keep',placement:'top'});mounted.push({id:'delete-policy',type:'Popconfirm',instance:popconfirm});functional.push('Popconfirm')}else throw new Error('Popconfirm API unavailable')}catch(e){errors.push({id:'delete-policy',type:'Popconfirm',message:String(e.message||e)})}
var insightBtn=button('customer-insights','Why engagement grew');
try{if(C.Popover&&typeof C.Popover.create==='function'){var popover=C.Popover.create({reference:insightBtn,title:'Engagement trends',content:'Illustrative improvement from retention and service cohorts.',trigger:'click',placement:'bottom-start'});mounted.push({id:'customer-insights',type:'Popover',instance:popover});functional.push('Popover')}else throw new Error('Popover API unavailable')}catch(e){errors.push({id:'customer-insights',type:'Popover',message:String(e.message||e)})}
mount('transaction-outcome','Result',{name:'success',visible:true,title:'Approval recorded',subtitle:'Illustrative local finance transaction'});
simple('backlog-ordering','Sort',['Design review','Finance review','Release build','Audit report']);
var tabs=mount('segmented-console','Tabs',{items:[{key:'users',label:'Users'},{key:'access',label:'Access'},{key:'billing',label:'Billing'}],defaultActiveKey:'users',type:'line'});
mount('shift-allocation','TimePanel',{value:'09:30:00',use12Hours:false,readOnly:true});
var tipBtn=button('sla-tooltip','Explain the SLA');
try{if(C.Tooltip&&typeof C.Tooltip.create==='function'){var tooltip=C.Tooltip.create({reference:tipBtn,content:'Monthly availability target for the customer-facing API.',placement:'top',showArrow:true});mounted.push({id:'sla-tooltip',type:'Tooltip',instance:tooltip});functional.push('Tooltip')}else throw new Error('Tooltip API unavailable')}catch(e){errors.push({id:'sla-tooltip',type:'Tooltip',message:String(e.message||e)})}
var trigBtn=button('context-triggers','Open trigger');
try{if(C.Trigger&&typeof C.Trigger.create==='function'){var floating=document.createElement('div');floating.className='pv3x-float';floating.textContent='QX Trigger: click opens this contextual business action.';document.body.append(floating);var trigger=C.Trigger.create({reference:trigBtn,floating:floating,trigger:'click',placement:'bottom-start'});mounted.push({id:'context-triggers',type:'Trigger',instance:trigger});functional.push('Trigger')}else throw new Error('Trigger API unavailable')}catch(e){errors.push({id:'context-triggers',type:'Trigger',message:String(e.message||e)})}
mount('contract-documents','Upload',{multiple:true,drag:true,autoUpload:false,listType:'text',accept:'.pdf,.doc,.docx',beforeUpload:function(){return false}});
mount('virtual-monitor','VirtualList',{items:Array.from({length:500},function(_,i){return item('event-'+i,'Event '+String(i+1).padStart(3,'0')+' · '+(i%7===0?'Warning':'Success'))}),estimateSize:32,height:204,overscan:6,itemRender:function(x){return x.label}});
mount('dial-settings','WheelPicker',{columns:[{key:'year',label:'Year',items:['2026','2027','2028'].map(function(y){return item(y,y)})},{key:'month',label:'Month',items:['01','02','03','04','05','06','07','08','09','10','11','12'].map(function(m){return item(m,m)})}],value:['2026','10'],needConfirm:true,showCancel:true});
mount('org-hierarchy','Tree',{items:[{key:'hq',value:'hq',label:'Headquarters',items:[{key:'engineering',value:'engineering',label:'Engineering',items:[{key:'platform',value:'platform',label:'Platform'},{key:'infra',value:'infra',label:'Infrastructure'}]},{key:'ops',value:'ops',label:'Operations'}]},{key:'regional',value:'regional',label:'Regional offices',items:[{key:'europe',value:'europe',label:'Europe'},{key:'americas',value:'americas',label:'Americas'}]}],expandedKeys:['hq','engineering'],showLine:true,expandOnRowClick:true});
var meter=mount('distribution-hub','Progress',{percent:98,type:'line',status:'success'});
var rev=mount('revenue-desk','Rate',{value:4.5,count:5,half:true,readOnly:true});
var staticNames=['alert','avatar','badge','button','card','checkbox','control','descriptions','empty','form','grid','icon','item','layout','message','radio','ripple','scroll','switch','transition-group','transition','trigger'];
document.querySelectorAll('[data-pv3x-family]').forEach(function(root){
 var id=root.getAttribute('data-card'),family=root.getAttribute('data-pv3x-family');
 if(staticNames.includes(family))cssNative.push(family);
 if(!id)return;
 root.querySelectorAll('[data-pv3x-demo]').forEach(function(btn){btn.addEventListener('click',function(){status(id,btn.textContent.trim()+' selected in local demonstration. No remote change.')})});
 var form=root.querySelector('[data-pv3x-form]');if(form)form.addEventListener('submit',function(e){e.preventDefault();status(id,form.checkValidity()?'Supplier sample validated locally.':'Form fields need completion.')});
 root.querySelectorAll('input[type="checkbox"],input[type="radio"]').forEach(function(input){input.addEventListener('change',function(){status(id,'Selection updated locally.')})});
 var add=root.querySelector('[data-pv3x-add-event]');
 if(add)add.addEventListener('click',function(){var list=root.querySelector('[data-pv3x-events]');var e=document.createElement('div');e.textContent='New local audit event '+(++counter);list.prepend(e);status(id,'Event added to the local demo.')});
 var transition=root.querySelector('[data-pv3x-transition]');
 if(transition)transition.addEventListener('click',function(){var chips=[...root.querySelectorAll('.pv3x-process-chip')];counter++;chips.forEach(function(x,i){x.classList.toggle('is-current',i===counter%chips.length)});status(id,'Moved to next local workflow state.')});
});
document.querySelectorAll('[data-pv3x-widget]').forEach(function(node){var id=node.getAttribute('data-pv3x-widget');if(!node.children.length&&!node.textContent.trim()&&!mounted.some(function(x){return x.id===id})){errors.push({id:id,type:node.getAttribute('data-pv3x-family'),message:'Widget slot empty'})}});
report.componentCount+=mounted.length;
report.cardCount=document.querySelectorAll('[data-card]').length;
report.mountErrors.push.apply(report.mountErrors,errors);
report.expanded={newCards:document.querySelectorAll('[data-pv3x-new-card]').length,mounted:mounted.length,cssNative:cssNative,events:counter,errors:errors,components:functional,owners:mounted};
window.addEventListener('pagehide',function(){mounted.forEach(function(x){try{x.instance.destroy&&x.instance.destroy()}catch(_){}})});
})();