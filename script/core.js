// core.js
import { createCar, car, updateCar } from './car.js';
import {buttons} from './buttons.js';
import { generateInitialRoad, updateRoad } from './road.js';
import { updateObstacles } from './obstacles.js';
import { checkGameOver } from './gameover.js';

export let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, -10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  createCar();
  generateInitialRoad();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function animateGame() {
  function animate() {
    requestAnimationFrame(animate);
    updateCar();
    updateRoad();
    updateObstacles();
    checkGameOver();
    camera.position.set(car.position.x, car.position.y + 5, car.position.z - 10);
    camera.lookAt(car.position);
    renderer.render(scene, camera);
  }
  animate();
}
