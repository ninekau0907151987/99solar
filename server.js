/**
 * 99 Solar Hat Yai - Web Server for Render & Local Hosting
 * บริษัท 99 แมทช์ เมคเกอร์ จำกัด
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Render expects port 10000 by default for Node.js Web Services
const PRIMARY_PORT = parseInt(process.env.PORT, 10) || 10000;
const FALLBACK_PORT = 3000;
const HOST = '0.0.0.0';
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const handleRequest = (req, res) => {
  // CORS & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Healthcheck for Render
  if (pathname === '/healthz' || pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', app: '99solar', time: new Date().toISOString() }));
    return;
  }

  // Root redirects to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Sanitize path to prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(BASE_DIR, safePath);

  // Check if file exists, or if appending .html works (clean URLs)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const htmlCandidate = filePath + '.html';
      fs.stat(htmlCandidate, (errHtml, statsHtml) => {
        if (!errHtml && statsHtml.isFile()) {
          serveFile(htmlCandidate, res);
        } else {
          // Fallback to index.html for Single-Page navigation or 404
          const indexFile = path.join(BASE_DIR, 'index.html');
          fs.readFile(indexFile, (errIndex, data) => {
            if (errIndex) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('404 Not Found - 99 Solar Hat Yai');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(data);
            }
          });
        }
      });
      return;
    }

    serveFile(filePath, res);
  });
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(content);
  });
}

// 1. Primary Server (Render PORT: 10000 หรือค่าตาม process.env.PORT)
const primaryServer = http.createServer(handleRequest);
primaryServer.listen(PRIMARY_PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(`☀️ 99 Solar Hat Yai Server running for Render`);
  console.log(`🌐 Primary Port (Render): http://${HOST}:${PRIMARY_PORT}`);
  console.log(`📁 Directory: ${BASE_DIR}`);
  console.log(`===============================================`);
});

// 2. Secondary Server (Fallback Port 3000 สำหรับกรณีรันในเครื่องหรือ Render สแกนพอร์ต 3000)
if (PRIMARY_PORT !== FALLBACK_PORT) {
  const fallbackServer = http.createServer(handleRequest);
  fallbackServer.listen(FALLBACK_PORT, HOST, () => {
    console.log(`🌐 Fallback Port: http://${HOST}:${FALLBACK_PORT}`);
  }).on('error', (err) => {
    // ถ้าพอร์ต 3000 ถูกใช้งานอยู่แล้ว ให้ข้ามได้โดยไม่แครช
    console.log(`ℹ️ Fallback port ${FALLBACK_PORT} is optional: ${err.message}`);
  });
}
