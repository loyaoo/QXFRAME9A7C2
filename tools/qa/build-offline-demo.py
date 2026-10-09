#!/usr/bin/env python3
"""Create a Windows offline annotated Create demo from a successful CI Actions artifact.

Use: python tools/qa/build-offline-demo.py ACTIONS.zip HEAD RUN_ID ARTIFACT_ID PR_MERGE_SHA GIT_TREE [DEST_DIRECTORY]
Never inject visual QA into tracked docs/create/index.html or preview*.html.
Only the extracted local bundle copies receive the QA script and stylesheet.
"""
import io
import hashlib
import http.server
import os
from pathlib import Path
import shutil
import sys
import threading
import urllib.request
import zipfile

artifact_arg, head, run_id, artifact_id, merge_sha, tree_sha = sys.argv[1:7]
artifact = Path(artifact_arg).resolve()
base = Path(sys.argv[7]).resolve() if len(sys.argv) > 7 else artifact.parent
base.mkdir(parents=True, exist_ok=True)
out = base / ('QXFRAME9A7C2-CREATEAPP-V3-S3-dist-docs-LOCAL-' + head[:8] + '.zip')
work = base / ('offline-QXFRAME9A7C2-' + head[:8])
assert len(head) == len(merge_sha) == len(tree_sha) == 40
shutil.rmtree(work, ignore_errors=True)
work.mkdir()

with zipfile.ZipFile(artifact) as outer:
    assert outer.testzip() is None
    nested = [name for name in outer.namelist() if name.endswith('.zip')]
    assert len(nested) == 1, nested
    with zipfile.ZipFile(io.BytesIO(outer.read(nested[0]))) as inner:
        assert inner.testzip() is None
        required = ('docs/create/index.html', 'docs/create/preview-01.html',
                    'docs/create/preview-02.html', 'dist/qxframe9a7c2.js',
                    'docs/create/offline-qa-changes.mjs', 'docs/create/offline-qa-changes.css')
        assert set(required).issubset(inner.namelist()), 'Missing Create or QA script in Actions artifact'
        inner.extractall(work)

# Fill self-referential change records with the exact commit used to build this
# ZIP. Never leave a vague 'current run' label or stale hardcoded count.
ledger_path=work/'docs/create/offline-qa-changes.mjs'
ledger=ledger_path.read_text('utf-8')
assert ledger.count('__QA_BUNDLE_HEAD__')==1, 'missing exact-HEAD change annotation'
ledger_path.write_text(ledger.replace('__QA_BUNDLE_HEAD__',head[:8]),'utf-8')

online = 'https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js'
for name in ('index.html', 'preview-01.html', 'preview-02.html'):
    file = work / 'docs/create' / name
    html = file.read_text('utf-8')
    assert html.count(online) == 1, name
    assert 'offline-qa-changes' not in html, 'Production HTML must not load QA overlays'
    assert html.count('</head>') == html.count('</body>') == 1
    html = html.replace(online, '../../dist/qxframe9a7c2.js')
    html = html.replace('</head>',
        '  <link rel="stylesheet" href="./offline-qa-changes.css">\n</head>')
    html = html.replace('</body>',
        '  <script type="module" src="./offline-qa-changes.mjs"></script>\n</body>')
    file.write_text(html, 'utf-8')

(work / 'START-DEMO.cmd').write_text(
    '@echo off\ncd /d "%~dp0"\nwhere node >nul 2>nul\n'
    'if %errorlevel%==0 (node demo-server.mjs) else (call START-DEMO-PYTHON.cmd)\n'
    'if errorlevel 1 pause\n', encoding='utf-8')
(work / 'START-DEMO-PYTHON.cmd').write_text(
    '@echo off\ncd /d "%~dp0"\nwhere py >nul 2>nul\n'
    'if %errorlevel%==0 (py -3 -m http.server 4173 --bind 127.0.0.1) '
    'else (python -m http.server 4173 --bind 127.0.0.1)\n'
    'if errorlevel 1 pause\n', encoding='utf-8')
