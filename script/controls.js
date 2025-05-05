// controls.js
export function setupControls() {
    window.keys = {};
    window.autodrive = false;
    window.gameOver = false;
  
    document.getElementById("autodriveBtn").addEventListener("click", () => {
      window.autodrive = !window.autodrive;
      document.getElementById("autodriveBtn").innerText = window.autodrive ? "Disable Autodrive" : "Enable Autodrive";
    });
  
    window.addEventListener('keydown', (e) => {
      window.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') window.isBoosting = true;
    });
  
    window.addEventListener('keyup', (e) => {
      window.keys[e.key.toLowerCase()] = false;
      if (e.key.toLowerCase() === 'e') window.isBoosting = false;
    });
  
    window.addEventListener('resize', () => {
      window.camera.aspect = window.innerWidth / window.innerHeight;
      window.camera.updateProjectionMatrix();
      window.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  