// Theme editor gate (script name kept for the release pipeline). The THEME-VISUAL-V2 Studio is
// superseded by createApp (docs/create/, v3 §3; owner decision stage 2: theme-playground links to it).
// Static mode runs the createApp model gate; --browser runs the createApp interaction gate.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = process.argv.includes('--browser') ? 'tools/verify-create-app-browser.mjs' : 'tools/verify-create-app.mjs';
const result = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
