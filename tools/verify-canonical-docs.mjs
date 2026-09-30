import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targetRoot=path.resolve(process.argv[2]||repoRoot);
const docsRoot=path.join(targetRoot,'docs');
const distRoot=path.join(targetRoot,'dist');
function assert(condition,message){if(!condition)throw new Error('[QXFRAME9A7C2 canonical docs] '+message);}
function posix(value){return value.split(path.sep).join('/');}
function inside(file,root){const rel=path.relative(root,file);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
assert(fs.existsSync(docsRoot),'docs directory missing: '+docsRoot);
assert(fs.existsSync(distRoot),'dist directory missing: '+distRoot);

const componentDir=path.join(docsRoot,'components');
const componentPages=fs.readdirSync(componentDir).filter(name=>name.endsWith('.html')).sort().map(name=>'docs/components/'+name);
const adminViewDir=path.join(docsRoot,'admin','views');
const adminViewPages=fs.readdirSync(adminViewDir).filter(name=>name.endsWith('.html')).sort().map(name=>'docs/admin/views/'+name);
const canonical=[
  ...componentPages,
  'docs/admin-dashboard-static.html',
  'docs/admin-form-static.html',
  'docs/admin-list-static.html',
  'docs/admin/index.html',
  'docs/admin/login.html',
  'docs/admin/register.html',
  'docs/admin/register-result.html',
  ...adminViewPages,
  'docs/index.html',
  'docs/theme-playground.html',
  'docs/tokens.html'
];
assert(componentPages.length===66,'expected 66 component pages, found '+componentPages.length);
assert(adminViewPages.length===36,'expected 36 complete-admin view pages, found '+adminViewPages.length);
assert(canonical.length===112,'expected 112 canonical HTML pages, found '+canonical.length);

const forbidden=/(^|\/)(?:src|tests|audit|migration|vendor)(?:\/|$)|(?:^|\/)stage-\d+\.html(?:$|[?#])/i;
const runtimeJs=/qxframe9a7c2\.js(?:[?#].*)?$/i;
const runtimeCss=/qxframe9a7c2\.css(?:[?#].*)?$/i;
const report=[];
for(const rel of canonical){
  const file=path.join(targetRoot,rel);
  assert(fs.existsSync(file),'missing canonical page '+rel);
  const html=fs.readFileSync(file,'utf8');
  const refs=[...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(match=>match[1].trim()).filter(Boolean);
  assert(refs.some(ref=>runtimeJs.test(ref)),'current dist JS missing from '+rel);
  assert(refs.some(ref=>runtimeCss.test(ref)),'current dist CSS missing from '+rel);
  if(rel.startsWith('docs/components/')){
    const component=(html.match(/<body\b[^>]*data-qxframe9a7c2-component=["']([^"']+)["']/i)||[])[1];
    assert(component,'component identity missing from '+rel);
    assert(/qxframe9a7c2-component-site\.js/.test(html),'component site runtime missing from '+rel);
    assert(/qxframe9a7c2-component-demos\.js/.test(html),'component demo runtime missing from '+rel);
  }
  for(const ref of refs){
    if(/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(ref))continue;
    const clean=ref.split('#')[0].split('?')[0];
    if(!clean)continue;
    assert(!forbidden.test(clean),'forbidden historical/source dependency in '+rel+': '+ref);
    const resolved=path.resolve(path.dirname(file),clean);
    assert(inside(resolved,docsRoot)||inside(resolved,distRoot),'dependency escapes docs/dist publication boundary in '+rel+': '+ref);
    assert(fs.existsSync(resolved),'missing local dependency in '+rel+': '+ref);
  }
  report.push({page:rel,refs:refs.length});
}

// Canonical docs dogfood the framework instead of rebuilding parallel visual primitives.
const componentSiteJs=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-component-site.js'),'utf8');
const componentSiteCss=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-component-site.css'),'utf8');
const playgroundJs=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-theme-playground.js'),'utf8');
const playgroundCss=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-theme-playground.css'),'utf8');
const enhancementsJs=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-component-enhancements.js'),'utf8');
const tokenJs=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-token-reference.js'),'utf8');
const tokenCss=fs.readFileSync(path.join(docsRoot,'assets','qxframe9a7c2-token-reference.css'),'utf8');

for(const [label,source,patterns] of [
  ['component docs',componentSiteJs,[
    /qxframe9a7c2-card qxframe9a7c2-docs-demo-card/,
    /qxframe9a7c2-card qxframe9a7c2-docs-observe-card/,
    /qxframe9a7c2-card is-hoverable qxframe9a7c2-docs-home-card/,
    /qxframe9a7c2-form-input is-(?:sm|lg)/
  ]],
  ['component API tables',enhancementsJs,[
    /qxframe9a7c2-table-wrap qxframe9a7c2-docs-api-table-wrap/,
    /qxframe9a7c2-table is-sm qxframe9a7c2-docs-api-table/,
    /qxframe9a7c2-form-input is-md/,
    /qxframe9a7c2-tag/
  ]],
  ['Theme Playground',playgroundJs,[
    /qxframe9a7c2-card qxframe9a7c2-play-card/,
    /qxframe9a7c2-card-header qxframe9a7c2-play-card-head/,
    /qxframe9a7c2-card-body qxframe9a7c2-play-card-body/,
    /qxframe9a7c2-card-footer qxframe9a7c2-play-card-foot/,
    /qxframe9a7c2-card qxframe9a7c2-play-setting/
  ]],
  ['Token Reference',tokenJs,[
    /qxframe9a7c2-card qxframe9a7c2-token-hero-copy/,
    /qxframe9a7c2-card qxframe9a7c2-token-control-card/,
    /qxframe9a7c2-card qxframe9a7c2-token-section/,
    /qxframe9a7c2-button is-primary is-solid is-sm qxframe9a7c2-token-button/
  ]]
]){
  for(const pattern of patterns) assert(pattern.test(source),label+' must dogfood framework Card/form/button primitives: '+pattern);
}
for(const [label,source,pattern] of [
  ['component demo Card',componentSiteCss,/\.qxframe9a7c2-docs-demo-card\{[^}]*\b(?:border|background|border-radius)\s*:/],
  ['component observe Card',componentSiteCss,/\.qxframe9a7c2-docs-observe-card\{[^}]*\b(?:border|background|border-radius)\s*:/],
  ['component API Table wrap',componentSiteCss,/\.qxframe9a7c2-docs-api-table-wrap\{[^}]*\b(?:border|background|border-radius)\s*:/],
  ['component API Table',componentSiteCss,/\.qxframe9a7c2-docs-api-table\{[^}]*\b(?:background|border-collapse)\s*:/],
  ['Theme Playground Card',playgroundCss,/\.qxframe9a7c2-play-card\{[^}]*\b(?:border|background|border-radius)\s*:/],
  ['Theme Playground setting Card',playgroundCss,/\.qxframe9a7c2-play-setting\{[^}]*(?:^|[;{])\s*(?:border|background|border-radius)\s*:/],
  ['Token Reference shared Card',tokenCss,/\.qxframe9a7c2-token-(?:hero-copy|control-card|section)\{[^}]*\b(?:border|background|border-radius)\s*:/]
]){
  assert(!pattern.test(source),label+' must not recreate the framework Card visual shell.');
}

console.log(JSON.stringify({ok:true,componentPages:componentPages.length,canonicalPages:canonical.length,checkedRefs:report.reduce((sum,row)=>sum+row.refs,0),docsDogfood:true}));
