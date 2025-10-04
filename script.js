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
  let running = false, gameOver = false;
  let score = 0, highScore = Number(localStorage.getItem("rialo_high") || 0);
  let level = 1, speedMultiplier = 1.0, enemiesPerSpawn = 3;
  const spawnInterval = 60;
  let spawnTimer = spawnInterval, shootCooldown = 0;

  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [], enemies = [];

  highText.textContent = `High Score: ${highScore}`;
  levelText.textContent = `Level: ${level}`;

  // Keyboard Controls
  const keys = {};
  document.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  });
  document.addEventListener("keyup", e => {
    if (["ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = false;
  });

  // 🎮 Simple On-screen Buttons
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");

  function activateKey(key) { keys[key] = true; }
  function deactivateKey(key) { keys[key] = false; }

  // UP
  btnUp.addEventListener("mousedown", () => activateKey("ArrowUp"));
  btnUp.addEventListener("mouseup", () => deactivateKey("ArrowUp"));
  btnUp.addEventListener("mouseleave", () => deactivateKey("ArrowUp"));
  btnUp.addEventListener("touchstart", e => { e.preventDefault(); activateKey("ArrowUp"); });
  btnUp.addEventListener("touchend", e => { e.preventDefault(); deactivateKey("ArrowUp"); });

  // DOWN
  btnDown.addEventListener("mousedown", () => activateKey("ArrowDown"));
  btnDown.addEventListener("mouseup", () => deactivateKey("ArrowDown"));
  btnDown.addEventListener("mouseleave", () => deactivateKey("ArrowDown"));
  btnDown.addEventListener("touchstart", e => { e.preventDefault(); activateKey("ArrowDown"); });
  btnDown.addEventListener("touchend", e => { e.preventDefault(); deactivateKey("ArrowDown"); });

  // 🎮 Start Game
  async function startGame() {
    startOverlay.classList.add("hidden");
    try { await bgVideo.play(); } catch (_) {}
    try { await bgMusic.play(); } catch (_) {}
    running = true; gameOver = false;
    score = 0; level = 1; speedMultiplier = 1.0; enemiesPerSpawn = 3;
    bullets = []; enemies.forEach(e => e.el.remove()); enemies = [];
    shootCooldown = 0; spawnTimer = spawnInterval;
    scoreText.textContent = "Score: 0"; levelText.textContent = `Level: ${level}`;
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
    bullets.push({ x: player.x + player.w, y: player.y + player.h / 2 - 3, w: 18, h: 6, speed: 12 });
    const sfx = new Audio(gunSoundSrc);
    sfx.volume = 0.7; sfx.play().catch(() => {});
  }

  // 🐦 Spawn Enemies
  function spawnEnemiesGroup(count) {
    for (let i = 0; i < count; i++) {
      const y = Math.random() * (canvas.height - 100);
      const speed = (2 + Math.random() * 2) * speedMultiplier;
      const img = new Image();
      img.src = "assets/enemy-bird.gif";
      img.className = "enemy-sprite";
      img.style.top = `${y}px`; img.style.left = `${canvas.width}px`;
      container.appendChild(img);
      enemies.push({ x: canvas.width, y, w: 60, h: 60, speed, el: img });
    }
  }

  function levelUp() {
    level++; enemiesPerSpawn += 3; speedMultiplier += 0.1;
    levelText.textContent = `Level: ${level}`;
    levelUpSound.currentTime = 0; levelUpSound.play().catch(() => {});
  }

  function update() {
    if (!running || gameOver) return;

    // Move
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += player.speed;

    // Shoot
    if (shootCooldown <= 0) { shoot(); shootCooldown = 12; }
    shootCooldown--;

    // Bullets
    bullets.forEach(b => b.x += b.speed);
    bullets = bullets.filter(b => b.x < canvas.width + 50);

    // Spawn Enemies
    spawnTimer--;
    if (spawnTimer <= 0) { spawnEnemiesGroup(enemiesPerSpawn); spawnTimer = spawnInterval; }

    // Move Enemies
    enemies.forEach(e => { e.x -= e.speed; e.el.style.left = `${e.x}px`; });

    // Collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (collide(player, e)) return endGame();

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (collide(b, e)) {
          e.el.remove(); enemies.splice(i, 1); bullets.splice(j, 1);
          score++; scoreText.textContent = `Score: ${score}`;
          if (score % 5 === 0) levelUp();
          break;
        }
      }
      if (e.x + e.w < 0) { e.el.remove(); enemies.splice(i, 1); }
    }
  }

  function collide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function endGame() {
    gameOver = true; running = false;
    overlay.classList.remove("hidden");
    enemies.forEach(e => e.el.remove()); enemies = []; bgMusic.pause();
    if (score > highScore) { highScore = score; localStorage.setItem("rialo_high", String(highScore)); }
    highText.textContent = `High Score: ${highScore}`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#ff3333"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
});
