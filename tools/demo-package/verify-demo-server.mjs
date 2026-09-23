import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const origin=process.env.DEMO_ORIGIN||'http://127.0.0.1:4173';
const endpoint=new URL(origin);
const demoRoot=path.resolve(process.argv[2]||'demo-package');

function request(pathname, options={}) {
  return new Promise((resolve,reject)=>{
    const req=http.request({
      protocol:endpoint.protocol,
      hostname:endpoint.hostname,
      port:endpoint.port,
      path:pathname,
      method:options.method||'GET',
      headers:options.headers||{}
    },res=>{
      const chunks=[];
      res.on('data',chunk=>chunks.push(chunk));
      res.on('end',()=>resolve({
        status:res.statusCode||0,
        headers:res.headers,
        body:Buffer.concat(chunks)
      }));
    });
    req.on('error',reject);
    req.end();
  });
}

function assert(condition,message){if(!condition)throw new Error('[QXFRAME9A7C2 demo security] '+message);}

const docs=await request('/docs/');
assert(docs.status===200,'GET /docs/ expected 200, got '+docs.status);
assert(String(docs.headers['x-content-type-options']||'').toLowerCase()==='nosniff','nosniff header missing');
assert(String(docs.headers['referrer-policy']||'').toLowerCase()==='no-referrer','no-referrer header missing');

const js=await request('/dist/qxframe9a7c2.js');
assert(js.status===200,'dist JS expected 200, got '+js.status);
const css=await request('/dist/qxframe9a7c2.css');
assert(css.status===200,'dist CSS expected 200, got '+css.status);

const traversal=await request('/%2e%2e/package.json');
assert(traversal.status===403,'encoded traversal expected 403, got '+traversal.status);

const malformed=await request('/%');
assert(malformed.status===400,'malformed percent encoding expected 400, got '+malformed.status);

const post=await request('/docs/',{method:'POST'});
assert(post.status===405,'POST expected 405, got '+post.status);
assert(String(post.headers.allow||'')==='GET, HEAD','POST Allow header mismatch');

const head=await request('/docs/',{method:'HEAD'});
assert(head.status===200,'HEAD /docs/ expected 200, got '+head.status);
assert(head.body.length===0,'HEAD response must not contain a body');

const escape=path.join(demoRoot,'escape-test');
try {
  try { fs.unlinkSync(escape); } catch {}
  fs.symlinkSync('/etc/passwd',escape);
  const symlink=await request('/escape-test');
  assert(symlink.status===403,'symlink escape expected 403, got '+symlink.status);
} finally {
  try { fs.unlinkSync(escape); } catch {}
}

console.log(JSON.stringify({ok:true,origin,checks:9}));
