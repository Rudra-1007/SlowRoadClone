let scene, camera, renderer;
let car, carBody, wheels = [];
let keys = {}, lastZ = 0, totalDistance = 0, lastTime = performance.now();
let gameOver = false;
let isNight = false;
let headlights = [];
let taillights = [];
let starsGroup = new THREE.Group();
const gravity = -9.8;
let velocityY = 0;
let isFalling = false;
let roadSegments = [], segmentLength = 50, visibleSegments = 10;
let obstacles = [];
let highScore = localStorage.getItem('highScore') || 0;
let currentSpeed = 0;
const maxSpeed = 50.3;
const boostedSpeed = 250;
const acceleration = 10.2;
const deceleration = 30;
let isBoosting = false;
const trackWidth = 5.5;
const terrainTileSize = 200;
const terrainGridCount = 3;
const halfGridCount = Math.floor(terrainGridCount / 2);
let terrainTiles = [];
const carBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();
let steeringAngle = 0;
const maxSteeringAngle = Math.PI / 6; // ~30 degrees
const steeringSpeed = 0.04; // How fast steering changes


// Define players with autodrive property
let players = [
  { id: 'You', distance: 0, elementId: 'distance', car: null, autodrive: false, lastZ: 0, speed: 0 },
  { id: 'Player 2', distance: 0, elementId: 'distance2', car: null, autodrive: true, lastZ: 0, speed: 0 }
];

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
  createStars();
  scene.add(starsGroup);
  starsGroup.visible = false;

  scene.background = new THREE.Color(0x87ceeb);

  document.getElementById("nightToggle").addEventListener("click", toggleNightMode);

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
  initializePlayers();
  createTerrain();
  generateInitialRoad();
  animate();

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (key === 'e') isBoosting = true;
    if (key === 'f') {
      players[0].autodrive = !players[0].autodrive;
      document.getElementById("autodriveBtn").innerText = players[0].autodrive ? "Disable Autodrive [F]" : "Enable Autodrive [F]";
    }
    if (key === 'n') toggleNightMode();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key.toLowerCase() === 'e') isBoosting = false;
  });

  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'ArrowUp') keys['arrowup'] = true;
    if (e.key === 'ArrowDown') keys['arrowdown'] = true;
    if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
    if (e.key === 'ArrowRight') keys['arrowright'] = true;
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'ArrowUp') keys['arrowup'] = false;
    if (e.key === 'ArrowDown') keys['arrowdown'] = false;
    if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
    if (e.key === 'ArrowRight') keys['arrowright'] = false;
  });

  document.getElementById("autodriveBtn").addEventListener("click", () => {
    players[0].autodrive = !players[0].autodrive;
    document.getElementById("autodriveBtn").innerText = players[0].autodrive ? "Disable Autodrive [F]" : "Enable Autodrive [F]";
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let touchInput = {
    forward: false,
    left: false,
    backward: false,
    right: false,
    boost: false
  };

  document.getElementById('forwardBtn').addEventListener('touchstart', () => touchInput.forward = true);
  document.getElementById('forwardBtn').addEventListener('touchend', () => touchInput.forward = false);
  document.getElementById('leftBtn').addEventListener('touchstart', () => touchInput.left = true);
  document.getElementById('leftBtn').addEventListener('touchend', () => touchInput.left = false);
  document.getElementById('rightBtn').addEventListener('touchstart', () => touchInput.right = true);
  document.getElementById('rightBtn').addEventListener('touchend', () => touchInput.right = false);
  document.getElementById('boostBtn').addEventListener('touchstart', () => isBoosting = true);
  document.getElementById('boostBtn').addEventListener('touchend', () => isBoosting = false);
  document.getElementById('backwardBtn').addEventListener('touchstart', () => touchInput.backward = true);
  document.getElementById('backwardBtn').addEventListener('touchend', () => touchInput.backward = false);
  document.getElementById('autoBtn').addEventListener('touchstart', () => {
    players[0].autodrive = !players[0].autodrive;
    document.getElementById("autodriveBtn").innerText = players[0].autodrive ? "Disable Autodrive [F]" : "Enable Autodrive [F]";
  });

  setInterval(() => generateObstacle(), 3000);
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

  const headlight1 = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 6, 0.5);
  headlight1.position.set(0.5, 0.4, 0.75);
  headlight1.target.position.set(0.5, 0.4, 5);
  car.add(headlight1);
  car.add(headlight1.target);
  headlights.push(headlight1);

  const headlight2 = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 6, 0.5);
  headlight2.position.set(-0.5, 0.4, 0.75);
  headlight2.target.position.set(-0.5, 0.4, 5);
  car.add(headlight2);
  car.add(headlight2.target);
  headlights.push(headlight2);

  const taillight1 = new THREE.SpotLight(0xff0000, 1, 10, Math.PI / 6, 0.5);
  taillight1.position.set(1, 0.4, -1);
  taillight1.target.position.set(1, 0.7, -1);
  car.add(taillight1);
  car.add(taillight1.target);
  taillights.push(taillight1);

  const taillight2 = new THREE.SpotLight(0xff0000, 1, 10, Math.PI / 6, 0.5);
  taillight2.position.set(-1, 0.4, -1);
  taillight2.target.position.set(-1, 0.7, -1);
  car.add(taillight2);
  car.add(taillight2.target);
  taillights.push(taillight2);

  car.rotation.y = Math.PI / 2;
  scene.add(car);
}

