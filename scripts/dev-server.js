#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

// Read the version number from the VERSION file (source of truth)
function getVersionString() {
  try {
    const version = fs.readFileSync(path.join(ROOT_DIR, 'VERSION'), 'utf8').trim();
    return version || '0';
  } catch (err) {
    console.warn('⚠️  Could not read VERSION file, using "0"');
    return '0';
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  // For HTML files, inject the version number from the VERSION file
  if (filePath.endsWith('.html')) {
    serveHTMLWithVersion(res, filePath);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

function serveHTMLWithVersion(res, htmlPath) {
  fs.readFile(htmlPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
      return;
    }

    const html = data.toString('utf8');
    const version = getVersionString();
    const processed = html.replace(/MU\/TH-UR FW 6000\.__VERSION__/g, `MU/TH-UR FW 6000.${version}`);

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    });
    res.end(processed);
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Handle root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Handle SPA routing - serve index.html for unknown routes
  const filePath = path.join(ROOT_DIR, pathname);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist, serve index.html for SPA routing
      console.log(`📄 SPA route: ${pathname} -> index.html`);
      serveFile(res, path.join(ROOT_DIR, 'index.html'));
    } else {
      console.log(`📁 Serving: ${pathname}`);
      serveFile(res, filePath);
    }
  });
});

server.listen(PORT, () => {
  console.log('🚀 Nostromo Monitoring System Development Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${ROOT_DIR}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});