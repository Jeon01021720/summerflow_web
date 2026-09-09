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

  function spotifyLinkAttrs() {
    return SPOTIFY_URL
      ? `href="${SPOTIFY_URL}" target="_blank" rel="noopener noreferrer"`
      : 'href="#" aria-disabled="true"';
  }

  function buildPage() {
    if (root) return root;

    root = document.createElement('section');
    root.className = 'sf-spotify-page';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-label', 'Summerflow Spotify playlist');
    root.innerHTML = `
      <div class="sf-spotify-window" role="dialog" aria-modal="true" aria-label="Summerflow playlist on Spotify">
        <aside class="sf-spotify-sidebar">
          <div class="sf-spotify-brand">SUMMERFLOW</div>
          <nav class="sf-spotify-nav" aria-label="Playlist navigation">
            <button class="is-active" type="button"><span>⌂</span> Home</button>
            <button type="button"><span>⌕</span> Search</button>
          </nav>
          <div class="sf-spotify-library-head"><span>Your Library</span><span>＋</span></div>
          <div class="sf-spotify-library-card">
            <div class="sf-spotify-mini-cover"><img src="./assets/logo-web/logo.png" alt="" /></div>
            <div><strong>Summerflow Playlist</strong><span>Playlist · Summerflow</span></div>
          </div>
          <div class="sf-spotify-library-card muted">
            <div class="sf-spotify-mini-cover alt">♡</div>
            <div><strong>Liked Songs</strong><span>Playlist</span></div>
          </div>
          <div class="sf-spotify-sidebar-foot">music for festival season ♡</div>
        </aside>

        <main class="sf-spotify-main">
          <header class="sf-spotify-topbar">
            <div class="sf-spotify-history" aria-hidden="true"><span>‹</span><span>›</span></div>
            <button class="sf-spotify-home" type="button">← HOME</button>
          </header>

          <section class="sf-spotify-hero">
            <div class="sf-spotify-cover"><img src="./assets/logo-web/logo.png" alt="Summerflow" /></div>
            <div class="sf-spotify-hero-copy">
              <span class="sf-spotify-type">PUBLIC PLAYLIST</span>
              <h1>Summerflow<br />Playlist</h1>
              <p>songs we're listening to this summer ♡</p>
              <div class="sf-spotify-meta"><strong>Summerflow</strong><span>·</span><span>playlist link pending</span></div>
            </div>
          </section>

          <section class="sf-spotify-content">
            <div class="sf-spotify-actions">
              <a class="sf-spotify-play" ${spotifyLinkAttrs()} aria-label="Open Summerflow playlist in Spotify">▶</a>
              <button class="sf-spotify-save" type="button" aria-label="Save playlist preview">♡</button>
              <span class="sf-spotify-more" aria-hidden="true">•••</span>
            </div>

            <div class="sf-spotify-track-head"><span>#</span><span>TITLE</span><span class="album">ALBUM</span><span>◷</span></div>
            <div class="sf-spotify-tracks">
              ${[1,2,3,4,5,6].map((n) => `
                <div class="sf-spotify-track">
                  <span class="num">${n}</span>
                  <div class="track-title"><strong>Track ${String(n).padStart(2,'0')}</strong><span>artist / title will follow the Spotify playlist</span></div>
                  <span class="track-album album">Summerflow playlist</span>
                  <span class="track-time">—:—</span>
                </div>`).join('')}
            </div>
          </section>
        </main>

        <aside class="sf-spotify-now">
          <div class="sf-spotify-now-head"><strong>Summerflow Playlist</strong><span>•••</span></div>
          <div class="sf-spotify-now-cover"><img src="./assets/logo-web/logo.png" alt="" /></div>
          <div class="sf-spotify-now-copy"><strong>What we're listening to</strong><span>Summerflow</span></div>
          <div class="sf-spotify-note">
            <strong>About this playlist</strong>
            <p>A tiny playlist for festival days, late afternoons and the way summer feels.</p>
          </div>
          <a class="sf-spotify-open" ${spotifyLinkAttrs()}>OPEN IN SPOTIFY ↗</a>
        </aside>

        <footer class="sf-spotify-playerbar">
          <div class="sf-spotify-player-info">
            <div class="sf-spotify-player-thumb"><img src="./assets/logo-web/logo.png" alt="" /></div>
            <div><strong>Summerflow Playlist</strong><span>Open Spotify to listen</span></div>
          </div>
          <div class="sf-spotify-player-controls" aria-hidden="true"><span>↶</span><span>‹</span><span class="play">▶</span><span>›</span><span>↷</span></div>
          <div class="sf-spotify-player-side"><span>⌕</span><span>▤</span><span>▱</span></div>
        </footer>
      </div>`;

    root.querySelectorAll('a[aria-disabled="true"]').forEach((link) => {
      link.addEventListener('click', (event) => event.preventDefault());
    });

    root.querySelector('.sf-spotify-home')?.addEventListener('click', closePage);
    document.body.append(root);
    return root;
  }

  function openPage() {
    closeLegacyDestination();
    const page = buildPage();
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sf-spotify-open');
    requestAnimationFrame(() => {
      page.classList.add('is-open');
      page.querySelector('.sf-spotify-home')?.focus({ preventScroll: true });
    });
  }

  function closePage() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('sf-spotify-open');
    window.setTimeout(() => root?.setAttribute('aria-hidden', 'true'), 220);
    cd.focus({ preventScroll: true });
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && root?.classList.contains('is-open')) {
      event.preventDefault();
      closePage();
    }
  }

  cd.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });

  cd.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance <= CLICK_THRESHOLD) queueMicrotask(openPage);
  });

  cd.addEventListener('pointercancel', () => { down = null; });
  cd.addEventListener('click', (event) => {
    if (event.detail === 0) queueMicrotask(openPage);
  });
  document.addEventListener('keydown', onKeydown);
})();
