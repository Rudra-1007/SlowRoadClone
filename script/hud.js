// hud.js
export function initHUD() {
    const highScore = localStorage.getItem('highScore') || 0;
    document.getElementById('highScoreDisplay').textContent = `High Score: ${highScore} m`;
  
    document.getElementById("startButton").addEventListener("click", () => {
      document.getElementById("startScreen").style.display = "none";
      document.getElementById("hud").style.display = "block";
    });
  
    document.getElementById("restartButton").addEventListener("click", () => {
      location.reload();
    });
  }
  
  export function updateHUD(speed, distance) {
    document.getElementById('speed').textContent = `Speed: ${speed.toFixed(1)}`;
    document.getElementById('distance').textContent = `Distance: ${distance.toFixed(1)}`;
  }
  