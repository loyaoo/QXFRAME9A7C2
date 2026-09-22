import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supportPath = path.join(root, 'docs', 'browser-support.md');
function assert(value, message) { if (!value) throw new Error(message); }
function walk(dir) {
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(absolute));
    else if(entry.isFile() && entry.name.endsWith('.js')) out.push(absolute);
  }
  return out;
}

assert(fs.existsSync(supportPath), 'Missing docs/browser-support.md.');
const support = fs.readFileSync(supportPath, 'utf8');
[['Chrome','105'],['Edge (Chromium)','105'],['Firefox','112'],['Safari','16.4']].forEach(([browser,version]) => assert(support.includes(`| ${browser} | ${version} |`), `Browser baseline drift: ${browser} ${version}.`));
for (const capability of ['AbortController','Pointer Events','ResizeObserver','MutationObserver','IntersectionObserver','`inert`','WeakRef','Trusted Types','Shadow DOM']) assert(support.includes(capability), `Browser support contract is missing capability: ${capability}.`);
assert(/Trusted Types[^\n]*\*\*not\*\* part of the 2\.19\.x baseline contract/.test(support), 'Trusted Types boundary must remain explicit.');
assert(/Shadow DOM[^\n]*Not a formal 2\.19\.x framework contract/.test(support), 'Shadow DOM boundary must remain explicit.');
assert(/ordinary Document DOM remains the supported ownership model/.test(support), 'Document DOM ownership boundary is missing.');

const componentFiles=walk(path.join(root,'src/components'));
const components=componentFiles.map(file=>({name:path.relative(root,file).replaceAll(path.sep,'/'),text:fs.readFileSync(file,'utf8')}));
const globalDocumentCreators=components.filter(record=>/\bglobal\.document\.(?:createElement|createElementNS|createDocumentFragment|createTextNode)\s*\(/.test(record.text));
assert(globalDocumentCreators.length===0,`Visible components create DOM through global.document: ${globalDocumentCreators.map(x=>x.name).join(', ')}.`);
const directObservers=components.filter(record=>/new\s+(?:ResizeObserver|MutationObserver|IntersectionObserver)\s*\(/.test(record.text));
assert(directObservers.length===0,`Visible components construct platform observers directly: ${directObservers.map(x=>x.name).join(', ')}.`);
const arbitraryInnerHTML=components.filter(record=>/\.innerHTML\s*=/.test(record.text));
assert(arbitraryInnerHTML.length===0,`Visible components write innerHTML directly: ${arbitraryInnerHTML.map(x=>x.name).join(', ')}.`);

const observerHub=fs.readFileSync(path.join(root,'src/core/observerHub.js'),'utf8');
const asyncTask=fs.readFileSync(path.join(root,'src/core/asyncTask.js'),'utf8');
const motion=fs.readFileSync(path.join(root,'src/core/motion.js'),'utf8');
const isolation=fs.readFileSync(path.join(root,'src/core/interactionIsolation.js'),'utf8');
const domTemplate=fs.readFileSync(path.join(root,'src/core/domTemplate.js'),'utf8');
assert(/typeof Ctor !== 'function'/.test(observerHub),'ObserverHub must fail closed when an observer constructor is unavailable.');
assert(/opts\.AbortController \|\| global\.AbortController/.test(asyncTask),'AsyncTask AbortController boundary is missing.');
assert(/typeof global\.AbortController === 'function'/.test(motion),'MotionCore AbortController fallback guard is missing.');
assert(/!\('inert' in node\) && node\.style/.test(isolation),'InteractionIsolation inert fallback is missing.');
assert(/DOMTemplate\.staticHTML forbids JavaScript interpolation/.test(domTemplate),'DOMTemplate must remain static-only while strict Trusted Types is outside the baseline.');
assert(/template\.innerHTML = markup/.test(domTemplate),'DOMTemplate implementation changed; revisit Trusted Types boundary before claiming strict-CSP support.');

console.log(JSON.stringify({ok:true,browserBaseline:{chrome:105,edge:105,firefox:112,safari:'16.4'},componentFiles:componentFiles.length,observerOwner:'ObserverHub',templateOwner:'DOMTemplate'}));
