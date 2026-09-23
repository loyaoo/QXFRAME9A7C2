QXFRAME9A7C2 DIST + DOCS DEMO

1. Double-click START-DEMO.cmd
2. Your browser will open http://127.0.0.1:4173/docs/
3. Press Ctrl+C in the command window to stop the demo server.

No npm install and no build are required.
The dist/ directory in this package is the real Rollup output produced by the same successful GitHub Actions run.
The docs/ pages reference this packaged dist/ directly.

Fallback:
If Node.js is not available, you may try opening docs/index.html directly, although HTTP mode is recommended.
