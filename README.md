# P2P Proximity Voice Chat

A real-time multiplayer demo with proximity-based voice chat. Players are represented as cubes in a 3D scene - the closer you are to another player, the louder you hear them.

Built with Three.js for rendering, WebRTC for peer-to-peer audio/data, and a simple Node.js signaling server.

## Features

- **Proximity voice chat** - Volume scales with distance between players
- **Direct P2P connection** - Audio and position data sent directly between browsers via WebRTC
- **Real-time sync** - See other players move around the scene
- **LAN support** - Connect from multiple devices on the same network

## How It Works

Two players connect to the signaling server, which helps establish a direct WebRTC connection between them. Once connected, audio streams and position updates flow directly between browsers without going through the server.

Volume is calculated using inverse square law:

```
Volume = 1 / distance²
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- A modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- SSL certificates for local development (see below)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AdalricP/p2pproximityvoicechat.git
   cd p2pproximityvoicechat
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Generate SSL certificates** (required for microphone access)
   ```bash
   openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365
   ```
   > Note: Accept the self-signed certificate warning in your browser

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   
   - Local: `https://localhost:8080`
   - LAN: `https://<your-ip>:8080` (for connecting from other devices)

## Controls

| Key | Action |
|-----|--------|
| Arrow Up | Move up |
| Arrow Down | Move down |
| Arrow Left | Move left |
| Arrow Right | Move right |
| Space | Reset position |

## Project Structure

```
p2pproximityvoicechat/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles for the 3D scene
├── js/
│   └── script.js       # Three.js scene, WebRTC & voice chat logic
├── server/
│   ├── server.js       # WebSocket signaling server
│   ├── package.json    # Server dependencies
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Technical Details

**Stack:**
- Three.js for 3D rendering
- WebRTC for P2P audio and data channels
- WebSocket for signaling
- Web Audio API (GainNode) for volume control

**Architecture:**

```
┌─────────────┐                        ┌─────────────┐
│   Player 1  │◄──── P2P Audio ────►  │   Player 2  │
│   (Blue)    │◄──── P2P Data  ────►  │    (Red)    │
└──────┬──────┘                        └──────┬──────┘
       │                                      │
       │         WebSocket Signaling          │
       └──────────────┬───────────────────────┘
                      │
              ┌───────▼───────┐
              │    Server     │
              │  (Node.js)    │
              └───────────────┘
```

Position updates use the WebRTC DataChannel when available, falling back to WebSocket relay if needed. Uses Google's public STUN server for NAT traversal.

## License

MIT
