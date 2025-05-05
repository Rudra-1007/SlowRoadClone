let scene, camera, renderer;
let car, carBody, wheels = [];
let keys = {}, lastZ = 0, totalDistance = 0, lastTime = performance.now();
let gameOver = false, autodrive = false;
const carBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

let roadSegments = [], segmentLength = 50, visibleSegments = 10;
let obstacles = [];
let highScore = localStorage.getItem('highScore') || 0;
document.getElementById('highScoreDisplay').textContent = `High Score: ${highScore} m`;

let currentSpeed = 0;
const maxSpeed = 50.3;
const boostedSpeed = 70;
const acceleration = 20;
const deceleration = 30;
let isBoosting = false;

document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("hud").style.display = "block";
  init();
});

document.getElementById("restartButton").addEventListener("click", () => {
  location.reload();
});

function init() {
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
  light.castShadow = true;
  scene.add(light);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  createCar();
  generateInitialRoad();

  animate();

  window.addEventListener('keydown', (e) => { 
    keys[e.key.toLowerCase()] = true; 
    if (e.key.toLowerCase() === 'e') isBoosting = true;
  });

  window.addEventListener('keyup', (e) => { 
    keys[e.key.toLowerCase()] = false; 
    if (e.key.toLowerCase() === 'e') isBoosting = false;
  });

  document.getElementById("autodriveBtn").addEventListener("click", () => {
    autodrive = !autodrive;
    document.getElementById("autodriveBtn").innerText = autodrive ? "Disable Autodrive" : "Enable Autodrive";
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setInterval(() => generateObstacle(), 3000);
  createCarFOV();  // Create the FOV cone
}

function createCar() {
  car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carBody.position.y = 0.25;
  car.add(carBody);

  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const positions = [
    [-1, 0.2, 0.6], [1, 0.2, 0.6],
    [-1, 0.2, -0.6], [1, 0.2, -0.6]
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

function createCarFOV() {
  const geometry = new THREE.ConeGeometry(2, 30, 32); // Cone (FOV) shape
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,  // Green for FOV
    opacity: 0.3,
    transparent: true
  });
  
  const fovCone = new THREE.Mesh(geometry, material);
  fovCone.rotation.x = Math.PI / 2; // Rotate to align with the car's forward direction
  fovCone.position.set(car.position.x, car.position.y, car.position.z + 5);
  
  scene.add(fovCone);
}

function generateInitialRoad() {
  for (let i = 0; i < visibleSegments; i++) {
    const segment = createRoadSegment(i * segmentLength);
    roadSegments.push(segment);
    scene.add(segment);
  }
}

function createRoadSegment(zPos) {
  const segmentGroup = new THREE.Group();
  segmentGroup.position.z = zPos;

  const roadGeometry = new THREE.BoxGeometry(10, 0.1, segmentLength);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
  roadMesh.position.set(0, 0, 0);
  segmentGroup.add(roadMesh);

  const lineLength = 2;
  const gap = 1.5;
  const numLines = Math.floor(segmentLength / (lineLength + gap));
  const lineGeometry = new THREE.BoxGeometry(0.2, 0.01, lineLength);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  for (let i = 0; i < numLines; i++) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0.06, -segmentLength / 2 + i * (lineLength + gap));
    segmentGroup.add(line);
  }

  return segmentGroup;
}

function updateCar() {
  if (gameOver) return;

  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;

  let targetSpeed = isBoosting ? boostedSpeed : maxSpeed;

  // Smooth acceleration/deceleration
  if (currentSpeed < targetSpeed) {
    currentSpeed += acceleration * deltaTime;
    currentSpeed = Math.min(currentSpeed, targetSpeed);
  } else if (currentSpeed > targetSpeed) {
    currentSpeed -= deceleration * deltaTime;
    currentSpeed = Math.max(currentSpeed, targetSpeed);
  }

  let moveDistance = (currentSpeed * 1000 / 3600) * deltaTime;

  // Manual controls
  let moveDirection = 0;
  if (!autodrive) {
    if (keys['w']) car.position.z += moveDistance;
    if (keys['s']) car.position.z -= moveDistance;
    if (keys['a']) car.position.x += 0.1;
    if (keys['d']) car.position.x -= 0.1;
  } else {
    // Autodrive movement with obstacle avoidance
    car.position.z += moveDistance;
    moveDirection = avoidObstacles();
    car.position.x += moveDirection;
  }

  // Check for collisions with obstacles
  for (let obstacle of obstacles) {
    carBox.setFromObject(car);
    obstacleBox.setFromObject(obstacle);

    if (carBox.intersectsBox(obstacleBox)) {
      checkGameOver();
      endGame();
      return;
    }
  }

  const deltaZ = car.position.z - lastZ;
  if (deltaZ >= 0) {
    totalDistance += deltaZ;
    lastZ = car.position.z;
  }

  lastTime = now;

  document.getElementById('speed').textContent = currentSpeed.toFixed(1);
  document.getElementById('distance').textContent = totalDistance.toFixed(1);

  updateObstacles();
  updateRoad();

  camera.position.set(car.position.x, car.position.y + 5, car.position.z - 10);
  camera.lookAt(car.position);
}

function avoidObstacles() {
  // Detect obstacles within the FOV and move around them
  const sensorBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(car.position.x, car.position.y, car.position.z + 5),
    new THREE.Vector3(2, 1, 10)
  );

  let obstacleAhead = false;
  let moveDirection = 0;

  for (let obstacle of obstacles) {
    obstacleBox.setFromObject(obstacle);
    if (sensorBox.intersectsBox(obstacleBox)) {
      obstacleAhead = true;
      break;
    }
  }

  if (obstacleAhead) {
    let leftClear = true;
    let rightClear = true;

    const leftSensor = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(car.position.x + 1, car.position.y, car.position.z + 5),
      new THREE.Vector3(1, 1, 10)
    );
    const rightSensor = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(car.position.x - 1, car.position.y, car.position.z + 5),
      new THREE.Vector3(1, 1, 10)
    );

    for (let obstacle of obstacles) {
      obstacleBox.setFromObject(obstacle);
      if (leftSensor.intersectsBox(obstacleBox)) leftClear = false;
      if (rightSensor.intersectsBox(obstacleBox)) rightClear = false;
    }

    if (leftClear && !rightClear) {
      moveDirection = 0.1;
    } else if (rightClear && !leftClear) {
      moveDirection = -0.1;
    } else if (leftClear && rightClear) {
      moveDirection = Math.random() > 0.5 ? 0.1 : -0.1;
    } else {
      moveDirection = 0;  // No escape route
    }
  }

  return moveDirection;
}

function updateObstacles() {
  // Logic for updating obstacle positions
}

function updateRoad() {
  // Logic for updating road segments
}

function checkGameOver() {
  // Check conditions for game over
}

function endGame() {
  // End game logic
}

function animate() {
  if (!gameOver) {
    updateCar();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}
