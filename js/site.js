(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
      nav.classList.toggle('open', !expanded);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('open');
    }));
  }

  // Preserve the existing Roll Your Fate idea from Blackjack's previous homepage.
  const fortunes = [
    'The cards whisper: a peculiar adventure is about to begin. Try not to look suspicious.',
    'A lucky star appears above you. Blackjack is already wondering how to steal it.',
    'You drew the wild card. Congratulations! The rules have become suggestions.',
    'A shadow crosses the table. There is laughter. Probably nothing to worry about.',
    'Fortune smiles upon you! Or is that just the fox grinning?',
    'Your next chapter starts with one unexpected choice. Make it a good one.',
    'A royal flush! Unfortunately, the fox has the other deck.',
    'The house grants you one wish: a good story and someone to share it with.',
    'A mysterious door opens. Behind it: another card, of course.',
    'The dealer folds his arms. “Interesting move,” he says. You are now nervous.'
  ];
  let lastFortune = -1;
  const message = document.getElementById('fortune-message');
  const panel = document.querySelector('.fortune-panel');
  function deal() {
    if (!message) return;
    let idx = Math.floor(Math.random() * fortunes.length);
    if (fortunes.length > 1 && idx === lastFortune) idx = (idx + 1) % fortunes.length;
    lastFortune = idx;
    message.textContent = fortunes[idx];
    panel?.classList.remove('dealt');
    void panel?.offsetWidth;
    panel?.classList.add('dealt');
    document.getElementById('fate')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }
  document.getElementById('roll-fate')?.addEventListener('click', deal);
  document.getElementById('deal-again')?.addEventListener('click', deal);
})();
