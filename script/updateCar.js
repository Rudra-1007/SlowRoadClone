// updateCar.js
import { keys, autodrive } from './controls.js';
import { updateRoad } from './road.js';
import { updateObstacles } from './obstacles.js';
import { updateHUD } from './hud.js';
import { checkGameOver } from './gameover.js';

let lastZ = 0, totalDistance = 0, lastTime = performance.now();
let baseSpeed = 30.5;
let boostedSpeed = 70;
let isBoosting = false;
let gameOver = false;

export function setBoosting(state) {
  isBoosting = state;
}

export function getGameOver() {
  return gameOver;
}

export function updateCar(car, obstacles) {
  if (gameOver) return;

  if (keys['a']) car.position.x += 0.1;
  if (keys['d']) car.position.x -= 0.1;
  if (keys['w']) car.position.z += 0.1;
  if (keys['s']) car.position.z -= 0.1;

  if (autodrive) {
    car.position.z += 0.1;
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const dx = car.position.x - obstacle.position.x;
      const dz = car.position.z - obstacle.position.z;

      if (Math.abs(dx) < 1 && Math.abs(dz) < 1) {
        gameOver = true;
        return;
      }

      const distanceToObstacle = car.position.z - obstacle.position.z;
      if (distanceToObstacle < 10 && distanceToObstacle > 0) {
        if (Math.abs(car.position.x - obstacle.position.x) < 1.5) {
          car.position.x = car.position.x < obstacle.position.x ? car.position.x - 0.1 : car.position.x + 0.1;
        }
      }
    }
  }

  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  const deltaZ = car.position.z - lastZ;

  if (deltaZ >= 0) {
    totalDistance += deltaZ;
    lastZ = car.position.z;
  }

  lastTime = now;
  let currentSpeed = isBoosting ? boostedSpeed : baseSpeed;
  const speed = ((deltaZ / deltaTime) * 3.6) + currentSpeed;

  updateHUD(Math.max(speed, baseSpeed), totalDistance);
  updateObstacles(car);
  updateRoad();

  gameOver = checkGameOver(car, totalDistance);

  return speed;
}
