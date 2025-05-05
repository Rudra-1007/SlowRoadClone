let scene, camera, renderer;
let car, carBody, wheels = [];
let keys = {}, lastZ = 0, totalDistance = 0, lastTime = performance.now();
let gameOver = false, autodrive = false;
const carBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

const gravity = -9.8;
let velocityY = 0;
let isFalling = false;  


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
    const key = e.key.toLowerCase();
    keys[key] = true;
  
    if (key === 'e') isBoosting = true;
    if (key === 'f') {
      autodrive = !autodrive;
      document.getElementById("autodriveBtn").innerText = autodrive ? "Disable Autodrive" : "Enable Autodrive";
    }
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
}

function createCar() {
  car = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const bodyGeometry = new THREE.BoxGeometry(3, 0.75, 1.5); 
  carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  carBody.position.y = 0.375;
  car.add(carBody);

  const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const positions = [
    [-1.2, 0.225, 0.7], [1.2, 0.225, 0.7],
    [-1.2, 0.225, -0.7], [1.2, 0.225, -0.7]
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

  // Tail lights
const tailLightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const tailLightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });

const leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
leftTailLight.position.set(-0.9, 0.25, -0.5);

const rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
rightTailLight.position.set(0.9, 0.25, -0.5);

car.add(leftTailLight);
car.add(rightTailLight);

const tailLightLeftGlow = new THREE.PointLight(0xff0000, 0.5, 1);
tailLightLeftGlow.position.copy(leftTailLight.position);
car.add(tailLightLeftGlow);

const tailLightRightGlow = new THREE.PointLight(0xff0000, 0.5, 1);
tailLightRightGlow.position.copy(rightTailLight.position);
car.add(tailLightRightGlow);

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

  // Body
  const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 1.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.position.y = 0.4;
  dummyCar.add(bodyMesh);

  // Wheels
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

  // Rotate to face forward along Z-axis
  dummyCar.rotation.y = Math.PI / 2;

  // Position dummy car on the road
  dummyCar.position.set(
    Math.random() * 8 - 4,   // X position
    0,
    car.position.z + 80      // Ahead of the player's car
  );

  dummyCar.castShadow = true;
  dummyCar.receiveShadow = true;

  scene.add(dummyCar);
  obstacles.push(dummyCar);
}


function updateObstacles() {
  // Loop through obstacles and remove the ones that have passed the car
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];

    // Check if the obstacle has passed the car and should be removed
    if (obstacle.position.z + 2 < car.position.z) {
      scene.remove(obstacle);  // Remove the obstacle from the scene
      obstacles.splice(i, 1);  // Remove the obstacle from the array
      i--;  // Adjust the index after removal to prevent skipping an obstacle
    }
  }
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

  // Check if car goes off the road (out of bounds)
  const trackWidth = 5.5;  // Define the width of the road
  if (car.position.x < -trackWidth || car.position.x > trackWidth) {
    // If the car is off the road, start applying gravity and fall
    if (!isFalling) {
      isFalling = true;  // Start falling
      velocityY = 0;  // Reset vertical velocity
    }
    velocityY += gravity * deltaTime;  // Apply gravity
    car.position.y += velocityY * deltaTime;  // Move car downwards

    // If car falls below a certain height, end the game
    if (car.position.y < -10) {  // If car falls too far down
      checkGameOver();  // End the game if the car is too far off-road
      endGame();  // Call the endGame function
    }
  }

  // Check for collisions with obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    carBox.setFromObject(car);
    obstacleBox.setFromObject(obstacle);

    if (carBox.intersectsBox(obstacleBox)) {
      checkGameOver();
      endGame();  // End the game if the car collides with an obstacle
      break;  // Exit the loop and continue with the rest of the function
    }
  }

  // Autodrive with obstacle avoidance
  let moveDirection = 0;  // Default to no horizontal movement

  // Create sensor box in front of the car
  const sensorBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(car.position.x, car.position.y, car.position.z + 5),
    new THREE.Vector3(2, 1, 10)  // Sensor size in front of the car
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
    let leftClear = true;
    let rightClear = true;

    // Create left and right sensor boxes
    const leftSensor = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(car.position.x + 1, car.position.y, car.position.z + 5),
      new THREE.Vector3(1, 1, 10)
    );
    const rightSensor = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(car.position.x - 1, car.position.y, car.position.z + 5),
      new THREE.Vector3(1, 1, 10)
    );

    // Check for obstacles on the left and right
    for (let obstacle of obstacles) {
      obstacleBox.setFromObject(obstacle);
      if (leftSensor.intersectsBox(obstacleBox)) leftClear = false;
      if (rightSensor.intersectsBox(obstacleBox)) rightClear = false;
    }

    // Adjust movement direction based on sensor readings
    if (leftClear && !rightClear) {
      moveDirection = 0.1;  // Move left if left side is clear
    } else if (rightClear && !leftClear) {
      moveDirection = -0.1;  // Move right if right side is clear
    } else if (leftClear && rightClear) {
      moveDirection = Math.random() > 0.5 ? 0.1 : -0.1;  // Random direction if both sides are clear
    } else {
      moveDirection = 0;  // No escape route, stop horizontal movement
    }
  }

  // Apply movement (z for forward/backward, x for left/right)
  if (!autodrive) {
    if (keys['w']) car.position.z += moveDistance;
    if (keys['s']) car.position.z -= moveDistance;
    if (keys['a']) car.position.x += 0.1;
    if (keys['d']) car.position.x -= 0.1;
  } else {
    car.position.z += moveDistance;
  }

  // Update car's horizontal position based on avoidance decision
  car.position.x += moveDirection;

  // Check for collisions with obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    carBox.setFromObject(car);
    obstacleBox.setFromObject(obstacle);

    if (carBox.intersectsBox(obstacleBox)) {
      checkGameOver();
      endGame();  // End the game if the car collides with an obstacle
      break;  // Exit the loop and continue with the rest of the function
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

function endGame() {
  gameOver = true;
  currentSpeed = 0;  // Stop the car

  const gameOverBox = document.getElementById("gameOverScreen");
  if (gameOverBox) {
    gameOverBox.style.display = "block";  // Show the game over box
  } else {
    console.error('Game Over Box not found!');
  }
}

function endObstacle(){
   // Ensure finalScore element exists before trying to modify it
   if (car.position.x < -obstacles || car.position.x > obstacles) {
    gameOver = true;
    document.getElementById("hud").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "block";

    const distance = totalDistance.toFixed(1);
    const previousHighScore = parseFloat(localStorage.getItem('highScore')) || 0;

    if (distance > previousHighScore) {
      localStorage.setItem('highScore', distance);
    }

    document.getElementById("gameOverDetails").innerText =
      `Distance: ${distance} m\nHigh Score: ${Math.max(distance, previousHighScore)} m`;
  }
  setTimeout(() => location.reload(), 3000);  // Reload after 3 seconds
}

function checkGameOver() {
  const trackWidth = 5;
  if (car.position.x < -trackWidth || car.position.x > trackWidth) {
    gameOver = true;
    document.getElementById("hud").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "block";

    const distance = totalDistance.toFixed(1);
    const previousHighScore = parseFloat(localStorage.getItem('highScore')) || 0;

    if (distance > previousHighScore) {
      localStorage.setItem('highScore', distance);
    }

    document.getElementById("gameOverDetails").innerText =
      `Distance: ${distance} m\nHigh Score: ${Math.max(distance, previousHighScore)} m`;
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (!gameOver) {
    updateCar();
    renderer.render(scene, camera);
  }
}
