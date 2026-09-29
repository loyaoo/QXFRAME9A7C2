import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function assert(condition,message){if(!condition)throw new Error('[QXFRAME9A7C2 admin template] '+message);}
function read(rel){return fs.readFileSync(path.join(repoRoot,rel),'utf8');}
function exists(rel){return fs.existsSync(path.join(repoRoot,rel));}

const shell='docs/admin/index.html';
const login='docs/admin/login.html';
const viewsDir=path.join(repoRoot,'docs/admin/views');
assert(exists(shell),'missing '+shell);
assert(exists(login),'missing '+login);
assert(fs.existsSync(viewsDir),'missing docs/admin/views');
const viewFiles=fs.readdirSync(viewsDir).filter(name=>name.endsWith('.html')).sort();
assert(viewFiles.length===11,'expected 11 admin view pages, found '+viewFiles.length);

const shellHtml=read(shell);
const shellJs=read('docs/assets/qxframe9a7c2-admin-shell.js');
const demoJs=read('docs/assets/qxframe9a7c2-admin-demo.js');
const shellCss=read('docs/assets/qxframe9a7c2-admin-shell.css');
const viewCss=read('docs/assets/qxframe9a7c2-admin-views.css');
const frameworkCss=read('src/qxframe9a7c2.css');
const tableSource=read('src/components/table.js');
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
  "searchOwner.close",
  "contentDocument",
  "iframe-interaction",
  'qxframe9a7c2-admin:navigate',
  'qxframe9a7c2-admin:theme',
  'requestFullscreen'
])assert(shellJs.includes(marker),'admin shell capability missing '+marker);
assert(!shellJs.includes("className='qx-admin-tab"),'admin shell must not maintain a second hand-authored Tabs implementation');
assert(!shellCss.includes('.qx-admin-tab{'),'legacy admin tab CSS must be removed');
assert(shellCss.includes('.qx-admin-tabs-scroll>.qxframe9a7c2-tabs'),'admin tab bar must style the canonical Tabs root only');
for(const marker of ["get('embed')==='1'",'is-admin-embedded','qxframe9a7c2-admin:navigate','qxframe9a7c2-admin:theme']){
  assert(demoJs.includes(marker),'standalone admin embed bridge missing '+marker);
}

const routeMatches=[...shellJs.matchAll(/href:'([^']+)'/g)].map(match=>match[1]);
assert(routeMatches.length===14,'expected 14 admin shell routes, found '+routeMatches.length);
const uniqueRoutes=new Set(routeMatches);
assert(uniqueRoutes.size===routeMatches.length,'admin shell contains duplicate route hrefs');
for(const href of routeMatches){
  const clean=href.split('?')[0].split('#')[0];
  const resolved=path.resolve(path.join(repoRoot,'docs/admin'),clean);
  assert(fs.existsSync(resolved),'admin shell route target missing: '+href);
}

const canonicalAdmin=[shell,login,...viewFiles.map(name=>'docs/admin/views/'+name)];
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

const combinedAdminViews=viewFiles.map(name=>read('docs/admin/views/'+name)).join('\n');
assert(!viewCss.includes('qx-admin-view-grid'),'admin views CSS must not recreate the framework responsive grid');
assert(!combinedAdminViews.includes('qx-admin-view-grid'),'admin view markup must use the framework responsive row/column system');
assert(combinedAdminViews.includes('qxframe9a7c2-row')&&combinedAdminViews.includes('qxframe9a7c2-col-md-17'),'admin view markup is missing framework responsive grid composition');
for(const marker of ['Native text controls consume the same visual recipe as Control','border-start-start-radius:max(0px,calc(var(--_qxframe9a7c2-card-radius) - 1px))','can-scroll-start','can-scroll-end','--_qxframe9a7c2-table-fixed-head-z'])assert(frameworkCss.includes(marker),'shared framework CSS polish marker missing '+marker);
for(const marker of ["classList.toggle('has-horizontal-overflow'","classList.toggle('can-scroll-start'","classList.toggle('can-scroll-end'","DOM.listen(root, 'scroll'"])assert(tableSource.includes(marker),'Table horizontal-overflow state marker missing '+marker);

const viewJs=read('docs/assets/qxframe9a7c2-admin-views.js');
for(const marker of ['Components','Control.enhance','Table.create','Upload.create','Autocomplete.create','DatePicker.create','Select.create']){
  assert(viewJs.includes(marker),'admin view component composition marker missing '+marker);
}

console.log(JSON.stringify({
  ok:true,
  shellRoutes:routeMatches.length,
  adminViews:viewFiles.length,
  canonicalAdminPages:canonicalAdmin.length
}));
