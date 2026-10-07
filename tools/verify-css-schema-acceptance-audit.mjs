import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectSchema } from './audit-css-schema-acceptance.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-schema-audit-test-'));
const paths = ['src/styles/theme/_default.scss', 'src/styles/theme/_family.scss', 'src/styles/components/card.css'];
const write = (file, text) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); };
try {
  write('tools/manifests/css-order.json', JSON.stringify({ sourceModules: paths }));
  write('QXFRAME9A7C2-CSS-Design-Token-System-Refactor-Execution-Guide-v1.6.md', '# 46. Complete guide\n');
  write(paths[0], ':root { ' + ['xs', 'sm', 'md', 'lg', 'xl'].map(size => '--qxframe9a7c2-theme-control-height-' + size + ': 2rem;').join(' ') + ' }');
  write(paths[1], ['xs', 'sm', 'md', 'lg', 'xl'].map(size => '.is-' + size + ' { --_qxframe9a7c2-size-control-height: var(--qxframe9a7c2-theme-control-height-' + size + '); }').join('\n'));
  write(paths[2], '/* color-mix(in srgb, red, blue) is documentation only. */\n.qxframe9a7c2-card { --_qxframe9a7c2-card-bg: red; background: var(--_qxframe9a7c2-card-bg); }');
  const inspect = () => inspectSchema({ rootDir: root });
  let result = inspect();
  assert.equal(result.completeGuide, true);
  assert.ok(result.themeControlHeight.every(role => role.defined && role.consumed));
  assert.equal(result.runtimeColorMix.length, 0, 'Comment-only mixing must not become a live consumer.');
  assert.equal(result.componentRootPublicDefaults.length, 0, 'Private final values are not public override masking candidates.');
  write(paths[1], '.is-md { --_qxframe9a7c2-size-control-height: var(--qxframe9a7c2-size-16); }');
  assert.ok(inspect().themeControlHeight.every(role => !role.consumed), 'Defined but disconnected Theme interfaces must be detected.');
  write(paths[0], ':root { --qxframe9a7c2-size-16: 2rem; }');
  assert.ok(inspect().themeControlHeight.every(role => !role.defined), 'Missing public Theme interfaces must be detected.');
  write(paths[2], '.qxframe9a7c2-card { --qxframe9a7c2-card-height: var(--qxframe9a7c2-theme-card-height); background: color-mix(in srgb, red, blue); }');
  result = inspect();
  assert.equal(result.runtimeColorMix.length, 1);
  assert.equal(result.mixByLayer.component, 1);
  assert.equal(result.componentRootPublicDefaults[0].token, '--qxframe9a7c2-card-height');
  write('QXFRAME9A7C2-CSS-Design-Token-System-Refactor-Execution-Guide-v1.6.md', '# 12. Truncated guide\n');
  assert.equal(inspect().completeGuide, false, 'A truncated authority cannot be accepted.');
  console.log(JSON.stringify({ ok: true, mutationCases: ['unconsumed-theme-role', 'undefined-theme-role', 'live-color-mix', 'public-root-default', 'truncated-guide'], ignoresCommentOnlyConsumers: true }));
} finally { fs.rmSync(root, { recursive: true, force: true }); }
