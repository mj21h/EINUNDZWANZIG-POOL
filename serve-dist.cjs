const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;
  if (pathname === '/') pathname = '/index.html';
  
  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(process.cwd(), 'dist', safePath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(12345, () => {
  console.log('Local server running on http://localhost:12345');
});
