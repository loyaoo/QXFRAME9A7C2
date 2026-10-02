(function(global,document){
'use strict';
var scriptNode=document.currentScript;
var scriptUrl=scriptNode&&scriptNode.src?scriptNode.src:location.href;
var STORAGE_KEY='qxframe9a7c2-theme-studio-v1';
var instances=[];
var runtime=null;
var currentTheme=null;
var currentConfig=null;
var previewMode='light';
var locks=Object.create(null);
var generateTimer=0;
var inlineGuard=null;
var modeMedia=global.matchMedia?global.matchMedia('(prefers-color-scheme: dark)'):null;

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});}
function clone(value){return JSON.parse(JSON.stringify(value));}
function q(){return global.QXFRAME9A7C2||{};}
function components(){var x=q();return x.Components||x.BuildingBlocks||{};}
function button(text,color,appearance,size){return '<button type="button" class="qxframe9a7c2-button is-'+(color||'default')+' is-'+(appearance||'outlined')+' is-'+(size||'sm')+'">'+esc(text)+'</button>';}
function badge(text,type){return '<span class="qxframe9a7c2-badge is-'+(type||'default')+' is-sm">'+esc(text)+'</span>';}
function scene(title,subtitle,body,kind){
  return '<article class="qxframe9a7c2-card qxframe9a7c2-studio-scene '+(kind||'')+'">'+
    '<header class="qxframe9a7c2-card-header"><div class="qxframe9a7c2-card-title qxframe9a7c2-studio-title"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></div></header>'+
    '<div class="qxframe9a7c2-card-body">'+body+'</div></article>';
}
function metric(label,value,change){return '<div class="qxframe9a7c2-studio-metric"><small>'+esc(label)+'</small><strong class="qxframe9a7c2-studio-kpi">'+esc(value)+'</strong>'+(change?'<span class="qxframe9a7c2-studio-change">'+esc(change)+'</span>':'')+'</div>';}
function listItem(title,meta,end){return '<div class="qxframe9a7c2-studio-list-item"><div class="qxframe9a7c2-studio-list-copy"><strong>'+esc(title)+'</strong><span>'+esc(meta)+'</span></div>'+(end||'')+'</div>';}
function swatchRow(label,prefix,count){
  var items='';for(var i=1;i<=count;i+=1)items+='<span class="qxframe9a7c2-studio-swatch" title="'+esc(label)+' '+i+'" style="--swatch:var('+prefix+i+')"></span>';
  return '<div class="qxframe9a7c2-studio-palette-row"><small>'+esc(label)+'</small><div class="qxframe9a7c2-studio-swatches">'+items+'</div></div>';
}
function roleSwatches(){
  return '<div class="qxframe9a7c2-studio-role-swatches">'+[
    ['Primary','--qxframe9a7c2-theme-primary'],['Success','--qxframe9a7c2-theme-success'],['Warning','--qxframe9a7c2-theme-warning'],['Error','--qxframe9a7c2-theme-error'],['Info','--qxframe9a7c2-theme-info']
  ].map(function(item){return '<span class="qxframe9a7c2-studio-role-swatch" style="--swatch:var('+item[1]+')">'+item[0]+'</span>';}).join('')+'</div>';
}
function chart(){
  var heights=[46,68,54,82,66,94,74,88,62,98,78,92];
  return '<div class="qxframe9a7c2-studio-chart">'+heights.map(function(h,i){return '<span class="qxframe9a7c2-studio-bar" style="height:'+h+'%;--bar:var(--qxframe9a7c2-theme-chart-'+((i%8)+1)+')"></span>';}).join('')+'</div>'+
    '<div class="qxframe9a7c2-studio-chart-legend">'+
      '<span><i class="qxframe9a7c2-studio-dot" style="--dot:var(--qxframe9a7c2-theme-chart-1)"></i>Revenue</span>'+
      '<span><i class="qxframe9a7c2-studio-dot" style="--dot:var(--qxframe9a7c2-theme-chart-2)"></i>Expansion</span>'+
      '<span><i class="qxframe9a7c2-studio-dot" style="--dot:var(--qxframe9a7c2-theme-chart-3)"></i>Services</span>'+
    '</div>';
}
function commercialHtml(){
  var out='';
  out+=scene('Analytics overview','Executive dashboard · Card / Badge / chart tokens',
    '<div class="qxframe9a7c2-studio-stack"><div class="qxframe9a7c2-studio-metrics">'+
      metric('Monthly revenue','$128,420','+12.4% vs last month')+metric('Active accounts','8,642','+384 this week')+metric('Conversion','7.82%','+0.46 pt')+metric('Net retention','118%','+3.1 pt')+
    '</div>'+chart()+'</div>','is-wide');
  out+=scene('Theme palette','Generated 13-step Primary / Neutral + semantic roles',
    '<div class="qxframe9a7c2-studio-palette">'+
      swatchRow('Primary','--qxframe9a7c2-theme-primary-',13)+
      swatchRow('Neutral','--qxframe9a7c2-theme-neutral-',13)+
      swatchRow('Chart','--qxframe9a7c2-theme-chart-',8)+roleSwatches()+
    '</div>','is-wide');
  out+=scene('Revenue goal','Progress / status / target',
    '<div class="qxframe9a7c2-studio-stack"><div class="qxframe9a7c2-studio-row is-between"><div class="qxframe9a7c2-studio-title"><strong>$84,600</strong><small>of $100,000 quarterly target</small></div>'+badge('On track','success')+'</div><div class="qxframe9a7c2-studio-mount" data-studio-mount="progress"></div></div>');
  out+=scene('Transactions','Table · finance operations',
    '<div class="qxframe9a7c2-studio-table-wrap"><div class="qxframe9a7c2-studio-mount" data-studio-mount="transactions"></div></div>','is-wide');
  out+=scene('CRM opportunity','Profile / tags / actions',
    '<div class="qxframe9a7c2-studio-stack"><div class="qxframe9a7c2-studio-profile"><div class="qxframe9a7c2-studio-avatar">AC</div><div class="qxframe9a7c2-studio-profile-copy"><strong>Acme Enterprise</strong><span>Expansion · North America</span></div>'+badge('Qualified','success')+'</div>'+
    '<div class="qxframe9a7c2-studio-metrics">'+metric('Deal value','$48k')+metric('Probability','72%')+'</div><div class="qxframe9a7c2-studio-row">'+button('Open opportunity','primary','solid')+button('Add note','default','outlined')+'</div></div>');
  out+=scene('Billing plan','Select / pricing / CTA',
    '<div class="qxframe9a7c2-studio-stack"><div class="qxframe9a7c2-studio-price"><strong>$49</strong><span>/ seat / month</span></div><div class="qxframe9a7c2-studio-mount" data-studio-mount="plan-select"></div><div class="qxframe9a7c2-studio-row">'+button('Update plan','primary','solid')+button('Cancel','default','text')+'</div></div>');
  out+=scene('Invoice #1048','Descriptions-like billing summary',
    '<div class="qxframe9a7c2-studio-list">'+listItem('Platform subscription','12 seats × $49','<strong>$588</strong>')+listItem('Usage overage','42 GB','<strong>$36</strong>')+listItem('Tax','8.25%','<strong>$51.48</strong>')+'</div><div class="qxframe9a7c2-studio-invoice-total"><span>Total</span><span>$675.48</span></div>');
  out+=scene('Invite teammate','Form / Input / role action',
    '<form class="qxframe9a7c2-studio-form"><label>Email<input class="qxframe9a7c2-form-input is-md" type="email" value="alex@example.com"></label><label>Message<textarea class="qxframe9a7c2-form-textarea is-md" rows="3">Join the product workspace.</textarea></label><div class="qxframe9a7c2-studio-row">'+button('Send invite','primary','solid')+button('Copy link','default','outlined')+'</div></form>');
  out+=scene('Workspace preferences','Switch / Checkbox states',
    '<div class="qxframe9a7c2-studio-list">'+
      listItem('Weekly summary','Every Monday at 09:00','<label class="qxframe9a7c2-switch is-md"><input class="qxframe9a7c2-switch-input" type="checkbox" checked><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></label>')+
      listItem('Security alerts','Critical events only','<label class="qxframe9a7c2-switch is-md"><input class="qxframe9a7c2-switch-input" type="checkbox" checked><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></label>')+
      listItem('Product updates','Monthly digest','<label class="qxframe9a7c2-switch is-md"><input class="qxframe9a7c2-switch-input" type="checkbox"><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></label>')+
    '</div>');
  out+=scene('Schedule review','DatePicker · business workflow',
    '<div class="qxframe9a7c2-studio-stack"><div class="qxframe9a7c2-studio-mount" data-studio-mount="schedule"></div><div class="qxframe9a7c2-studio-row">'+badge('45 min','info')+badge('Remote','default')+'</div></div>');
  out+=scene('Brand assets','Upload · content operations',
    '<div class="qxframe9a7c2-studio-mount" data-studio-mount="upload"></div>');
  out+=scene('Workspace navigation','Menu · selected / hover / nested',
    '<div class="qxframe9a7c2-studio-mount" data-studio-mount="menu"></div>');
  out+=scene('Project workspace','Tabs · application shell',
    '<div class="qxframe9a7c2-studio-mount" data-studio-mount="tabs"></div>','is-wide');
  out+=scene('Notifications','List / Badge / status hierarchy',
    '<div class="qxframe9a7c2-studio-list">'+listItem('Deployment completed','Production · 4 minutes ago',badge('Success','success'))+listItem('Invoice paid','Acme · $675.48',badge('Paid','info'))+listItem('API usage warning','82% of monthly quota',badge('Review','warning'))+'</div>');
  out+=scene('Support inbox','Operational list / priority',
    '<div class="qxframe9a7c2-studio-list">'+listItem('SSO configuration','Enterprise · 12 min',badge('High','error'))+listItem('Export formatting','Growth · 28 min',badge('Open','primary'))+listItem('Seat transfer','Starter · 1 h',badge('Normal','default'))+'</div>');
  out+=scene('Subscription','Pricing card / hierarchy',
    '<div class="qxframe9a7c2-studio-stack">'+badge('Current plan','primary')+'<div class="qxframe9a7c2-studio-price"><strong>$199</strong><span>/ month</span></div><div class="qxframe9a7c2-studio-list">'+listItem('Unlimited projects','Included','✓')+listItem('Audit log','180 days','✓')+listItem('Priority support','4 hour SLA','✓')+'</div>'+button('Manage subscription','primary','solid','md')+'</div>');
  out+=scene('Security','Account form / controls',
    '<form class="qxframe9a7c2-studio-form"><label>Current password<input class="qxframe9a7c2-form-input is-md" type="password" value="••••••••"></label><label>New password<input class="qxframe9a7c2-form-input is-md" type="password" placeholder="At least 12 characters"></label><div class="qxframe9a7c2-studio-row">'+button('Update password','primary','solid')+button('Revoke sessions','error','outlined')+'</div></form>');
  out+=scene('Empty state','First-run product surface',
    '<div class="qxframe9a7c2-studio-empty"><div class="qxframe9a7c2-studio-empty-icon">＋</div><strong>No automations yet</strong><p>Create an automation to connect events, conditions and actions across your workspace.</p>'+button('Create automation','primary','solid')+'</div>');
  out+=scene('Error state','Result / recovery actions',
    '<div class="qxframe9a7c2-studio-empty"><div class="qxframe9a7c2-studio-empty-icon">!</div><strong>We could not load this report</strong><p>The underlying dataset changed while the report was running. Refresh the query or return to the dashboard.</p><div class="qxframe9a7c2-studio-row">'+button('Retry','primary','solid')+button('Back','default','outlined')+'</div></div>');
  out+=scene('Activity','Timeline-like audit feed',
    '<div class="qxframe9a7c2-studio-list">'+listItem('Maya published v2.4','2 minutes ago',badge('Deploy','success'))+listItem('Liam updated billing role','18 minutes ago',badge('Admin','info'))+listItem('Nora exported 482 records','42 minutes ago',badge('Data','default'))+listItem('System rotated API key','1 hour ago',badge('Security','warning'))+'</div>');
  out+=scene('Checkout','Commerce form / totals',
    '<div class="qxframe9a7c2-studio-stack"><form class="qxframe9a7c2-studio-form"><label>Cardholder<input class="qxframe9a7c2-form-input is-md" value="Avery Stone"></label><label>Card number<input class="qxframe9a7c2-form-input is-md" value="4242 4242 4242 4242"></label><div class="qxframe9a7c2-studio-row is-stretch"><input class="qxframe9a7c2-form-input is-md" value="10/29"><input class="qxframe9a7c2-form-input is-md" value="123"></div></form><div class="qxframe9a7c2-studio-invoice-total"><span>Due today</span><span>$199.00</span></div>'+button('Pay $199.00','primary','solid','md')+'</div>');
  return out;
}
function insertCommercial(){
  if(document.querySelector('[data-qxframe9a7c2-studio-commercial]'))return;
  var all=document.getElementById('all-components');if(!all||!all.parentNode)return;
  var section=document.createElement('section');
  section.className='qxframe9a7c2-studio-commercial';
  section.dataset.qxframe9a7c2StudioCommercial='true';
  section.innerHTML='<div class="qxframe9a7c2-studio-commercial-head"><div><h2>Commercial Preview Canvas</h2><p>真实业务组合场景而不是组件 API 排列。Card、Button、Input、Switch、Badge 直接使用 QXFRAME 样式；Table、Select、DatePicker、Upload、Menu、Tabs、Progress 使用真实 runtime component。</p></div><div class="qxframe9a7c2-studio-commercial-meta">'+badge('20 business scenes','primary')+badge('Live Light / Dark','info')+badge('Complete Theme CSS','success')+'</div></div><div class="qxframe9a7c2-studio-scenes">'+commercialHtml()+'</div>';
  all.parentNode.insertBefore(section,all);
}
function mount(name,options){
  var host=document.querySelector('[data-studio-mount="'+name+'"]');if(!host)return;
  var C=components(),instance=null;
  try{
    if(name==='transactions'&&C.Table)instance=C.Table.create({container:host,items:[
      {key:'t1',customer:'Acme Inc.',status:'Paid',amount:'$675.48'},
      {key:'t2',customer:'Northstar Labs',status:'Pending',amount:'$1,248.00'},
      {key:'t3',customer:'Studio Nine',status:'Paid',amount:'$329.00'},
      {key:'t4',customer:'Vertex',status:'Refunded',amount:'-$89.00'}
    ],getKey:function(row){return row.key;},bordered:true,striped:true,columns:[{key:'customer',title:'Customer'},{key:'status',title:'Status'},{key:'amount',title:'Amount'}]});
    else if(name==='plan-select'&&C.Select)instance=C.Select.create({container:host,items:[{key:'monthly',value:'monthly',label:'Monthly billing'},{key:'annual',value:'annual',label:'Annual · save 18%'},{key:'enterprise',value:'enterprise',label:'Enterprise contract'}],value:'annual',clearable:false});
    else if(name==='progress'&&C.Progress)instance=C.Progress.create({container:host,type:'line',percent:84,status:'active',success:{percent:62}});
    else if(name==='schedule'&&C.DatePicker)instance=C.DatePicker.create({container:host,value:'2026-10-12',clearable:true});
    else if(name==='upload'&&C.Upload)instance=C.Upload.create({container:host,multiple:true,drag:true,autoUpload:false,listType:'text'});
    else if(name==='menu'&&C.Menu)instance=C.Menu.create({container:host,mode:'vertical',selectedKey:'analytics',openKeys:['workspace'],items:[{key:'workspace',label:'Workspace',items:[{key:'overview',label:'Overview'},{key:'analytics',label:'Analytics'},{key:'customers',label:'Customers'}]},{key:'billing',label:'Billing'},{key:'settings',label:'Settings'}]});
    else if(name==='tabs'&&C.Tabs)instance=C.Tabs.create({container:host,defaultActiveKey:'overview',items:[{key:'overview',label:'Overview',content:'Project health · 84% complete · 12 open tasks'},{key:'activity',label:'Activity',content:'18 updates across design, engineering and go-to-market.'},{key:'settings',label:'Settings',content:'Workspace defaults, permissions and integrations.'}]});
    if(instance)instances.push(instance);else if(host)host.innerHTML='<div class="qxframe9a7c2-studio-runtime-error">Runtime component unavailable: '+esc(name)+'</div>';
  }catch(error){host.innerHTML='<div class="qxframe9a7c2-studio-runtime-error">'+esc(error&&error.message||error)+'</div>';}
}
function mountCommercial(){['transactions','plan-select','progress','schedule','upload','menu','tabs'].forEach(mount);}

