// APC PWA Test - zero-dependency Node.js server
// Run:  node server.js        (default port 3000, or set PORT=8080)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'notes.json');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml'
};

function loadNotes() { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; } }
function saveNotes(n) { fs.writeFileSync(DATA, JSON.stringify(n, null, 2)); }
function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  // ---------- API ----------
  if (url.pathname === '/api/time') {
    return sendJSON(res, 200, { serverTime: new Date().toISOString(), host: require('os').hostname() });
  }
  if (url.pathname === '/api/notes' && req.method === 'GET') {
    return sendJSON(res, 200, loadNotes());
  }
  if (url.pathname === '/api/notes' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body || '{}');
        if (!text || !String(text).trim()) return sendJSON(res, 400, { error: 'text required' });
        const notes = loadNotes();
        const note = { id: Date.now(), text: String(text).trim().slice(0, 500), createdAt: new Date().toISOString() };
        notes.unshift(note); saveNotes(notes);
        sendJSON(res, 201, note);
      } catch { sendJSON(res, 400, { error: 'bad json' }); }
    });
    return;
  }
  if (url.pathname.startsWith('/api/notes/') && req.method === 'DELETE') {
    const id = Number(url.pathname.split('/').pop());
    saveNotes(loadNotes().filter(n => n.id !== id));
    return sendJSON(res, 200, { ok: true });
  }

  // ---------- Static files ----------
  let file = path.normalize(path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' };
    if (file.endsWith('sw.js')) headers['Cache-Control'] = 'no-cache'; // always check for new SW
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`APC PWA Test running on http://localhost:${PORT}`);
  const nets = require('os').networkInterfaces();
  for (const list of Object.values(nets)) for (const n of list)
    if (n.family === 'IPv4' && !n.internal) console.log(`  LAN: http://${n.address}:${PORT}`);
});
