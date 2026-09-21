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

  // Workspace + Hubs product focus tabs
  document.querySelectorAll('.product-focus').forEach(section => {
    const tabs = [...section.querySelectorAll('[data-product-tab]')];
    const panels = [...section.querySelectorAll('[data-product-panel]')];
    const detailTitle = section.querySelector('[data-product-title]');
    const detailCopy = section.querySelector('[data-product-copy]');
    if (!tabs.length || !panels.length) return;
    const labels = tabs.map(tab => tab.querySelector('.product-tab__title')?.textContent.trim() || '');
    const copies = section.id === 'workspace'
      ? ['Toute votre musique au même endroit.','Invitez, collaborez, avancez.','Glissez. Déposez. C’est prêt.','Privé, public, lien ou page dédiée.']
      : ['Choisissez les titres à rendre visibles.','Tags, prompt et similarity.','Dans le bon contexte, par les bons pros.','Directement depuis la page ou le titre.','Vues, écoutes et téléchargements en un coup d’œil.'];
    let active = 0;
    const activate = index => {
      active = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const on = i === active;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
      });
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === active));
      if (detailTitle) detailTitle.textContent = labels[active];
      if (detailCopy) detailCopy.textContent = copies[active] || '';
      if (mqMobile.matches) tabs[active].scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
    };
    tabs.forEach((tab, i) => tab.addEventListener('click', () => activate(i)));
    const swipe = section.querySelector('[data-product-swipe]');
    let sx = 0, sy = 0;
    swipe?.addEventListener('touchstart', e => { const t=e.changedTouches[0]; sx=t.clientX; sy=t.clientY; }, {passive:true});
    swipe?.addEventListener('touchend', e => {
      if (!mqMobile.matches) return;
      const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
      if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.2) activate(active + (dx<0 ? 1 : -1));
    }, {passive:true});
    section._productFocusActivate = activate;
    section._productFocusGetActive = () => active;
    activate(0);
  });

  // Desktop scroll storytelling for Workspace + Hubs.
  // The page scroll remains native: sticky only holds the visual while progress selects a frame.
  const scrollFocusSections = [...document.querySelectorAll('.product-focus[data-scroll-focus="true"]')];
  let focusRaf = 0;
  const focusStepMetrics = section => {
    const tabs = [...section.querySelectorAll('[data-product-tab]')];
    const count = tabs.length;
    const rect = section.getBoundingClientRect();
    const stickyTop = 64;
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    const consumed = Math.min(travel, Math.max(0, stickyTop - rect.top));
    const progress = consumed / travel;
    return { tabs, count, progress };
  };
  const syncScrollFocus = () => {
    focusRaf = 0;
    if (mqMobile.matches) return;
    scrollFocusSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const {count, progress} = focusStepMetrics(section);
      if (!count) return;
      const index = Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1))));
      if (section._productFocusGetActive?.() !== index) section._productFocusActivate?.(index);
    });
  };
  const requestFocusSync = () => {
    if (!focusRaf) focusRaf = requestAnimationFrame(syncScrollFocus);
  };
  window.addEventListener('scroll', requestFocusSync, {passive:true});
  window.addEventListener('resize', requestFocusSync, {passive:true});
  mqMobile.addEventListener?.('change', requestFocusSync);

  // Tabs remain fully interactive. On desktop a click gently moves the native page scroll
  // to the corresponding storytelling position instead of creating a separate carousel state.
  scrollFocusSections.forEach(section => {
    const tabs = [...section.querySelectorAll('[data-product-tab]')];
    tabs.forEach((tab, index) => tab.addEventListener('click', () => {
      if (mqMobile.matches || tabs.length < 2) return;
      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const target = sectionTop - 64 + travel * (index / (tabs.length - 1));
      window.scrollTo({top:target, behavior:'smooth'});
    }));
  });
  requestFocusSync();

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