(() => {
  const camera = document.querySelector('.charm-camera');
  if (!camera || camera.dataset.sfCameraGalleryReady === '1') return;
  camera.dataset.sfCameraGalleryReady = '1';

  const FRONT = camera.querySelector('img')?.getAttribute('src') || './assets/web/camera.png';
  const BACK = './assets/web/SF_polaroid_rotate_v2.webp';
  const slides = ['01','02','03','04','05'];
  let down = null;
  let busy = false;
  let galleryOpen = false;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function closeLegacy() {
    const view = document.querySelector('.destination-view');
    if (!view) return;
    view.classList.remove('is-open');
    view.setAttribute('aria-hidden', 'true');
  }

  function cameraBox() {
    const w = innerWidth, h = innerHeight;
    const s = Math.max(260, Math.min(w * (w <= 700 ? .94 : .72), h * .76, 720));
    return { left:(w-s)/2, top:(h-s)/2, width:s, height:s };
  }

  function galleryBox() {
    const w = innerWidth, h = innerHeight;
    const mx = w <= 700 ? 10 : Math.max(28, w*.055);
    const my = w <= 700 ? 16 : Math.max(28, h*.055);
    const width = Math.min(w-mx*2, 1040);
    const height = Math.min(h-my*2, w <= 700 ? h*.88 : 780);
    return { left:(w-width)/2, top:(h-height)/2, width, height };
  }

  function makeTransition(rect) {
    const bg = document.createElement('div');
    bg.className = 'sf-camera-transition-backdrop';
    const shell = document.createElement('div');
    shell.className = 'sf-camera-transition-shell';
    Object.assign(shell.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    const flip = document.createElement('div');
    flip.className = 'sf-camera-transition-flipper';
    const img = document.createElement('img');
    img.className = 'sf-camera-transition-image'; img.alt=''; img.draggable=false; img.src=FRONT;
    const lcd = document.createElement('div');
    lcd.className = 'sf-camera-transition-lcd';
    lcd.innerHTML = '<div class="sf-camera-transition-placeholder"><div><strong>LOOKBOOK</strong><span>SWIPE TO BROWSE</span></div></div>';
    flip.append(img,lcd); shell.append(flip); document.body.append(bg,shell);
    return {bg,shell,flip,img,lcd};
  }

  function makeGallery(start, bg) {
    const root = document.createElement('section');
    root.className = 'sf-lookbook-gallery';
    root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','Lookbook photo gallery');
    Object.assign(root.style,{left:`${start.left}px`,top:`${start.top}px`,width:`${start.width}px`,height:`${start.height}px`});

    const head = document.createElement('header'); head.className='sf-lookbook-toolbar';
    const home = document.createElement('button'); home.type='button'; home.className='sf-lookbook-home'; home.textContent='← HOME';
    const title = document.createElement('div'); title.className='sf-lookbook-title'; title.innerHTML='<strong>LOOKBOOK</strong><span>CAMERA ROLL</span>';
    const counter = document.createElement('div'); counter.className='sf-lookbook-counter';
    head.append(home,title,counter);

    const viewport = document.createElement('div'); viewport.className='sf-lookbook-viewport'; viewport.tabIndex=0;
    const track = document.createElement('div'); track.className='sf-lookbook-track';
    slides.forEach((n,i)=>{
      const s=document.createElement('article'); s.className=`sf-lookbook-slide tone-${i+1}`;
      s.innerHTML=`<div class="sf-lookbook-slide-placeholder"><span>0${i+1}</span><strong>MODEL SHOT ${n}</strong><small>PHOTO SLOT / LOOKBOOK 03</small></div>`;
      track.append(s);
    });
    viewport.append(track);
    const prev=document.createElement('button'); prev.type='button'; prev.className='sf-lookbook-nav sf-lookbook-prev'; prev.textContent='‹'; prev.setAttribute('aria-label','Previous photo');
    const next=document.createElement('button'); next.type='button'; next.className='sf-lookbook-nav sf-lookbook-next'; next.textContent='›'; next.setAttribute('aria-label','Next photo');
    const hint=document.createElement('div'); hint.className='sf-lookbook-hint'; hint.textContent='SWIPE / DRAG';
    root.append(head,viewport,prev,next,hint); document.body.append(root);

    let index=0, drag=false, pid=null, sx=0, sy=0, lx=0, horizontal=false, closing=false;
    const render=(dx=0,animate=true)=>{track.style.transition=animate?'transform 420ms cubic-bezier(.2,.78,.2,1)':'none';track.style.transform=`translate3d(calc(${-index*100}% + ${dx}px),0,0)`;counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;prev.disabled=index===0;next.disabled=index===slides.length-1;};
    const go=(n)=>{index=Math.max(0,Math.min(slides.length-1,n));render(0,true);};

    viewport.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;drag=true;pid=e.pointerId;sx=lx=e.clientX;sy=e.clientY;horizontal=false;viewport.classList.add('is-dragging');viewport.setPointerCapture?.(e.pointerId);});
    viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==pid)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!horizontal&&Math.abs(dx)>6)horizontal=Math.abs(dx)>Math.abs(dy);if(!horizontal)return;e.preventDefault();lx=e.clientX;const resist=(index===0&&dx>0)||(index===slides.length-1&&dx<0)?.28:1;render(dx*resist,false);},{passive:false});
    const finish=e=>{if(!drag||e.pointerId!==pid)return;drag=false;viewport.classList.remove('is-dragging');const dx=lx-sx,t=Math.min(86,viewport.clientWidth*.16);if(horizontal&&dx<-t)go(index+1);else if(horizontal&&dx>t)go(index-1);else render(0,true);pid=null;};
    viewport.addEventListener('pointerup',finish); viewport.addEventListener('pointercancel',finish);
    prev.addEventListener('click',()=>go(index-1)); next.addEventListener('click',()=>go(index+1));

    async function close(){if(closing)return;closing=true;root.classList.remove('is-ready');bg.classList.remove('is-gallery');await root.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],{duration:180,fill:'forwards'}).finished.catch(()=>{});root.remove();bg.classList.remove('is-visible');await sleep(120);bg.remove();document.body.classList.remove('sf-camera-transition-active','sf-lookbook-gallery-open');galleryOpen=false;busy=false;document.removeEventListener('keydown',keys);camera.focus({preventScroll:true});}
    function keys(e){if(!galleryOpen)return;if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}else if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}else if(e.key==='Escape'){e.preventDefault();close();}}
    document.addEventListener('keydown',keys); home.addEventListener('click',close); render(0,false);
    return {root,viewport};
  }

  async function open(){
    if(busy||galleryOpen)return; busy=true; closeLegacy();
    const rect=camera.getBoundingClientRect(), target=cameraBox(), ui=makeTransition(rect);
    document.body.classList.add('sf-camera-transition-active'); requestAnimationFrame(()=>ui.bg.classList.add('is-visible'));
    try{
      const move=ui.shell.animate([{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`},{left:`${target.left}px`,top:`${target.top}px`,width:`${target.width}px`,height:`${target.height}px`}],{duration:560,easing:'cubic-bezier(.16,.84,.2,1)',fill:'forwards'});
      await move.finished;
      await ui.flip.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],{duration:210,easing:'ease-in',fill:'forwards'}).finished;
      ui.img.src=BACK; ui.shell.classList.add('is-back'); ui.flip.style.transform='rotateY(-90deg)';
      await ui.flip.animate([{transform:'rotateY(-90deg)'},{transform:'rotateY(0deg)'}],{duration:270,easing:'cubic-bezier(.18,.76,.22,1)',fill:'forwards'}).finished;
      await sleep(100); ui.lcd.classList.add('is-on'); await sleep(420);
      const start=ui.lcd.getBoundingClientRect(), g=makeGallery(start,ui.bg), end=galleryBox();
      document.body.classList.add('sf-lookbook-gallery-open'); ui.bg.classList.add('is-gallery');
      await Promise.all([
        g.root.animate([{left:`${start.left}px`,top:`${start.top}px`,width:`${start.width}px`,height:`${start.height}px`,borderRadius:'10px'},{left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px`,borderRadius:'22px'}],{duration:620,easing:'cubic-bezier(.16,.84,.2,1)',fill:'forwards'}).finished,
        ui.shell.animate([{opacity:1},{opacity:0}],{duration:420,delay:80,fill:'forwards'}).finished
      ]);
      ui.shell.remove(); galleryOpen=true; busy=false; g.root.classList.add('is-ready'); g.viewport.focus({preventScroll:true});
    }catch(err){console.warn('[Summerflow] camera gallery fallback',err);ui.shell.remove();ui.bg.remove();document.body.classList.remove('sf-camera-transition-active','sf-lookbook-gallery-open');busy=false;galleryOpen=false;}
  }

  camera.addEventListener('pointerdown',e=>{if(!busy&&!galleryOpen)down={id:e.pointerId,x:e.clientX,y:e.clientY};});
  camera.addEventListener('pointerup',e=>{if(busy||galleryOpen||!down||down.id!==e.pointerId)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(d<=7){closeLegacy();open();}});
  camera.addEventListener('pointercancel',()=>{down=null;});
  camera.addEventListener('click',e=>{if(e.detail===0&&!busy&&!galleryOpen){closeLegacy();open();}});
})();
