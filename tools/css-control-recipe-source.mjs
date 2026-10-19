import fs from 'node:fs';
import path from 'node:path';

// Theme Visual v1.5 has one CSS authority. Control geometry, typography,
// appearance and state recipes are all authored in the canonical Theme v2
// source; there is no Preset -> Theme bridge to resolve in test code.
export function readEffectiveControlRecipes(root) {
  return [ 'src/styles/main/semantic-cascade.css', 'src/styles/components/semantic-status-modifiers.css', 'src/styles/components/feedback-theme-states.css', 'src/styles/components/data-control-states.css', 'src/styles/components/input-action-states.css', 'src/styles/components/overlay-picker-states.css', 'src/styles/components/menu-selection-states.css', 'src/styles/components/component-sizing.css' ].map(rel=>fs.readFileSync(path.join(root,rel),'utf8')).join('\n');
}
