(() => {
  const camera = document.querySelector('.charm-camera');
  if (!camera || camera.dataset.sfCameraGalleryReady === '2') return;
  camera.dataset.sfCameraGalleryReady = '2';

  const FRONT = camera.querySelector('img')?.getAttribute('src') || './assets/web/camera.png';
  const BACK = './assets/web/camera-back.png';
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let down = null;
  let busy = false;
  let galleryOpen = false;

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = async () => {
        try {
          if (img.decode) await img.decode();
          resolve(src);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  const backReady = preloadImage(BACK);

  function closeLegacy() {
    const view = document.querySelector('.destination-view');
    if (!view) return;
    view.classList.remove('is-open');
    view.setAttribute('aria-hidden', 'true');
  }

  function cameraBox() {
    const w = innerWidth;
    const h = innerHeight;
    const size = Math.max(260, Math.min(w * (w <= 700 ? 0.94 : 0.72), h * 0.76, 720));
    return { left: (w - size) / 2, top: (h - size) / 2, width: size, height: size };
  }

  function galleryBox() {
    const w = innerWidth;
    const h = innerHeight;
    const mx = w <= 700 ? 14 : Math.max(34, w * 0.08);
    const my = w <= 700 ? 28 : Math.max(38, h * 0.08);
    const width = Math.min(w - mx * 2, 980);
    const height = Math.min(h - my * 2, w <= 700 ? h * 0.80 : 690);
    return { left: (w - width) / 2, top: (h - height) / 2, width, height };
  }

  function makeTransition(rect) {
    const bg = document.createElement('div');
    bg.className = 'sf-camera-transition-backdrop';

    const shell = document.createElement('div');
    shell.className = 'sf-camera-transition-shell';
    Object.assign(shell.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    const flip = document.createElement('div');
    flip.className = 'sf-camera-transition-flipper';

    const img = document.createElement('img');
    img.className = 'sf-camera-transition-image';
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.src = FRONT;

    const lcd = document.createElement('div');
    lcd.className = 'sf-camera-transition-lcd';
    lcd.innerHTML = '<div class="sf-camera-transition-placeholder"><div><strong>LOOKBOOK</strong><span>LOADING</span></div></div>';

    flip.append(img, lcd);
    shell.append(flip);
    document.body.append(bg, shell);
    return { bg, shell, flip, img, lcd };
  }

  function makeGallery(start, bg) {
    const root = document.createElement('section');
    root.className = 'sf-lookbook-gallery sf-lookbook-ready';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Summerflow Lookbook coming soon');
    Object.assign(root.style, {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`
    });

    const home = document.createElement('button');
    home.type = 'button';
    home.className = 'sf-lookbook-home sf-lookbook-ready-home';
    home.textContent = '← HOME';

    const view = document.createElement('div');
    view.className = 'sf-lookbook-ready-view';
    view.tabIndex = -1;
    view.innerHTML = `
      <div class="sf-lookbook-ready-center">
        <img class="sf-lookbook-ready-logo" src="./assets/logo-web/logo.png?v=1" alt="Summerflow" draggable="false" />
        <p class="sf-lookbook-ready-status">ON READY,,</p>
      </div>`;

    root.append(home, view);
    document.body.append(root);

    let closing = false;

    async function close() {
      if (closing) return;
      closing = true;
      root.classList.remove('is-ready');
      bg.classList.remove('is-gallery');
      await root.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(.985)' }
      ], { duration: 180, fill: 'forwards' }).finished.catch(() => {});
      root.remove();
      bg.classList.remove('is-visible');
      await sleep(120);
      bg.remove();
      document.body.classList.remove('sf-camera-transition-active', 'sf-lookbook-gallery-open');
      galleryOpen = false;
      busy = false;
      document.removeEventListener('keydown', keys);
      camera.focus({ preventScroll: true });
    }

    function keys(event) {
      if (!galleryOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener('keydown', keys);
    home.addEventListener('click', close);
    return { root, viewport: view };
  }

  async function open() {
    if (busy || galleryOpen) return;
    busy = true;
    closeLegacy();

    try {
      await backReady;
    } catch (error) {
      console.error('[Summerflow] camera back image failed to decode', error);
      busy = false;
      return;
    }

    const rect = camera.getBoundingClientRect();
    const target = cameraBox();
    const ui = makeTransition(rect);
    document.body.classList.add('sf-camera-transition-active');
    requestAnimationFrame(() => ui.bg.classList.add('is-visible'));

    try {
      const move = ui.shell.animate([
        { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` },
        { left: `${target.left}px`, top: `${target.top}px`, width: `${target.width}px`, height: `${target.height}px` }
      ], { duration: 560, easing: 'cubic-bezier(.16,.84,.2,1)', fill: 'forwards' });
      await move.finished;

      await ui.flip.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(90deg)' }
      ], { duration: 210, easing: 'ease-in', fill: 'forwards' }).finished;

      ui.img.src = BACK;
      if (ui.img.decode) await ui.img.decode();
      ui.shell.classList.add('is-back');
      ui.flip.style.transform = 'rotateY(-90deg)';

      await ui.flip.animate([
        { transform: 'rotateY(-90deg)' },
        { transform: 'rotateY(0deg)' }
      ], { duration: 270, easing: 'cubic-bezier(.18,.76,.22,1)', fill: 'forwards' }).finished;

      await sleep(100);
      ui.lcd.classList.add('is-on');
      await sleep(420);

      const start = ui.lcd.getBoundingClientRect();
      const gallery = makeGallery(start, ui.bg);
      const end = galleryBox();
      document.body.classList.add('sf-lookbook-gallery-open');
      ui.bg.classList.add('is-gallery');

      await Promise.all([
        gallery.root.animate([
          { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px`, borderRadius: '10px' },
          { left: `${end.left}px`, top: `${end.top}px`, width: `${end.width}px`, height: `${end.height}px`, borderRadius: '24px' }
        ], { duration: 620, easing: 'cubic-bezier(.16,.84,.2,1)', fill: 'forwards' }).finished,
        ui.shell.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 80, fill: 'forwards' }).finished
      ]);

      ui.shell.remove();
      galleryOpen = true;
      busy = false;
      gallery.root.classList.add('is-ready');
      gallery.viewport.focus({ preventScroll: true });
    } catch (error) {
      console.error('[Summerflow] camera lookbook transition failed', error);
      ui.shell.remove();
      ui.bg.remove();
      document.body.classList.remove('sf-camera-transition-active', 'sf-lookbook-gallery-open');
      busy = false;
      galleryOpen = false;
    }
  }

  camera.addEventListener('pointerdown', (event) => {
    if (!busy && !galleryOpen) down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  camera.addEventListener('pointerup', (event) => {
    if (busy || galleryOpen || !down || down.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance <= 7) {
      closeLegacy();
      open();
    }
  });

  camera.addEventListener('pointercancel', () => { down = null; });
  camera.addEventListener('click', (event) => {
    if (event.detail === 0 && !busy && !galleryOpen) {
      closeLegacy();
      open();
    }
  });
})();
