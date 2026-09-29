import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const apiPath=path.join(root,'docs/assets/qxframe9a7c2-component-api.js');
const generated=JSON.parse(fs.readFileSync(path.join(root,'docs/generated/component-api.json'),'utf8'));
const START='/* QXFRAME9A7C2 GENERATED CONTRACT PARAMS:START */';
const END='/* QXFRAME9A7C2 GENERATED CONTRACT PARAMS:END */';
function typeLabel(spec){
  if(typeof spec==='string')return spec;
  if(!spec||typeof spec!=='object')return 'any';
  let type=spec.type||'any';
  if(spec.nullable&&!String(type).includes('null'))type+=' | null';
  return String(type);
}
function defaultLabel(component,name){
  const defs=component.defaults||{};
  if(!Object.prototype.hasOwnProperty.call(defs,name))return '—';
  const value=defs[name];
  if(value===undefined)return 'undefined';
  if(typeof value==='string')return JSON.stringify(value);
  try{return JSON.stringify(value);}catch{return String(value);}
}
function description(component,name,spec){
  const type=typeLabel(spec);
  if(/^on[A-Z]/.test(name)&&/function/.test(type))return name+' 公共回调；参数签名来自 '+component.name+' canonical component contract。';
  if(/^(container|target|reference|triggerTarget|inputTarget|valueTarget|formField|formTarget)$/.test(name))return component.name+' 的 '+name+' DOM / field 绑定入口；类型来自 canonical component contract。';
  if(/^(disabled|readOnly|required|busy|loading|open|controlled|headless|virtual)$/.test(name))return component.name+' 的 '+name+' 状态/模式参数；语义与 canonical runtime contract 保持一致。';
  if(/^(value|defaultValue|items|source|name|size|status|variant|placement|strategy|placeholder)$/.test(name))return component.name+' 的 '+name+' 公共参数；类型与默认值由 canonical component contract 同步。';
  return component.name+' 公共参数 '+name+'；类型与默认值由 canonical component contract 自动同步。';
}
const payload={};
for(const component of generated.components||[]){
  payload[component.name]=Object.entries(component.schema||{}).map(([name,spec])=>({
    name,type:typeLabel(spec),default:defaultLabel(component,name),description:description(component,name,spec)
  }));
}
const block=START+'\n'+
`(function(api,contracts){
  'use strict';
  if(!api||!contracts)return;
  Object.keys(contracts).forEach(function(componentName){
    var record=api[componentName];
    if(!record)return;
    if(!Array.isArray(record.options))record.options=[];
    if(!Array.isArray(record.events))record.events=[];
    contracts[componentName].forEach(function(row){
      var exists=record.options.some(function(entry){return entry&&entry.name===row.name;});
      if(!exists)record.options.push(row);
      if(/^on[A-Z]/.test(row.name)&&/function/.test(String(row.type||''))){
        var eventExists=record.events.some(function(entry){return entry&&entry.name===row.name;});
        if(!eventExists)record.events.push({name:row.name,type:row.type,signature:row.type,default:row.default,description:row.description});
      }
    });
  });
})(window.QXFRAME9A7C2_DOCS_API,${JSON.stringify(payload)});`+
'\n'+END;
let source=fs.readFileSync(apiPath,'utf8');
const start=source.indexOf(START),end=source.indexOf(END);
if(start<0||end<start)throw new Error('[QXFRAME9A7C2 docs api sync] generated contract block missing');
const current=source.slice(start,end+END.length);
if(process.argv.includes('--check')){
  if(current!==block)throw new Error('[QXFRAME9A7C2 docs api sync] generated contract block is stale; run npm run sync:docs-api');
  console.log(JSON.stringify({ok:true,components:Object.keys(payload).length,rows:Object.values(payload).reduce((sum,rows)=>sum+rows.length,0)}));
}else{
  source=source.slice(0,start)+block+source.slice(end+END.length);
  fs.writeFileSync(apiPath,source);
  console.log(JSON.stringify({ok:true,written:path.relative(root,apiPath),components:Object.keys(payload).length}));
}
