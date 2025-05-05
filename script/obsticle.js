// obstacles.js
import { scene } from './core.js';

let obstacles = [];

export function generateObstacle(carZ) {
  const size = Math.random() * 1.5 + 0.5;
  const obstacleGeometry = new THREE.BoxGeometry(size, 1, size);
  const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  obstacle.position.set(Math.random() * 4 - 2, size / 2, carZ + 50);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

export function updateObstacles(car) {
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    if (obstacle.position.z + 2 < car.position.z) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
      i--;
    }
  }
}
