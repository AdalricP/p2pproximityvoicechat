# P2P Voice Chat with Proximity Audio

## Features
✅ **Full Peer-to-Peer (P2P)** - Voice AND position data via WebRTC
✅ Real-time 2-player movement synchronization
✅ WebRTC peer-to-peer voice chat
✅ Proximity-based audio (voice gets quieter with distance)
✅ LAN support for playing across devices
✅ Server only used for matchmaking - all gameplay is P2P!

## Architecture

```
Initial Connection (Signaling):
Player 1 ← WebSocket → Server ← WebSocket → Player 2

After P2P Established:
Player 1 ←────── WebRTC Direct P2P ──────→ Player 2
         (Voice Audio + Position Data)
         Server not involved!
```

## How to Run

### 1. Start the Server
```bash
cd /Users/aryan/Desktop/p2pvoicechat/my-project/server
node server.js
```

The server will display:
```
🚀 Server running:
  - Local:   http://localhost:8080
  - Network: http://172.16.57.137:8080  # Your LAN IP

📱 On other devices (LAN), open: http://172.16.57.137:8080
```

### 2. Connect Players

**Same Computer (Testing):**
- Open two browser tabs: `http://localhost:8080`

**Different Computers on Same Network (LAN):**
- Computer 1: Open `http://localhost:8080`
- Computer 2: Open `http://172.16.57.137:8080` (use the Network IP from server output)
- Make sure both computers are on the same WiFi/network
- If connection fails, check firewall settings

### 3. Grant Microphone Permission
- Browser will ask for microphone access - click "Allow"
- Both players need to grant permission
- Wait for status to show: **"P2P Connected! Voice + Position via direct connection."**
- This means you're now using 100% peer-to-peer!

### 4. Play!
- **Controls:**
  - Arrow Keys: Move your cube
  - Spacebar: Reset position
- **Visual:**
  - Blue cube: You
  - Red cube: Other player
- **Audio:**
  - Voice chat is proximity-based
  - The closer you are, the louder you hear each other
  - Maximum hearing distance: 10 units
  - Volume fades with distance

## Troubleshooting

### "Disconnected from server"
- Make sure the server is running
- Refresh the browser page

### "Could not access microphone"
- Check browser permissions (usually icon in address bar)
- Try using Chrome or Firefox
- Make sure no other app is using the microphone

### Voice chat not working
- Make sure BOTH players granted microphone permission
- Check browser console (F12) for errors
- Try refreshing both pages

### LAN connection not working
- Ensure both devices are on same network
- Check firewall settings (allow port 8080)
- Try disabling VPN if active
- On Mac, go to System Preferences → Security & Privacy → Firewall → Allow Node

## How Proximity Audio Works

The volume is calculated based on distance between players:
- Distance < 1 unit: Full volume
- Distance 1-10 units: Gradual fade (exponential curve)
- Distance > 10 units: Silent

Formula: `volume = (1 - distance/10)²`

## Network Configuration

### Find Your LAN IP (if needed)
**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

### Port Configuration
- Default port: 8080
- To change: Edit `PORT` in `server/server.js`
