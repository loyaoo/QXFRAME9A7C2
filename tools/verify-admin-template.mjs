import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function assert(condition,message){if(!condition)throw new Error('[QXFRAME9A7C2 admin template] '+message);}
function read(rel){return fs.readFileSync(path.join(repoRoot,rel),'utf8');}
function hasCompositeFieldLabel(html){return [...html.matchAll(/<label[^>]*qxframe9a7c2-form-field[^>]*>([\s\S]*?)<\/label>/g)].some(match=>/<div\b/.test(match[1]));}
function exists(rel){return fs.existsSync(path.join(repoRoot,rel));}
function hasDirectRowChildOfRow(html){
  const source=String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
  const stack=[];
  const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for(const match of source.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)){
    const raw=match[0],tag=match[1].toLowerCase(),attrs=match[2]||'';
    if(raw.startsWith('</')){
      let index=stack.length-1;
      while(index>=0&&stack[index].tag!==tag)index--;
      if(index>=0)stack.length=index;
      continue;
    }
    const classText=(attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)||[])[1]||'';
    const classes=new Set(classText.split(/\s+/).filter(Boolean));
    const parent=stack[stack.length-1];
    if(classes.has('qxframe9a7c2-row')&&parent?.classes?.has('qxframe9a7c2-row'))return true;
    if(!voidTags.has(tag)&&!raw.endsWith('/>'))stack.push({tag,classes});
  }
  return false;
}
function hasMixedGridComponentRoot(html){
  const componentRoots=new Set([
    'qxframe9a7c2-card','qxframe9a7c2-table','qxframe9a7c2-tabs','qxframe9a7c2-collapse',
    'qxframe9a7c2-descriptions','qxframe9a7c2-list','qxframe9a7c2-form','qxframe9a7c2-alert',
    'qxframe9a7c2-result','qxframe9a7c2-calendar','qxframe9a7c2-transfer','qxframe9a7c2-tree',
    'qxframe9a7c2-menu'
  ]);
  const source=String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
  for(const match of source.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)){
    const attrs=match[2]||'';
    const classText=(attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)||[])[1]||'';
    const classes=classText.split(/\s+/).filter(Boolean);
    if(!classes.some(name=>/^qxframe9a7c2-col(?:-|$)/.test(name)))continue;
    if(classes.some(name=>componentRoots.has(name)))return true;
  }
  return false;
}
function hasSizedColumnWithoutBase(html){
  const source=String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
  for(const match of source.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)){
    const classText=((match[2]||'').match(/\bclass\s*=\s*["']([^"']*)["']/i)||[])[1]||'';
    const classes=classText.split(/\s+/).filter(Boolean);
    const sized=classes.some(name=>/^qxframe9a7c2-col-(?:auto|\d+|(?:xs|sm|md|lg|xl|xxl)-(?:auto|\d+))$/.test(name));
    if(sized&&!classes.includes('qxframe9a7c2-col'))return true;
  }
  return false;
}

const shell='docs/admin/index.html';
const login='docs/admin/login.html';
const viewsDir=path.join(repoRoot,'docs/admin/views');
assert(exists(shell),'missing '+shell);
assert(exists(login),'missing '+login);
assert(fs.existsSync(viewsDir),'missing docs/admin/views');
const viewFiles=fs.readdirSync(viewsDir).filter(name=>name.endsWith('.html')).sort();
assert(viewFiles.length===36,'expected 36 admin view pages, found '+viewFiles.length);

