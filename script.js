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

  // Game State
  let running = false;
  let gameOver = false;
  let score = 0;
  let highScore = Number(localStorage.getItem("rialo_high") || 0);
  let shootCooldown = 0;
  let spawnTimer = 0;

  // ⚡ Level System
  let level = 1;
  let speedMultiplier = 1; // musuh awal normal

  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = [];

  highText.textContent = `High Score: ${highScore}`;

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
    speedMultiplier = 1;

    bullets = [];
    enemies.forEach((e) => e.el.remove());
    enemies = [];
    shootCooldown = 0;
    spawnTimer = 0;

    scoreText.textContent = "Score: 0";
    levelText.textContent = "Level: 1";
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

  // 🐦 Spawn Enemy (GIF)
  function spawnEnemy() {
    if (enemies.length > 8) return;
    const y = Math.random() * (canvas.height - 100);
    const baseSpeed = 2 + Math.random() * 2;
    const speed = baseSpeed * speedMultiplier;

    const img = new Image();
    img.src = "assets/enemy-bird.gif";
    img.alt = "enemy-bird";
    img.className = "enemy-sprite";
    img.style.top = `${y}px`;
    img.style.left = `${canvas.width}px`;

    img.onload = () => {
      container.appendChild(img);
      enemies.push({ x: canvas.width, y, w: 60, h: 60, speed, el: img });
    };
  }

  // 🕹️ Update
  function update() {
    if (!running || gameOver) return;

    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += player.speed;

    if (shootCooldown <= 0) {
      shoot();
      shootCooldown = 12;
    }
    shootCooldown--;

    bullets.forEach((b) => (b.x += b.speed));
    bullets = bullets.filter((b) => b.x < canvas.width + 50);

    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = 90 + Math.random() * 60;
    }

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

          // 🎯 Level Up
          if (score % 100 === 0) {
            level++;
            speedMultiplier += 0.15;
            levelText.textContent = `Level: ${level}`;
            levelUpSound.currentTime = 0;
            levelUpSound.play().catch(() => {});
            console.log(`⚡ Level ${level} → speed x${speedMultiplier.toFixed(2)}`);
          }

          break;
        }
      }

      if (e.x + e.w < 0) {
        e.el.remove();
        enemies.splice(i, 1);
      }
    }
  }

  function collide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

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
    if (playerImg.complete) ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
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
