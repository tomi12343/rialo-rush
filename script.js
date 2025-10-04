const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

let player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
let bullets = [];
let enemies = [];
let score = 0;
let highScore = localStorage.getItem("rialo_high") || 0;
let gameOver = false;
let shootCooldown = 0;
let spawnTimer = 0;

const scoreText = document.getElementById("score");
const highText = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");

highText.textContent = `High Score: ${highScore}`;

const keys = {};

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function spawnEnemy() {
  const y = Math.random() * (canvas.height - 100);
  const speed = 3 + Math.random() * 2;
  enemies.push({ x: canvas.width + 40, y, w: 60, h: 60, speed });
}

function shoot() {
  bullets.push({
    x: player.x + player.w,
    y: player.y + player.h / 2 - 4,
    w: 20,
    h: 8,
    speed: 10,
  });
}

function update() {
  if (gameOver) return;

  // player movement
  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y + player.h < canvas.height)
    player.y += player.speed;

  // shooting
  if (keys[" "] && shootCooldown <= 0) {
    shoot();
    shootCooldown = 10;
  }
  shootCooldown--;

  // update bullets
  bullets.forEach((b) => (b.x += b.speed));
  bullets = bullets.filter((b) => b.x < canvas.width + 50);

  // spawn enemies
  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = 60 + Math.random() * 60;
  }

  // update enemies
  enemies.forEach((e) => (e.x -= e.speed));

  // collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // check player collision
    if (collide(player, e)) {
      return endGame();
    }

    // check bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (collide(b, e)) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        scoreText.textContent = `Score: ${score}`;
        break;
      }
    }

    // remove off-screen
    if (e.x + e.w < 0) enemies.splice(i, 1);
  }
}

function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function endGame() {
  gameOver = true;
  overlay.classList.remove("hidden");

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("rialo_high", highScore);
  }
  highText.textContent = `High Score: ${highScore}`;
}

restartBtn.addEventListener("click", () => {
  score = 0;
  bullets = [];
  enemies = [];
  player.y = 380;
  gameOver = false;
  overlay.classList.add("hidden");
  scoreText.textContent = "Score: 0";
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw player
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // draw bullets
  ctx.fillStyle = "#ffcc00";
  bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

  // draw enemies
  enemies.forEach((e) => ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h));
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
