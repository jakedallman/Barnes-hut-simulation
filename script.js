import './MenuLogic.js';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { OrbitControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/OrbitControls.js';
const canvas = document.getElementById('simulation');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(20, canvas.clientWidth / canvas.clientHeight, 0.1, 500000);

// Camera moved far enough to see the current planet layout
camera.position.set(15000, 12000, 15000);
camera.lookAt(0, 0, 0);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 10));

const worker = new Worker('worker.js');
const maxBodyCount = 10000;
const frameBuffers = [
    new ArrayBuffer(maxBodyCount * 4 * Float32Array.BYTES_PER_ELEMENT),
    new ArrayBuffer(maxBodyCount * 4 * Float32Array.BYTES_PER_ELEMENT)
];

const confirmButton = document.getElementById('confirm-mode');
const randomMassesCheckbox = document.getElementById('random-masses');
const asteroidCountInput = document.getElementById('asteroid-count');
const iceBodiesCountInput = document.getElementById('icebody-count');

confirmButton?.addEventListener('click', () => {
    const selectedMode = document.querySelector('input[name="mode"]:checked')?.value;
    const asteroids = parseInt(asteroidCountInput?.value, 10) || 0;
    const iceBodies = parseInt(iceBodiesCountInput?.value, 10) || 0;
    const randomMasses = randomMassesCheckbox?.checked || false;
    const massMin = parseFloat(document.querySelector('#mass-min')?.value) || 1;
    const massMax = parseFloat(document.querySelector('#mass-max')?.value) || 100;
    const minX = parseInt(document.querySelector('#min-x')?.value) || -10000;
    const maxX = parseInt(document.querySelector('#max-x')?.value) || 10000;
    const minY = parseInt(document.querySelector('#min-y')?.value) || -10000;
    const maxY = parseInt(document.querySelector('#max-y')?.value) || 10000;
    const minZ = parseInt(document.querySelector('#min-z')?.value) || -10000;
    const maxZ = parseInt(document.querySelector('#max-z')?.value) || 10000;
    const minXvel = parseFloat(document.querySelector('#min-xvel')?.value) || -10;
    const maxXvel = parseFloat(document.querySelector('#max-xvel')?.value) || 10;
    const minYvel = parseFloat(document.querySelector('#min-yvel')?.value) || -10;
    const maxYvel = parseFloat(document.querySelector('#max-yvel')?.value) || 10;
    const minZvel = parseFloat(document.querySelector('#min-zvel')?.value) || -10;
    const maxZvel = parseFloat(document.querySelector('#max-zvel')?.value) || 10;
    const chaosMinimumMass = parseFloat(document.querySelector('#chaos-min-mass')?.value) || 1;
    const chaosMaximumMass = parseFloat(document.querySelector('#chaos-max-mass')?.value) || 100;
    const chaosNumberBodies = parseInt(document.querySelector('#chaos-number-bodies')?.value, 10) || 1000;
    worker.postMessage({
        type: 'configure',
        selectedMode,
        asteroids,
        iceBodies,
        randomMasses,
        massMin,
        massMax,
        Xmin: minX,
        XMax: maxX,
        Ymin: minY,
        YMax: maxY,
        Zmin: minZ,
        ZMax: maxZ,
        XvelMin: minXvel,
        XvelMax: maxXvel,
        YvelMin: minYvel,
        YvelMax: maxYvel,
        ZvelMin: minZvel,
        ZvelMax: maxZvel,
        chaosMinimumMass,
        chaosMaximumMass,
        chaosNumberBodies
    });
});

const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), 10000);
const dummy = new THREE.Object3D();
scene.add(mesh);
let index = 0;

const geometry = new THREE.BufferGeometry();

let count = 0;
let locations = new Float32Array(10000 * 3);
let bodyCount = 0;

geometry.setAttribute('position', new THREE.BufferAttribute(locations, 3));
const pointsMesh = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 100 }));
scene.add(pointsMesh);









/// Adds in basic controls

const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // Required for key support
controls.keys = {
  LEFT: 'ArrowLeft',
  UP: 'ArrowUp',
  RIGHT: 'ArrowRight', 
  BOTTOM: 'ArrowDown'
};

function processFrameData(buffer) {
    const receivedData = new Float32Array(buffer);
    count = 0;
    index = 0;

    for (let i = 0; i < bodyCount; i++) {
        const base = i * 4;
        const x = receivedData[base];
        const y = receivedData[base + 1];
        const z = receivedData[base + 2];
        const payload = receivedData[base + 3];

        if (payload < 0) {
            locations[count * 3] = x;
            locations[count * 3 + 1] = y;
            locations[count * 3 + 2] = z;
            count++;
        } else {
            dummy.position.set(x, y, z);
            dummy.scale.set(payload, payload, payload);
            dummy.updateMatrix();
            mesh.setMatrixAt(index, dummy.matrix);
            index++;
        }
    }

    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true;
}

worker.onmessage = function(event) {
    const { type, buffer, bodyCount: receivedBodyCount } = event.data;
    if (type !== 'frame') return;

    bodyCount = receivedBodyCount;
    processFrameData(buffer);
    worker.postMessage({ type: 'returnBuffer', buffer }, [buffer]);
};

worker.postMessage({ type: 'start', buffers: frameBuffers }, frameBuffers);



///main loop
function animate() {
    requestAnimationFrame(animate);

    mesh.instanceMatrix.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);

    


}

animate();

window.addEventListener('resize', () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
});