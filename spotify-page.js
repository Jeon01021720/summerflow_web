(() => {
  const cd = document.querySelector('.charm-cd');
  if (!cd || cd.dataset.sfSpotifyReady === '1') return;
  cd.dataset.sfSpotifyReady = '1';

  const CLICK_THRESHOLD = 7;
  const SPOTIFY_URL = 'https://open.spotify.com/playlist/1mYd4XNY1AXb4qY4LjpnS3?si=316516ec64ab4b18';
  let down = null;
  let root = null;
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
        position:absolute!important;
        inset:auto!important;
        left:var(--sf-page-left,0px)!important;
        top:var(--sf-page-top,0px)!important;
        width:var(--sf-vv-width,100vw)!important;
        height:var(--sf-vv-height,100dvh)!important;
        min-height:0!important;
        padding:0!important;
        display:grid!important;
        place-items:center!important;
        overflow:hidden!important;
        overscroll-behavior:none!important;
        touch-action:none!important;
      }
      .sf-spotify-page .sf-zine-wrap{
        flex:none!important;
        margin:0!important;
        transform-origin:50% 50%!important;
      }
      .sf-spotify-page:not(.is-open) .sf-zine-wrap{
        transform:translateY(16px) scale(var(--sf-fit-scale,1)) rotate(-.35deg)!important;
      }
      .sf-spotify-page.is-open .sf-zine-wrap{
        transform:translateY(0) scale(var(--sf-fit-scale,1)) rotate(-.35deg)!important;
      }
      @media(max-height:700px){
        .sf-spotify-page .sf-zine-sheet{transform:none!important}
      }
    `;
    document.head.append(style);
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

  function syncVisualViewport() {
    if (!root) return;
    const { left, top, width, height } = viewportMetrics();
    root.style.setProperty('--sf-page-left', `${left}px`);
    root.style.setProperty('--sf-page-top', `${top}px`);
    root.style.setProperty('--sf-vv-width', `${Math.max(1, width)}px`);
    root.style.setProperty('--sf-vv-height', `${Math.max(1, height)}px`);

    const wrap = root.querySelector('.sf-zine-wrap');
    if (!wrap) return;

    wrap.style.setProperty('--sf-fit-scale', '1');
    const naturalWidth = Math.max(1, wrap.offsetWidth);
    const naturalHeight = Math.max(1, wrap.offsetHeight);
    const safeX = 18;
    const safeY = 18;
    const fit = Math.min(
      1,
      Math.max(0.1, (width - safeX * 2) / naturalWidth),
      Math.max(0.1, (height - safeY * 2) / naturalHeight)
    );
    wrap.style.setProperty('--sf-fit-scale', String(fit));
  }

  function startViewportTracking() {
    if (viewportTracking) return;
    viewportTracking = true;
    syncVisualViewport();
    window.addEventListener('resize', syncVisualViewport, { passive: true });
    window.addEventListener('scroll', syncVisualViewport, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncVisualViewport, { passive: true });
      window.visualViewport.addEventListener('scroll', syncVisualViewport, { passive: true });
    }
  }

  function stopViewportTracking() {
    if (!viewportTracking) return;
    viewportTracking = false;
    window.removeEventListener('resize', syncVisualViewport);
    window.removeEventListener('scroll', syncVisualViewport);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', syncVisualViewport);
      window.visualViewport.removeEventListener('scroll', syncVisualViewport);
    }
  }

  function blockBackgroundScroll(event) {
    if (root?.classList.contains('is-open')) event.preventDefault();
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
              <div class="sf-zine-track tone-pink"><span>01</span><strong>OMG</strong><small>Newjeans</small></div>
              <div class="sf-zine-track tone-lilac"><span>02</span><strong>ETA</strong><small>Newjeans</small></div>
              <div class="sf-zine-track tone-yellow"><span>03</span><strong>Howsweet</strong><small>Newjeans</small></div>
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
    root.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    root.addEventListener('touchmove', blockBackgroundScroll, { passive: false });
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
    startViewportTracking();
    requestAnimationFrame(() => {
      syncVisualViewport();
      requestAnimationFrame(() => {
        syncVisualViewport();
        page.classList.add('is-open');
        page.querySelector('.sf-spotify-close')?.focus({ preventScroll: true });
      });
    });
  }

  function closeWidget() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    stopViewportTracking();
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
