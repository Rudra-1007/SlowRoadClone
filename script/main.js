// main.js
import * as THREE from 'three';
import { scene, camera, renderer, setupCore } from './core.js';
import { createCar } from './car.js';
import { generateInitialRoad } from './road.js';
import { generateObstacle } from './obstacles.js';
import { setupControls } from './controls.js';
import { initHUD } from './hud.js';
import { updateCar, setBoosting, getGameOver } from './updateCar.js';

let car, wheels = [], obstacles = [];

// UI event handlers
function setupUI() {
  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("hud").style.display = "block";
    init();
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    location.reload();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e') setBoosting(true);
  });

  window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'e') setBoosting(false);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function init() {
  setupCore();
  setupControls();
  initHUD();
  car = createCar();
  generateInitialRoad();

  setInterval(() => generateObstacle(car.position.z), 3000);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (!getGameOver()) {
    updateCar(car, obstacles);
    camera.position.set(car.position.x, car.position.y + 5, car.position.z - 10);
    camera.lookAt(car.position);
    renderer.render(scene, camera);
  }
}

setupUI();