function createCarForPlayer(playerId, x, y, z) {
  const playerCar = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: playerId === 'You' ? 0xff0000 : 0x0000ff });
  const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
  const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carBody.position.y = 0.25;
  playerCar.add(carBody);

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
    playerCar.add(wheel);
  });

  playerCar.rotation.y = Math.PI / 2;
  playerCar.position.set(x, y, z);
  return playerCar;
}

function initializePlayers() {
  players.forEach(player => {
    if (player.id === 'You') {
      player.car = car;
      player.distance = totalDistance;
    } else {
      player.car = createCarForPlayer(player.id, Math.random() * 8 - 4, 0, car.position.z);
      player.car.position.x += 2;
      scene.add(player.car);
    }
  });
}

function createStars() {
  const starGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 300; i++) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(
      Math.random() * 200 - 100,
      Math.random() * 50 + 10,
      Math.random() * 300 - 100
    );
    starsGroup.add(star);
  }
}

function toggleNightMode() {
  isNight = !isNight;
  scene.background = new THREE.Color(isNight ? 0x0a0a3a : 0x87ceeb);
  headlights.forEach(light => light.visible = isNight);
  taillights.forEach(light => light.visible = isNight);
  starsGroup.visible = isNight;
  const btn = document.getElementById("nightToggle");
  if (btn) {
    btn.textContent = isNight ? "☀️ Day Mode [N]" : "🌙 Night Mode [N]";
    btn.style.color = isNight ? "white" : "black";
    btn.style.backgroundColor = isNight ? "#222" : "#eee";
    document.querySelectorAll("#hud button").forEach(btn => {
      btn.style.color = isNight ? "white" : "black";
      btn.style.backgroundColor = isNight ? "transparent" : "transparent";
    });
  }
}

function createTerrainTile(gridX, gridZ) {
  const geometry = new THREE.PlaneGeometry(terrainTileSize, terrainTileSize, 32, 32);
  geometry.rotateX(-Math.PI / 2);
  const positionAttribute = geometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const yOffset = (Math.random() - 0.5) * 0.3;
    positionAttribute.setY(i, yOffset);
  }
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.position.set(gridX * terrainTileSize, -0.1, gridZ * terrainTileSize);
  scene.add(mesh);
  return { mesh, gridX, gridZ };
}

function initTerrainTiles() {
  terrainTiles = [];
  for (let x = -halfGridCount; x <= halfGridCount; x++) {
    for (let z = -halfGridCount; z <= halfGridCount; z++) {
      terrainTiles.push(createTerrainTile(x, z));
    }
  }
}

function updateTerrainTiles() {
  if (!car) return;
  const carGridX = Math.floor(car.position.x / terrainTileSize);
  const carGridZ = Math.floor(car.position.z / terrainTileSize);
  terrainTiles.forEach(tile => {
    let dx = tile.gridX - carGridX;
    let dz = tile.gridZ - carGridZ;
    if (dx > halfGridCount) {
      tile.gridX -= terrainGridCount;
      tile.mesh.position.x = tile.gridX * terrainTileSize;
    } else if (dx < -halfGridCount) {
      tile.gridX += terrainGridCount;
      tile.mesh.position.x = tile.gridX * terrainTileSize;
    }
    if (dz > halfGridCount) {
      tile.gridZ -= terrainGridCount;
      tile.mesh.position.z = tile.gridZ * terrainTileSize;
    } else if (dz < -halfGridCount) {
      tile.gridZ += terrainGridCount;
      tile.mesh.position.z = tile.gridZ * terrainTileSize;
    }
  });
}

