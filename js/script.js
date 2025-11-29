(function () {
  const container = document.getElementById('container');

  let ws;
  let myPlayerId;
  let otherPlayerCube;
  let lastSentTime = 0;
  const UPDATE_INTERVAL = 50;

  let localStream;
  let peerConnection;
  let audioContext;
  let gainNode;
  let dataChannel;
  const MAX_VOICE_DISTANCE = 10;
  const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 20.0);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const keyboard = {};

  window.addEventListener('keydown', function (e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    keyboard[e.key] = true;
  }, false);

  window.addEventListener('keyup', function (e) {
    keyboard[e.key] = false;
  }, false);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x4aa3f0, metalness: 0.2, roughness: 0.6 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0, 0);
  scene.add(cube);

  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '8080';
    
    ws = new WebSocket(`${protocol}//${host}:${port}`);
    
    ws.onopen = () => {
      console.log('Connected to server');
      updateStatus('Connected to server');
      initVoiceChat();
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'init':
          myPlayerId = data.playerId;
          console.log('My player ID:', myPlayerId);
          updateStatus(`Connected as Player ${myPlayerId}`);
          break;
          
        case 'players_ready':
          console.log('Both players connected!');
          updateStatus('Both players connected! Setting up P2P connection...');
          createOtherPlayerCube();
          setupPeerConnection();
          break;
          
        case 'position':
          if (!dataChannel || dataChannel.readyState !== 'open') {
            updateOtherPlayer(data.position, data.rotation);
            updateProximityVolume(data.position);
          }
          break;
          
        case 'player_disconnected':
          console.log('Other player disconnected');
          updateStatus('Other player disconnected. Waiting for player...');
          removeOtherPlayerCube();
          closePeerConnection();
          break;

        case 'server_full':
          console.log('Server is full');
          updateStatus('Server is full (max 2 players)');
          break;

        case 'offer':
          handleOffer(data.offer);
          break;
        case 'answer':
          handleAnswer(data.answer);
          break;
        case 'ice-candidate':
          handleIceCandidate(data.candidate);
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateStatus('Connection error');
    };
    
    ws.onclose = () => {
      console.log('Disconnected from server');
      updateStatus('Disconnected from server');
      removeOtherPlayerCube();
    };
  }

  function sendPosition(position, rotation) {
    const now = Date.now();
    if (now - lastSentTime >= UPDATE_INTERVAL) {
      const positionData = JSON.stringify({
        type: 'position',
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
      });

      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(positionData);
      } else if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(positionData);
      }
      
      lastSentTime = now;
    }
  }

  function createOtherPlayerCube() {
    if (otherPlayerCube) return;
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.2, roughness: 0.6 });
    otherPlayerCube = new THREE.Mesh(geometry, material);
    otherPlayerCube.position.set(0, 0, 0);
    scene.add(otherPlayerCube);
  }

  function updateOtherPlayer(position, rotation) {
    if (otherPlayerCube) {
      otherPlayerCube.position.set(position.x, position.y, position.z);
      otherPlayerCube.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  function removeOtherPlayerCube() {
    if (otherPlayerCube) {
      scene.remove(otherPlayerCube);
      otherPlayerCube = null;
    }
  }

  function updateStatus(message) {
    if (statusDiv) {
      statusDiv.textContent = message;
    }
  }

  async function initVoiceChat() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported. Please open via HTTP (http://localhost:8080), not file://');
      }
      
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('Microphone access granted');
      updateStatus('Microphone ready. Waiting for other player...');
      
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      updateStatus('❌ Error: ' + error.message);
      
      if (window.location.protocol === 'file:') {
        updateStatus('⚠️ Please open http://localhost:8080 (not file://)');
      }
    }
  }

  async function setupPeerConnection() {
    if (!localStream) {
      console.log('Waiting for local stream...');
      return;
    }

    peerConnection = new RTCPeerConnection(configuration);

    dataChannel = peerConnection.createDataChannel('gameData');
    
    dataChannel.onopen = () => {
      console.log('✅ P2P Data Channel opened - now using direct P2P for positions!');
      updateStatus('🎮 P2P Connected! Voice + Position via direct connection.');
    };

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'position') {
        updateOtherPlayer(data.position, data.rotation);
        updateProximityVolume(data.position);
      }
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      updateStatus('Data channel error - falling back to server relay');
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
      updateStatus('P2P connection lost - using server relay');
    };

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      console.log('Received remote audio track');
      
      // Audio element is muted because we route audio through Web Audio API's
      // GainNode for proximity-based volume control instead
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.muted = true;
      remoteAudio.play().catch(e => console.error('Error playing audio:', e));
      
      const source = audioContext.createMediaStreamSource(event.streams[0]);
      source.connect(gainNode);
      
      console.log('Audio routing: Remote stream → Gain Node → Output');
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      ws.send(JSON.stringify({
        type: 'offer',
        offer: offer
      }));
      console.log('Sent WebRTC offer');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async function handleOffer(offer) {
    if (!localStream) {
      console.log('Waiting for local stream before handling offer...');
      setTimeout(() => handleOffer(offer), 500);
      return;
    }

    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      
      dataChannel.onopen = () => {
        console.log('✅ P2P Data Channel opened - now using direct P2P for positions!');
        updateStatus('P2P Connected! Voice + Position via direct connection.');
      };

      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'position') {
          updateOtherPlayer(data.position, data.rotation);
          updateProximityVolume(data.position);
        }
      };

      dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
      };
    };

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      console.log('Received remote audio track');
      
      // Audio element is muted because we route audio through Web Audio API's
      // GainNode for proximity-based volume control instead
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.muted = true;
      remoteAudio.play().catch(e => console.error('Error playing audio:', e));
      
      const source = audioContext.createMediaStreamSource(event.streams[0]);
      source.connect(gainNode);
      
      console.log('Audio routing: Remote stream → Gain Node → Output');
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      ws.send(JSON.stringify({
        type: 'answer',
        answer: answer
      }));
      console.log('Sent WebRTC answer');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async function handleAnswer(answer) {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('WebRTC connection established');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async function handleIceCandidate(candidate) {
    try {
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  function updateProximityVolume(otherPosition) {
    if (!gainNode || !cube || !otherPosition) return;

    const distance = Math.sqrt(
      Math.pow(cube.position.x - otherPosition.x, 2) +
      Math.pow(cube.position.y - otherPosition.y, 2) +
      Math.pow(cube.position.z - otherPosition.z, 2)
    );

    let volume = 1.0;
    if (distance > 0.5) {
      volume = Math.max(0, 1 - (distance / MAX_VOICE_DISTANCE));
    }

    volume = Math.pow(volume, 2);
    
    console.log(`Distance: ${distance.toFixed(2)}, Volume: ${volume.toFixed(3)}`);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  }

  function closePeerConnection() {
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  }

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize, false);

  function animate() {
    requestAnimationFrame(animate);
    if (keyboard['ArrowRight']) cube.position.x += 0.3;
    if (keyboard['ArrowLeft'])  cube.position.x -= 0.3;
    if (keyboard['ArrowUp'])    cube.position.y += 0.3;
    if (keyboard['ArrowDown'])  cube.position.y -= 0.3;
    if (keyboard[' ']) {
      cube.position.set(0, 0, 0);
    }
    
    sendPosition(cube.position, cube.rotation);
    
    if (typeof info !== 'undefined' && info) {
      info.textContent = `pos: x=${cube.position.x.toFixed(2)} y=${cube.position.y.toFixed(2)} z=${cube.position.z.toFixed(2)}`;
    }
    renderer.render(scene, camera);
  }

  const info = document.createElement('div');
  info.className = 'info';
  info.textContent = `pos: x=${cube.position.x.toFixed(2)} y=${cube.position.y.toFixed(2)} z=${cube.position.z.toFixed(2)}`;
  info.style.color = '#fff';
  container.appendChild(info);

  const statusDiv = document.createElement('div');
  statusDiv.className = 'status';
  statusDiv.textContent = 'Connecting to server...';
  statusDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; color: #4aa3f0; font-size: 16px; font-family: monospace;';
  container.appendChild(statusDiv);

  initWebSocket();
  animate();
  
})();
