(()=>{'use strict';
const sizes={M:{key:'creator',storage:'100 Go',tracks:'100',talent:'10',annual:5,monthly:8},L:{key:'plus',storage:'250 Go',tracks:'500',talent:'50',annual:9,monthly:14},XL:{key:'max',storage:'500 Go',tracks:'Illimités',talent:'100',annual:19,monthly:29}};
const state={size:'M',billing:'annual',member:'yes'};
const fmt=n=>n.toLocaleString('fr-FR',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const set=(sel,v)=>{$(sel).textContent=v};
function creatorPrice(data){return state.billing==='annual'?(state.member==='yes'?data.annual/2:data.annual):data.monthly}
function render(){
 $$('[data-v36-billing]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.v36Billing===state.billing)));
 $$('[data-v36-member]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.v36Member===state.member)));
 $$('[data-creator-size]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.creatorSize===state.size)));
 $$('[data-v36-size-choice]').forEach(el=>{const on=el.dataset.v36SizeChoice===state.size;el.setAttribute('aria-pressed',String(on));el.classList.toggle('is-selected',on)});
 const data=sizes[state.size],price=creatorPrice(data);
 set('#v36-size-name',state.size);set('#v36-storage',data.storage);set('#v36-tracks',data.tracks);set('#v36-talent',data.talent);
 set('#v36-price-creator',fmt(price)+' €');set('#v36-unit-creator','/mois*');
 const cta=$('#v36-cta-creator');cta.textContent='Choisir Creator '+state.size;const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';cta.append(arrow);
 cta.href='inscription.html?plan='+data.key+'&billing='+state.billing+'&member='+state.member;
 if(state.billing==='annual'&&state.member==='yes')set('#v36-detail-creator','1re année : '+fmt(price*12)+' € TTC facturés, puis '+fmt(data.annual*12)+' €/an au renouvellement.');
 else if(state.billing==='annual')set('#v36-detail-creator',fmt(price*12)+' € TTC facturés chaque année.');
 else set('#v36-detail-creator','Paiement mensuel, sans remise sociétaire.');
 Object.entries(sizes).forEach(([size,s])=>{const p=creatorPrice(s);set('[data-v36-scale-price="'+size+'"]',fmt(p)+' €/mois'+(state.billing==='annual'?'*':''))});
 $('#v36-cta-free').href='inscription.html?plan=free&billing='+state.billing+'&member='+state.member;
 const starterCard=$('[data-v36-card="starter"]');
 const cards=$('.v36-cards');
 const notMember=state.member==='no';
 starterCard.hidden=notMember;
 cards.dataset.member=state.member;
 $$('[data-starter-column]').forEach(cell=>{cell.hidden=notMember;});
 const intro=$('#v38-pricing-intro');
 if(intro)intro.textContent=notMember?'Découvrez gratuitement SACEM Cloud ou choisissez la capacité Creator adaptée à votre musique.':'Un espace pour vos créations, du premier morceau à tout votre catalogue. Trois offres, selon votre usage.';
 const starter=$('#v36-cta-starter');starter.href='inscription.html?plan=starter&billing=monthly&member='+state.member;
 if(state.member==='yes'){
  set('#v36-price-starter','1,99 €');set('#v36-unit-starter','/mois');set('#v36-detail-starter','Sociétaires : 1,99 € TTC/mois, toujours facturé mensuellement.');starter.removeAttribute('data-disabled');starter.textContent='Choisir Starter';const a=document.createElement('span');a.setAttribute('aria-hidden','true');a.textContent='↗';starter.append(a);
 }else{
  set('#v36-price-starter','À définir');set('#v36-unit-starter','');set('#v36-detail-starter','Tarif non-sociétaire non arrêté. Demandez à être informé.');starter.setAttribute('data-disabled','true');starter.textContent='Être informé';const a=document.createElement('span');a.setAttribute('aria-hidden','true');a.textContent='↗';starter.append(a);
 }
 set('#v36-context',state.member==='yes'?(state.billing==='annual'?'Avantage SACEM : -50 % la première année de la première souscription annuelle Creator éligible.':'Les offres Creator sont au tarif mensuel public. La remise SACEM de 50 % ne s’applique pas au mensuel.'):'Prix publics Creator affichés. Starter est réservé aux sociétaires SACEM.');
}
$$('[data-v36-billing]').forEach(el=>el.addEventListener('click',()=>{state.billing=el.dataset.v36Billing;render()}));
$$('[data-v36-member]').forEach(el=>el.addEventListener('click',()=>{state.member=el.dataset.v36Member;render()}));
$$('[data-creator-size]').forEach(el=>el.addEventListener('click',()=>{state.size=el.dataset.creatorSize;render()}));
$$('[data-v36-size-choice]').forEach(el=>el.addEventListener('click',()=>{state.size=el.dataset.v36SizeChoice;render();document.querySelector('.v36-card-creator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'})}));
render();})();