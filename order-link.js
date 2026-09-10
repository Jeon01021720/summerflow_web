(() => {
  const envelope = document.querySelector('.charm-envelope');
  if (!envelope || envelope.dataset.sfOrderLinkReady === '1') return;
  envelope.dataset.sfOrderLinkReady = '1';

  const ORDER_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfC1tebLDw66pTVbr1j2nVPZkGe7HYlwTb-gI8FGsbURgF4pg/viewform';
  const CLICK_THRESHOLD = 7;
  let down = null;

  function isEnvelopeTarget(target) {
    return target === envelope || envelope.contains(target);
  }

  function goToOrder() {
    window.location.href = ORDER_URL;
  }

  document.addEventListener('pointerdown', (event) => {
    if (!isEnvelopeTarget(event.target)) return;
    if (event.button !== undefined && event.button !== 0) return;
    down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, true);

  document.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId || !isEnvelopeTarget(event.target)) return;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (distance > CLICK_THRESHOLD) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    goToOrder();
  }, true);

  document.addEventListener('pointercancel', (event) => {
    if (down?.id === event.pointerId) down = null;
  }, true);

  document.addEventListener('click', (event) => {
    if (event.detail !== 0 || !isEnvelopeTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goToOrder();
  }, true);
})();
