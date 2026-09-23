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
const canonical=[
  ...componentPages,
  'docs/admin-dashboard-static.html',
  'docs/admin-form-static.html',
  'docs/admin-list-static.html',
  'docs/index.html',
  'docs/theme-playground.html',
  'docs/tokens.html'
];
assert(componentPages.length===66,'expected 66 component pages, found '+componentPages.length);
assert(canonical.length===72,'expected 72 canonical HTML pages, found '+canonical.length);

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
console.log(JSON.stringify({ok:true,componentPages:componentPages.length,canonicalPages:canonical.length,checkedRefs:report.reduce((sum,row)=>sum+row.refs,0)}));
