(()=>{'use strict';
 const mq=matchMedia('(min-width:1050px) and (min-height:700px)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const journeys=[...document.querySelectorAll('[data-journey]')].map(root=>{
   const desktop=root.querySelector('[data-journey-desktop]');
   const slides=[...root.querySelectorAll('[data-journey-slide]')];
   const entries=[...root.querySelectorAll('.journey-v40__mobile-step')].map(el=>({
     title:el.querySelector('h3')?.textContent.trim()||'',
     copy:el.querySelector('p')?.textContent.trim()||''
   }));
   const title=root.querySelector('[data-journey-title]');
   const copy=root.querySelector('[data-journey-copy]');
   const counter=root.querySelector('.journey-v40__counter');
   const bar=root.querySelector('[data-journey-progress]');
   if(!desktop||!slides.length||slides.length!==entries.length||!title||!copy||!counter||!bar)return null;
   let active=-1;
   function setStep(index){
     const n=Math.max(0,Math.min(slides.length-1,index));
     if(active===n)return;active=n;
     slides.forEach((slide,i)=>{
       const on=i===n;slide.classList.toggle('is-active',on);
       slide.setAttribute('aria-hidden',String(!on));
     });
     title.textContent=entries[n].title;copy.textContent=entries[n].copy;
     counter.textContent=String(n+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
     bar.style.width=((n+1)/slides.length*100)+'%';
   }
   setStep(0);
   return {desktop,slides,setStep};
 }).filter(Boolean);
 let raf=0;
 function sync(){raf=0;if(!mq.matches)return;
   for(const {desktop,slides,setStep} of journeys){
     const rect=desktop.getBoundingClientRect();
     if(rect.bottom<0||rect.top>innerHeight)continue; 
     const total=Math.max(1,desktop.offsetHeight-innerHeight);
     const distance=Math.min(total,Math.max(0,74-rect.top));
     const n=Math.min(slides.length-1,Math.floor(distance/total*slides.length));
     setStep(n);
   }
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 mq.addEventListener('change',schedule);
 schedule();
})();
