(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (menu && nav) {
    const close = () => { nav.classList.remove('open');menu.setAttribute('aria-expanded', 'false');menu.setAttribute('aria-label','Open navigation'); };
    menu.addEventListener('click', () => { const isOpen = nav.classList.toggle('open');menu.setAttribute('aria-expanded', String(isOpen));menu.setAttribute('aria-label',isOpen?'Close navigation':'Open navigation'); });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click',close));
    document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
  const fortunes = [
    {symbol:'✦',title:'A little magic',message:'A spark of magic follows you home. Blackjack insists he had absolutely nothing to do with it.'},
    {symbol:'☾',title:'The grand escape',message:'Your next adventure starts behind a curtain. Somehow the fox is already there, applauding himself.'},
    {symbol:'♠',title:'A terrible joke',message:'You are granted one truly dreadful joke. The audience groans. Blackjack calls it a masterpiece.'},
    {symbol:'✧',title:'An encore!',message:'The show ends… and immediately begins again. Someone forgot to tell the fox about the schedule.'},
    {symbol:'★',title:'A lucky star',message:'A wandering star lights your next chapter. Not even Blackjack can explain where he pulled it from.'},
    {symbol:'♣',title:'Fox business',message:'You notice one missing card and three suspicious pawprints. The magician has already left the stage.'},
    {symbol:'♡',title:'A crew reunion',message:'The curtain opens on familiar faces. This time, everyone shares the spotlight and the laughter.'},
    {symbol:'✿',title:'Forest whispers',message:'A soft voice from the forest hints at another adventure. Blackjack answers with the worst pun imaginable.'},
    {symbol:'✵',title:'The final trick',message:'The magician bows, the lights fade, and the deck vanishes. Look behind your ear. Yes, really.'}
  ];
  const cards = [...document.querySelectorAll('.trick-card')];
  const output = document.getElementById('trick-message');
  let draws=[];let used=false;
  function shuffle(){
    draws = fortunes.map((_,i)=>i);
    for(let i=draws.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[draws[i],draws[j]]=[draws[j],draws[i]];}
    used=false;
    cards.forEach((card,i)=>{
      card.classList.remove('is-revealed');card.disabled=false;card.setAttribute('aria-pressed','false');
      card.setAttribute('aria-label',`Reveal magic card ${i+1}`);
      card.querySelector('.revealed-symbol').textContent='✧';
      card.querySelector('.revealed-title').textContent='Mystery';
    });
    output.textContent='✦ The deck is shuffled. Choose a card, if you dare. ✦';
  }
  cards.forEach((card,i)=>card.addEventListener('click',()=>{
    if(used)return;
    used=true;
    const selected=fortunes[draws[i]];
    card.querySelector('.revealed-symbol').textContent=selected.symbol;
    card.querySelector('.revealed-title').textContent=selected.title;
    card.classList.add('is-revealed');card.setAttribute('aria-pressed','true');
    cards.forEach(other=>{other.disabled=true});
    output.textContent=selected.message;
  }));
  document.getElementById('shuffle-cards')?.addEventListener('click',shuffle);
  shuffle();
})();
