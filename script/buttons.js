// buttons.js
import { setBoosting } from './updateCar.js';

export function setupUI(startCallback, restartCallback) {
  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("hud").style.display = "block";
    if (typeof startCallback === 'function') startCallback();
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    if (typeof restartCallback === 'function') restartCallback();
  });

  document.getElementById("autodriveBtn").addEventListener("click", () => {
    const btn = document.getElementById("autodriveBtn");
    const isActive = btn.innerText.includes("Disable");
    btn.innerText = isActive ? "Enable Autodrive" : "Disable Autodrive";
    window.autodrive = !isActive;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e') setBoosting(true);
  });

  window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'e') setBoosting(false);
  });

  window.addEventListener('resize', () => {
    const camera = window.camera;
    const renderer = window.renderer;
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
}