(work / 'demo-server.mjs').write_text("""import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const mime={'.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8',
 '.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png',
 '.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 try {
  const url=new URL(req.url,'http://127.0.0.1');
  let p=decodeURIComponent(url.pathname);
  if(p.endsWith('/'))p+='index.html';
  const full=path.resolve(root,'.'+p);
  if(full!==root&&!full.startsWith(root+path.sep)){res.writeHead(403).end('Forbidden');return;}
  fs.readFile(full,(err,buf)=>{
   if(err){res.writeHead(404).end('Not found');return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream',
     'Cache-Control':'no-store'});res.end(buf);
  });
 }catch(_){res.writeHead(400).end('Bad request')}
}).listen(4173,'127.0.0.1',()=>console.log('Open http://127.0.0.1:4173/docs/create/'));
""", encoding='utf-8')
(work / 'VERSION-HEAD.txt').write_text(
    'Development HEAD: ' + head + '\nCI PR merge: ' + merge_sha +
    '\nSame Git tree: ' + tree_sha + '\nQXFRAME run: ' + run_id +
    '\nActions artifact: ' + artifact_id + '\n', encoding='utf-8')
(work / 'README-本地验收.md').write_text(
    '# QXFRAME9A7C2 Stage3 Windows 离线验收\n\n'
    '开发 HEAD: ' + head + '\nPR CI 合成 SHA: ' + merge_sha +
    '\n同一 Git tree: ' + tree_sha + '\nQXFRAME CI: ' + run_id +
    '\nActions artifact: ' + artifact_id + '\n\n'
    '## 启动\n\n双击 START-DEMO.cmd（Node.js 18+ 或 Python 3 即可），无需 npm、git 或网络。'
    '访问 http://127.0.0.1:4173/docs/create/ 。'
    '单独的 Preview 01、02 分别在 docs/create/preview-01.html、preview-02.html。\n\n'
    '## 改动高亮定位（仅离线版）\n\n'
    '默认开启。Create 右下角的「验收标注 · 离线专用」清单列出卡片、'
    '具体改变和提交号；橙色实线框是修改过的 Card，虚线是内部改动区域。'
    '点击变更条目定位到对应卡片；点击「关闭高亮 · 原貌对比」恢复干净画面。'
    '独立打开 Preview 01 也有同样的清单。所有改动标记只注入此本地包副本，'
    '在线 Create/Pages 和上游严格几何测试完全不加载。\n\n'
    '本轮标注：FAQ 三等分标签与答案颜色、Savings Targets 条目和底部提示、'
    'Recent Transactions 日期色、Syncing State 文本换行。Preview 02 本批未更改。'
    '未标注的卡片不代表已通过验收。\n\n'
    '之后每批更改卡片必须同步更新 docs/create/offline-qa-changes.mjs 的清单。'
    '此包未合并到 main，Stage 3 尚待人工验收。\n', encoding='utf-8')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
cwd = os.getcwd()
os.chdir(work)
server = Server(('127.0.0.1', 0), Quiet)
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = ('docs/create/', 'docs/create/preview-01.html', 'docs/create/preview-02.html',
          'docs/create/offline-qa-changes.mjs', 'docs/create/offline-qa-changes.css',
          'docs/theme-playground.html', 'dist/qxframe9a7c2.js', 'dist/qxframe9a7c2.css')
try:
    for path in checks:
        with urllib.request.urlopen('http://127.0.0.1:' + str(server.server_port) + '/' + path,
                                    timeout=10) as response:
            assert response.status == 200, path
            response.read()
finally:
    server.shutdown()
    os.chdir(cwd)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as final:
    for f in sorted(work.rglob('*')):
        if f.is_file():
            final.write(f, f.relative_to(work).as_posix())
with zipfile.ZipFile(out) as check:
    assert check.testzip() is None
    count = len(check.namelist())
print('ZIP', out, 'FILES', count, 'BYTES', out.stat().st_size,
      'SHA256', hashlib.sha256(out.read_bytes()).hexdigest(), 'CRC PASS', 'HTTP200', len(checks))