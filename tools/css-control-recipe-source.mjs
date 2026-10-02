import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Historical normalization manifests describe the effective Preset mapping.
// Follow the real public Theme bridge rather than requiring a bypass of it.
export function readEffectiveControlRecipes(root) {
  const theme = fs.readFileSync(path.join(root, 'src/styles/theme/_default.scss'), 'utf8');
  const family = fs.readFileSync(path.join(root, 'src/styles/theme/_family.scss'), 'utf8');
  return family.replace(/var\((--qxframe9a7c2-theme-control-[a-z-]+-(?:xs|sm|md|lg|xl))\)/g, (_, token) => {
    const value = theme.match(new RegExp(token + '\\s*:\\s*([^;]+);'))?.[1];
    assert.ok(value, 'Missing public Theme control recipe: ' + token);
    return value.trim();
  });
}
