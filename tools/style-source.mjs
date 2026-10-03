import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ownRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export const CANONICAL_STYLE_ENTRY='src/styles/qxframe9a7c2.scss';

function readOrder(root){
  return JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-order.json'),'utf8'));
}

export function getCanonicalStyleModulePaths({root=ownRoot}={}){
  const order=readOrder(root);
  if(!Array.isArray(order.sourceModules)||order.sourceModules.length===0){
    throw new Error('CSS source-order manifest must declare sourceModules.');
  }
  return [...order.sourceModules];
}

export function readCanonicalStyleSource({root=ownRoot,schema=null}={}){
  return getCanonicalStyleModulePaths({root})
    .filter(rel=>schema!==1||rel!=='src/styles/theme/_visual-v2.scss')
    .map(rel=>fs.readFileSync(path.join(root,rel),'utf8'))
    .join('');
}

export function getCanonicalComponentStyleModulePaths({root=ownRoot}={}){
  return getCanonicalStyleModulePaths({root}).filter(rel=>rel.startsWith('src/styles/components/'));
}

export function readCanonicalComponentStyleSource({root=ownRoot}={}){
  return getCanonicalComponentStyleModulePaths({root})
    .map(rel=>fs.readFileSync(path.join(root,rel),'utf8'))
    .join('');
}

export function getPhaseABaselinePath({root=ownRoot}={}){
  const rel=readOrder(root).migrationBaseline;
  if(!rel) throw new Error('CSS source-order manifest must declare the Phase A baseline fixture.');
  return path.join(root,rel);
}

export function readPhaseABaseline({root=ownRoot}={}){
  return fs.readFileSync(getPhaseABaselinePath({root}),'utf8');
}
