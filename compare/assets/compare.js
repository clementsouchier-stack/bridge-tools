/* Bridge Compare — shared header behaviour (desktop dropdowns + mobile menu). */
(() => {
  'use strict';
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const burger = nav.querySelector('.bm-burger');
  const mobile = nav.querySelector('.bm-mobile-panel');
  const backdrop = nav.querySelector('.bm-mobile-backdrop');
  const triggers = [...nav.querySelectorAll('.bm-trigger')];

  const closeDropdowns = (except) => {
    nav.querySelectorAll('.bm-dropdown.open').forEach((d) => {
      if (d === except) return;
      d.classList.remove('open');
      d.querySelector('.bm-trigger')?.setAttribute('aria-expanded', 'false');
    });
  };

  const setMenu = (open, returnFocus) => {
    if (!burger || !mobile || !backdrop) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobile.hidden = !open;
    backdrop.hidden = !open;
    document.body.classList.toggle('menu-locked', open);
    if (open) mobile.querySelector('summary, a')?.focus();
    else if (returnFocus) burger.focus();
  };

  burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  backdrop?.addEventListener('click', () => setMenu(false));
  mobile?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  triggers.forEach((b) => b.addEventListener('click', () => {
    const d = b.closest('.bm-dropdown');
    const opening = !d.classList.contains('open');
    closeDropdowns(d);
    d.classList.toggle('open', opening);
    b.setAttribute('aria-expanded', String(opening));
  }));

  document.addEventListener('click', (e) => { if (!e.target.closest('.bm-dropdown')) closeDropdowns(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openDrop = nav.querySelector('.bm-dropdown.open');
    if (openDrop) { closeDropdowns(); openDrop.querySelector('.bm-trigger')?.focus(); }
    if (burger?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  // Keep keyboard focus inside the mobile menu while it is open.
  mobile?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...mobile.querySelectorAll('a, summary')].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); burger.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); burger.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1190) setMenu(false); });
})();

/* Keep the current comparison visible in the horizontally scrolling switcher. */
(() => {
  const list = document.querySelector('.bc-compare-bar ul');
  const current = list?.querySelector('[aria-current="page"]');
  if (!list || !current || list.scrollWidth <= list.clientWidth) return;
  const li = current.parentElement;
  // Bring the current page to the start of the strip so its label is never cut off.
  list.scrollLeft = Math.max(0, li.offsetLeft - 4);
})();
