import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateCssGridFlexMap } from './audit-css-grid-flex-map.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persisted=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-grid-flex-conversion-map.json'),'utf8'));
const current=generateCssGridFlexMap({rootDir:root});
assert.deepEqual(persisted.baseline,current.baseline,'CSS Grid baseline is stale.');
assert.deepEqual(persisted.summary,current.summary,'CSS Grid classification summary is stale.');
assert.deepEqual(persisted.rules,current.rules,'CSS Grid rule conversion map is stale.');
assert.ok(current.baseline.actualGridRuleCount<=64,'Actual CSS Grid rule count must never exceed the frozen Phase B conversion baseline of 64.');
assert.equal(current.summary.protected24ColumnFlexGridRulesMatched,0,'24-column Flex Grid must not be classified as CSS Grid.');
assert.ok(current.rules.every(rule=>rule.approved===false&&rule.finalStrategy===null),'Audit must not pre-approve conversion strategies.');
console.log(JSON.stringify({ok:true,...current.baseline,byRisk:current.summary.byRisk,protected24ColumnFlexGridRulesMatched:0}));
