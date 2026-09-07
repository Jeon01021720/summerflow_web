(() => {
  const camera = document.querySelector('.charm-camera');
  if (!camera || camera.dataset.sfCameraTransitionReady === '1') return;
  camera.dataset.sfCameraTransitionReady = '1';

  const FRONT_SRC = camera.querySelector('img')?.getAttribute('src') || './assets/web/camera.png';
  const BACK_SRC = './assets/web/SF_polaroid_rotate.webp';
  const CLICK_THRESHOLD = 7;
  let pointerStart = null;
  let running = false;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function rotationFromTransform(transform) {
    if (!transform || transform === 'none') return 0;
    const match = transform.match(/^matrix\(([^)]+)\)$/);
    if (!match) return 0;
    const parts = match[1].split(',').map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return 0;
    return Math.atan2(parts[1], parts[0]) * 180 / Math.PI;
  }

  function closeExistingDestinationImmediately() {
    const view = document.querySelector('.destination-view');
    if (!view) return;
    view.classList.remove('is-open');
    view.setAttribute('aria-hidden', 'true');
  }

  function showLookbookDestination() {
    const view = document.querySelector('.destination-view');
    if (!view) return;
    view.querySelector('[data-view-title]')?.replaceChildren(document.createTextNode('LOOKBOOK'));
    view.querySelector('[data-view-copy]')?.replaceChildren(document.createTextNode('model shots & summer snapshots — placeholder'));
    view.querySelector('[data-view-icon]')?.replaceChildren(document.createTextNode('▣'));
    view.querySelector('[data-view-kicker]')?.replaceChildren(document.createTextNode('CAMERA'));
    view.classList.add('is-open');
    view.setAttribute('aria-hidden', 'false');
    view.querySelector('.home-button')?.focus({ preventScroll: true });
  }

  function targetBox() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = Math.min(w * (w <= 700 ? 0.94 : 0.72), h * (w <= 700 ? 0.62 : 0.76), 720);
    const finalSize = Math.max(250, size);
    return { width: finalSize, height: finalSize, left: (w - finalSize) / 2, top: (h - finalSize) / 2 };
  }

  function buildTransition(rect) {
    const backdrop = document.createElement('div');
    backdrop.className = 'sf-camera-transition-backdrop';

    const shell = document.createElement('div');
    shell.className = 'sf-camera-transition-shell';
    Object.assign(shell.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    const flipper = document.createElement('div');
    flipper.className = 'sf-camera-transition-flipper';

    const img = document.createElement('img');
    img.className = 'sf-camera-transition-image';
    img.alt = '';
    img.draggable = false;
    img.src = FRONT_SRC;

    const lcd = document.createElement('div');
    lcd.className = 'sf-camera-transition-lcd';

    const placeholder = document.createElement('div');
    placeholder.className = 'sf-camera-transition-placeholder';
    placeholder.innerHTML = '<div><strong>MODEL SHOT</strong><span>PHOTO SOON / LOOKBOOK 03</span></div>';

    lcd.append(placeholder);
    flipper.append(img, lcd);
    shell.append(flipper);
    document.body.append(backdrop, shell);
    return { backdrop, shell, flipper, img, lcd };
  }

  async function playTransition() {
    if (running) return;
    running = true;
    closeExistingDestinationImmediately();

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rect = camera.getBoundingClientRect();
    const currentRotation = rotationFromTransform(getComputedStyle(camera).transform);
    const target = targetBox();
    const ui = buildTransition(rect);

    document.body.classList.add('sf-camera-transition-active');
    requestAnimationFrame(() => ui.backdrop.classList.add('is-visible'));

    try {
      if (reduced) {
        Object.assign(ui.shell.style, {
          left: `${target.left}px`,
          top: `${target.top}px`,
          width: `${target.width}px`,
          height: `${target.height}px`
        });
        ui.img.src = BACK_SRC;
        ui.shell.classList.add('is-back');
        ui.lcd.classList.add('is-on');
        await sleep(850);
      } else {
        const move = ui.shell.animate([
          { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` },
          { left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }
        ], { duration: 560, easing: 'cubic-bezier(.16,.84,.2,1)', fill: 'forwards' });

        const settle = ui.flipper.animate([
          { transform: `rotateZ(${currentRotation}deg) rotateY(0deg)` },
          { transform: 'rotateZ(0deg) rotateY(0deg)' }
        ], { duration: 560, easing: 'cubic-bezier(.16,.84,.2,1)', fill: 'forwards' });

        await Promise.all([move.finished, settle.finished]);

        await ui.flipper.animate([
          { transform: 'rotateZ(0deg) rotateY(0deg)' },
          { transform: 'rotateZ(-1deg) rotateY(90deg)' }
        ], { duration: 210, easing: 'cubic-bezier(.55,.05,.72,.34)', fill: 'forwards' }).finished;

        ui.img.src = BACK_SRC;
        ui.shell.classList.add('is-back');
        ui.flipper.style.transform = 'rotateZ(1deg) rotateY(-90deg)';

        await ui.flipper.animate([
          { transform: 'rotateZ(1deg) rotateY(-90deg)' },
          { transform: 'rotateZ(0deg) rotateY(0deg)' }
        ], { duration: 270, easing: 'cubic-bezier(.18,.76,.22,1)', fill: 'forwards' }).finished;

        await sleep(160);
        ui.lcd.classList.add('is-on');
        await sleep(950);
      }

      ui.shell.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.035)' }
      ], { duration: reduced ? 1 : 220, easing: 'ease-out', fill: 'forwards' });

      ui.backdrop.classList.remove('is-visible');
      await sleep(reduced ? 1 : 170);
      showLookbookDestination();
    } catch (error) {
      console.warn('[Summerflow] camera transition fallback', error);
      showLookbookDestination();
    } finally {
      ui.shell.remove();
      await sleep(reduced ? 1 : 120);
      ui.backdrop.remove();
      document.body.classList.remove('sf-camera-transition-active');
      running = false;
    }
  }

  camera.addEventListener('pointerdown', (event) => {
    if (!running) pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  camera.addEventListener('pointerup', (event) => {
    if (running || !pointerStart || pointerStart.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (distance > CLICK_THRESHOLD) return;
    closeExistingDestinationImmediately();
    playTransition();
  });

  camera.addEventListener('pointercancel', () => { pointerStart = null; });
  camera.addEventListener('click', (event) => {
    if (!running && event.detail === 0) {
      closeExistingDestinationImmediately();
      playTransition();
    }
  });
})();
