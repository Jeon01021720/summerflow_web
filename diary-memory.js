(() => {
  const diary = document.querySelector('.charm-diary');
  if (!diary || diary.dataset.sfMemoryReady === '1') return;
  diary.dataset.sfMemoryReady = '1';

  const CLICK_THRESHOLD = 7;
  let down = null;
  let root = null;
  let viewportTracking = false;

  function closeLegacyDestination() {
    const legacy = document.querySelector('.destination-view');
    if (!legacy) return;
    legacy.classList.remove('is-open');
    legacy.setAttribute('aria-hidden', 'true');
  }

  function viewportMetrics() {
    const viewport = window.visualViewport;
    return {
      left: viewport ? viewport.pageLeft : (window.scrollX || 0),
      top: viewport ? viewport.pageTop : (window.scrollY || document.documentElement.scrollTop || 0),
      width: viewport ? viewport.width : window.innerWidth,
      height: viewport ? viewport.height : window.innerHeight,
    };
  }

  function syncViewport() {
    if (!root) return;
    const { left, top, width, height } = viewportMetrics();
    root.style.setProperty('--sf-memory-left', `${left}px`);
    root.style.setProperty('--sf-memory-top', `${top}px`);
    root.style.setProperty('--sf-memory-vw', `${Math.max(1, width)}px`);
    root.style.setProperty('--sf-memory-vh', `${Math.max(1, height)}px`);

    const board = root.querySelector('.sf-memory-board');
    if (!board) return;
    board.style.setProperty('--sf-memory-fit', '1');
    const naturalWidth = Math.max(1, board.offsetWidth);
    const naturalHeight = Math.max(1, board.offsetHeight);
    const safeX = 12;
    const safeY = 12;
    const fit = Math.min(
      1,
      Math.max(.35, (width - safeX * 2) / naturalWidth),
      Math.max(.35, (height - safeY * 2) / naturalHeight)
    );
    board.style.setProperty('--sf-memory-fit', String(fit));
  }

  function startViewportTracking() {
    if (viewportTracking) return;
    viewportTracking = true;
    syncViewport();
    window.addEventListener('resize', syncViewport, { passive: true });
    window.addEventListener('scroll', syncViewport, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewport, { passive: true });
      window.visualViewport.addEventListener('scroll', syncViewport, { passive: true });
    }
  }

  function stopViewportTracking() {
    if (!viewportTracking) return;
    viewportTracking = false;
    window.removeEventListener('resize', syncViewport);
    window.removeEventListener('scroll', syncViewport);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', syncViewport);
      window.visualViewport.removeEventListener('scroll', syncViewport);
    }
  }

  function blockBackgroundScroll(event) {
    if (root?.classList.contains('is-open')) event.preventDefault();
  }

  function togglePiece(button) {
    const active = !button.classList.contains('is-picked');
    root?.querySelectorAll('.sf-memory-piece.is-picked').forEach((piece) => {
      if (piece === button) return;
      piece.classList.remove('is-picked');
      piece.setAttribute('aria-pressed', 'false');
    });
    button.classList.toggle('is-picked', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function buildMemory() {
    if (root) return root;

    root = document.createElement('section');
    root.className = 'sf-memory-page';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-label', 'Summerflow memory capsule');
    root.innerHTML = `
      <div class="sf-memory-board" role="dialog" aria-modal="true" aria-label="Memory Capsule 01">
        <div class="sf-memory-head">
          <b>MEMORY CAPSULE 01</b>
          <span>found inside summerflow</span>
        </div>
        <button class="sf-memory-close" type="button" aria-label="Close memory capsule">×</button>

        <img class="sf-memory-diary" src="./assets/web/diary.png" alt="" aria-hidden="true" draggable="false" />

        <button class="sf-memory-piece sf-memory-photo" type="button" aria-label="Pick up a summer photo" aria-pressed="false">
          <img src="./assets/scrapbook/SF_Polpic.png" alt="" draggable="false" />
        </button>

        <button class="sf-memory-piece sf-memory-memo" type="button" aria-label="Pick up a tiny summer memo" aria-pressed="false">
          <img src="./assets/scrapbook/SF_Memo.png" alt="" draggable="false" />
        </button>

        <button class="sf-memory-piece sf-memory-ticket" type="button" aria-label="Pick up the festival ticket" aria-pressed="false">
          <small>KEEP THIS STUB</small>
          <strong>YONSEI · FESTIVAL SEASON</strong>
          <em>SUMMER 2026 / ADMIT ONE ♡</em>
        </button>

        <button class="sf-memory-piece sf-memory-note" type="button" aria-label="Pick up the Summerflow note" aria-pressed="false">
          <span>we wanted to make something you'd remember wearing.</span>
          <small>— a note from summerflow</small>
        </button>

        <button class="sf-memory-piece sf-memory-strip" type="button" aria-label="Pick up a memory label" aria-pressed="false">
          MADE FOR LONG DAYS & LATE NIGHTS ✦
        </button>

        <button class="sf-memory-piece sf-memory-date" type="button" aria-label="Pick up the date stamp" aria-pressed="false">
          09 · 2026 · YONSEI
        </button>

        <p class="sf-memory-ending">a little piece of summer we wanted to keep ♡</p>
      </div>`;

    root.querySelector('.sf-memory-close')?.addEventListener('click', closeMemory);
    root.querySelectorAll('.sf-memory-piece').forEach((piece) => {
      piece.addEventListener('click', () => togglePiece(piece));
    });
    root.addEventListener('pointerdown', (event) => {
      if (event.target === root) closeMemory();
    });
    root.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    root.addEventListener('touchmove', blockBackgroundScroll, { passive: false });
    document.body.append(root);
    return root;
  }

  function openMemory() {
    closeLegacyDestination();
    const page = buildMemory();
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sf-memory-open');
    startViewportTracking();
    requestAnimationFrame(() => {
      syncViewport();
      requestAnimationFrame(() => {
        syncViewport();
        page.classList.add('is-open');
        page.querySelector('.sf-memory-close')?.focus({ preventScroll: true });
      });
    });
  }

  function closeMemory() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    root.querySelectorAll('.sf-memory-piece.is-picked').forEach((piece) => {
      piece.classList.remove('is-picked');
      piece.setAttribute('aria-pressed', 'false');
    });
    stopViewportTracking();
    document.body.classList.remove('sf-memory-open');
    window.setTimeout(() => root?.setAttribute('aria-hidden', 'true'), 280);
    diary.focus({ preventScroll: true });
  }

  diary.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  diary.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance <= CLICK_THRESHOLD) queueMicrotask(openMemory);
  });

  diary.addEventListener('pointercancel', () => { down = null; });
  diary.addEventListener('click', (event) => {
    if (event.detail === 0) queueMicrotask(openMemory);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root?.classList.contains('is-open')) {
      event.preventDefault();
      closeMemory();
    }
  });
})();
