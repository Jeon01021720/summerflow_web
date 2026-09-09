(() => {
  const OPEN_DIARY_SRC = './assets/web/diary-open.webp?v=1';

  function swapOpenDiary(root = document) {
    const image = root.querySelector?.('.sf-memory-diary');
    if (!image || image.dataset.sfOpenDiary === '1') return;
    image.dataset.sfOpenDiary = '1';
    image.src = OPEN_DIARY_SRC;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
  }

  swapOpenDiary();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.sf-memory-diary')) swapOpenDiary(node.parentElement || node);
        else swapOpenDiary(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
