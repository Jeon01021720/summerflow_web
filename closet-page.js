(() => {
  const hanger = document.querySelector('.charm-hanger');
  if (!hanger || hanger.dataset.sfClosetReady === '1') return;
  hanger.dataset.sfClosetReady = '1';

  const CLICK_THRESHOLD = 7;
  const names = [
    'Sky Slim Soccer Jersey',
    'Victory 85 Off-shoulder Tee',
    'Buried At Yonsei Tee',
    'Yonsei 85 Baseball Dress',
    'Angel Wing Off-shoulder Tee',
    'Navy Soccer Jersey'
  ];
  let root = null;
  let viewport = null;
  let down = null;
  let drag = null;
  let tracking = false;

  function closeLegacyDestination() {
    const legacy = document.querySelector('.destination-view');
    if (!legacy) return;
    legacy.classList.remove('is-open');
    legacy.setAttribute('aria-hidden', 'true');
  }

  function buildCloset() {
    if (root) return root;
    root = document.createElement('section');
    root.className = 'sf-closet-page';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('aria-label', 'Summerflow closet rack');
    root.innerHTML = `
      <div class="sf-closet-shell" role="dialog" aria-modal="true" aria-label="Summerflow Closet Rack 01">
        <header class="sf-closet-head">
          <div class="sf-closet-title">
            <small>CLOSET RACK 01 · SUMMER 2026</small>
            <h1>things we’d<br>wear all summer</h1>
            <p>drag the rack and look through the summerflow pieces ♡</p>
          </div>
          <button class="sf-closet-close" type="button" aria-label="Close closet">×</button>
        </header>
        <span class="sf-closet-star a" aria-hidden="true">✦</span><span class="sf-closet-star b" aria-hidden="true">♡</span>
        <div class="sf-closet-viewport" tabindex="0" aria-label="Scrollable clothing rack">
          <div class="sf-rack-canvas">
            <div class="sf-rack-rod" aria-hidden="true"></div>
            ${Array.from({length:6},()=>'<img class="sf-rack-hanger" src="./assets/web/hanger.png" alt="" draggable="false" aria-hidden="true" />').join('')}
            <img class="sf-rack-garments" src="./assets/closet/closet-garments.webp?v=1" alt="Summerflow clothing collection" draggable="false" />
            ${names.map((name,index)=>`<span class="sf-rack-label" data-i="${index}">${name}</span>`).join('')}
          </div>
        </div>
        <span class="sf-closet-hint">DRAG THE RACK</span>
      </div>`;

    viewport = root.querySelector('.sf-closet-viewport');
    root.querySelector('.sf-closet-close')?.addEventListener('click', closeCloset);
    root.addEventListener('pointerdown', (event) => { if (event.target === root) closeCloset(); });
    root.addEventListener('wheel', (event) => {
      if (!root.classList.contains('is-open') || !viewport) return;
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        viewport.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    }, { passive:false });

    viewport?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') return;
      drag = { id:event.pointerId, x:event.clientX, scroll:viewport.scrollLeft };
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add('is-dragging');
    });
    viewport?.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      viewport.scrollLeft = drag.scroll - (event.clientX - drag.x);
      event.preventDefault();
    });
    const releaseDrag = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      viewport.classList.remove('is-dragging');
      drag = null;
    };
    viewport?.addEventListener('pointerup', releaseDrag);
    viewport?.addEventListener('pointercancel', releaseDrag);
    document.body.append(root);
    return root;
  }

  function metrics() {
    const vv = window.visualViewport;
    return {
      left: vv ? vv.pageLeft : (window.scrollX || 0),
      top: vv ? vv.pageTop : (window.scrollY || document.documentElement.scrollTop || 0),
      width: vv ? vv.width : window.innerWidth,
      height: vv ? vv.height : window.innerHeight
    };
  }
  function syncViewport() {
    if (!root) return;
    const m = metrics();
    root.style.setProperty('--sf-closet-left', `${m.left}px`);
    root.style.setProperty('--sf-closet-top', `${m.top}px`);
    root.style.setProperty('--sf-closet-width', `${Math.max(1,m.width)}px`);
    root.style.setProperty('--sf-closet-height', `${Math.max(1,m.height)}px`);
  }
  function startTracking() {
    if (tracking) return;
    tracking = true; syncViewport();
    window.addEventListener('resize',syncViewport,{passive:true});
    window.addEventListener('scroll',syncViewport,{passive:true});
    window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
    window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});
  }
  function stopTracking() {
    if (!tracking) return;
    tracking = false;
    window.removeEventListener('resize',syncViewport); window.removeEventListener('scroll',syncViewport);
    window.visualViewport?.removeEventListener('resize',syncViewport); window.visualViewport?.removeEventListener('scroll',syncViewport);
  }
  function openCloset() {
    closeLegacyDestination();
    const page = buildCloset();
    page.setAttribute('aria-hidden','false');
    document.body.classList.add('sf-closet-open');
    startTracking();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      syncViewport(); page.classList.add('is-open');
      page.querySelector('.sf-closet-close')?.focus({preventScroll:true});
      if (viewport) viewport.scrollLeft = Math.max(0,(viewport.scrollWidth-viewport.clientWidth)*.12);
    }));
  }
  function closeCloset() {
    if (!root?.classList.contains('is-open')) return;
    root.classList.remove('is-open'); document.body.classList.remove('sf-closet-open'); stopTracking();
    setTimeout(()=>root?.setAttribute('aria-hidden','true'),280);
    hanger.focus({preventScroll:true});
  }

  hanger.addEventListener('pointerdown',(event)=>{
    if (event.button !== undefined && event.button !== 0) return;
    down={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  hanger.addEventListener('pointerup',(event)=>{
    if (!down || down.id!==event.pointerId) return;
    const distance=Math.hypot(event.clientX-down.x,event.clientY-down.y); down=null;
    if(distance<=CLICK_THRESHOLD) queueMicrotask(openCloset);
  });
  hanger.addEventListener('pointercancel',()=>{down=null});
  hanger.addEventListener('click',(event)=>{if(event.detail===0) queueMicrotask(openCloset)});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&root?.classList.contains('is-open')){event.preventDefault();closeCloset();}});
})();
