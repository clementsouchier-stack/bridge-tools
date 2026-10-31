(() => {
  const mqMobile = window.matchMedia('(max-width:920px)');

  // Hero switcher
  const heroTabs = [...document.querySelectorAll('[data-hero-tab]')];
  const heroPanels = [...document.querySelectorAll('[data-hero-panel]')];
  let heroIndex = 0, heroTimer;
  const setHero = (index) => {
    if (!heroTabs.length) return;
    heroIndex = (index + heroTabs.length) % heroTabs.length;
    heroTabs.forEach((tab, i) => {
      const active = i === heroIndex;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    heroPanels.forEach((panel, i) => panel.classList.toggle('is-active', i === heroIndex));
  };
  const startHero = () => {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => setHero(heroIndex + 1), 4200);
  };
  heroTabs.forEach((tab, i) => tab.addEventListener('click', () => { setHero(i); startHero(); }));
  heroPanels.forEach(panel => panel.addEventListener('click', () => { setHero(heroIndex + 1); startHero(); }));
  setHero(0); startHero();

  // Lightbox
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  const image = modal.querySelector('.lightbox-modal__image');
  const title = modal.querySelector('.lightbox-modal__title');
  const copy = modal.querySelector('.lightbox-modal__copy');
  const counter = modal.querySelector('.lightbox-modal__counter');
  const prev = modal.querySelector('[data-lightbox-prev]');
  const next = modal.querySelector('[data-lightbox-next]');
  const triggers = [...document.querySelectorAll('[data-lightbox-trigger="true"]')];
  const items = triggers.map(el => {
    const img = el.querySelector('img');
    return {el, src:img?.getAttribute('src')||'', alt:img?.alt||'', title:el.dataset.lightboxTitle||'', copy:el.dataset.lightboxCopy||''};
  });
  let lightboxIndex=0, lastFocus=null;
  const open = index => {
    if (!items.length) return;
    lightboxIndex=(index+items.length)%items.length;
    const item=items[lightboxIndex];
    image.src=item.src; image.alt=item.alt; title.textContent=item.title; copy.textContent=item.copy;
    counter.textContent=`${lightboxIndex+1} / ${items.length}`;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden';
    modal.querySelector('[data-lightbox-close]')?.focus({preventScroll:true});
  };
  const close = () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); document.documentElement.style.overflow='';
    lastFocus?.focus?.({preventScroll:true});
  };
  const go = delta => open(lightboxIndex + delta);
  triggers.forEach((el,i) => {
    el.addEventListener('click',()=>{lastFocus=el;open(i)});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();lastFocus=el;open(i)}});
  });
  prev?.addEventListener('click',e=>{e.stopPropagation();go(-1)});
  next?.addEventListener('click',e=>{e.stopPropagation();go(1)});
  modal.addEventListener('click',e=>{if(e.target.closest('[data-lightbox-close]'))close();else if(!e.target.closest('.lightbox-modal__dialog'))close()});
  document.addEventListener('keydown',e=>{if(!modal.classList.contains('is-open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1)});
  const swipeZone=modal.querySelector('.lightbox-modal__image-wrap'); let lx=0,ly=0;
  swipeZone?.addEventListener('touchstart',e=>{const t=e.changedTouches[0];lx=t.clientX;ly=t.clientY},{passive:true});
  swipeZone?.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-lx,dy=t.clientY-ly;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)go(dx<0?1:-1)},{passive:true});
})();