// car.js
import * as THREE from 'three';
import { scene, camera } from './scene.js';
import { updateHUD } from './hud.js';
import { isBoosting, getSpeed } from './boost.js';
import { obstacles } from './obstacles.js';

export let car, carBody, wheels = [];
let lastZ = 0;
export let totalDistance = 0;

export function createCar() {
  car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carBody.position.y = 0.25;
  car.add(carBody);

  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const positions = [
    [-0.8, 0.15, 0.45], [0.8, 0.15, 0.45],
    [-0.8, 0.15, -0.45], [0.8, 0.15, -0.45]
  ];

  positions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(...pos);
    wheel.rotation.x = Math.PI / 2;
    car.add(wheel);
    wheels.push(wheel);
  });

  car.rotation.y = Math.PI / 2;
  scene.add(car);
}

export function updateCarPosition(deltaTime) {
  const moveStep = 0.1;

  if (window.gameOver) return;

  if (window.keys['a']) car.position.x += moveStep;
  if (window.keys['d']) car.position.x -= moveStep;
  if (window.keys['w']) car.position.z += moveStep;
  if (window.keys['s']) car.position.z -= moveStep;

  if (window.autodrive) {
    car.position.z += moveStep;
    for (let obstacle of obstacles) {
      const dx = car.position.x - obstacle.position.x;
      const dz = car.position.z - obstacle.position.z;
      if (Math.abs(dx) < 1 && Math.abs(dz) < 1) {
        window.endGame();
        return;
      }
      const distanceToObstacle = car.position.z - obstacle.position.z;
      if (distanceToObstacle < 10 && distanceToObstacle > 0) {
        if (Math.abs(car.position.x - obstacle.position.x) < 1.5) {
          car.position.x = car.position.x < obstacle.position.x ? car.position.x - moveStep : car.position.x + moveStep;
        }
      }
    }
  }

  const deltaZ = car.position.z - lastZ;
  if (deltaZ >= 0) {
    totalDistance += deltaZ;
    lastZ = car.position.z;
  }

  const speed = getSpeed(deltaZ, deltaTime);
  updateHUD(speed, totalDistance);

  camera.position.set(car.position.x, car.position.y + 5, car.position.z - 10);
  camera.lookAt(car.position);
}
