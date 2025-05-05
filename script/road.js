// road.js
import * as THREE from 'three';
import { scene } from './scene.js';

let roadSegments = [], segmentLength = 50, visibleSegments = 10;

export function generateInitialRoad() {
  for (let i = 0; i < visibleSegments; i++) {
    const segment = createRoadSegment(i * segmentLength);
    roadSegments.push(segment);
    scene.add(segment);
  }
}

function createRoadSegment(zPos) {
  const geometry = new THREE.BoxGeometry(10, 0.1, segmentLength);
  const material = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, zPos);
  return mesh;
}

export function updateRoad() {
  const frontSegment = roadSegments[roadSegments.length - 1];
  const carZ = window.car.position.z;

  if (carZ > frontSegment.position.z - segmentLength) {
    const newSegment = createRoadSegment(frontSegment.position.z + segmentLength);
    roadSegments.push(newSegment);
    scene.add(newSegment);
  }

  while (roadSegments.length > visibleSegments) {
    const oldSegment = roadSegments.shift();
    scene.remove(oldSegment);
  }
}
