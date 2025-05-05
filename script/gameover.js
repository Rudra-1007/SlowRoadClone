// gameover.js
export function checkGameOver(car, totalDistance) {
    const trackWidth = 5;
    if (car.position.x < -trackWidth || car.position.x > trackWidth) {
      document.getElementById("hud").style.display = "none";
      document.getElementById("gameOverScreen").style.display = "block";
  
      const distance = totalDistance.toFixed(1);
      const previousHighScore = parseFloat(localStorage.getItem('highScore')) || 0;
  
      if (distance > previousHighScore) {
        localStorage.setItem('highScore', distance);
      }
  
      document.getElementById("gameOverDetails").innerText =
        `Distance: ${distance} m\nHigh Score: ${Math.max(distance, previousHighScore)} m`;
  
      return true;
    }
    return false;
  }
  