import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let animationPaused = false;
const planets = [];

// Adjusted Solar System Data (example tweaks)
const solarSystemData = [
    { name: 'Sun', radius: 5, color: 0xffff00, orbitalRadius: 0, type: 'star' },
    { name: 'Mercury', radius: 0.38, color: 0x888888, orbitalRadius: 10, orbitalSpeed: 0.047 },
    { name: 'Venus', radius: 0.95, color: 0xffe4b5, orbitalRadius: 14, orbitalSpeed: 0.035 },
    { name: 'Earth', radius: 1, color: 0x4da6ff, orbitalRadius: 19, orbitalSpeed: 0.029 }, // Brighter blue
    { name: 'Mars', radius: 0.53, color: 0xff5733, orbitalRadius: 25, orbitalSpeed: 0.024 }, // More vibrant red
    { name: 'Jupiter', radius: 3.5, color: 0xffc87f, orbitalRadius: 38, orbitalSpeed: 0.013 }, // Adjusted size
    { name: 'Saturn', radius: 3, color: 0xf0e68c, orbitalRadius: 50, orbitalSpeed: 0.009, hasRings: true },
    { name: 'Uranus', radius: 1.8, color: 0xadd8e6, orbitalRadius: 62, orbitalSpeed: 0.006 },
    { name: 'Neptune', radius: 1.7, color: 0x3366ff, orbitalRadius: 75, orbitalSpeed: 0.005 } // Darker blue
];

function createCelestialBodies() {
    solarSystemData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        let material;
        if (data.type === 'star') {
            material = new THREE.MeshBasicMaterial({ color: data.color });
        } else {
            material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8, metalness: 0.1 });
        }
        const mesh = new THREE.Mesh(geometry, material);

        if (data.type === 'star') {
            scene.add(mesh);
        } else {
            mesh.position.x = data.orbitalRadius; // Initial position
            scene.add(mesh);
            const planetData = {
                mesh,
                name: data.name,
                orbitalRadius: data.orbitalRadius,
                orbitalSpeed: data.orbitalSpeed,
                angle: Math.random() * Math.PI * 2 // Random initial angle
            };
            planets.push(planetData);

            // Add rings for Saturn
            if (data.hasRings) {
                const ringGeometry = new THREE.RingGeometry(data.radius * 1.2, data.radius * 2.2, 64);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xaaa899, // Saturn ring color
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                });
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2; // Rotate to be horizontal
                // Rings will be parented to Saturn's mesh
                mesh.add(ringMesh); // Add ring as a child of Saturn's mesh
            }
        }
    });
}

function createOrbitLines() {
    planets.forEach(planetData => {
        if (planetData.orbitalRadius > 0) { // Don't draw orbit line for the sun or static objects
            const points = [];
            const segments = 128; // Number of segments for the circle
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(theta) * planetData.orbitalRadius, 0, Math.sin(theta) * planetData.orbitalRadius));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5 }); // Dim white/grey
            const line = new THREE.LineLoop(geometry, material);
            scene.add(line);
        }
    });
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000); // Adjusted FOV and far plane
    camera.position.set(0, 60, 120); // Higher and further initial camera position
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows if desired later
    document.getElementById('scene-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Slightly less ambient
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.8, 1000); // Sun's light
    pointLight.position.set(0, 0, 0);
    // pointLight.castShadow = true; // Enable if performance allows and objects are set to receive/cast shadows
    scene.add(pointLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 800; // Increased max distance

    createCelestialBodies();
    createOrbitLines(); // Call the new function

    document.getElementById('pause-button').addEventListener('click', () => animationPaused = true);
    document.getElementById('play-button').addEventListener('click', () => {
        animationPaused = false;
        // Potentially reset time factor here if using a strict time-based animation that could "jump"
    });
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!animationPaused) {
        // Using a less aggressive time factor, speeds are now in solarSystemData
        const deltaTime = 0.05; // Simplified delta time, consider using THREE.Clock for more accuracy

        planets.forEach(planet => {
            planet.angle += planet.orbitalSpeed * deltaTime;

            const x = planet.orbitalRadius * Math.cos(planet.angle);
            const z = planet.orbitalRadius * Math.sin(planet.angle);
            planet.mesh.position.set(x, 0, z);

            // Rotate planets themselves (optional, subtle effect)
            planet.mesh.rotation.y += 0.005;
        });
    }

    controls.update();
    renderer.render(scene, camera);
}

init();
