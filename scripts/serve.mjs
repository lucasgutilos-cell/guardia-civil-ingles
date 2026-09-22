import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT||4173);
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
 try{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname.startsWith('/guardia-civil-ingles/'))pathname=pathname.slice('/guardia-civil-ingles'.length);
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
 }catch{res.writeHead(400).end();}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/guardia-civil-ingles/'));