function option(value,label){return '<option value="'+esc(value)+'">'+esc(label||value)+'</option>';}
function selectOptions(items){return items.map(function(item){return option(item[0],item[1]);}).join('');}
function lockButton(key){return '<button type="button" class="qxframe9a7c2-studio-lock" data-studio-lock="'+esc(key)+'">Lock</button>';}
function field(label,key,control,lockKey){return '<label class="qxframe9a7c2-studio-field"><span class="qxframe9a7c2-studio-label"><span>'+esc(label)+'</span>'+(lockKey?lockButton(lockKey):'')+'</span>'+control+'</label>';}
function studioPanelHtml(){
  return '<div class="qxframe9a7c2-studio-group"><div class="qxframe9a7c2-studio-group-head"><strong>Theme Studio v1</strong><small>Schema 1</small></div>'+
    field('Theme name','name','<input class="qxframe9a7c2-studio-control" data-studio-input="name" type="text">')+
    '<div class="qxframe9a7c2-studio-mode"><button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-studio-mode="light">Light</button><button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-studio-mode="dark">Dark</button><button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-studio-mode="system">System</button></div></div>'+
  '<div class="qxframe9a7c2-studio-group"><div class="qxframe9a7c2-studio-group-head"><strong>Design</strong><small>orthogonal controls</small></div>'+
    field('Preset','preset','<select class="qxframe9a7c2-studio-control" data-studio-preset><option value="">Custom / current</option>'+selectOptions([['signal','Signal'],['ledger','Ledger'],['harbor','Harbor'],['juniper','Juniper'],['ember','Ember'],['orbit','Orbit'],['graphite','Graphite'],['canvas','Canvas']])+'</select>')+
    field('Style','style','<select class="qxframe9a7c2-studio-control" data-studio-input="style">'+selectOptions([['vega','Vega'],['nova','Nova'],['maia','Maia'],['lyra','Lyra'],['mira','Mira'],['luma','Luma'],['sera','Sera'],['rhea','Rhea']])+'</select>','style')+
    field('Base color','baseColor','<select class="qxframe9a7c2-studio-control" data-studio-input="baseColor">'+selectOptions([['neutral','Neutral'],['stone','Stone'],['zinc','Zinc'],['mauve','Mauve'],['olive','Olive'],['mist','Mist'],['taupe','Taupe']])+'</select>','baseColor')+
    field('Theme color','primary','<div class="qxframe9a7c2-studio-color-row"><select class="qxframe9a7c2-studio-control" data-studio-input="primary">'+selectOptions([['blue','Blue'],['purple','Purple'],['cyan','Cyan'],['teal','Teal'],['green','Green'],['orange','Orange'],['red','Red'],['pink','Pink'],['custom','Custom']])+'</select><input class="qxframe9a7c2-studio-color" data-studio-primary-color type="color" value="#5b5bd6"></div>','primary')+
    field('Chart color','chart','<select class="qxframe9a7c2-studio-control" data-studio-input="chart">'+selectOptions([['primary','Primary'],['neutral','Neutral'],['blue','Blue'],['purple','Purple'],['cyan','Cyan'],['teal','Teal'],['green','Green'],['lime','Lime'],['yellow','Yellow'],['orange','Orange'],['red','Red'],['pink','Pink'],['grey','Grey']])+'</select>','chart')+
    field('Radius','radius','<select class="qxframe9a7c2-studio-control" data-studio-input="radius">'+selectOptions([['default','Default'],['none','None'],['small','Small'],['medium','Medium'],['large','Large']])+'</select>','radius')+
  '</div>'+
  '<div class="qxframe9a7c2-studio-group"><div class="qxframe9a7c2-studio-group-head"><strong>Typography</strong><small>font resources stay external</small></div>'+
    field('Body font','body','<select class="qxframe9a7c2-studio-control" data-studio-input="body">'+selectOptions([['system-ui','System UI'],['inter','Inter'],['humanist','Humanist'],['serif','Serif']])+'</select>','body')+
    field('Heading font','heading','<select class="qxframe9a7c2-studio-control" data-studio-input="heading">'+selectOptions([['inherit','Inherit'],['system-ui','System UI'],['inter','Inter'],['humanist','Humanist'],['serif','Serif'],['mono','Mono']])+'</select>','heading')+
    field('Base size','baseSize','<select class="qxframe9a7c2-studio-control" data-studio-input="baseSize">'+selectOptions([['12','12'],['14','14'],['16','16'],['18','18'],['20','20']])+'</select>','body')+
  '</div>'+
  '<div class="qxframe9a7c2-studio-group"><div class="qxframe9a7c2-studio-group-head"><strong>Menu</strong><small>component preset</small></div>'+
    field('Color','menuColor','<select class="qxframe9a7c2-studio-control" data-studio-input="menuColor">'+selectOptions([['default','Default'],['primary','Primary'],['inverted','Inverted'],['neutral','Neutral']])+'</select>','menu')+
    field('Appearance','menuAppearance','<select class="qxframe9a7c2-studio-control" data-studio-input="menuAppearance">'+selectOptions([['solid','Solid'],['soft','Soft'],['translucent','Translucent']])+'</select>','menu')+
    field('Accent','menuAccent','<select class="qxframe9a7c2-studio-control" data-studio-input="menuAccent">'+selectOptions([['subtle','Subtle'],['balanced','Balanced'],['strong','Strong']])+'</select>','menu')+
  '</div>'+
  '<details class="qxframe9a7c2-studio-advanced"><summary>Advanced semantic roles</summary><div class="qxframe9a7c2-studio-advanced-body">'+
    field('Success','success','<select class="qxframe9a7c2-studio-control" data-studio-input="success">'+selectOptions([['green','Green'],['teal','Teal'],['blue','Blue']])+'</select>')+
    field('Warning','warning','<select class="qxframe9a7c2-studio-control" data-studio-input="warning">'+selectOptions([['orange','Orange'],['yellow','Yellow'],['red','Red']])+'</select>')+
    field('Error','error','<select class="qxframe9a7c2-studio-control" data-studio-input="error">'+selectOptions([['red','Red'],['orange','Orange'],['pink','Pink']])+'</select>')+
    field('Info','info','<select class="qxframe9a7c2-studio-control" data-studio-input="info">'+selectOptions([['cyan','Cyan'],['blue','Blue'],['teal','Teal']])+'</select>')+
    '<div class="qxframe9a7c2-studio-override-editor">'+
      field('Palette seed','paletteSeedName','<select class="qxframe9a7c2-studio-control" data-studio-palette-name>'+selectOptions([['blue','Blue'],['cyan','Cyan'],['teal','Teal'],['green','Green'],['lime','Lime'],['yellow','Yellow'],['orange','Orange'],['red','Red'],['pink','Pink'],['purple','Purple'],['grey','Grey']])+'</select>')+
      field('Seed color','paletteSeedValue','<input class="qxframe9a7c2-studio-color" data-studio-palette-color type="color" value="#165dff">')+
      '<button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-studio-apply-palette>Apply seed</button>'+
    '</div>'+
    field('Shadow profile','shadowProfile','<select class="qxframe9a7c2-studio-control" data-studio-advanced-profile="shadow">'+selectOptions([['default','Style default'],['flat','Flat'],['crisp','Crisp'],['elevated','Elevated'],['custom','Custom overrides']])+'</select>')+
    field('Border profile','borderProfile','<select class="qxframe9a7c2-studio-control" data-studio-advanced-profile="border">'+selectOptions([['default','Framework default'],['hairline','Hairline 1px'],['standard','Standard 2px'],['strong','Strong 4px'],['custom','Custom overrides']])+'</select>')+
    field('Motion profile','motionProfile','<select class="qxframe9a7c2-studio-control" data-studio-advanced-profile="motion">'+selectOptions([['default','Framework default'],['none','No motion'],['snappy','Snappy'],['relaxed','Relaxed'],['custom','Custom overrides']])+'</select>')+
    '<div class="qxframe9a7c2-studio-override-editor">'+
      field('Public token','overrideName','<input class="qxframe9a7c2-studio-control" data-studio-override-name type="text" placeholder="--qxframe9a7c2-theme-…">')+
      field('CSS value','overrideValue','<input class="qxframe9a7c2-studio-control" data-studio-override-value type="text" placeholder="0.5rem / rgb(...)">')+
      '<button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-studio-add-override>Add</button>'+
    '</div><div class="qxframe9a7c2-studio-overrides" data-studio-overrides></div>'+
  '</div></details>'+
  '<div class="qxframe9a7c2-studio-actions"><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-studio-randomize>Randomize</button><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-studio-reset>Reset</button></div>'+
  '<div class="qxframe9a7c2-studio-actions"><button class="qxframe9a7c2-button is-primary is-solid is-sm" type="button" data-studio-copy>Copy CSS</button><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-studio-export-css>Export CSS</button><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-studio-export-json>Export JSON</button><button class="qxframe9a7c2-button is-default is-outlined is-sm" type="button" data-studio-import>Import JSON</button><input class="qxframe9a7c2-studio-import" data-studio-file type="file" accept="application/json,.json"></div>'+
  '<div class="qxframe9a7c2-studio-audit" data-studio-audit><strong>Readability</strong><span>Waiting for generated theme…</span></div>'+
  '<div class="qxframe9a7c2-studio-status" data-studio-status>Loading frozen Theme Schema…</div>';
}
function installPanel(){
  var rail=document.querySelector('[data-qxframe9a7c2-play-rail]')||document.querySelector('.qxframe9a7c2-play-rail');if(!rail)return null;
  var legacy=rail.querySelector('.qxframe9a7c2-play-settings'),actions=rail.querySelector('.qxframe9a7c2-play-rail-actions'),exportBox=rail.querySelector('.qxframe9a7c2-play-export');
  var panel=document.createElement('div');panel.className='qxframe9a7c2-studio-panel';panel.dataset.qxframe9a7c2StudioPanel='true';panel.innerHTML=studioPanelHtml();
  if(legacy)rail.insertBefore(panel,legacy);else rail.appendChild(panel);
  if(legacy)legacy.hidden=true;if(actions)actions.hidden=true;if(exportBox)exportBox.hidden=true;
  return panel;
}
function clearLegacyInlineTheme(){
  var root=document.documentElement,names=[];
  for(var i=0;i<root.style.length;i+=1){var name=root.style.item(i);if(/^--_?qxframe9a7c2-/.test(name))names.push(name);}
  names.forEach(function(name){root.style.removeProperty(name);});
}
function ensureInlineGuard(){
  if(inlineGuard)return;
  var busy=false;inlineGuard=new MutationObserver(function(){
    if(busy)return;var style=document.documentElement.getAttribute('style')||'';if(style.indexOf('--qxframe9a7c2-')<0&&style.indexOf('--_qxframe9a7c2-')<0)return;
    busy=true;clearLegacyInlineTheme();busy=false;
  });
  inlineGuard.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
}
function effectiveMode(){
  if(previewMode==='system')return modeMedia&&modeMedia.matches?'dark':'light';
  return previewMode==='dark'?'dark':'light';
}
function applyMode(){
  var mode=effectiveMode(),root=document.documentElement;
  root.classList.toggle('qxframe9a7c2-theme-dark',mode==='dark');root.classList.toggle('qxframe9a7c2-theme-light',mode!=='dark');
  root.setAttribute('data-theme',mode);root.setAttribute('data-qxframe9a7c2-theme',mode);
  document.querySelectorAll('[data-studio-mode]').forEach(function(b){b.classList.toggle('is-primary',b.dataset.studioMode===previewMode);b.classList.toggle('is-solid',b.dataset.studioMode===previewMode);b.classList.toggle('is-default',b.dataset.studioMode!==previewMode);b.classList.toggle('is-outlined',b.dataset.studioMode!==previewMode);});
}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({config:currentConfig,previewMode:previewMode,locks:locks}));}catch(_){}
}
function load(){
  try{var saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved&&saved.config){previewMode=saved.previewMode||'light';locks=Object.assign(Object.create(null),saved.locks||{});return saved.config;}}catch(_){}
  return null;
}
function setControl(key,value){var el=document.querySelector('[data-studio-input="'+key+'"]');if(el)el.value=String(value);}
function colorLike(value){return /^#|^rgba?\(|^hsla?\(|^okl/i.test(String(value||''));}
function allowedOverride(name){
  if(!runtime||!runtime.manifest)return false;
  return runtime.manifest.tokens.some(function(token){return token.name===name;})||(runtime.manifest.optionalComponentOverrides||[]).indexOf(name)>=0;
}
function renderOverrides(){
  var host=document.querySelector('[data-studio-overrides]');if(!host||!currentConfig)return;
  var items=Object.entries(currentConfig.advanced&&currentConfig.advanced.overrides||{});
  host.innerHTML=items.length?items.map(function(entry){return '<div class="qxframe9a7c2-studio-override-item"><div class="qxframe9a7c2-studio-override-copy"><code>'+esc(entry[0])+'</code><span>'+esc(entry[1])+'</span></div><button type="button" class="qxframe9a7c2-button is-error is-text is-xs" data-studio-remove-override="'+esc(entry[0])+'">Remove</button></div>';}).join(''):'<span class="qxframe9a7c2-studio-label">No explicit overrides. Generator presets own the current theme.</span>';
}
function renderAudit(report){
  var host=document.querySelector('[data-studio-audit]');if(!host||!report)return;
  var warnings=report.warnings||[],passed=(report.checks||[]).length-warnings.length;
  host.classList.toggle('is-warning',warnings.length>0);
  host.innerHTML='<strong>Readability · '+passed+'/'+(report.checks||[]).length+' checks pass</strong>'+(warnings.length?warnings.map(function(item){return '<span>'+esc(item.message)+'</span>';}).join(''):'<span>Text, secondary text and semantic on-color checks pass current thresholds.</span>');
}
function syncControls(){
  if(!currentConfig)return;
  setControl('name',currentConfig.name);setControl('style',currentConfig.style);setControl('baseColor',currentConfig.baseColor);setControl('chart',currentConfig.chart.color);setControl('radius',currentConfig.radius);
  setControl('body',currentConfig.typography.body);setControl('heading',currentConfig.typography.heading);setControl('baseSize',currentConfig.typography.baseSize);
  setControl('menuColor',currentConfig.components.menu.color);setControl('menuAppearance',currentConfig.components.menu.appearance);setControl('menuAccent',currentConfig.components.menu.accent);
  ['success','warning','error','info'].forEach(function(k){setControl(k,currentConfig.roles[k]);});
  var presetSelect=document.querySelector('[data-studio-preset]');if(presetSelect)presetSelect.value='';
  var primarySelect=document.querySelector('[data-studio-input="primary"]'),colorInput=document.querySelector('[data-studio-primary-color]');
  if(primarySelect){primarySelect.value=colorLike(currentConfig.roles.primary)?'custom':currentConfig.roles.primary;}
  if(colorInput&&colorLike(currentConfig.roles.primary)){try{colorInput.value=runtime.color.colorToHex(currentConfig.roles.primary);}catch(_){}}
  document.querySelectorAll('[data-studio-lock]').forEach(function(b){var on=!!locks[b.dataset.studioLock];b.classList.toggle('is-locked',on);b.textContent=on?'Locked':'Lock';});
  document.querySelectorAll('[data-studio-advanced-profile]').forEach(function(el){var inferred=runtime&&runtime.advanced?runtime.advanced.inferAdvancedProfile(currentConfig,el.dataset.studioAdvancedProfile):'default';el.value=inferred||'custom';});
  renderOverrides();
  applyMode();
}
function configFromControls(){
  var next=clone(currentConfig||runtime.engine.DEFAULT_CONFIG);
  function val(key){var el=document.querySelector('[data-studio-input="'+key+'"]');return el?el.value:null;}
  next.name=val('name')||'qxframe-theme';next.style=val('style');next.baseColor=val('baseColor');next.chart={color:val('chart')};next.radius=val('radius');next.density='default';
  next.typography.body=val('body');next.typography.heading=val('heading');next.typography.baseSize=Number(val('baseSize')||14);
  next.components.menu.color=val('menuColor');next.components.menu.appearance=val('menuAppearance');next.components.menu.accent=val('menuAccent');
  ['success','warning','error','info'].forEach(function(k){next.roles[k]=val(k);});
  var primary=val('primary');next.roles.primary=primary==='custom'?(document.querySelector('[data-studio-primary-color]')||{}).value||'#5b5bd6':primary;
  return runtime.engine.normalizeConfig(next);
}
function ensureThemeStyle(){
  var style=document.querySelector('style[data-qxframe9a7c2-generated-theme]');if(!style){style=document.createElement('style');style.dataset.qxframe9a7c2GeneratedTheme='true';document.head.appendChild(style);}return style;
}
function updateStatus(text,error){
  var el=document.querySelector('[data-studio-status]');if(!el)return;el.innerHTML=error?'<strong>Generator error</strong><br>'+esc(text):text;
}
function generateNow(){
  if(!runtime)return;
  clearTimeout(generateTimer);
  try{
    currentConfig=configFromControls();
    currentTheme=runtime.generator.generateTheme(runtime.manifest,runtime.recipes,currentConfig);
    clearLegacyInlineTheme();ensureInlineGuard();ensureThemeStyle().textContent=currentTheme.css;applyMode();save();syncControls();renderAudit(currentTheme.reports.readability);
    var kb=(currentTheme.css.length/1024).toFixed(1),warningCount=currentTheme.reports.readability.warnings.length;
    updateStatus('<strong>'+esc(currentConfig.name)+'</strong><br>4,028 public inputs · Light + Dark · '+kb+' KB complete CSS · '+warningCount+' readability warning'+(warningCount===1?'':'s'),false);
  }catch(error){updateStatus(error&&error.message||String(error),true);}
}
function schedule(){clearTimeout(generateTimer);generateTimer=setTimeout(generateNow,80);}
function randomItem(items){return items[Math.floor(Math.random()*items.length)];}
function randomize(){
  var next=clone(currentConfig);
  if(!locks.style)next.style=randomItem(['vega','nova','maia','lyra','mira','luma','sera','rhea']);
  if(!locks.baseColor)next.baseColor=randomItem(['neutral','stone','zinc','mauve','olive','mist','taupe']);
  if(!locks.primary)next.roles.primary=randomItem(['blue','purple','cyan','teal','green','orange','red','pink']);
  if(!locks.chart)next.chart.color=randomItem(['primary','neutral','blue','purple','cyan','teal','green','lime','yellow','orange','red','pink','grey']);
  if(!locks.body){next.typography.body=randomItem(['system-ui','inter','humanist','serif']);next.typography.baseSize=randomItem([12,14,16,18]);}
  if(!locks.heading)next.typography.heading=randomItem(['inherit','system-ui','inter','humanist','serif','mono']);
  if(!locks.radius)next.radius=randomItem(['default','none','small','medium','large']);
  next.density='default';
  if(!locks.menu){next.components.menu.color=randomItem(['default','primary','inverted','neutral']);next.components.menu.appearance=randomItem(['solid','soft','translucent']);next.components.menu.accent=randomItem(['subtle','balanced','strong']);}
  currentConfig=runtime.engine.normalizeConfig(next);syncControls();generateNow();
}
function reset(){
  currentConfig=runtime.engine.normalizeConfig({});previewMode='light';locks=Object.create(null);syncControls();generateNow();
}
function copy(text){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);var area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve();}
function download(artifact){
  var blob=new Blob([artifact.content],{type:artifact.mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=artifact.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);
}
function wirePanel(panel){
  panel.querySelectorAll('[data-studio-input]').forEach(function(el){el.addEventListener('change',schedule);if(el.tagName==='INPUT')el.addEventListener('input',schedule);});
  var presetSelect=panel.querySelector('[data-studio-preset]');if(presetSelect)presetSelect.addEventListener('change',function(){if(!this.value)return;currentConfig=runtime.presets.applyThemePreset(this.value,currentConfig);syncControls();generateNow();});
  var color=panel.querySelector('[data-studio-primary-color]');if(color)color.addEventListener('input',function(){var select=panel.querySelector('[data-studio-input="primary"]');if(select)select.value='custom';schedule();});
  panel.querySelectorAll('[data-studio-mode]').forEach(function(b){b.addEventListener('click',function(){previewMode=this.dataset.studioMode;applyMode();save();});});
  panel.querySelectorAll('[data-studio-lock]').forEach(function(b){b.addEventListener('click',function(){var key=this.dataset.studioLock;locks[key]=!locks[key];syncControls();save();});});
  var random=panel.querySelector('[data-studio-randomize]');if(random)random.addEventListener('click',randomize);
  var resetButton=panel.querySelector('[data-studio-reset]');if(resetButton)resetButton.addEventListener('click',reset);
  var applyPalette=panel.querySelector('[data-studio-apply-palette]');if(applyPalette)applyPalette.addEventListener('click',function(){try{var name=panel.querySelector('[data-studio-palette-name]').value,value=panel.querySelector('[data-studio-palette-color]').value;currentConfig=runtime.advanced.applyPaletteSeed(currentConfig,name,value);syncControls();generateNow();}catch(error){updateStatus(error&&error.message||error,true);}});
  panel.querySelectorAll('[data-studio-advanced-profile]').forEach(function(el){el.addEventListener('change',function(){if(this.value==='custom')return;try{currentConfig=runtime.advanced.applyAdvancedProfile(currentConfig,this.dataset.studioAdvancedProfile,this.value);syncControls();generateNow();}catch(error){updateStatus(error&&error.message||error,true);}});});
  var addOverride=panel.querySelector('[data-studio-add-override]');if(addOverride)addOverride.addEventListener('click',function(){
    var name=(panel.querySelector('[data-studio-override-name]')||{}).value||'',value=(panel.querySelector('[data-studio-override-value]')||{}).value||'';
    name=name.trim();value=value.trim();
    if(!allowedOverride(name)){updateStatus('Unknown or non-public Theme Schema token: '+name,true);return;}
    try{var next=clone(currentConfig);next.advanced=next.advanced||{overrides:{}};next.advanced.overrides=Object.assign({},next.advanced.overrides||{});next.advanced.overrides[name]=value;currentConfig=runtime.engine.normalizeConfig(next);syncControls();generateNow();}catch(error){updateStatus(error&&error.message||error,true);}
  });
  panel.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('[data-studio-remove-override]');if(!button)return;var name=button.getAttribute('data-studio-remove-override'),next=clone(currentConfig);if(next.advanced&&next.advanced.overrides)delete next.advanced.overrides[name];currentConfig=runtime.engine.normalizeConfig(next);syncControls();generateNow();});
  var copyButton=panel.querySelector('[data-studio-copy]');if(copyButton)copyButton.addEventListener('click',function(){if(currentTheme)copy(currentTheme.css).then(function(){updateStatus('<strong>CSS copied</strong><br>Complete Light + Dark theme copied to clipboard.',false);});});
  var exportCss=panel.querySelector('[data-studio-export-css]');if(exportCss)exportCss.addEventListener('click',function(){if(currentTheme)download(runtime.io.exportArtifacts(currentTheme).css);});
  var exportJson=panel.querySelector('[data-studio-export-json]');if(exportJson)exportJson.addEventListener('click',function(){if(currentTheme)download(runtime.io.exportArtifacts(currentTheme).config);});
  var file=panel.querySelector('[data-studio-file]'),importButton=panel.querySelector('[data-studio-import]');
  if(importButton&&file)importButton.addEventListener('click',function(){file.click();});
  if(file)file.addEventListener('change',function(){var selected=this.files&&this.files[0];if(!selected)return;selected.text().then(function(text){currentConfig=runtime.io.importConfigJson(text);syncControls();generateNow();}).catch(function(error){updateStatus(error&&error.message||error,true);});this.value='';});
}
function loadRuntime(){
  var base;
  try{base=new URL('.',scriptUrl);}catch(error){return Promise.reject(error);}
  var generatorUrl=new URL('theme-generator/generator.mjs',base).href,engineUrl=new URL('theme-generator/engine.mjs',base).href,ioUrl=new URL('theme-generator/io.mjs',base).href,colorUrl=new URL('theme-generator/color-engine.mjs',base).href,presetsUrl=new URL('theme-generator/presets.mjs',base).href,advancedUrl=new URL('theme-generator/advanced-engine.mjs',base).href;
  var manifestUrl=new URL('../generated/theme-public-schema-v1.json',base).href,recipesUrl=new URL('../generated/theme-color-recipes-v1.json',base).href;
  return Promise.all([import(generatorUrl),import(engineUrl),import(ioUrl),import(colorUrl),import(presetsUrl),import(advancedUrl),fetch(manifestUrl).then(function(r){if(!r.ok)throw new Error('Theme Schema load failed: '+r.status);return r.json();}),fetch(recipesUrl).then(function(r){if(!r.ok)throw new Error('Theme recipes load failed: '+r.status);return r.json();})]).then(function(parts){
    return {generator:parts[0],engine:parts[1],io:parts[2],color:parts[3],presets:parts[4],advanced:parts[5],manifest:parts[6],recipes:parts[7]};
  });
}
function enableStudio(){
  var panel=installPanel();if(!panel)return;
  var saved=load();currentConfig=runtime.engine.normalizeConfig(saved||{});wirePanel(panel);syncControls();generateNow();
  var intro=document.querySelector('.qxframe9a7c2-play-hero h1');if(intro)intro.textContent='Theme Studio · real commercial preview';
  var copy=document.querySelector('.qxframe9a7c2-play-hero p');if(copy)copy.textContent='高层配置经过冻结 Schema v1 生成完整 Light / Dark 静态 CSS。上方商业场景用于判断 neutral、Style geometry、radius、monochrome chart 与 Menu treatment 是否在真实产品组合里成立；下面继续保留全组件矩阵做回归。';
  global.QXFRAME9A7C2_THEME_STUDIO=Object.freeze({getConfig:function(){return clone(currentConfig);},getTheme:function(){return currentTheme;},randomize:randomize,reset:reset,regenerate:generateNow});
}
function showEngineError(error){
  var section=document.querySelector('[data-qxframe9a7c2-studio-commercial]');if(!section)return;
  var box=document.createElement('div');box.className='qxframe9a7c2-studio-engine-error';box.textContent='Theme Generator module did not activate in this environment; commercial component preview remains available. '+String(error&&error.message||error);section.insertBefore(box,section.firstChild);
}
function cleanup(){instances.forEach(function(instance){try{if(instance&&typeof instance.destroy==='function')instance.destroy();}catch(_){}});instances=[];if(inlineGuard)inlineGuard.disconnect();}
function boot(){
  var shell=document.querySelector('[data-qxframe9a7c2-play-shell]');if(!shell){setTimeout(boot,0);return;}
  insertCommercial();mountCommercial();
  loadRuntime().then(function(value){runtime=value;enableStudio();}).catch(showEngineError);
  global.addEventListener('pagehide',cleanup,{once:true});
  if(modeMedia&&typeof modeMedia.addEventListener==='function')modeMedia.addEventListener('change',function(){if(previewMode==='system')applyMode();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
