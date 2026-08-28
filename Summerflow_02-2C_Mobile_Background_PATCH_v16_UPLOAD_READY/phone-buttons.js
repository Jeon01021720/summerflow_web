(() => {
  'use strict';

  const stage = document.querySelector('.stage');
  const lcd = document.querySelector('.lcd-screen');
  const logo = document.querySelector('.lcd-pixel-logo');
  const next = document.querySelector('.phone-hit[data-action="next"]');
  if (!stage || !lcd || !logo || !next) return;

  const logos = [
    { src: './assets/logo-web/logo-pixel.png', name: 'Summerflow' },
    { src: './assets/pixel-logos/SF_ID_LCD.png', name: 'SF ID' },
    { src: './assets/pixel-logos/SF_CT_LCD.png', name: 'SF CT' },
  ];

  let index = 0;
  let ready = false;
  let switching = false;

  logos.forEach(({ src }) => { const image = new Image(); image.src = src; });

  function setLogo(nextIndex) {
    index = (nextIndex + logos.length) % logos.length;
    const item = logos[index];
    logo.src = item.src;
    logo.setAttribute('alt', item.name);
    logo.dataset.logo = item.name;
  }

  function changeLogo(direction) {
    if (!ready || switching) return false;
    switching = true;
    lcd.classList.add('logo-switch');

    window.setTimeout(() => setLogo(index + direction), 78);
    window.setTimeout(() => {
      lcd.classList.remove('logo-switch');
      switching = false;
    }, 230);
    return true;
  }

  next.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    changeLogo(1);
  });

  // Original boot starts at 1s and finishes around 2.6s.
  window.setTimeout(() => {
    stage.classList.add('lcd-ready');
    setLogo(0);
    ready = true;
  }, 2750);

  window.__summerflowPhoneButtons = {
    version: 'v15-single-next-pad',
    get index() { return index; },
    get ready() { return ready; },
    get current() { return logos[index].name; },
    logos,
    changeLogo,
  };
})();
