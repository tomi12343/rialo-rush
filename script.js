window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const container = document.getElementById("game-container");
  const bgVideo = document.getElementById("bg-video");

  // UI
  const scoreText = document.getElementById("score");
  const levelText = document.getElementById("level");
  const highText = document.getElementById("highscore");
  const startOverlay = document.getElementById("start");
  const startBtn = document.getElementById("startBtn");
  const overlay = document.getElementById("overlay");
  const restartBtn = document.getElementById("restart");

  // Assets
  const playerImg = new Image();
  playerImg.src = "assets/player.png";

  const bgMusic = new Audio("assets/music.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.6;

  const gunSoundSrc = "assets/gun.wav";
  const levelUpSound = new Audio("assets/levelup.wav");
  levelUpSound.volume = 0.8;

  // State
  let running = false;
  let gameOver = false;
  let score = 0;
  let highScore = Number(localStorage.getItem("rialo_high") || 0);

  // Spawn & Level
  let level = 1;
  let speedMultiplier = 1.0;
  let enemiesPerSpawn = 3; // awal 3 musuh tiap detik
  let spawnInterval = 60; // setiap detik (60fps)
  let spawnTimer = spawnInterval;

  // Entities
  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = [];

  // UI init
  highText.textContent = `High Score: ${highScore}`;
  levelText.textContent = `Level: ${level}`;

  // Controls
  const keys = {};
  document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  }, { passive: false });
  document.addEventListener("keyup", (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = false;
  }, { passive: false });

  function focusCanvas() {
    canvas.focus({ preventScroll: true });
  }

  async function startGame() {
    startOverlay.classList.add("hidden");
    try { await bgVideo.play(); } catch (_) {}
    try { await bgMusic.play(); } catch (_) {}

    running = true;
    gameOver = false;
    score = 0;
    level = 1;
    speedMultiplier = 1.0;
    enemiesPerSpawn = 3;

    bullets = [];
    enemies.forEach((e) => e.el.remove());
    enemies = [];

    scoreText.textContent = "Score: 0";
    levelText.textContent = `Level: ${level}`;
    highText.textContent = `High Score: ${highScore}`;
    focusCanvas();
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
    startGame();
  });

  // 🔫 Auto Shooting
  let shootCooldown = 0;
  function shoot() {
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h / 2 - 3,
      w: 18,
      h: 6,
      speed: 12,
    });
    const sfx = new Audio(gunSoundSrc);
    sfx.volume = 0.7;
    sfx.play().catch(() => {});
  }

  // 🐦 Spawn Enemies (group)
  function spawnEnemiesGroup(count) {
    for (let i = 0; i < count; i++) {
      const y = Math.random() * (canvas.height - 100);
      const baseSpeed = 2 + Math.random() * 2;
      const speed = baseSpeed * speedMultiplier;

      const img = new Image();
      img.src = "assets/enemy-bird.gif";
      img.className = "enemy-sprite";
      img.style.top = `${y}px`;
      img.style.left = `${canvas.width}px`;

      img.onload = () => {
        container.appendChild(img);
        enemies.push({ x: canvas.width, y, w: 60, h: 60, speed, el: img });
      };
    }
  }

  // ⚡ Level Up logic
  function levelUp() {
    level++;
    enemiesPerSpawn += 3; // tambah 3 musuh per spawn
    speedMultiplier += 0.1; // makin cepat
    levelText.textContent = `Level: ${level}`;
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(() => {});
    console.log(`🔥 Level ${level} | ${enemiesPerSpawn} musuh/spawn | Speed x${speedMultiplier.toFixed(2)}`);
  }

  // 🕹️ Update
  function update() {
    if (!running || gameOver) return;

    // Gerak Player
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height)
      player.y += player.speed;

    // Auto Shoot
    if (shootCooldown <= 0) {
      shoot();
      shootCooldown = 12;
    }
    shootCooldown--;

    // Bullets
    bullets.forEach((b) => (b.x += b.speed));
    bullets = bullets.filter((b) => b.x < canvas.width + 50);

    // Spawn tiap detik
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemiesGroup(enemiesPerSpawn);
      spawnTimer = spawnInterval;
    }

    // Gerak musuh
    enemies.forEach((e) => {
      e.x -= e.speed;
      e.el.style.left = `${e.x}px`;
    });

    // Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (collide(player, e)) return endGame();

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (collide(b, e)) {
          e.el.remove();
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          scoreText.textContent = `Score: ${score}`;

          // Level Up tiap kelipatan 5
          if (score % 5 === 0) levelUp();
          break;
        }
      }

      // Musuh keluar layar
      if (e.x + e.w < 0) {
        e.el.remove();
        enemies.splice(i, 1);
      }
    }
  }

  // 🔲 Collision Check
  function collide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // 💀 Game Over
  function endGame() {
    gameOver = true;
    running = false;
    overlay.classList.remove("hidden");
    enemies.forEach((e) => e.el.remove());
    enemies = [];
    bgMusic.pause();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("rialo_high", String(highScore));
    }
    highText.textContent = `High Score: ${highScore}`;
  }

  // 🎨 Draw
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (playerImg.complete)
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#ff3333";
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
  }

  // 🔁 Loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
});
