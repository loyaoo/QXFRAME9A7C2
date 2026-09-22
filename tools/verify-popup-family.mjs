import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PopupComponent } from '../src/components/popup.js';
import { Popover } from '../src/components/popover.js';
import { Popconfirm } from '../src/components/popconfirm.js';
import { Tooltip } from '../src/components/tooltip.js';
import { Dropdown } from '../src/components/dropdown.js';
import { Trigger } from '../src/components/trigger.js';
import { QXFRAME9A7C2 } from '../src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const popupSource = fs.readFileSync(path.join(root, 'src/components/popup.js'), 'utf8');
const popoverSource = fs.readFileSync(path.join(root, 'src/components/popover.js'), 'utf8');
const popconfirmSource = fs.readFileSync(path.join(root, 'src/components/popconfirm.js'), 'utf8');
const tooltipSource = fs.readFileSync(path.join(root, 'src/components/tooltip.js'), 'utf8');
const dropdownSource = fs.readFileSync(path.join(root, 'src/components/dropdown.js'), 'utf8');
const triggerSource = fs.readFileSync(path.join(root, 'src/components/trigger.js'), 'utf8');
const forbidden = [/Registry\.(?:get|define|assert)\s*\(/, /\bdefineModule\s*\(/, /(?:globalThis|window|self)\.QXFRAME9A7C2/, /\(function\s*\(global\)/];
for (const [name, source] of [['PopupComponent', popupSource], ['Popover', popoverSource], ['Popconfirm', popconfirmSource], ['Tooltip', tooltipSource], ['Dropdown', dropdownSource], ['Trigger', triggerSource]]) {
    for (const pattern of forbidden) assert.ok(!pattern.test(source), `${name} contains legacy runtime dependency: ${pattern}`);
}
assert.match(popoverSource, /class\s+Popover\s+extends\s+PopupComponent/, 'Popover must inherit PopupComponent.');
assert.match(popconfirmSource, /class\s+Popconfirm\s+extends\s+PopupComponent/, 'Popconfirm must inherit PopupComponent.');
assert.match(tooltipSource, /class\s+Tooltip\s+extends\s+PopupComponent/, 'Tooltip must inherit PopupComponent.');
assert.match(dropdownSource, /class\s+Dropdown\s+extends\s+PopupComponent/, 'Dropdown must inherit PopupComponent.');
for (const method of ['open','close','toggle','setOpen','reposition']) {
    assert.match(popupSource, new RegExp(`\\n\\s*${method}\\s*\\(`), `PopupComponent must own ${method}().`);
    assert.ok(!new RegExp(`\\n\\s*${method}\\s*\\(`).test(popoverSource), `Popover must not duplicate PopupComponent.${method}().`);
    assert.ok(!new RegExp(`\\n\\s*${method}\\s*\\(`).test(popconfirmSource), `Popconfirm must not duplicate PopupComponent.${method}().`);
    assert.ok(!new RegExp(`\\n\\s*${method}\\s*\\(`).test(tooltipSource), `Tooltip must not duplicate PopupComponent.${method}().`);
}
assert.ok(!/^\s*destroy\s*\(/m.test(popoverSource), 'Popover must inherit Component.destroy lifecycle.');
assert.ok(!/^\s*updateOptions\s*\(/m.test(popoverSource), 'Popover must inherit Component.updateOptions transaction.');
assert.ok(QXFRAME9A7C2.Components.Trigger, 'Trigger authority missing.');
assert.ok(QXFRAME9A7C2.Components.Popover, 'Popover authority missing.');
assert.ok(QXFRAME9A7C2.Components.Popconfirm, 'Popconfirm authority missing.');
assert.ok(QXFRAME9A7C2.Components.Tooltip, 'Tooltip authority missing.');
assert.ok(QXFRAME9A7C2.Components.Dropdown, 'Dropdown authority missing.');
assert.equal(QXFRAME9A7C2.Components.Trigger.motion, Trigger.motion, 'Trigger authority must retain canonical motion identity.');
assert.equal(Object.getPrototypeOf(Popover.prototype), PopupComponent.prototype, 'Popover prototype chain drift.');
assert.equal(Object.getPrototypeOf(Dropdown.prototype), PopupComponent.prototype, 'Dropdown prototype chain drift.');
console.log(JSON.stringify({ ok:true, triggerAuthority:true, popupFamilyBase:true, popoverAuthority:true, popconfirmAuthority:true, tooltipAuthority:true, dropdownAuthority:true, lifecycleOwner:'PopupComponent' }));
