import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function assert(condition,message){if(!condition)throw new Error('[QXFRAME9A7C2 docs api] '+message);}
function read(rel){return fs.readFileSync(path.join(repoRoot,rel),'utf8');}
function parseFrozenAssignment(source,prefix){
  const start=source.indexOf(prefix);
  assert(start>=0,'missing assignment prefix: '+prefix);
  const jsonStart=start+prefix.length;
  let depth=0,inString=false,escape=false,end=-1;
  const opener=source[jsonStart];
  const closer=opener==='['?']':'}';
  assert(opener==='['||opener==='{','assignment is not JSON object/array: '+prefix);
  for(let i=jsonStart;i<source.length;i++){
    const ch=source[i];
    if(inString){
      if(escape){escape=false;continue;}
      if(ch==='\\'){escape=true;continue;}
      if(ch==='"')inString=false;
      continue;
    }
    if(ch==='"'){inString=true;continue;}
    if(ch===opener)depth++;
    else if(ch===closer){depth--;if(depth===0){end=i+1;break;}}
  }
  assert(end>jsonStart,'unterminated JSON assignment: '+prefix);
  return JSON.parse(source.slice(jsonStart,end));
}

const pkg=JSON.parse(read('package.json'));
const catalogSource=read('docs/assets/qxframe9a7c2-component-catalog.js');
const versionMatch=catalogSource.match(/QXFRAME9A7C2_DOCS_VERSION\s*=\s*['"]([^'"]+)['"]/);
assert(versionMatch,'docs version constant missing');
assert(versionMatch[1]===pkg.version,'docs version '+versionMatch[1]+' does not match package '+pkg.version);

const catalog=parseFrozenAssignment(catalogSource,'window.QXFRAME9A7C2_DOCS_CATALOG = Object.freeze(');
const apiSource=read('docs/assets/qxframe9a7c2-component-api.js');
const apiContext={window:{}};
vm.runInNewContext(apiSource,apiContext,{filename:'docs/assets/qxframe9a7c2-component-api.js'});
const api=apiContext.window.QXFRAME9A7C2_DOCS_API||{};
const generated=JSON.parse(read('docs/generated/component-api.json'));
const componentDir=path.join(repoRoot,'docs/components');
const pages=fs.readdirSync(componentDir).filter(name=>name.endsWith('.html')).sort();

assert(catalog.length===66,'expected 66 catalog entries, found '+catalog.length);
assert(pages.length===catalog.length,'component page count '+pages.length+' does not match catalog '+catalog.length);

const catalogNames=new Set(catalog.map(item=>item.name));
for(const meta of catalog){
  assert(meta&&meta.name&&meta.slug,'invalid catalog record');
  assert(api[meta.name],'missing rich API record for '+meta.name);
  const record=api[meta.name];
  assert(Array.isArray(record.options),'API options/params missing for '+meta.name);
  assert(Array.isArray(record.methods),'API methods missing for '+meta.name);
  assert(Array.isArray(record.events),'API events missing for '+meta.name);
  if(meta.api!=='CSS')assert(record.methods.length>0,'runtime/building-block methods are empty for '+meta.name);

  const file=meta.slug+'.html';
  assert(pages.includes(file),'missing component page '+file);
  const html=read('docs/components/'+file);
  assert(html.includes('data-qxframe9a7c2-component="'+meta.name+'"'),'component identity mismatch in '+file);
  assert(html.includes('qxframe9a7c2-component-api.js'),'API data asset missing in '+file);
  assert(html.includes('qxframe9a7c2-component-enhancements.js'),'API renderer asset missing in '+file);
}

for(const component of generated.components||[]){
  assert(catalogNames.has(component.name),'generated runtime contract has no catalog page: '+component.name);
  assert(api[component.name],'generated runtime contract has no rich API record: '+component.name);
  const rich=api[component.name];
  const generatedNames=Object.keys(component.schema||{});
  const richNames=new Set((rich.options||[]).map(row=>row.name));
  const missing=generatedNames.filter(name=>!richNames.has(name));
  assert(missing.length===0,'rich API params missing for '+component.name+': '+missing.join(', '));
}

const enhancements=read('docs/assets/qxframe9a7c2-component-enhancements.js');
for(const marker of ['API / Params / Methods','Props & Params','方法 / Methods','Events & Callbacks']){
  assert(enhancements.includes(marker),'API renderer marker missing: '+marker);
}
const site=read('docs/assets/qxframe9a7c2-component-site.js');
assert(!site.includes('qxframe9a7c2-docs-version">v2.19.79'),'stale hard-coded docs version remains in topbar');
assert(site.includes('Admin Template'),'docs navigation does not expose complete admin template');

console.log(JSON.stringify({
  ok:true,
  version:pkg.version,
  componentPages:pages.length,
  richApiRecords:Object.keys(api).length,
  generatedRuntimeContracts:(generated.components||[]).length
}));
