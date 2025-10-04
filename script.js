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

  // Difficulty Scaling
  let level = 1;
  let speedMultiplier = 1.0;
  let enemiesPerSpawn = 3; // Awal: 3 musuh per detik
  const spawnInterval = 60; // 60 frame = 1 detik
  let spawnTimer = spawnInterval;

  // Player & Entities
  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = [];
  let shootCooldown = 0;

  // UI Init
  highText.textContent = `High Score: ${highScore}`;
  levelText.textContent = `Level: ${level}`;

  // Keyboard Controls
  const keys = {};
  document.addEventListener(
    "keydown",
    (e) => {
      if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
      keys[e.code] = true;
    },
    { passive: false }
  );

  document.addEventListener(
    "keyup",
    (e) => {
      if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
      keys[e.code] = false;
    },
    { passive: false }
  );

  // 🎮 On-screen Controls (PC & HP)
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const mobileControls = document.getElementById("mobile-controls");

  // (Opsional: tampilkan hanya di HP / potret)
  function checkMobileView() {
    if (window.innerWidth < 768 || window.innerHeight > window.innerWidth) {
      mobileControls.classList.remove("hidden");
    } else {
      mobileControls.classList.add("hidden");
    }
  }
  checkMobileView();
  window.addEventListener("resize", checkMobileView);

  function bindPointerHold(buttonEl, keyCode) {
    if (!buttonEl) return;

    const onDown = (e) => {
      e.preventDefault();
      keys[keyCode] = true;
      if (buttonEl.setPointerCapture && e.pointerId !== undefined) {
        try {
          buttonEl.setPointerCapture(e.pointerId);
        } catch {}
      }
    };
    const onUp = (e) => {
      e.preventDefault();
      keys[keyCode] = false;
      if (buttonEl.releasePointerCapture && e.pointerId !== undefined) {
        try {
          buttonEl.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    buttonEl.addEventListener("pointerdown", onDown, { passive: false });
    buttonEl.addEventListener("pointerup", onUp, { passive: false });
    buttonEl.addEventListener("pointercancel", onUp, { passive: false });
    buttonEl.addEventListener("pointerleave", onUp, { passive: false });
  }

  bindPointerHold(btnUp, "ArrowUp");
  bindPointerHold(btnDown, "ArrowDown");

  // Focus
  function focusCanvas() {
    canvas.focus({ preventScroll: true });
  }

  // 🚀 Start Game
  async function startGame() {
    startOverlay.classList.add("hidden");
    try {
      await bgVideo.play();
    } catch (_) {}
    try {
      await bgMusic.play();
    } catch (_) {}

    running = true;
    gameOver = false;
    score = 0;
    level = 1;
    speedMultiplier = 1.0;
    enemiesPerSpawn = 3;
    bullets = [];
    enemies.forEach((e) => e.el.remove());
    enemies = [];
    shootCooldown = 0;
    spawnTimer = spawnInterval;

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

  // 🐦 Spawn Group
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

  // ⚡ Level Up
  function levelUp() {
    level++;
    enemiesPerSpawn += 3;
    speedMultiplier += 0.1;
    levelText.textContent = `Level: ${level}`;
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(() => {});
    console.log(
      `🔥 Level ${level} | ${enemiesPerSpawn} musuh/spawn | Speed x${speedMultiplier.toFixed(
        2
      )}`
    );
  }

  // 🕹️ Update
  function update() {
    if (!running || gameOver) return;

    // Player Movement
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

    // Spawn setiap detik
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemiesGroup(enemiesPerSpawn);
      spawnTimer = spawnInterval;
    }

    // Move enemies
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

          // Level up tiap kelipatan 5
          if (score % 5 === 0) levelUp();
          break;
        }
      }

      if (e.x + e.w < 0) {
        e.el.remove();
        enemies.splice(i, 1);
      }
    }
  }

  // Collision Check
  function collide(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // Game Over
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

  // Draw
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (playerImg.complete)
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#ff3333";
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
  }

  // Loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
});
