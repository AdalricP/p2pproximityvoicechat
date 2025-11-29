# 🎮 P2P Proximity Voice Chat

A real-time multiplayer experience with **proximity-based voice chat** using WebRTC peer-to-peer connections and Three.js for 3D visualization.

![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

---

## ✨ Features

- 🎤 **Proximity Voice Chat** — Voice volume automatically adjusts based on the distance between players
- 🔗 **Peer-to-Peer Connection** — Direct P2P communication via WebRTC for low latency
- 🎮 **Real-time Movement** — Control your cube with arrow keys and see other players move in real-time
- 🔒 **Secure Communication** — HTTPS/WSS for secure signaling and connections
- 📱 **Cross-Device Support** — Works across devices on the same network

---

## 🎯 How It Works

1. **Connect** — Two players connect to the same server
2. **P2P Setup** — WebRTC establishes a direct peer-to-peer connection
3. **Voice Chat** — Audio streams are transmitted directly between peers
4. **Proximity Audio** — Volume is calculated using inverse square law based on 3D distance
5. **Move & Talk** — Move your cube around and experience spatial audio!

```
Volume = 1 / distance²
```

When players are close, they hear each other loudly. As they move apart, the volume decreases naturally.

---

## 🚀 Getting Started

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

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| ⬆️ Arrow Up | Move up |
| ⬇️ Arrow Down | Move down |
| ⬅️ Arrow Left | Move left |
| ➡️ Arrow Right | Move right |
| Space | Reset position |

---

## 📁 Project Structure

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

---

## 🔧 Technical Details

### Technologies Used

| Technology | Purpose |
|------------|---------|
| **Three.js** | 3D rendering and scene management |
| **WebRTC** | Peer-to-peer audio streaming and data channels |
| **WebSocket** | Signaling server for WebRTC negotiation |
| **Web Audio API** | Proximity-based volume control via GainNode |

### Architecture

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

### Key Features Implementation

- **Proximity Audio**: Uses Web Audio API's `GainNode` to dynamically adjust volume based on 3D Euclidean distance
- **P2P Data Channel**: Position updates are sent via WebRTC DataChannel when available, with WebSocket fallback
- **STUN Server**: Uses Google's public STUN server for NAT traversal

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests

---

## 📄 License

This project is licensed under the MIT License - see the [package.json](server/package.json) for details.

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) for the amazing 3D library
- [WebRTC](https://webrtc.org/) for making P2P communication possible
- All contributors and testers!

---

<p align="center">
  Made with ❤️ and JavaScript
</p>