function createTerrain() {
  initTerrainTiles();
}

function createRoadSegment(zPos) {
  const segmentGroup = new THREE.Group();
  segmentGroup.position.z = zPos;
  const roadGeometry = new THREE.BoxGeometry(10, 0.1, segmentLength);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
  roadMesh.position.set(0, 0.1, 0);
  segmentGroup.add(roadMesh);
  const lineLength = 2;
  const gap = 1.5;
  const numLines = Math.floor(segmentLength / (lineLength + gap));
  const lineGeometry = new THREE.BoxGeometry(0.2, 0.01, lineLength);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (let i = 0; i < numLines; i++) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0.2, -segmentLength / 2 + i * (lineLength + gap));
    segmentGroup.add(line);
  }
  return segmentGroup;
}

function generateInitialRoad() {
  for (let i = 0; i < visibleSegments; i++) {
    const segment = createRoadSegment(i * segmentLength);
    roadSegments.push(segment);
    scene.add(segment);
  }
}

function updateRoad() {
  const frontSegment = roadSegments[roadSegments.length - 1];
  if (!frontSegment) return;
  if (car.position.z > frontSegment.position.z - segmentLength) {
    const newSegment = createRoadSegment(frontSegment.position.z + segmentLength);
    roadSegments.push(newSegment);
    scene.add(newSegment);
  }
  while (roadSegments.length > visibleSegments) {
    const oldSegment = roadSegments.shift();
    scene.remove(oldSegment);
  }
}

function generateObstacle() {
  const dummyCar = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 1.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.position.y = 0.4;
  dummyCar.add(bodyMesh);
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wheelPositions = [
    [-0.9, 0.2, 0.5], [0.9, 0.2, 0.5],
    [-0.9, 0.2, -0.5], [0.9, 0.2, -0.5]
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(...pos);
    dummyCar.add(wheel);
  });
  dummyCar.rotation.y = Math.PI / 2;
  dummyCar.position.set(Math.random() * 8 - 4, 0, car.position.z + 80);
  dummyCar.castShadow = true;
  dummyCar.receiveShadow = true;
  dummyCar.userData.velocityZ = -(currentSpeed > 0 ? currentSpeed * 1000 / 3600 : 20) * 1.5;
  dummyCar.userData.velocityX = (Math.random() - 0.5) * 0.1;
  obstacles.push(dummyCar);
  scene.add(dummyCar);
}

function updateObstacles(deltaTime) {
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    let newX = obstacle.position.x + obstacle.userData.velocityX;
    let newZ = obstacle.position.z + obstacle.userData.velocityZ * deltaTime;
    if (newX < -trackWidth) {
      newX = -trackWidth;
      obstacle.userData.velocityX *= -1;
    } else if (newX > trackWidth) {
      newX = trackWidth;
      obstacle.userData.velocityX *= -1;
    }
    obstacle.position.set(newX, obstacle.position.y, newZ);
    if (obstacle.position.z + 2 < car.position.z) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
      i--;
    }
  }
}

