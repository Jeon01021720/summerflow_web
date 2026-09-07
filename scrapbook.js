(() => {
  'use strict';

  const scraps = [...document.querySelectorAll('.scrap')];
  if (!scraps.length) return;

  let active = null;

  function setActive(next) {
    scraps.forEach((scrap) => {
      const on = scrap === next;
      scrap.classList.toggle('is-active', on);
      scrap.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    active = next;
  }

  scraps.forEach((scrap) => {
    scrap.setAttribute('aria-pressed', 'false');
    scrap.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActive(active === scrap ? null : scrap);
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (active && !event.target.closest('.scrap')) setActive(null);
  });

  window.__summerflowScrapbook = {
    version: '02-2A-v1',
    scraps,
    get active() { return active; },
  };
})();
