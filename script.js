window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // --- Load assets ---
  const playerImg = new Image();
  playerImg.src = "assets/player.png";

  const enemyImg = new Image();
  enemyImg.src = "assets/enemy.png";

  // --- Game State ---
  let player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = [];
  let score = 0;
  let highScore = localStorage.getItem("rialo_high") || 0;
  let gameOver = false;
  let shootCooldown = 0;
  let spawnTimer = 0;

  // --- UI Elements ---
  const scoreText = document.getElementById("score");
  const highText = document.getElementById("highscore");
  const overlay = document.getElementById("overlay");
  const restartBtn = document.getElementById("restart");

  highText.textContent = `High Score: ${highScore}`;

  // --- Controls ---
  const keys = {};
  document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
  });
  document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  // --- Shooting ---
  function shoot() {
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h / 2 - 3,
      w: 18,
      h: 6,
      speed: 12,
    });
  }

  // --- Enemy Spawn ---
  function spawnEnemy() {
    const y = Math.random() * (canvas.height - 100);
    const speed = 3 + Math.random() * 2;
    enemies.push({ x: canvas.width + 40, y, w: 60, h: 60, speed });
  }

  // --- Update Logic ---
  function update() {
    if (gameOver) return;

    // Gerak player
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height)
      player.y += player.speed;

    // Nembak (Space)
    if (keys["Space"] && shootCooldown <= 0) {
      shoot();
      shootCooldown = 10; // cooldown ~0.16s
    }
    if (shootCooldown > 0) shootCooldown--;

    // Update peluru
    bullets.forEach((b) => (b.x += b.speed));
    bullets = bullets.filter((b) => b.x < canvas.width + 50);

    // Spawn musuh
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = 60 + Math.random() * 60;
    }

    // Update musuh
    enemies.forEach((e) => (e.x -= e.speed));

    // Cek tabrakan
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Player vs musuh
      if (collide(player, e)) {
        endGame();
        return;
      }

      // Peluru vs musuh
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

      // Hapus musuh keluar layar
      if (e.x + e.w < 0) enemies.splice(i, 1);
    }
  }

  // --- Collision Check ---
  function collide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // --- Game Over ---
  function endGame() {
    gameOver = true;
    overlay.classList.remove("hidden");

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("rialo_high", highScore);
    }
    highText.textContent = `High Score: ${highScore}`;
  }

  // --- Restart ---
  restartBtn.addEventListener("click", () => {
    score = 0;
    bullets = [];
    enemies = [];
    player.y = 380;
    gameOver = false;
    overlay.classList.add("hidden");
    scoreText.textContent = "Score: 0";
  });

  // --- Draw ---
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    if (playerImg.complete) {
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    }

    // Peluru
    ctx.fillStyle = "#ff3333"; // merah terang, kontras di video
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Musuh
    enemies.forEach((e) => {
      if (enemyImg.complete) ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    });
  }

  // --- Game Loop ---
  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
