document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const toggle=document.querySelector('.mobile-toggle');
const nav=document.querySelector('.nav-links');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Fermer':'Menu';});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='Menu';}));}

const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced&&'IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');
  const selectors=['.problem-card','.step','.review','.portrait-card','.copy-stack','.contact-panel','.info-card','.price-card','.map-card','.article','.side-card','.page-icon'];
  const items=[...document.querySelectorAll(selectors.join(','))];
  items.forEach(el=>el.classList.add('reveal-item'));
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}})},{threshold:.12,rootMargin:'0px 0px -24px 0px'});
  items.forEach(el=>observer.observe(el));
}

// Keep FAQ behavior calm: opening one closes the others on the homepage.
const faqDetails=[...document.querySelectorAll('.faq details')];
faqDetails.forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open){faqDetails.forEach(other=>{if(other!==detail)other.open=false;});}}));
