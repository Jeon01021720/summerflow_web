(() => {
  const cd = document.querySelector('.charm-cd');
  if (!cd || cd.dataset.sfSpotifyReady === '1') return;
  cd.dataset.sfSpotifyReady = '1';

  const CLICK_THRESHOLD = 7;
  const SPOTIFY_URL = '';
  let down = null;
  let root = null;
  let savedScrollY = 0;
  let pageLocked = false;
  let bodyStyle = null;
  let viewportTracking = false;

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

  function installViewportFix() {
    if (document.getElementById('sf-spotify-viewport-fix')) return;
    const style = document.createElement('style');
    style.id = 'sf-spotify-viewport-fix';
    style.textContent = `
      .sf-spotify-page{
        top:var(--sf-vv-top,0px)!important;
        bottom:auto!important;
        height:var(--sf-vv-height,100dvh)!important;
        min-height:0!important;
        display:flex!important;
        align-items:flex-start!important;
        justify-content:center!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
      }
      .sf-spotify-page .sf-zine-wrap{
        flex:0 0 auto;
        margin:auto 0!important;
      }
      @media(max-height:700px){
        .sf-spotify-page .sf-zine-sheet{transform:none!important}
      }
    `;
    document.head.append(style);
  }

  function syncVisualViewport() {
    if (!root) return;
    const viewport = window.visualViewport;
    const top = viewport ? viewport.offsetTop : 0;
    const height = viewport ? viewport.height : window.innerHeight;
    root.style.setProperty('--sf-vv-top', `${Math.max(0, top)}px`);
    root.style.setProperty('--sf-vv-height', `${Math.max(1, height)}px`);
  }

  function startViewportTracking() {
    if (viewportTracking) return;
    viewportTracking = true;
    syncVisualViewport();
    window.addEventListener('resize', syncVisualViewport, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncVisualViewport, { passive: true });
      window.visualViewport.addEventListener('scroll', syncVisualViewport, { passive: true });
    }
  }

  function stopViewportTracking() {
    if (!viewportTracking) return;
    viewportTracking = false;
    window.removeEventListener('resize', syncVisualViewport);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', syncVisualViewport);
      window.visualViewport.removeEventListener('scroll', syncVisualViewport);
    }
  }

  function lockPage() {
    if (pageLocked) return;
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const style = document.body.style;
    bodyStyle = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };
    style.position = 'fixed';
    style.top = `-${savedScrollY}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
    style.overflow = 'hidden';
    pageLocked = true;
  }

  function unlockPage() {
    if (!pageLocked) return;
    const style = document.body.style;
    style.position = bodyStyle?.position || '';
    style.top = bodyStyle?.top || '';
    style.left = bodyStyle?.left || '';
    style.right = bodyStyle?.right || '';
    style.width = bodyStyle?.width || '';
    style.overflow = bodyStyle?.overflow || '';
    pageLocked = false;
    bodyStyle = null;
    window.scrollTo(0, savedScrollY);
  }

  function buildWidget() {
    if (root) return root;

    installViewportFix();
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
    lockPage();
    page.setAttribute('aria-hidden', 'false');
    page.scrollTop = 0;
    document.body.classList.add('sf-spotify-open');
    startViewportTracking();
    requestAnimationFrame(() => {
      syncVisualViewport();
      requestAnimationFrame(() => {
        page.classList.add('is-open');
        page.querySelector('.sf-spotify-close')?.focus({ preventScroll: true });
      });
    });
  }

  function closeWidget() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    stopViewportTracking();
    document.body.classList.remove('sf-spotify-open');
    unlockPage();
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
