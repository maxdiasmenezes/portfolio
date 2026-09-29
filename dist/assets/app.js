(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reducedMotion.matches;
  try { const saved = localStorage.getItem('portfolio-motion'); if (saved) motion = saved === 'on'; } catch (_) {}
  const motionButton = document.getElementById('motion-toggle');
  let canvasFrame = 0;
  let workspaceVisible = false;

  function setMotion(enabled, remember = false) {
    motion = enabled;
    root.dataset.motion = enabled ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(enabled));
    motionButton.querySelector('.motion-label').textContent = enabled ? 'Pause motion' : 'Enable motion';
    motionButton.querySelector('.motion-icon').textContent = enabled ? 'Ⅱ' : '▷';
    if (remember) { try { localStorage.setItem('portfolio-motion', root.dataset.motion); } catch (_) {} }
    cancelAnimationFrame(canvasFrame); canvasFrame = 0;
    if (typeof drawWorkspace === 'function') drawWorkspace(performance.now());
  }
  motionButton.addEventListener('click', () => setMotion(!motion, true));
  reducedMotion.addEventListener('change', event => setMotion(!event.matches));
  // Set preference before registering animated observers.
  root.dataset.motion = motion ? 'on' : 'off';

  const menuButton = document.querySelector('.mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
  menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.matchMedia('(min-width: 561px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });

  // Reveal once, so scrolling back never hides information.
  if ('IntersectionObserver' in window) {
    root.classList.add('animate-reveals');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  const stage = document.querySelector('.robot-stage');
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', event => {
    if (!motion || event.pointerType === 'touch') return;
    const box = hero.getBoundingClientRect();
    stage.style.setProperty('--px', ((event.clientX - box.left) / box.width - 0.5) * 14 + 'px');
    stage.style.setProperty('--py', ((event.clientY - box.top) / box.height - 0.5) * 12 + 'px');
  });
  hero.addEventListener('pointerleave', () => { stage.style.setProperty('--px', '0px'); stage.style.setProperty('--py', '0px'); });

  const progress = document.querySelector('.scroll-progress');
  let scrollQueued = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();

  // Native dialogs supply focus management, keyboard support, and Escape closing.
  document.querySelectorAll('.project-open').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById('dialog-' + button.dataset.project);
      dialog.showModal(); document.body.classList.add('has-modal');
    });
  });
  document.querySelectorAll('.project-dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { const box = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close(); });
    dialog.addEventListener('close', () => document.body.classList.remove('has-modal'));
  });

  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.querySelector('.copy-status');
  let copyTimer;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      copyStatus.textContent = 'Email copied.';
    } catch (_) { copyStatus.textContent = 'Select the email address to copy it.'; }
    clearTimeout(copyTimer); copyTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4000);
  });

  // Illustrative workspace diagram. Coordinates are decorative, not research data.
  const canvas = document.getElementById('workspace-canvas');
  const context = canvas.getContext('2d');
  let canvasWidth = 0, canvasHeight = 0;
  function resizeCanvas() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = box.width; canvasHeight = box.height;
    canvas.width = Math.round(box.width * ratio); canvas.height = Math.round(box.height * ratio);
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!motion || !workspaceVisible) drawWorkspace(performance.now());
  }
  function drawWorkspace(now) {
    if (!context || !canvasWidth || !canvasHeight) return;
    const ctx = context, w = canvasWidth, h = canvasHeight;
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w * 0.66, h * 0.84);
    const centerX = w * 0.5, centerY = h * 0.55;
    const project = (x, y, z = 0) => ({ x: centerX + (x - y) * scale * 0.60, y: centerY + (x + y) * scale * 0.25 - z * scale * 0.7 });
    const line = (a, b, color, width = 1) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    for (let i = -5; i <= 5; i++) { const n = i / 5; line(project(-1, n), project(1, n), '#7999b320'); line(project(n, -1), project(n, 1), '#7999b320'); }
    // Reach envelope shown as a wireframe dome, a geometric engineering diagram.
    for (let elevation = 0; elevation <= 4; elevation++) {
      const angle = elevation * Math.PI / 10;
      const radius = Math.cos(angle) * 0.84;
      const height = Math.sin(angle) * 0.84;
      ctx.beginPath();
      for (let j = 0; j <= 80; j++) { const t = j / 80 * Math.PI * 2; const p = project(Math.cos(t) * radius, Math.sin(t) * radius, height); if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
      ctx.strokeStyle = elevation === 0 ? '#77b0e765' : '#71a8d532'; ctx.lineWidth = 1; ctx.stroke();
    }
    for (let segment = 0; segment < 12; segment++) {
      const a = segment / 12 * Math.PI * 2; ctx.beginPath();
      for (let j = 0; j <= 20; j++) { const t = j / 20 * Math.PI / 2; const p = project(Math.cos(a) * Math.cos(t) * .84, Math.sin(a) * Math.cos(t) * .84, Math.sin(t) * .84); if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
      ctx.strokeStyle = '#71a8d52b'; ctx.stroke();
    }
    const selected = motion ? Math.floor(now / 500) % 81 : 42;
    for (let i = 0; i < 81; i++) {
      const p = project((i % 9 - 4) / 5, (Math.floor(i / 9) - 4) / 5);
      const active = i === selected;
      ctx.beginPath(); ctx.arc(p.x, p.y, active ? 4 : 1.8, 0, Math.PI * 2); ctx.fillStyle = active ? '#d6fb70' : '#8fc4e77d'; ctx.fill();
      if (active) { ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.strokeStyle = '#d6fb7050'; ctx.stroke(); }
    }
    const origin = project(0, 0), xAxis = project(1.12, 0), yAxis = project(0, 1.12), zAxis = project(0, 0, 1.1);
    line(origin, xAxis, '#d6fb7080'); line(origin, yAxis, '#84baff80'); line(origin, zAxis, '#b5c7dd80');
    ctx.font = '10px monospace'; ctx.fillStyle = '#9bb4ce'; ctx.fillText('X', xAxis.x + 7, xAxis.y + 4); ctx.fillText('Y', yAxis.x - 12, yAxis.y + 4); ctx.fillText('Z', zAxis.x - 3, zAxis.y - 8);
    if (motion && workspaceVisible && !document.hidden) canvasFrame = requestAnimationFrame(drawWorkspace);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas); else window.addEventListener('resize', resizeCanvas);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { workspaceVisible = entries[0].isIntersecting; cancelAnimationFrame(canvasFrame); canvasFrame = 0; drawWorkspace(performance.now()); }, { threshold: 0 }).observe(canvas);
  } else workspaceVisible = true;
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(canvasFrame); canvasFrame = 0; if (!document.hidden) drawWorkspace(performance.now()); });
  resizeCanvas();
  setMotion(motion);
})();
