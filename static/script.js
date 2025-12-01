// --- THREE.JS ARC REACTOR SETUP ---
let scene, camera, renderer;
let reactorGroup; // Group to hold all reactor parts
let coreSphere, innerRing, outerRing, particles;
let isSpeaking = false;
let isListening = false;
let mouseX = 0, mouseY = 0;

// DOM Elements
const micButton = document.getElementById('mic-button');
const chatArea = document.getElementById('chat-area');

function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- REACTOR GEOMETRY ---
    reactorGroup = new THREE.Group();
    scene.add(reactorGroup);

    // 1. Core Energy Sphere
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x00a8ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    coreSphere = new THREE.Mesh(coreGeo, coreMat);
    reactorGroup.add(coreSphere);

    // 2. Inner Spinning Ring (Torus Knot)
    const innerGeo = new THREE.TorusKnotGeometry(1.2, 0.1, 100, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, opacity: 0.3, transparent: true });
    innerRing = new THREE.Mesh(innerGeo, innerMat);
    reactorGroup.add(innerRing);

    // 3. Outer Mechanical Ring
    const outerGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 100);
    const outerMat = new THREE.MeshBasicMaterial({ color: 0x00a8ff, transparent: true, opacity: 0.5 });
    outerRing = new THREE.Mesh(outerGeo, outerMat);
    outerRing.rotation.x = Math.PI / 2;
    reactorGroup.add(outerRing);

    // 4. Energy Particles (Flowing Inwards)
    const partGeo = new THREE.BufferGeometry();
    const partCount = 800;
    const pos = new Float32Array(partCount * 3);
    // Store initial positions for animation reset
    for (let i = 0; i < partCount * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 10;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x00a8ff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    particles = new THREE.Points(partGeo, partMat);
    reactorGroup.add(particles);

    // Lights
    const pointLight = new THREE.PointLight(0x00a8ff, 2, 20);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Mouse Interaction
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
    });

    animate();
}

let time = 0;

function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    if (reactorGroup) {
        // Parallax Effect (Look at mouse)
        reactorGroup.rotation.y += (mouseX - reactorGroup.rotation.y) * 0.05;
        reactorGroup.rotation.x += (mouseY - reactorGroup.rotation.x) * 0.05;

        // Core Rotation
        coreSphere.rotation.y -= 0.02;
        coreSphere.rotation.z -= 0.01;

        // Inner Ring Complex Rotation
        innerRing.rotation.x += 0.01;
        innerRing.rotation.y += 0.015;

        // Outer Ring Wobble
        outerRing.rotation.x = (Math.PI / 2) + Math.sin(time) * 0.1;
        outerRing.rotation.y += 0.005;

        // Particle Flow Animation
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Move towards center (0,0,0)
            positions[i] *= 0.99; // X
            positions[i + 1] *= 0.99; // Y
            positions[i + 2] *= 0.99; // Z

            // Reset if too close
            if (Math.abs(positions[i]) < 0.1) {
                positions[i] = (Math.random() - 0.5) * 10;
                positions[i + 1] = (Math.random() - 0.5) * 10;
                positions[i + 2] = (Math.random() - 0.5) * 10;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // State Reactivity
        if (isListening) {
            // Red Alert / Active Mode
            coreSphere.material.color.setHex(0xff4757);
            innerRing.material.color.setHex(0xff4757);
            coreSphere.scale.setScalar(1.2 + Math.sin(time * 10) * 0.1);
            innerRing.rotation.y += 0.05; // Spin faster
        } else if (isSpeaking) {
            // Blue Pulse Mode
            coreSphere.material.color.setHex(0x00f3ff);
            innerRing.material.color.setHex(0x00f3ff);
            coreSphere.scale.setScalar(1.0 + Math.sin(time * 20) * 0.2); // Voice vibration
        } else {
            // Idle Blue
            coreSphere.material.color.setHex(0x00a8ff);
            innerRing.material.color.setHex(0x00f3ff);
            coreSphere.scale.setScalar(1);
        }
    }

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Initialize 3D Scene
document.addEventListener('DOMContentLoaded', init3D);


// --- VOICE LOGIC ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
}

const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

if (micButton) {
    micButton.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition start error:", e);
            }
        }
    });
}

recognition.onstart = () => {
    isListening = true;
    if (micButton) micButton.classList.add('active');
};

recognition.onend = () => {
    isListening = false;
    if (micButton) micButton.classList.remove('active');
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage(transcript, 'user');
    sendToBackend(transcript);
};

recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    isListening = false;
    if (micButton) micButton.classList.remove('active');
};

function addMessage(text, sender) {
    if (!chatArea) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendToBackend(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.response;

        addMessage(aiResponse, 'ai');
        speak(aiResponse);

    } catch (error) {
        console.error('Error:', error);
        addMessage("Server unreachable.", 'ai');
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        let voices = window.speechSynthesis.getVoices();
        const setVoice = () => {
            voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice =>
            (voice.name.includes('Google US English') ||
                voice.name.includes('Microsoft Zira') ||
                voice.name.includes('Samantha'))
            );
            if (preferredVoice) utterance.voice = preferredVoice;
        };

        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoice;
        } else {
            setVoice();
        }

        utterance.onstart = () => {
            isSpeaking = true;
        };

        utterance.onend = () => {
            isSpeaking = false;
        };

        utterance.onerror = (e) => {
            isSpeaking = false;
        };

        window.speechSynthesis.speak(utterance);
    }
}
