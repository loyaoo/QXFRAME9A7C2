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
  'qxframe9a7c2-admin:navigate',
  'qxframe9a7c2-admin:theme',
  'requestFullscreen'
])assert(shellJs.includes(marker),'admin shell capability missing '+marker);
for(const marker of ['embed=1','is-admin-embedded','qxframe9a7c2-admin:navigate','qxframe9a7c2-admin:theme']){
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
