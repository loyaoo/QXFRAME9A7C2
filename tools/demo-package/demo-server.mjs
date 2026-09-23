import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.map':'application/json; charset=utf-8'};
function send(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);}
function openBrowser(url){
  try{
    let child;
    if(process.platform==='win32') child=spawn('cmd',['/c','start','',url],{detached:true,stdio:'ignore'});
    else if(process.platform==='darwin') child=spawn('open',[url],{detached:true,stdio:'ignore'});
    else child=spawn('xdg-open',[url],{detached:true,stdio:'ignore'});
    child.unref();
  }catch{}
}
const server=http.createServer((req,res)=>{
  const raw=decodeURIComponent(String(req.url||'/').split('?')[0]);
  const requested=raw==='/'?'/docs/index.html':raw;
  const resolved=path.resolve(root,'.'+requested);
  if(resolved!==root&&!resolved.startsWith(root+path.sep)) return send(res,403,'Forbidden');
  fs.stat(resolved,(err,stat)=>{
    if(err) return send(res,404,'Not found');
    const file=stat.isDirectory()?path.join(resolved,'index.html'):resolved;
    fs.readFile(file,(readErr,data)=>{
      if(readErr) return send(res,404,'Not found');
      send(res,200,data,types[path.extname(file).toLowerCase()]||'application/octet-stream');
    });
  });
});
server.listen(port,'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+port+'/docs/';
  console.log('QXFRAME9A7C2 demo: '+url);
  console.log('Press Ctrl+C to stop.');
  if(process.argv.includes('--open')) openBrowser(url);
});
