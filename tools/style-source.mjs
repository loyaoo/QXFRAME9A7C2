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
  if(!Array.isArray(order.migrationModules)||order.migrationModules.length===0){
    throw new Error('CSS source-order manifest must declare migrationModules.');
  }
  return [...order.migrationModules];
}

export function readCanonicalStyleSource({root=ownRoot}={}){
  return getCanonicalStyleModulePaths({root})
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
