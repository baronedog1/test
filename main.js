import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000); // Increased far clipping plane
camera.position.z = 200; // Adjusted camera position

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enabled antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Added damping for smoother controls

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0); // Sun light
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Sun
const sunRadius = 69.57; // Scaled down by 10000 from actual km
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64); // Increased segments for smoother sphere
const sunTexture = textureLoader.load('https://i.imgur.com/BdC9ySg.jpeg'); // Example sun texture
const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: 0xffff00, // Make sun emissive
    emissiveMap: sunTexture,
    emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets data (name, actual radius (km), actual orbital radius (10^6 km), texture, color for fallback)
// Scaled down: radius by 10000, orbital radius by 100
const planetsData = [
    { name: "Mercury", radius: 0.2439, orbitalRadius: 57.9, textureUrl: 'https://i.imgur.com/gJt0fkf.jpeg', color: 0xff0000, orbitalSpeedFactor: 1.607 },
    { name: "Venus", radius: 0.6051, orbitalRadius: 108.2, textureUrl: 'https://i.imgur.com/NqHa3rq.jpeg', color: 0x00ff00, orbitalSpeedFactor: 1.174 },
    { name: "Earth", radius: 0.6371, orbitalRadius: 149.6, textureUrl: 'https://i.imgur.com/Jc9Vp7I.jpeg', color: 0x0000ff, orbitalSpeedFactor: 1.0 },
    { name: "Mars", radius: 0.3389, orbitalRadius: 227.9, textureUrl: 'https://i.imgur.com/g0K27aD.jpeg', color: 0xffa500, orbitalSpeedFactor: 0.802 },
    { name: "Jupiter", radius: 6.9911, orbitalRadius: 778.6, textureUrl: 'https://i.imgur.com/60K9Wk2.jpeg', color: 0xffd700, orbitalSpeedFactor: 0.434 },
    { name: "Saturn", radius: 5.8232, orbitalRadius: 1433.5, textureUrl: 'https://i.imgur.com/I0X8Y7G.jpeg', color: 0x808080, orbitalSpeedFactor: 0.323 },
    { name: "Uranus", radius: 2.5362, orbitalRadius: 2872.5, textureUrl: 'https://i.imgur.com/sOfz9aF.jpeg', color: 0x00ffff, orbitalSpeedFactor: 0.228 },
    { name: "Neptune", radius: 2.4622, orbitalRadius: 4495.1, textureUrl: 'https://i.imgur.com/2DRuY2J.jpeg', color: 0x000080, orbitalSpeedFactor: 0.182 },
];


const planets = [];
const orbitalPaths = new THREE.Group(); // Group to hold orbital paths
scene.add(orbitalPaths);

planetsData.forEach(planetData => {
    const planetGeometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
    const planetTexture = textureLoader.load(planetData.textureUrl);
    const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture, roughness: 0.8, metalness: 0.2 });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.x = planetData.orbitalRadius; // Initial position on orbit

    // Create orbital path
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absellipse(0, 0, planetData.orbitalRadius, planetData.orbitalRadius, 0, Math.PI * 2, false, 0).getSpacedPoints(128)
    );
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2; // Rotate to align with XZ plane
    orbitalPaths.add(orbit);


    planets.push({ mesh: planet, data: planetData, angle: Math.random() * Math.PI * 2 }); // Random initial angle
    scene.add(planet);
});

// Starfield
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: true
});
const starVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 5000; // Increased range for starfield
    const y = (Math.random() - 0.5) * 5000;
    const z = (Math.random() - 0.5) * 5000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starfield = new THREE.Points(starGeometry, starMaterial);
scene.add(starfield);


// Animation loop
let animationPaused = false;
const pauseButton = document.getElementById('pause');
const resumeButton = document.getElementById('resume');

pauseButton.addEventListener('click', () => {
    animationPaused = true;
});

resumeButton.addEventListener('click', () => {
    animationPaused = false;
});

const clock = new THREE.Clock(); // For time-based animation speed

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    if (!animationPaused) {
        planets.forEach(planetObj => {
            // Simplified orbital speed based on factor (could be derived from Kepler's laws for more accuracy)
            // Base speed adjusted for visibility
            planetObj.angle += (0.1 * planetObj.data.orbitalSpeedFactor) * deltaTime;
            planetObj.mesh.position.x = planetObj.data.orbitalRadius * Math.cos(planetObj.angle);
            planetObj.mesh.position.z = planetObj.data.orbitalRadius * Math.sin(planetObj.angle);
        });
    }

    controls.update(); // Required if enableDamping or autoRotate are set to true
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
