window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const bgVideo = document.getElementById("bg-video");
  const container = document.getElementById("game-container");

  // UI
  const scoreText = document.getElementById("score");
  const highText = document.getElementById("highscore");
  const startOverlay = document.getElementById("start");
  const startBtn = document.getElementById("startBtn");
  const overlay = document.getElementById("overlay");
  const restartBtn = document.getElementById("restart");

  // Player
  const playerImg = new Image();
  playerImg.src = "assets/player.png";

  // Audio
  const bgMusic = new Audio("assets/music.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.6;

  const gunSoundSrc = "assets/gun.wav"; // sfx tembakan

  // State
  let running = false;
  let gameOver = false;
  let score = 0;
  let highScore = Number(localStorage.getItem("rialo_high") || 0);
  let shootCooldown = 0;
  let spawnTimer = 0;

  const player = { x: 60, y: 380, w: 80, h: 80, speed: 6 };
  let bullets = [];
  let enemies = []; // { x,y,w,h,speed, el }

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

  // Start game (safe autoplay handling)
  async function startGame() {
    // sembunyikan overlay dulu (klik user sudah terjadi)
    startOverlay.classList.add("hidden");

    // coba play media, tapi jangan hentikan game kalau gagal
    try { await bgVideo.play(); } catch (err) {
      console.warn("Video autoplay gagal:", err);
    }
    try { await bgMusic.play(); } catch (err) {
      console.warn("Backsound gagal diputar (perlu gesture user):", err);
    }

    running = true;
    gameOver = false;
    score = 0;
    bullets = [];
    enemies.forEach((e) => e.el.remove());
    enemies = [];
    shootCooldown = 0;
    spawnTimer = 0;
    scoreText.textContent = "Score: 0";

    focusCanvas();
  }

  startBtn.addEventListener("click", startGame);

  restartBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
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
    // sound effect
    const sfx = new Audio(gunSoundSrc);
    sfx.volume = 0.7;
    sfx.play().catch(() => {});
  }

  // Spawn musuh (video burung)
  function spawnEnemy() {
    const y = Math.random() * (canvas.height - 100);
    const speed = 2 + Math.random() * 2;

    const el = document.createElement("video");
    el.src = "assets/enemy-bird.mp4";
    el.loop = true;
    el.muted = true;
    el.autoplay = true;
    el.playsInline = true;
    el.className = "enemy-video";
    el.style.top = `${y}px`;
    el.style.left = `${canvas.width}px`;
    el.play().catch(() => {});
    container.appendChild(el);

    enemies.push({ x: canvas.width, y, w: 60, h: 60, speed, el });
  }

  function update() {
    if (!running || gameOver) return;

    // Gerak player
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += player.speed;

    // Auto shoot
    if (shootCooldown <= 0) {
      shoot();
      shootCooldown = 12; // semakin kecil semakin cepat
    }
    if (shootCooldown > 0) shootCooldown--;

    // Bullets
    bullets.forEach((b) => (b.x += b.speed));
    bullets = bullets.filter((b) => b.x < canvas.width + 50);

    // Spawn musuh
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = 90 + Math.random() * 60;
    }

    // Update posisi musuh
    enemies.forEach((e) => {
      e.x -= e.speed;
      e.el.style.left = `${e.x}px`;
      e.el.style.top = `${e.y}px`;
    });

    // Collision
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Player vs musuh
      if (collide(player, e)) return endGame();

      // Peluru vs musuh
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (collide(b, e)) {
          e.el.remove();
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          scoreText.textContent = `Score: ${score}`;
          break;
        }
      }

      // Hapus musuh yang lewat
      if (e.x + e.w < 0) {
        e.el.remove();
        enemies.splice(i, 1);
      }
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

    enemies.forEach((e) => e.el.remove());
    enemies = [];
    bgMusic.pause();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("rialo_high", String(highScore));
    }
    highText.textContent = `High Score: ${highScore}`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    if (playerImg.complete) {
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    }

    // Peluru
    ctx.fillStyle = "#ff3333";
    bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
});