function updateCar() {
  if (gameOver) return;
  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  console.log('DeltaTime:', deltaTime); // Debug

  players.forEach(player => {
    let moveDistance, targetSpeed;
    if (player.id === 'You') {
      targetSpeed = isBoosting ? boostedSpeed : maxSpeed;
      if (player.speed < targetSpeed) {
        player.speed += acceleration * deltaTime;
        player.speed = Math.min(player.speed, targetSpeed);
      } else if (player.speed > targetSpeed) {
        player.speed -= deceleration * deltaTime;
        player.speed = Math.max(player.speed, targetSpeed);
      }
      moveDistance = (player.speed * 1000 / 3600) * deltaTime;
      console.log(`${player.id} Speed: ${player.speed}, MoveDistance: ${moveDistance}`); // Debug
    } else {
      targetSpeed = maxSpeed * 0.8;
      if (player.speed < targetSpeed) {
        player.speed += acceleration * deltaTime;
        player.speed = Math.min(player.speed, targetSpeed);
      }
      moveDistance = (player.speed * 1000 / 3600) * deltaTime;
    }

    let moveDirection = 0;
    if (player.autodrive) {
      const sensorBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(player.car.position.x, player.car.position.y, player.car.position.z + 5),
        new THREE.Vector3(2, 1, 10)
      );
      let obstacleAhead = false;
      for (let obstacle of obstacles) {
        obstacleBox.setFromObject(obstacle);
        if (sensorBox.intersectsBox(obstacleBox)) {
          obstacleAhead = true;
          break;
        }
      }
      if (obstacleAhead) {
        let leftClear = true, rightClear = true;
        const leftSensor = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(player.car.position.x + 1, player.car.position.y, player.car.position.z + 5),
          new THREE.Vector3(1, 1, 10)
        );
        const rightSensor = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(player.car.position.x - 1, player.car.position.y, player.car.position.z + 5),
          new THREE.Vector3(1, 1, 10)
        );
        for (let obstacle of obstacles) {
          obstacleBox.setFromObject(obstacle);
          if (leftSensor.intersectsBox(obstacleBox)) leftClear = false;
          if (rightSensor.intersectsBox(obstacleBox)) rightClear = false;
        }
        if (leftClear && !rightClear) moveDirection = 0.1;
        else if (rightClear && !leftClear) moveDirection = -0.1;
        else if (leftClear && rightClear) moveDirection = Math.random() > 0.5 ? 0.1 : -0.1;
        else moveDirection = 0;
      }
    }

    if (player.id === 'You' && !player.autodrive) {
      if (keys['w'] || keys['arrowup'] || touchInput.forward) player.car.position.z += moveDistance;
      if (keys['s'] || keys['arrowdown'] || touchInput.backward) player.car.position.z -= moveDistance;
      if (keys['a'] || keys['arrowleft'] || touchInput.left) player.car.position.x += 0.1;
      if (keys['d'] || keys['arrowright'] || touchInput.right) player.car.position.x -= 0.1;
    } else {
      player.car.position.z += moveDistance;
      player.car.position.x += moveDirection;
    }

    if (player.car.position.x < -trackWidth) player.car.position.x = -trackWidth;
    if (player.car.position.x > trackWidth) player.car.position.x = trackWidth;

    const deltaZ = player.car.position.z - player.lastZ;
    console.log(`${player.id} DeltaZ: ${deltaZ}, Distance: ${player.distance}`); // Debug
    if (deltaZ >= 0) {
      player.distance += deltaZ;
      player.lastZ = player.car.position.z;
    }
  });

  updateScoreDisplay();

  players.forEach(player => {
    carBox.setFromObject(player.car);
    for (let obstacle of obstacles) {
      obstacleBox.setFromObject(obstacle);
      if (carBox.intersectsBox(obstacleBox)) {
        console.log(`${player.id} collided with obstacle`); // Debug
        endGame();
        break;
      }
    }
  });

  updateObstacles(deltaTime);
  updateRoad();

  camera.position.set(car.position.x, car.position.y + 5, car.position.z - 10);
  camera.lookAt(car.position);

  lastTime = now;
}

function updateScoreDisplay() {
  const scoreList = document.getElementById('scoreList');
  scoreList.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.id}: ${player.distance.toFixed(1)} m`;
    scoreList.appendChild(li);
  });
  document.getElementById('speed').textContent = players[0].speed.toFixed(1);
  document.getElementById('distance').textContent = players[0].distance.toFixed(1);
}

function checkGameOver() {
  players.forEach(player => {
    if (player.car.position.x < -trackWidth || player.car.position.x > trackWidth) {
      gameOver = true;
      document.getElementById("hud").style.display = "none";
      document.getElementById("gameOverScreen").style.display = "block";
      const distance = players[0].distance.toFixed(1);
      const previousHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
      if (distance > previousHighScore) {
        localStorage.setItem('highScore', distance);
      }
      let gameOverText = `Game Over!\n\n`;
      players.forEach(player => {
        gameOverText += `${player.id}: ${player.distance.toFixed(1)} m\n`;
      });
      gameOverText += `High Score: ${Math.max(distance, previousHighScore)} m`;
      document.getElementById("gameOverDetails").innerText = gameOverText;
    }
  });
}

function endGame() {
  gameOver = true;
  players.forEach(player => {
    player.speed = 0;
  });
  const gameOverBox = document.getElementById("gameOverScreen");
  if (gameOverBox) {
    gameOverBox.style.display = "block";
  } else {
    console.error('Game Over Box not found!');
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (!gameOver) {
    updateCar();
    updateTerrainTiles();
    renderer.render(scene, camera);
  }
}

let touchInput = {
  forward: false,
  left: false,
  backward: false,
  right: false,
  boost: false
};