(() => {
  const cd = document.querySelector('.charm-cd');
  if (!cd || cd.dataset.sfSpotifyReady === '1') return;
  cd.dataset.sfSpotifyReady = '1';

  const CLICK_THRESHOLD = 7;
  const SPOTIFY_URL = '';
  let down = null;
  let root = null;

  function closeLegacyDestination() {
    const legacy = document.querySelector('.destination-view');
    if (!legacy) return;
    legacy.classList.remove('is-open');
    legacy.setAttribute('aria-hidden', 'true');
  }

  function linkAttrs() {
    return SPOTIFY_URL
      ? `href="${SPOTIFY_URL}" target="_blank" rel="noopener noreferrer"`
      : 'href="#" aria-disabled="true"';
  }

  function buildWidget() {
    if (root) return root;

    root = document.createElement('section');
    root.className = 'sf-spotify-page';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-label', 'Summerflow Spotify playlist');
    root.innerHTML = `
      <div class="sf-spotify-widget" role="dialog" aria-modal="true" aria-label="Summerflow playlist share">
        <div class="sf-spotify-widget-head">
          <span>summerflow shared a playlist ♡</span>
          <button class="sf-spotify-close" type="button" aria-label="Close playlist">×</button>
        </div>

        <div class="sf-spotify-share-card">
          <div class="sf-spotify-brandline">
            <span class="sf-spotify-dot" aria-hidden="true">●</span>
            <strong>SPOTIFY</strong>
            <span class="sf-spotify-pill">PLAYLIST</span>
          </div>

          <div class="sf-spotify-cover">
            <img src="./assets/logo-web/logo.png" alt="Summerflow" />
          </div>

          <div class="sf-spotify-copy">
            <h1>Summerflow Playlist</h1>
            <p>songs we're listening to this summer</p>
          </div>

          <div class="sf-spotify-mini-list" aria-label="Playlist preview">
            <div><span>01</span><strong>track title</strong><small>artist</small></div>
            <div><span>02</span><strong>track title</strong><small>artist</small></div>
            <div><span>03</span><strong>track title</strong><small>artist</small></div>
          </div>

          <a class="sf-spotify-open" ${linkAttrs()}>OPEN IN SPOTIFY <span>↗</span></a>
        </div>

        <div class="sf-spotify-widget-foot">for festival days, late afternoons & tiny summer memories</div>
      </div>`;

    root.querySelector('.sf-spotify-close')?.addEventListener('click', closeWidget);
    root.addEventListener('pointerdown', (event) => {
      if (event.target === root) closeWidget();
    });
    root.querySelectorAll('a[aria-disabled="true"]').forEach((link) => {
      link.addEventListener('click', (event) => event.preventDefault());
    });
    document.body.append(root);
    return root;
  }

  function openWidget() {
    closeLegacyDestination();
    const page = buildWidget();
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sf-spotify-open');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => page.classList.add('is-open'));
    });
  }

  function closeWidget() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('sf-spotify-open');
    window.setTimeout(() => root?.setAttribute('aria-hidden', 'true'), 260);
    cd.focus({ preventScroll: true });
  }

  cd.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  cd.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance <= CLICK_THRESHOLD) queueMicrotask(openWidget);
  });

  cd.addEventListener('pointercancel', () => { down = null; });
  cd.addEventListener('click', (event) => {
    if (event.detail === 0) queueMicrotask(openWidget);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root?.classList.contains('is-open')) {
      event.preventDefault();
      closeWidget();
    }
  });
})();
