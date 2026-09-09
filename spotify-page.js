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
      <div class="sf-zine-wrap" role="dialog" aria-modal="true" aria-label="Summerflow mini playlist zine">
        <div class="sf-zine-topbar">
          <span>summerflow shared a tiny music note ♡</span>
          <button class="sf-spotify-close" type="button" aria-label="Close playlist">×</button>
        </div>

        <article class="sf-zine">
          <i class="sf-zine-paper sf-zine-paper-one" aria-hidden="true"></i>
          <i class="sf-zine-paper sf-zine-paper-two" aria-hidden="true"></i>

          <div class="sf-zine-sheet">
            <span class="sf-zine-tape" aria-hidden="true"></span>
            <span class="sf-zine-sparkles" aria-hidden="true">✦ ♡ ✷</span>

            <header class="sf-zine-masthead">
              <div>
                <span class="sf-zine-issue">MINI ISSUE 01</span>
                <strong>SUMMERFLOW RADIO</strong>
              </div>
              <span class="sf-zine-spotify"><b>●</b> SPOTIFY</span>
            </header>

            <section class="sf-zine-hero">
              <div class="sf-zine-logo-card">
                <img src="./assets/logo-web/logo.png" alt="Summerflow" />
              </div>
              <div class="sf-zine-intro">
                <span class="sf-zine-stamp">PLAYLIST NOTE</span>
                <h1>Summerflow<br />Playlist</h1>
                <p>songs for when summer stays a little longer ♡</p>
              </div>
            </section>

            <div class="sf-zine-divider" aria-hidden="true"><span>today's little rotation</span></div>

            <div class="sf-zine-tracks" aria-label="Playlist preview">
              <div class="sf-zine-track tone-pink"><span>01</span><strong>track title</strong><small>artist</small></div>
              <div class="sf-zine-track tone-lilac"><span>02</span><strong>track title</strong><small>artist</small></div>
              <div class="sf-zine-track tone-yellow"><span>03</span><strong>track title</strong><small>artist</small></div>
            </div>

            <footer class="sf-zine-footer">
              <p>festival days · late afternoons · tiny summer memories</p>
              <a class="sf-spotify-open" ${linkAttrs()}>OPEN IN SPOTIFY <span>↗</span></a>
            </footer>
          </div>
        </article>
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
      requestAnimationFrame(() => {
        page.classList.add('is-open');
        page.querySelector('.sf-spotify-close')?.focus({ preventScroll: true });
      });
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
