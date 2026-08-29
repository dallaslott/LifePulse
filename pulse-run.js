(() => {
  'use strict';

  const VERSION = '5.143.0';
  const ROUND_SECONDS = 45;
  const HIGH_SCORE_KEY = 'lifepulse-pulse-run-high-score';
  const MOMENTS = [
    { label: 'HISTORY', glyph: 'H', color: '#55dcff' },
    { label: 'SPORTS', glyph: 'S', color: '#ffd166' },
    { label: 'SPACE', glyph: 'C', color: '#ad91ff' },
    { label: 'TECH', glyph: 'T', color: '#55f0ad' }
  ];

  let ui = {};
  let ctx = null;
  let state = null;
  let lastFocus = null;
  let pointerStart = null;

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const randomItem = items => items[Math.floor(Math.random() * items.length)];

  function interfaceSound(name) {
    try { window.playInterfaceSound?.(name); } catch {}
  }

  function birthYear() {
    const selected = Number(document.getElementById('dobYear')?.value);
    return Number.isFinite(selected) && selected >= 1900 ? selected : Math.max(1900, new Date().getFullYear() - 30);
  }

  function highScore() {
    try { return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0); } catch { return 0; }
  }

  function saveHighScore(score) {
    try { localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(highScore(), score))); } catch {}
  }

  function fitCanvas() {
    if (!ui.canvas || !ctx) return;
    const rect = ui.canvas.getBoundingClientRect();
    const ratio = clamp(window.devicePixelRatio || 1, 1, 2);
    ui.canvas.width = Math.max(1, Math.round(rect.width * ratio));
    ui.canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (state) {
      state.width = rect.width;
      state.height = rect.height;
      state.playerX = Math.max(58, rect.width * .16);
      state.targetY = laneY(state.targetLane);
      if (!state.running) state.playerY = state.targetY;
    }
  }

  function laneY(lane) {
    const height = state?.height || ui.stage?.clientHeight || 400;
    return height * ([.24, .5, .76][clamp(lane, 0, 2)]);
  }

  function setLane(lane) {
    if (!state?.running) return;
    state.targetLane = clamp(lane, 0, 2);
    state.targetY = laneY(state.targetLane);
    navigator.vibrate?.(8);
  }

  function moveLane(direction) {
    setLane((state?.targetLane ?? 1) + direction);
  }

  function resetState() {
    const nowYear = new Date().getFullYear();
    const startYear = Math.min(nowYear, birthYear());
    state = {
      version: VERSION,
      running: false,
      finished: false,
      width: ui.stage?.clientWidth || 800,
      height: ui.stage?.clientHeight || 480,
      playerX: 120,
      playerY: 0,
      targetY: 0,
      targetLane: 1,
      items: [],
      particles: [],
      labels: [],
      elapsed: 0,
      lastTime: 0,
      spawnClock: 0,
      gridOffset: 0,
      score: 0,
      stability: 3,
      streak: 0,
      bestStreak: 0,
      collected: 0,
      startYear,
      nowYear,
      raf: 0
    };
    state.playerY = state.targetY = laneY(1);
  }

  function updateHud() {
    if (!state) return;
    const progress = clamp(state.elapsed / ROUND_SECONDS, 0, 1);
    const year = Math.round(state.startYear + (state.nowYear - state.startYear) * progress);
    if (ui.year) ui.year.textContent = `${year} • ${Math.max(0, Math.ceil(ROUND_SECONDS - state.elapsed))}s`;
    if (ui.score) ui.score.textContent = `Score ${state.score.toLocaleString()}`;
    if (ui.stability) ui.stability.textContent = `Stability ${'●'.repeat(state.stability)}${'○'.repeat(Math.max(0, 3 - state.stability))}`;
  }

  function spawnItem() {
    const fractureChance = Math.min(.34, .18 + state.elapsed / 260);
    const isFracture = Math.random() < fractureChance;
    const moment = randomItem(MOMENTS);
    const radius = isFracture ? 19 : 17;
    state.items.push({
      x: state.width + radius + 8,
      y: laneY(Math.floor(Math.random() * 3)),
      radius,
      isFracture,
      label: isFracture ? 'FRACTURE' : moment.label,
      glyph: isFracture ? '×' : moment.glyph,
      color: isFracture ? '#ff4f72' : moment.color,
      rotation: Math.random() * Math.PI,
      hit: false
    });
  }

  function burst(item, success) {
    for (let index = 0; index < 12; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 95;
      state.particles.push({ x:item.x, y:item.y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:.55, color:item.color });
    }
    state.labels.push({ x:item.x, y:item.y - 24, life:.75, text:success ? `${item.label} +${100 + Math.min(100, state.streak * 10)}` : 'TIMELINE HIT', color:item.color });
  }

  function collide(item) {
    if (item.hit) return;
    const distance = Math.hypot(item.x - state.playerX, item.y - state.playerY);
    if (distance > item.radius + 15) return;
    item.hit = true;
    if (item.isFracture) {
      state.stability -= 1;
      state.streak = 0;
      state.score = Math.max(0, state.score - 75);
      burst(item, false);
      interfaceSound('detail-close');
      navigator.vibrate?.([45, 35, 70]);
    } else {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.collected += 1;
      state.score += 100 + Math.min(100, state.streak * 10);
      burst(item, true);
      interfaceSound('detail-open');
      navigator.vibrate?.(18);
    }
  }

  function update(delta) {
    state.elapsed += delta;
    state.gridOffset = (state.gridOffset + delta * (90 + state.elapsed * 1.7)) % 90;
    state.playerY += (state.targetY - state.playerY) * Math.min(1, delta * 12);
    state.spawnClock -= delta;
    if (state.spawnClock <= 0) {
      spawnItem();
      state.spawnClock = Math.max(.46, .88 - state.elapsed * .006) + Math.random() * .2;
    }
    const speed = 230 + state.elapsed * 4.2;
    state.items.forEach(item => {
      item.x -= speed * delta;
      item.rotation += delta * (item.isFracture ? 2.6 : 1.2);
      collide(item);
    });
    state.items = state.items.filter(item => item.x > -50 && !item.hit);
    state.particles.forEach(particle => { particle.x += particle.vx*delta; particle.y += particle.vy*delta; particle.vy += 55*delta; particle.life -= delta; });
    state.particles = state.particles.filter(particle => particle.life > 0);
    state.labels.forEach(label => { label.y -= 22*delta; label.life -= delta; });
    state.labels = state.labels.filter(label => label.life > 0);
    updateHud();
    if (state.elapsed >= ROUND_SECONDS || state.stability <= 0) finishGame();
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, '#030918');
    gradient.addColorStop(.55, '#071224');
    gradient.addColorStop(1, '#02050d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.lineWidth = 1;
    for (let lane = 0; lane < 3; lane += 1) {
      const y = laneY(lane);
      ctx.strokeStyle = 'rgba(83,225,255,.14)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke();
    }
    for (let x = -90 + state.gridOffset; x < state.width + 90; x += 90) {
      ctx.strokeStyle = 'rgba(83,225,255,.07)';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 70, state.height); ctx.stroke();
    }

    const pulse = Math.sin(state.elapsed * 7.5);
    ctx.strokeStyle = 'rgba(62,236,174,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, state.playerY);
    const start = Math.max(8, state.playerX - 105);
    ctx.lineTo(start, state.playerY);
    ctx.lineTo(start + 12, state.playerY - 8);
    ctx.lineTo(start + 21, state.playerY + 10);
    ctx.lineTo(start + 32, state.playerY - 29 - pulse * 3);
    ctx.lineTo(start + 45, state.playerY + 26 + pulse * 3);
    ctx.lineTo(start + 58, state.playerY);
    ctx.lineTo(state.playerX, state.playerY);
    ctx.stroke();
  }

  function drawItems() {
    state.items.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.shadowColor = item.color;
      ctx.shadowBlur = item.isFracture ? 20 : 16;
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.isFracture ? 'rgba(255,50,92,.16)' : 'rgba(5,16,29,.9)';
      ctx.lineWidth = item.isFracture ? 3 : 2;
      if (item.isFracture) {
        ctx.beginPath();
        for (let index = 0; index < 8; index += 1) {
          const angle = index * Math.PI / 4;
          const radius = index % 2 ? item.radius * .62 : item.radius;
          const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
          index ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0,0,item.radius,0,Math.PI*2); ctx.fill(); ctx.stroke();
      }
      ctx.rotate(-item.rotation);
      ctx.shadowBlur = 0;
      ctx.fillStyle = item.color;
      ctx.font = '900 12px Montserrat, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(item.glyph, 0, 1);
      ctx.restore();
    });
  }

  function drawPlayer() {
    const glow = 10 + Math.sin(state.elapsed * 9) * 3;
    ctx.save();
    ctx.shadowColor = '#5bffc0'; ctx.shadowBlur = 25;
    const gradient = ctx.createRadialGradient(state.playerX - 4, state.playerY - 5, 2, state.playerX, state.playerY, 17);
    gradient.addColorStop(0, '#f5ffff'); gradient.addColorStop(.25, '#8affca'); gradient.addColorStop(1, '#09aa74');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(state.playerX, state.playerY, 13 + glow * .08, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawEffects() {
    state.particles.forEach(particle => {
      ctx.globalAlpha = clamp(particle.life / .55, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    });
    ctx.globalAlpha = 1;
    state.labels.forEach(label => {
      ctx.globalAlpha = clamp(label.life / .75, 0, 1);
      ctx.fillStyle = label.color;
      ctx.font = '900 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.text, label.x, label.y);
    });
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!ctx || !state) return;
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackground();
    drawItems();
    drawPlayer();
    drawEffects();
  }

  function frame(time) {
    if (!state?.running) return;
    const delta = state.lastTime ? Math.min(.04, (time - state.lastTime) / 1000) : 0;
    state.lastTime = time;
    update(delta);
    draw();
    if (state.running) state.raf = requestAnimationFrame(frame);
  }

  function startGame() {
    cancelAnimationFrame(state?.raf || 0);
    resetState();
    fitCanvas();
    state.running = true;
    ui.message.hidden = true;
    updateHud();
    interfaceSound('drawer-open');
    state.raf = requestAnimationFrame(frame);
  }

  function finishGame() {
    if (!state?.running) return;
    state.running = false;
    cancelAnimationFrame(state.raf);
    saveHighScore(state.score);
    const endedEarly = state.stability <= 0;
    ui.message.hidden = false;
    ui.message.innerHTML = `
      <span class="pulse-run-kicker">${endedEarly ? 'Timeline Destabilized' : 'Present Day Reached'}</span>
      <h2>${state.score.toLocaleString()} Points</h2>
      <p>You collected <strong>${state.collected}</strong> moments. High score: <strong>${highScore().toLocaleString()}</strong>.</p>
      <div class="pulse-run-instructions"><span>${state.startYear} &rarr; ${state.nowYear}</span><span>Best Streak ${state.bestStreak}</span></div>
      <button class="pulse-run-primary" id="pulse-run-replay" type="button">Run Again</button>`;
    interfaceSound(endedEarly ? 'detail-close' : 'detail-open');
    document.getElementById('pulse-run-replay')?.focus({ preventScroll:true });
  }

  function openGame() {
    if (!ui.overlay) return;
    lastFocus = document.activeElement;
    document.body.classList.add('pulse-run-open');
    ui.overlay.classList.add('is-open');
    ui.overlay.setAttribute('aria-hidden','false');
    resetState();
    fitCanvas();
    draw();
    const best = highScore();
    ui.message.hidden = false;
    ui.message.innerHTML = `
      <span class="pulse-run-kicker">Action Prototype</span>
      <h2>Keep History's Pulse Alive</h2>
      <p>Move between three lanes. Collect glowing moments from history, sports, space, and technology. Avoid red timeline fractures.</p>
      <div class="pulse-run-instructions"><span>&uarr; &darr; Keys</span><span>Swipe</span><span>Tap A Lane</span>${best ? `<span>High Score ${best.toLocaleString()}</span>` : ''}</div>
      <button class="pulse-run-primary" id="pulse-run-start" type="button">Start Pulse Run</button>`;
    updateHud();
    interfaceSound('drawer-open');
    setTimeout(() => document.getElementById('pulse-run-start')?.focus({ preventScroll:true }), 50);
  }

  function closeGame() {
    if (!ui.overlay?.classList.contains('is-open')) return;
    if (state) state.running = false;
    cancelAnimationFrame(state?.raf || 0);
    ui.overlay.classList.remove('is-open');
    ui.overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('pulse-run-open');
    interfaceSound('drawer-close');
    (lastFocus || document.getElementById('pulse-run-launch-btn'))?.focus?.({ preventScroll:true });
  }

  function bind() {
    ui = {
      overlay: document.getElementById('pulse-run-overlay'),
      stage: document.getElementById('pulse-run-stage'),
      canvas: document.getElementById('pulse-run-canvas'),
      message: document.getElementById('pulse-run-message'),
      year: document.getElementById('pulse-run-year'),
      score: document.getElementById('pulse-run-score'),
      stability: document.getElementById('pulse-run-stability')
    };
    if (!ui.overlay || !ui.canvas) return;
    ctx = ui.canvas.getContext('2d');
    resetState();
    fitCanvas();
    draw();
    document.getElementById('pulse-run-launch-btn')?.addEventListener('click', openGame);
    document.getElementById('pulse-run-close')?.addEventListener('click', closeGame);
    document.getElementById('pulse-run-up')?.addEventListener('click', () => moveLane(-1));
    document.getElementById('pulse-run-down')?.addEventListener('click', () => moveLane(1));
    ui.overlay.addEventListener('click', event => {
      if (event.target === ui.overlay) closeGame();
      if (event.target.closest('#pulse-run-start, #pulse-run-replay')) startGame();
    });
    ui.stage.addEventListener('pointerdown', event => { pointerStart = { x:event.clientX, y:event.clientY }; });
    ui.stage.addEventListener('pointerup', event => {
      if (!pointerStart || !state?.running) return;
      const deltaY = event.clientY - pointerStart.y;
      if (Math.abs(deltaY) > 28) moveLane(deltaY < 0 ? -1 : 1);
      else {
        const rect = ui.stage.getBoundingClientRect();
        setLane(Math.floor(clamp((event.clientY - rect.top) / rect.height, 0, .999) * 3));
      }
      pointerStart = null;
    });
    document.addEventListener('keydown', event => {
      if (!ui.overlay.classList.contains('is-open')) return;
      if (event.key === 'Escape') { closeGame(); return; }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); moveLane(-1); }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); moveLane(1); }
    });
    window.addEventListener('resize', fitCanvas, { passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