const shellHtml=read(shell);
const shellJs=read('docs/assets/qxframe9a7c2-admin-shell.js');
const demoJs=read('docs/assets/qxframe9a7c2-admin-demo.js');
const shellCss=read('docs/assets/qxframe9a7c2-admin-shell.css');
const viewCss=read('docs/assets/qxframe9a7c2-admin-views.css');
const frameworkCss=read('src/qxframe9a7c2.css');
const tableSource=read('src/components/table.js');
const controlSource=read('src/components/control.js');
const adminFormHtml=read('docs/admin-form-static.html');
const adminListHtml=read('docs/admin-list-static.html');
for(const marker of [
  'qxframe9a7c2-admin-shell.css',
  'qxframe9a7c2-admin-shell.js',
  '../../dist/qxframe9a7c2.css',
  '../../dist/qxframe9a7c2.js'
])assert(shellHtml.includes(marker),'admin shell missing dependency '+marker);
for(const marker of [
  'new Map()',
  'sessionStorage',
  'closeOthers',
  'closeRight',
  'closeAll',
  'C.Tabs.create',
  'function syncTabs(syncItems)',
  'if(syncItems===true)tabsOwner.setItems',
  "searchOwner.close",
  "contentDocument",
  "iframe-interaction",
  'qxframe9a7c2-admin:navigate',
  'qxframe9a7c2-admin:theme',
  'requestFullscreen'
])assert(shellJs.includes(marker),'admin shell capability missing '+marker);
assert(!shellJs.includes("className='qx-admin-tab"),'admin shell must not maintain a second hand-authored Tabs implementation');
assert(!shellCss.includes('.qx-admin-tab{'),'legacy admin tab CSS must be removed');
assert(!hasCompositeFieldLabel(adminFormHtml+'\n'+adminListHtml),'composite admin controls must not be wrapped by native label activation');
assert(shellCss.includes('.qx-admin-tabs-scroll>.qxframe9a7c2-tabs'),'admin tab bar must style the canonical Tabs root only');
assert(/\.qx-admin-menu\{[^}]*overflow:hidden/.test(shellCss),'admin menu host must not expose a native scrollbar');
assert(/\.qx-admin-menu \.qxframe9a7c2-menu\{[^}]*height:100%/.test(shellCss),'admin Menu must fill its scroll-owning shell');
assert(frameworkCss.includes('.qxframe9a7c2-menu-root-scroll'),'Menu root must expose framework Scroll composition');
assert(!/\.showScrollbar\s*\(/.test(shellJs),'admin Menu must keep canonical Scroll auto visibility and must not force persistent scrollbar chrome');
for(const marker of ["get('embed')==='1'",'is-admin-embedded','qxframe9a7c2-admin:navigate','qxframe9a7c2-admin:theme']){
  assert(demoJs.includes(marker),'standalone admin embed bridge missing '+marker);
}

const routeMatches=[...shellJs.matchAll(/href:'([^']+)'/g)].map(match=>match[1]);
assert(routeMatches.length===39,'expected 39 admin shell routes, found '+routeMatches.length);
const uniqueRoutes=new Set(routeMatches);
assert(uniqueRoutes.size===routeMatches.length,'admin shell contains duplicate route hrefs');
for(const href of routeMatches){
  const clean=href.split('?')[0].split('#')[0];
  const resolved=path.resolve(path.join(repoRoot,'docs/admin'),clean);
  assert(fs.existsSync(resolved),'admin shell route target missing: '+href);
}

const register='docs/admin/register.html';
const registerResult='docs/admin/register-result.html';
assert(exists(register),'missing '+register);
assert(exists(registerResult),'missing '+registerResult);
const canonicalAdmin=[shell,login,register,registerResult,...viewFiles.map(name=>'docs/admin/views/'+name)];
for(const rel of canonicalAdmin){
  const html=read(rel);
  assert(/qxframe9a7c2\.css/.test(html),'current dist CSS missing from '+rel);
  assert(/qxframe9a7c2\.js/.test(html),'current dist JS missing from '+rel);
  assert(!/layui(?:admin)?/i.test(html),'third-party layui source/branding leaked into '+rel);
  const refs=[...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    .map(match=>match[1].trim()).filter(Boolean);
  for(const ref of refs){
    if(/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(ref))continue;
    const clean=ref.split('#')[0].split('?')[0];
    if(!clean)continue;
    assert(fs.existsSync(path.resolve(path.dirname(path.join(repoRoot,rel)),clean)),'missing local dependency in '+rel+': '+ref);
  }
}

for(const required of ['monitor.html','workplace.html','products.html','inventory.html','customers.html','marketing.html','finance.html','table-list.html','standard-list.html','card-list.html','search-list.html','basic-form.html','step-form.html','advanced-form.html','basic-detail.html','advanced-detail.html','notifications.html','jobs.html','account-settings.html','result-fail.html','403.html','schedule.html','workflow.html','theme-center.html','developer-tools.html'])assert(viewFiles.includes(required),'missing complete-admin preset view '+required);
for(const key of ['monitor','workplace','products','inventory','customers','marketing','finance','table-list','standard-list','card-list','search-list','basic-form','step-form','advanced-form','basic-detail','advanced-detail','notifications','jobs','account-settings','result-fail','403','schedule','workflow','theme-center','developer-tools'])assert(shellJs.includes("key:'"+key+"'"),'admin shell missing preset route '+key);
const combinedAdminViews=viewFiles.map(name=>read('docs/admin/views/'+name)).join('\n');
assert(!hasCompositeFieldLabel(combinedAdminViews),'admin view composite controls must not be wrapped by native label activation');
for(const legacy of ['qx-admin-view-grid','qx-admin-view-page','qx-admin-view-head','qx-admin-search-hero']){
  assert(!viewCss.includes(legacy),'admin views CSS must not recreate structural layout '+legacy);
  assert(!combinedAdminViews.includes(legacy),'admin view markup must use framework row/column composition instead of '+legacy);
}
for(const name of viewFiles){
  const html=read('docs/admin/views/'+name);
  assert(html.includes('qxframe9a7c2-row qxframe9a7c2-gutter-x-0 qxframe9a7c2-gutter-y-4'),'admin view root must use canonical row/column composition: '+name);
  assert(!hasDirectRowChildOfRow(html),'admin Grid row must be nested through a framework column, not directly under another row: '+name);
  assert(!hasMixedGridComponentRoot(html),'admin Grid column must wrap component roots instead of sharing one DOM node with them: '+name);
}
assert(combinedAdminViews.includes('qxframe9a7c2-row')&&combinedAdminViews.includes('qxframe9a7c2-col-md-17'),'admin view markup is missing framework responsive grid composition');
assert(!/\bqxframe9a7c2-(?:g|gx|gy)(?:-(?:xs|sm|md|lg|xl|xxl))?-\d+\b/.test(combinedAdminViews),'admin views must not retain pre-wxui g/gx/gy Grid aliases');
assert(controlSource.includes('clearReplacesToggle: false')&&!controlSource.includes('clearReplacesToggle: true'),'Control must keep popup toggle available beside clear by default');
for(const marker of [
  'Native text controls consume the same visual recipe as Control',
  ':hover:not(:focus):not(:disabled)',
  '.qxframe9a7c2-form-selectgroup-item:has(>.qxframe9a7c2-form-selectgroup-input:checked)',
  '.qxframe9a7c2-menu.is-inline.is-collapsed{min-width:0;width:min(var(--_qxframe9a7c2-menu-collapsed-width),100%)}',
  '.qxframe9a7c2-menu-group-label{display:none}',
  'border-start-start-radius:max(0px,calc(var(--_qxframe9a7c2-card-radius) - 1px))',
  'can-scroll-start','can-scroll-end','--_qxframe9a7c2-table-fixed-head-z'
])assert(frameworkCss.includes(marker),'shared framework CSS polish marker missing '+marker);
for(const marker of ["classList.toggle('has-horizontal-overflow'","classList.toggle('can-scroll-start'","classList.toggle('can-scroll-end'","DOM.listen(scrollViewport, 'scroll'"])assert(tableSource.includes(marker),'Table horizontal-overflow state marker missing '+marker);

const viewJs=read('docs/assets/qxframe9a7c2-admin-views.js');
assert(!/className=['"][^'"]*qxframe9a7c2-col[^'"]*qxframe9a7c2-card[^'"]*['"]/.test(viewJs),'dynamic admin view builders must not merge Grid column and Card classes on one node');
assert(viewJs.includes("col.className='qxframe9a7c2-col qxframe9a7c2-col-24'")&&viewJs.includes('col.appendChild(a)'),'dynamic admin Card builder must compose Grid column > Card');
const coverageLedger='docs/admin/COMPONENT_COVERAGE.md';
assert(exists(coverageLedger),'missing '+coverageLedger);
const coverageText=read(coverageLedger);
const adminCoverageSource=[
  shellHtml,shellJs,demoJs,viewJs,shellCss,viewCss,adminFormHtml,adminListHtml,
  read('docs/admin-dashboard-static.html'),combinedAdminViews
].join('\n');
const componentPages=fs.readdirSync(path.join(repoRoot,'docs/components')).filter(name=>name.endsWith('.html')).map(name=>name.replace(/\.html$/,'')).sort();
const coverageMarkers={
  "alert": "qxframe9a7c2-alert-root",
  "autocomplete": "C.Autocomplete",
  "avatar": "qxframe9a7c2-avatar",
  "badge": "qxframe9a7c2-badge",
  "button": "qxframe9a7c2-button",
  "calendar": "C.Calendar",
  "card": "qxframe9a7c2-card",
  "carousel": "C.Carousel",
  "cascader": "C.Cascader",
  "checkbox": "type=\"checkbox\"",
  "collapse": "C.Collapse",
  "color-panel": "C.ColorPanel",
  "color-picker": "C.ColorPicker",
  "control": "Control.enhance",
  "date-picker": "C.DatePicker",
  "descriptions": "qxframe9a7c2-descriptions",
  "drawer": "C.Drawer",
  "dropdown": "C.Dropdown",
  "empty": "qxframe9a7c2-empty",
  "form": "qxframe9a7c2-form qx-admin-form-layout",
  "grid": "qxframe9a7c2-row",
  "icon": "qxframe9a7c2-icon",
  "image": "C.Image",
  "input-number": "C.InputNumber",
  "input-otp": "C.InputOTP",
  "item": "C.Item",
  "json": "C.JSON",
  "layout": "qxframe9a7c2-layout",
  "list": "C.List",
  "loading": "C.Loading",
  "menu": "C.Menu",
  "message": "C.Message",
  "modal": "C.Modal",
  "notification": "C.Notification",
  "option-list": "C.OptionList",
  "pagination": "C.Pagination",
  "period-panel": "C.PeriodPanel",
  "popconfirm": "C.Popconfirm",
  "popover": "C.Popover",
  "progress": "C.Progress",
  "radio": "type=\"radio\"",
  "rate": "C.Rate",
  "result": "C.Result",
  "ripple": "is-ripple",
  "scroll": "C.Scroll",
  "select": "C.Select",
  "slider": "C.Slider",
  "sort": "C.Sort",
  "steps": "C.Steps",
  "switch": "qxframe9a7c2-switch",
  "table": "C.Table",
  "tabs": "C.Tabs",
  "tag-input": "C.TagInput",
  "tags": "C.Tags",
  "time-panel": "C.TimePanel",
  "time-picker": "C.TimePicker",
  "tooltip": "C.Tooltip",
  "transfer": "C.Transfer",
  "transition-group": "DOMHeadless.TransitionGroup",
  "transition": "DOMHeadless.Transition.create",
  "tree-select": "C.TreeSelect",
  "tree": "C.Tree",
  "trigger": "C.Trigger",
  "upload": "C.Upload",
  "virtual-list": "C.VirtualList",
  "wheel-picker": "C.WheelPicker"
};
assert(componentPages.length===66,'expected 66 component docs pages for admin coverage, found '+componentPages.length);
assert(Object.keys(coverageMarkers).length===componentPages.length,'admin coverage marker count must match component catalog');
for(const name of componentPages){
  assert(Object.prototype.hasOwnProperty.call(coverageMarkers,name),'admin coverage marker missing for '+name);
  assert(coverageText.includes('| '+name+' |'),'admin coverage ledger row missing '+name);
  assert(adminCoverageSource.includes(coverageMarkers[name]),'admin preset does not exercise '+name+' using marker '+coverageMarkers[name]);
}

for(const marker of ['Components','Control.enhance','Table.create','Upload.create','Autocomplete.create','DatePicker.create','Select.create']){
  assert(viewJs.includes(marker),'admin view component composition marker missing '+marker);
}

console.log(JSON.stringify({
  ok:true,
  shellRoutes:routeMatches.length,
  adminViews:viewFiles.length,
  canonicalAdminPages:canonicalAdmin.length
}));
