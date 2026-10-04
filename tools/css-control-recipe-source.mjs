import fs from 'node:fs';
import path from 'node:path';

// Theme Visual v1.5 has one CSS authority. Control geometry, typography,
// appearance and state recipes are all authored in the canonical Theme v2
// source; there is no Preset -> Theme bridge to resolve in test code.
export function readEffectiveControlRecipes(root) {
  return fs.readFileSync(path.join(root,'src/styles/theme/_visual-v2.scss'),'utf8');
}
