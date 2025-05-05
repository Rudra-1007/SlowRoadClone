// core.js
import { scene, camera, renderer, initThreeScene } from './scene.js';
import { createCar, updateCarPosition } from './car.js';
import { generateInitialRoad, updateRoad } from './road.js';
import { updateObstacles, generateObstacle } from './obstacles.js';
import { checkGameOver, isGameOver } from './gameover.js';

let lastTime = performance.now();

export function initScene() {
  initThreeScene();
  createCar();
  generateInitialRoad();
  setInterval(generateObstacle, 3000);
}

export function animateGame() {
  requestAnimationFrame(animateGame);

  if (!isGameOver()) {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    updateCarPosition(deltaTime);
    updateObstacles();
    updateRoad();
    checkGameOver();
    renderer.render(scene, camera);
  }
}
