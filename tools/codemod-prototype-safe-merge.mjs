import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const changed=[];

function file(rel){return path.join(root,rel);}
function read(rel){return fs.readFileSync(file(rel),'utf8');}
function write(rel,text){fs.writeFileSync(file(rel),text);changed.push(rel);}
function ensureUtils(rel,text){
  if(/from ['"]\.\.\/utils\/utils\.js['"]/.test(text)||/from ['"]\.\/utils\.js['"]/.test(text)) return text;
  const spec=rel.startsWith('src/utils/')?'./utils.js':'../utils/utils.js';
  const lines=text.split('\n');
  let i=0; while(i<lines.length && (lines[i].trim()==='' || lines[i].startsWith('//'))) i++;
  lines.splice(i,0,"import { Utils } from '"+spec+"';");
  return lines.join('\n');
}
function replaceExact(rel,pairs,needUtils=true){
  let text=read(rel), before=text;
  for(const [a,b] of pairs){
    if(!text.includes(a)) throw new Error(rel+' missing expected pattern: '+a);
    text=text.replace(a,b);
  }
  if(needUtils) text=ensureUtils(rel,text);
  if(text!==before) write(rel,text);
}

const directFiles=[
 'src/components/autocomplete.js','src/components/color-picker.js','src/components/dropdown.js',
 'src/components/menu.js','src/components/picker-field.js','src/components/select.js','src/components/tags.js',
 'src/components/time-picker.js','src/components/tree-select.js','src/components/tree.js',
 'src/components/trigger.js','src/components/wheel-picker.js'
];
for(const rel of directFiles){
  let text=read(rel), before=text;
  text=text.replace(/Object\.keys\(next\)\.forEach\(function \((?:name|key)\) \{ opts\[(?:name|key)\] = next\[(?:name|key)\]; \}\);/g,'Utils.copyOwn(opts, next);');
  if(text===before) throw new Error(rel+' did not replace direct next->opts merge');
  text=ensureUtils(rel,text); write(rel,text);
}

replaceExact('src/components/text-field.js',[
 ["Object.keys(patch).forEach(key => { opts[key] = patch[key]; });","Utils.copyOwn(opts, patch);"]
]);

replaceExact('src/components/cascader.js',[
 ["Object.keys(next).forEach(function (name) { if (name !== 'items') opts[name] = next[name]; });","Object.keys(next).forEach(function (name) { if (name !== 'items' && Utils.safeOwnKey(name)) opts[name] = next[name]; });"]
]);

replaceExact('src/components/control.js',[
 ["Object.keys(next).forEach(function (key) { opts[key] = next[key]; });","Utils.copyOwn(opts, next);"],
 ["Object.keys(next).forEach(function (name) { if (name !== 'committedValue') opts[name] = next[name]; });","Object.keys(next).forEach(function (name) { if (name !== 'committedValue' && Utils.safeOwnKey(name)) opts[name] = next[name]; });"]
]);

replaceExact('src/components/transfer.js',[
 ["Object.keys(value).forEach(function (key) { if (key !== 'source' && key !== 'target') base[key] = value[key]; });","Object.keys(value).forEach(function (key) { if (key !== 'source' && key !== 'target' && Utils.safeOwnKey(key)) base[key] = value[key]; });"]
]);

replaceExact('src/components/item.js',[
 ["Object.keys(source).forEach(function (key) { context[key] = source[key]; });","Utils.copyOwn(context, source);"]
]);

{
  let rel='src/components/list.js', text=read(rel), before=text;
  text=text.replace("var state=collection.getState(),projected={};Object.keys(state).forEach(function(name){projected[name]=state[name];});","var state=collection.getState(),projected=Utils.copyOwn({},state);");
  text=text.replace("Object.keys(collection).forEach(function(name){if(name==='updateOptions'||name==='getState'||typeof collection[name]!=='function')return;api[name]=function(){","Object.keys(collection).forEach(function(name){if(!Utils.safeOwnKey(name)||name==='updateOptions'||name==='getState'||typeof collection[name]!=='function')return;api[name]=function(){");
  if(text===before) throw new Error(rel+' did not change');
  text=ensureUtils(rel,text); write(rel,text);
}

replaceExact('src/core/config.js',[
 ["function cloneTokens(tokens) { var out = {}; Object.keys(tokens || {}).forEach(function (key) { out[key] = tokens[key]; }); return out; }","function cloneTokens(tokens) { return Utils.copyOwn({}, tokens || {}); }"],
 ["Object.keys(patch).forEach(function (key) { state[key]=key==='tokens'?validateTokens(patch[key]):patch[key]; });","Object.keys(patch).forEach(function (key) { if (!Utils.safeOwnKey(key)) return; state[key]=key==='tokens'?validateTokens(patch[key]):patch[key]; });"],
 ["chain.forEach(function (currentNode) { var scoped = scopedPatchAt(currentNode); if (scoped && scoped.tokens) Object.keys(scoped.tokens).forEach(function (key) { tokens[key] = scoped.tokens[key]; }); });","chain.forEach(function (currentNode) { var scoped = scopedPatchAt(currentNode); if (scoped && scoped.tokens) Utils.copyOwn(tokens, scoped.tokens); });"],
 ["Object.keys(state.tokens).forEach(function (key) { if (!own(tokens,key)) tokens[key] = state.tokens[key]; });","Object.keys(state.tokens).forEach(function (key) { if (Utils.safeOwnKey(key) && !own(tokens,key)) tokens[key] = state.tokens[key]; });"]
]);

replaceExact('src/core/interactionDetails.js',[
 ["if (extras) Object.keys(extras).forEach(function (key) { if (!(key in detail)) detail[key] = extras[key]; });","if (extras) Object.keys(extras).forEach(function (key) { if (Utils.safeOwnKey(key) && !(key in detail)) detail[key] = extras[key]; });"]
]);

replaceExact('src/core/motion.js',[
 ["Object.keys(value).forEach(function (key) { output[key] = value[key]; });","Utils.copyOwn(output, value);"],
 ["if (extra) Object.keys(extra).forEach(function (key) { base[key] = extra[key]; });","if (extra) Utils.copyOwn(base, extra);"]
]);

replaceExact('src/core/transitionGroup.js',[
 ["if (extra) Object.keys(extra).forEach(function (key) { base[key] = extra[key]; });","if (extra) Utils.copyOwn(base, extra);"]
]);

{
  let rel='src/core/uploadLifecycle.js', text=read(rel), before=text;
  text=text.replaceAll("Object.keys(patch || {}).forEach(function (key) { record[key] = patch[key]; });","Utils.copyOwn(record, patch || {});");
  text=text.replace("Object.keys(nextRecord).forEach(function (key) { current[key] = nextRecord[key]; });","Utils.copyOwn(current, nextRecord);");
  if(text===before) throw new Error(rel+' did not change');
  text=ensureUtils(rel,text); write(rel,text);
}

replaceExact('src/utils/valueEquality.js',[
 ["Object.keys(value).forEach(function (key) { output[key] = copyDeep(value[key], memo); });","Object.keys(value).forEach(function (key) { if (Utils.safeOwnKey(key)) output[key] = copyDeep(value[key], memo); });"]
]);

replaceExact('src/core/textInputBehavior.js',[
 ["Object.keys(patch).forEach(function (key) { opts[key] = patch[key]; });","Utils.copyOwn(opts, patch);"]
]);

const styleFiles=[
 ['src/components/loading.js',[
  ["Object.keys(style).forEach(key => { element.style[key] = style[key] == null ? '' : String(style[key]); });","Object.keys(style).forEach(key => { if (Utils.safeOwnKey(key)) element.style[key] = style[key] == null ? '' : String(style[key]); });"],
  ["Object.keys(style).forEach(key => { element.style[key] = ''; });","Object.keys(style).forEach(key => { if (Utils.safeOwnKey(key)) element.style[key] = ''; });"]
 ]],
 ['src/components/menu.js',[
  ["if (opts.style && typeof opts.style === 'object') Object.keys(opts.style).forEach(function (name) { root.style[name] = opts.style[name]; });","if (opts.style && typeof opts.style === 'object') Object.keys(opts.style).forEach(function (name) { if (Utils.safeOwnKey(name)) root.style[name] = opts.style[name]; });"],
  ["if (item.style && typeof item.style === 'object') Object.keys(item.style).forEach(function (name) { button.style[name] = item.style[name]; });","if (item.style && typeof item.style === 'object') Object.keys(item.style).forEach(function (name) { if (Utils.safeOwnKey(name)) button.style[name] = item.style[name]; });"]
 ]],
 ['src/core/noticeService.js',[
  ["Object.keys(style).forEach(function (key) { element.style[key] = style[key] == null ? '' : String(style[key]); });","Object.keys(style).forEach(function (key) { if (Utils.safeOwnKey(key)) element.style[key] = style[key] == null ? '' : String(style[key]); });"],
  ["Object.keys(previous).forEach(function (key) { element.style[key] = ''; });","Object.keys(previous).forEach(function (key) { if (Utils.safeOwnKey(key)) element.style[key] = ''; });"]
 ]],
 ['src/core/overlayFrameShell.js',[
  ["function applyStyle(element,style){if(!style||typeof style!=='object')return;Object.keys(style).forEach(function(key){element.style[key]=style[key]==null?'':String(style[key]);});}","function applyStyle(element,style){if(!style||typeof style!=='object')return;Object.keys(style).forEach(function(key){if(Utils.safeOwnKey(key))element.style[key]=style[key]==null?'':String(style[key]);});}"]
 ]]
];
for(const [rel,pairs] of styleFiles) replaceExact(rel,pairs);

console.log(JSON.stringify({ok:true,changed:changed.sort(),count:changed.length},null,2));
