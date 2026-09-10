(() => {
  const hanger = document.querySelector('.charm-hanger');
  if (!hanger || hanger.dataset.sfClosetReady === '5') return;
  hanger.dataset.sfClosetReady = '5';

  const CLICK_THRESHOLD = 7;
  const pieces = [
    { name: 'Sky Slim Soccer Jersey', file: 'Sky Slim Soccer Jersey.png', fit: 1.03, y: 0 },
    { name: 'Victory 85 Off-shoulder Tee', file: 'Victory 85 Off-shoulder Tee.png', fit: 1.05, y: 0 },
    { name: 'Buried At Yonsei Tee', file: 'Buried At Yonsei Tee.png', fit: 1.03, y: 0 },
    { name: 'Yonsei 85 Baseball Dress', file: 'Yonsei 85 Baseball Dress.png', fit: 1.13, y: 0 },
    { name: 'Angel Wing Off-shoulder Tee', file: 'Angel Wing Off-shoulder Tee.png', fit: 1.06, y: 0 },
    { name: 'Navy Soccer Jersey', file: 'Navy Soccer Jersey.png', fit: 1.03, y: 0 },
    { name: 'Midnight Cross Bandana', file: 'Midnight Cross Bandana.png', fit: .98, y: 0 },
    { name: 'Yonsei Bangle', file: 'Yonsei Bangle.png', fit: .94, y: 0 },
    { name: 'Soda Dot Socks', file: 'Soda Dot Socks.png', fit: 1.00, y: 0 }
  ];
  const STEP = Math.PI * 2 / pieces.length;

  let root = null;
  let stage = null;
  let itemEls = [];
  let down = null;
  let drag = null;
  let tracking = false;
  let rotation = 0;
  let animationFrame = 0;
  let wheelLocked = false;

  function closeLegacyDestination() {
    const legacy = document.querySelector('.destination-view');
    if (!legacy) return;
    legacy.classList.remove('is-open');
    legacy.setAttribute('aria-hidden', 'true');
  }

  function assetPath(file) {
    return `./assets/web/${encodeURIComponent(file)}?v=3`;
  }

  function buildCloset() {
    if (root) return root;
    root = document.createElement('section');
    root.className = 'sf-closet-page';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-label', 'Summerflow product carousel');
    root.innerHTML = `
      <div class="sf-closet-shell" role="dialog" aria-modal="true" aria-label="Summerflow Closet 03">
        <header class="sf-closet-head">
          <div class="sf-closet-title">
            <small>CLOSET 03 · SUMMER 2026</small>
            <h1>things we’d<br>wear all summer</h1>
            <p>swipe left or right and look through the summerflow pieces ♡</p>
          </div>
          <button class="sf-closet-close" type="button" aria-label="Close closet">×</button>
        </header>
        <span class="sf-closet-star a" aria-hidden="true">✦</span>
        <span class="sf-closet-star b" aria-hidden="true">♡</span>
        <div class="sf-carousel-wrap">
          <button class="sf-rack-arrow sf-rack-prev" type="button" aria-label="Previous piece">‹</button>
          <div class="sf-product-stage" tabindex="0" aria-label="Summerflow products. Drag left or right to browse.">
            ${pieces.map((piece, index) => `
              <article class="sf-product-item" data-i="${index}" aria-label="${piece.name}" style="--product-fit:${piece.fit};--product-y:${piece.y}px">
                <img class="sf-product-image" src="${assetPath(piece.file)}" alt="${piece.name}" draggable="false" />
                <span class="sf-product-label">${piece.name}</span>
              </article>`).join('')}
          </div>
          <button class="sf-rack-arrow sf-rack-next" type="button" aria-label="Next piece">›</button>
        </div>
        <span class="sf-closet-hint">SWIPE · DRAG</span>
      </div>`;

    stage = root.querySelector('.sf-product-stage');
    itemEls = [...root.querySelectorAll('.sf-product-item')];

    root.querySelector('.sf-closet-close')?.addEventListener('click', closeCloset);
    root.querySelector('.sf-rack-prev')?.addEventListener('click', () => rotateBy(1));
    root.querySelector('.sf-rack-next')?.addEventListener('click', () => rotateBy(-1));
    root.addEventListener('pointerdown', (event) => {
      if (event.target === root) closeCloset();
    });

    stage?.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      drag = { id: event.pointerId, x: event.clientX, startRotation: rotation, moved: false };
      stage.setPointerCapture?.(event.pointerId);
      stage.classList.add('is-dragging');
      event.preventDefault();
    });

    stage?.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      drag.moved ||= Math.abs(dx) > 4;
      rotation = drag.startRotation + dx * 0.0065;
      renderCarousel();
      event.preventDefault();
    });

    const releaseDrag = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      stage.classList.remove('is-dragging');
      const moved = drag.moved;
      drag = null;
      if (moved) snapToNearest();
    };
    stage?.addEventListener('pointerup', releaseDrag);
    stage?.addEventListener('pointercancel', releaseDrag);

    stage?.addEventListener('wheel', (event) => {
      if (!root?.classList.contains('is-open')) return;
      event.preventDefault();
      if (wheelLocked) return;
      wheelLocked = true;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      rotateBy(delta > 0 ? -1 : 1);
      setTimeout(() => { wheelLocked = false; }, 260);
    }, { passive: false });

    stage?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        rotateBy(1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        rotateBy(-1);
      }
    });

    document.body.append(root);
    return root;
  }

  function renderCarousel() {
    if (!stage || !itemEls.length) return;
    const w = stage.clientWidth || 900;
    const h = stage.clientHeight || 560;
    const radiusX = Math.min(w * 0.42, 500);
    const centerX = w / 2;
    const centerY = Math.min(Math.max(h * 0.44, 180), 300);

    itemEls.forEach((item, index) => {
      const angle = rotation + index * STEP;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const depth = (cos + 1) / 2;
      const x = centerX + sin * radiusX;
      const y = centerY + (1 - depth) * 18;
      const scale = 0.46 + depth * 0.62;
      const opacity = 0.05 + Math.pow(depth, 1.55) * 0.95;
      const labelOpacity = Math.max(0, Math.min(1, (depth - 0.88) / 0.08));
      const blur = (1 - depth) * 1.8;

      item.style.setProperty('--product-x', `${x}px`);
      item.style.setProperty('--product-y-pos', `${y}px`);
      item.style.setProperty('--product-scale', scale.toFixed(3));
      item.style.setProperty('--product-opacity', opacity.toFixed(3));
      item.style.setProperty('--label-opacity', labelOpacity.toFixed(3));
      item.style.setProperty('--product-blur', `${blur.toFixed(2)}px`);
      item.style.zIndex = String(20 + Math.round(depth * 80));
      item.dataset.front = depth > 0.96 ? '1' : '0';
      item.setAttribute('aria-hidden', depth < 0.12 ? 'true' : 'false');
    });
  }

  function animateTo(target) {
    cancelAnimationFrame(animationFrame);
    const start = rotation;
    const change = target - start;
    const started = performance.now();
    const duration = 420;

    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      rotation = start + change * eased;
      renderCarousel();
      if (t < 1) animationFrame = requestAnimationFrame(tick);
      else animationFrame = 0;
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function rotateBy(direction) {
    const base = Math.round(rotation / STEP) * STEP;
    animateTo(base + direction * STEP);
  }

  function snapToNearest() {
    animateTo(Math.round(rotation / STEP) * STEP);
  }

  function metrics() {
    const vv = window.visualViewport;
    return {
      left: vv ? vv.pageLeft : (window.scrollX || 0),
      top: vv ? vv.pageTop : (window.scrollY || document.documentElement.scrollTop || 0),
      width: vv ? vv.width : window.innerWidth,
      height: vv ? vv.height : window.innerHeight
    };
  }

  function syncViewport() {
    if (!root) return;
    const m = metrics();
    root.style.setProperty('--sf-closet-left', `${m.left}px`);
    root.style.setProperty('--sf-closet-top', `${m.top}px`);
    root.style.setProperty('--sf-closet-width', `${Math.max(1, m.width)}px`);
    root.style.setProperty('--sf-closet-height', `${Math.max(1, m.height)}px`);
    renderCarousel();
  }

  function startTracking() {
    if (tracking) return;
    tracking = true;
    syncViewport();
    window.addEventListener('resize', syncViewport, { passive: true });
    window.addEventListener('scroll', syncViewport, { passive: true });
    window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
    window.visualViewport?.addEventListener('scroll', syncViewport, { passive: true });
  }

  function stopTracking() {
    if (!tracking) return;
    tracking = false;
    window.removeEventListener('resize', syncViewport);
    window.removeEventListener('scroll', syncViewport);
    window.visualViewport?.removeEventListener('resize', syncViewport);
    window.visualViewport?.removeEventListener('scroll', syncViewport);
  }

  function openCloset() {
    closeLegacyDestination();
    const page = buildCloset();
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sf-closet-open');
    startTracking();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      syncViewport();
      page.classList.add('is-open');
      renderCarousel();
      page.querySelector('.sf-closet-close')?.focus({ preventScroll: true });
    }));
  }

  function closeCloset() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('sf-closet-open');
    stopTracking();
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    setTimeout(() => root?.setAttribute('aria-hidden', 'true'), 280);
    hanger.focus({ preventScroll: true });
  }

  hanger.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  hanger.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance <= CLICK_THRESHOLD) queueMicrotask(openCloset);
  });
  hanger.addEventListener('pointercancel', () => { down = null; });
  hanger.addEventListener('click', (event) => {
    if (event.detail === 0) queueMicrotask(openCloset);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root?.classList.contains('is-open')) {
      event.preventDefault();
      closeCloset();
    }
  });
})();
