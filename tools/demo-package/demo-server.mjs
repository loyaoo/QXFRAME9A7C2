import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const realRoot=fs.realpathSync(root);
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.map':'application/json; charset=utf-8'};
function send(res,status,body,type='text/plain; charset=utf-8',method='GET'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(method==='HEAD')res.end();else res.end(body);}
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
  const method=String(req.method||'GET').toUpperCase();
  if(method!=='GET'&&method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return send(res,405,'Method Not Allowed','text/plain; charset=utf-8',method);}
  let raw;
  try{raw=decodeURIComponent(String(req.url||'/').split('?')[0]);}catch{return send(res,400,'Bad Request','text/plain; charset=utf-8',method);}
  if(raw.includes('\0'))return send(res,400,'Bad Request','text/plain; charset=utf-8',method);
  const requested=raw==='/'?'/docs/index.html':raw;
  const resolved=path.resolve(root,'.'+requested);
  if(resolved!==root&&!resolved.startsWith(root+path.sep)) return send(res,403,'Forbidden','text/plain; charset=utf-8',method);
  fs.stat(resolved,(err,stat)=>{
    if(err) return send(res,404,'Not found','text/plain; charset=utf-8',method);
    const file=stat.isDirectory()?path.join(resolved,'index.html'):resolved;
    fs.realpath(file,(realErr,realFile)=>{
      if(realErr|| (realFile!==realRoot&&!realFile.startsWith(realRoot+path.sep))) return send(res,403,'Forbidden','text/plain; charset=utf-8',method);
      fs.readFile(realFile,(readErr,data)=>{
        if(readErr) return send(res,404,'Not found','text/plain; charset=utf-8',method);
        send(res,200,data,types[path.extname(realFile).toLowerCase()]||'application/octet-stream',method);
      });
    });
  });
});
server.listen(port,'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+port+'/docs/';
  console.log('QXFRAME9A7C2 demo: '+url);
  console.log('Press Ctrl+C to stop.');
  if(process.argv.includes('--open')) openBrowser(url);
});
