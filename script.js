const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

let player = { x: 50, y: 300, width: 50, height: 50, speed: 5 };
let bullets = [];
let enemies = [];
let score = 0;
let highScore = localStorage.getItem("highscore") || 0;
let gameOver = false;

const scoreDisplay = document.getElementById("score");
const highscoreDisplay = document.getElementById("highscore");
const gameOverScreen = document.getElementById("game-over");
const restartBtn = document.getElementById("restart-btn");

highscoreDisplay.textContent = `High Score: ${highScore}`;

document.addEventListener("keydown", movePlayer);
document.addEventListener("keydown", shoot);

function movePlayer(e) {
  if (gameOver) return;
  if (e.key === "ArrowUp" && player.y > 0) player.y -= player.speed;
  if (e.key === "ArrowDown" && player.y + player.height < canvas.height) player.y += player.speed;
}

function shoot(e) {
  if (gameOver) return;
  if (e.code === "Space") {
    bullets.push({ x: player.x + player.width, y: player.y + player.height / 2, width: 10, height: 4 });
  }
}

function spawnEnemy() {
  if (gameOver) return;
  let y = Math.random() * (canvas.height - 40);
  enemies.push({ x: canvas.width, y: y, width: 40, height: 40, speed: 2 + Math.random() * 2 });
}

function update() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Draw bullets
  bullets.forEach((b, i) => {
    b.x += 6;
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, b.width, b.height);
    if (b.x > canvas.width) bullets.splice(i, 1);
  });

  // Draw enemies
  enemies.forEach((enemy, i) => {
    enemy.x -= enemy.speed;
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);

    // Collision with player
    if (checkCollision(player, enemy)) {
      endGame();
    }

    // Collision with bullets
    bullets.forEach((b, j) => {
      if (checkCollision(b, enemy)) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
      }
    });

    if (enemy.x + enemy.width < 0) enemies.splice(i, 1);
  });

  requestAnimationFrame(update);
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function endGame() {
  gameOver = true;
  gameOverScreen.classList.remove("hidden");
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highscore", highScore);
  }
}

restartBtn.addEventListener("click", () => {
  score = 0;
  scoreDisplay.textContent = "Score: 0";
  gameOver = false;
  gameOverScreen.classList.add("hidden");
  enemies = [];
  bullets = [];
  player.y = 300;
  update();
});

setInterval(spawnEnemy, 1500);
update();
