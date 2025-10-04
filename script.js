window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const bgVideo = document.getElementById("bg-video");

  // UI
  const scoreText = document.getElementById("score");
  const highText = document.getElementById("highscore");
  const startOverlay = document.getElementById("start");
  const startBtn = document.getElementById("startBtn");
  const overlay = document.getElementById("overlay");
  const restartBtn = document.getElementById("restart");

  // Assets
  const playerImg = new Image();
  playerImg.src = "assets/player.png";
  const enemyImg = new Image();
  enemyImg.src = "assets/enemy.png";

  // State
  let running = false;     // <- start screen menunggu user
  let gameOver = false;
  let score = 0;
  let highScore = Number(localStorage.getItem("rialo_high") || 0);
  let shootCooldown = 0;
  let spawnTimer = 0;

  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = [];

  highText.textContent = `High Score: ${highScore}`;

  // Controls (gunakan e.code + cegah scroll)
  const keys = {};
  document.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
  }, { passive: false });

  document.addEventListener("keyup", (e) => {
    if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    keys[e.code] = false;
  }, { passive: false });

  // Fokuskan canvas saat start agar input diterima
  function focusCanvas() {
    canvas.focus({ preventScroll: true });
  }

  // Start by user gesture (fix autoplay/input focus)
  async function startGame() {
    try { await bgVideo.play(); } catch (_) { /* ignore */ }
    startOverlay.classList.add("hidden");
    running = true;
    gameOver = false;
    score = 0;
    bullets = [];
    enemies = [];
    shootCooldown = 0;
    spawnTimer = 0;
    scoreText.textContent = "Score: 0";
    focusCanvas();
  }

  startBtn.addEventListener("click", startGame);

  // Restart
  restartBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    startGame();
  });

  // Shooting
  function shoot() {
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h / 2 - 3,
      w: 18,
      h: 6,
      speed: 12,
    });
  }

  // Spawn musuh
  function spawnEnemy() {
    const y = Math.random() * (canvas.height - 100);
    const speed = 3 + Math.random() * 2;
    enemies.push({ x: canvas.width + 40, y, w: 60, h: 60, speed });
  }

  // Update
  function update() {
    if (!running || gameOver) return;

    // Gerak player
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height)
      player.y += player.speed;

    // Nembak (Space)
    if (keys["Space"] && shootCooldown <= 0) {
      shoot();
      shootCooldown = 10; // ~0.16s
    }
    if (shootCooldown > 0) shootCooldown--;

    // Peluru
    bullets.forEach((b) => (b.x += b.speed));
    bullets = bullets.filter((b) => b.x < canvas.width + 50);

    // Musuh
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = 60 + Math.random() * 60;
    }
    enemies.forEach((e) => (e.x -= e.speed));

    // Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Player vs musuh
      if (collide(player, e)) {
        return endGame();
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

      // Off-screen cleanup
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
    running = false;
    overlay.classList.remove("hidden");

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("rialo_high", String(highScore));
    }
    highText.textContent = `High Score: ${highScore}`;
  }

  // Draw
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    if (playerImg.complete) {
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    }

    // Peluru (warna kontras)
    ctx.fillStyle = "#ff3333";
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Musuh
    enemies.forEach((e) => {
      if (enemyImg.complete) ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    });
  }

  // Loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();

  // Klik di mana saja juga bisa start (kalau mau cepat)
  document.addEventListener("click", (e) => {
    if (!running && startOverlay && !startOverlay.classList.contains("hidden")) {
      // biar hanya tombol Start yang trigger, boleh kamu hapus block ini kalau mau start di klik mana saja
      // startGame();
    }
  });
});
