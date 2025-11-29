const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load SSL certificates with error handling
let serverOptions;
try {
  serverOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
  };
} catch (error) {
  console.error('Error loading SSL certificates:', error.message);
  console.error('Please generate certificates with:');
  console.error('  openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365');
  process.exit(1);
}

// Create HTTPS server to serve static files
const server = https.createServer(serverOptions, (req, res) => {
  // Serve files from parent directory
  const baseDir = path.join(__dirname, '..');
  const requestedPath = req.url === '/' ? 'index.html' : req.url;
  let filePath = path.normalize(path.join(baseDir, requestedPath));

  // Prevent path traversal attacks by ensuring the resolved path is within baseDir
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  // Get file extension
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };

  const contentType = contentTypes[ext] || 'text/plain';

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

const players = new Map();

wss.on('connection', (ws) => {
  const playerId = generateId();
  players.set(playerId, ws);
  
  console.log(`Player ${playerId} connected. Total players: ${players.size}`);
  
  // Send player their ID
  ws.send(JSON.stringify({ type: 'init', playerId }));
  
  // Notify about other player if exists
  if (players.size === 2) {
    broadcast({ type: 'players_ready', count: 2 });
  } else if (players.size > 2) {
    ws.send(JSON.stringify({ type: 'server_full' }));
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Forward WebRTC signaling messages to the other player
      if (['offer', 'answer', 'ice-candidate'].includes(data.type)) {
        players.forEach((client, id) => {
          if (id !== playerId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...data, from: playerId }));
          }
        });
      } else {
        // Broadcast position/other data to other player
        players.forEach((client, id) => {
          if (id !== playerId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...data, from: playerId }));
          }
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    players.delete(playerId);
    console.log(`Player ${playerId} disconnected. Total players: ${players.size}`);
    broadcast({ type: 'player_disconnected', playerId });
  });
});

function broadcast(data) {
  players.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\nServer running:`);
  console.log(`localhost -> https://localhost:${PORT}`);
  console.log(`LAN -> https://${localIP}:${PORT}`);
});

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
