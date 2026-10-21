const http=require('http'),fs=require('fs'),path=require('path');
const REPO='/home/claude/touch22-website',HERE=__dirname;
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/stage.html';
 const f=u.startsWith('/orders/')?path.join(REPO,u):path.join(HERE,u);
 fs.readFile(f,(e,b)=>{if(e){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(b);});
}).listen(8090,()=>console.log('up'));
