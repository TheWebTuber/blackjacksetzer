(() => {
  'use strict';
  // Uses the same JSON format as the existing PMOG / Dream Drops Crew emote pages:
  // ["Exact Filename.gif", "Another Exact Filename.png"]
  const DATA_URL = '/emotes/emotes.json';
  const FILE_BASE = '/emotes/files/';
  const VALID_EXTENSIONS = /\.(gif|png|webp|apng|jpg|jpeg)$/i;
  const ANIMATED_EXTENSIONS = /\.(gif|apng)$/i;
  const state = { files: [], search: '', filter: 'all', sort: 'az' };
  const gallery = document.getElementById('gallery');
  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const count = document.getElementById('collection-count');
  const status = document.getElementById('gallery-status');
  const empty = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDescription = document.getElementById('empty-description');
  const dialog = document.getElementById('preview-dialog');
  const previewImage = document.getElementById('preview-image');
  const previewName = document.getElementById('preview-name');
  const previewOpen = document.getElementById('preview-open');
  const previewCopy = document.getElementById('preview-copy');
  const toast = document.getElementById('toast');
  let toastTimer;
  let activePreviewUrl = '';

  const getUrl = filename => new URL(FILE_BASE + encodeURIComponent(filename), window.location.origin).href;
  const timestamp = filename => (filename.match(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/) || [''])[0];
  const cleanTitle = filename => filename.replace(/\.[^.]+$/, '').replace(/^@?Blackjack(?:setzer)?[_\s-]*/i,'').replace(/_/g, ' ').replace(/\s*\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/, '').trim() || filename;
  const showToast = message => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2500);
  };
  async function copyText(text) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      showToast('Link copied to clipboard!');
    } catch (_) {
      // Fallback for HTTP hosting or older browsers: select a temporary input.
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly','');
      input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input); input.select();
      try {
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        showToast('Link copied to clipboard!');
      } catch (error) {
        showToast('Copy not supported here. Open the image to copy its address.');
      } finally { input.remove(); }
    }
  }
  function showPreview(filename) {
    activePreviewUrl = getUrl(filename);
    previewImage.src = activePreviewUrl;
    previewImage.alt = cleanTitle(filename);
    previewName.textContent = filename;
    previewOpen.href = activePreviewUrl;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.open(activePreviewUrl, '_blank', 'noopener');
  }
  function makeCard(filename) {
    const card = document.createElement('article'); card.className = 'emote-card';
    const preview = document.createElement('button'); preview.className = 'emote-preview'; preview.type = 'button';
    preview.setAttribute('aria-label', 'Preview ' + cleanTitle(filename));
    const img = document.createElement('img'); img.src = getUrl(filename); img.alt = cleanTitle(filename); img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => { img.alt = 'Image file missing: ' + filename; card.classList.add('missing-file'); });
    preview.append(img); preview.addEventListener('click', () => showPreview(filename));
    const info = document.createElement('div'); info.className = 'emote-card-info';
    const name = document.createElement('h3'); name.className = 'emote-name'; name.title = filename; name.textContent = cleanTitle(filename);
    const type = document.createElement('span'); type.className = 'emote-type'; type.textContent = ANIMATED_EXTENSIONS.test(filename) ? 'Animated emote' : 'Image emote';
    const actions = document.createElement('div'); actions.className = 'emote-actions';
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-button'; copy.textContent = 'Copy Link';
    copy.addEventListener('click', () => copyText(getUrl(filename)));
    const open = document.createElement('a'); open.className = 'open-button'; open.href = getUrl(filename); open.target = '_blank'; open.rel = 'noopener noreferrer'; open.textContent = '↗'; open.setAttribute('aria-label', 'Open image ' + filename);
    actions.append(copy, open); info.append(name, type, actions); card.append(preview, info);
    return card;
  }
  function render() {
    const visible = state.files.filter(filename => {
      if (!cleanTitle(filename).toLowerCase().includes(state.search.toLowerCase()) && !filename.toLowerCase().includes(state.search.toLowerCase())) return false;
      if (state.filter === 'animated') return ANIMATED_EXTENSIONS.test(filename);
      if (state.filter === 'static') return !ANIMATED_EXTENSIONS.test(filename);
      return true;
    });
    if (state.sort === 'recent') visible.sort((a,b) => timestamp(b).localeCompare(timestamp(a)) || a.localeCompare(b,undefined,{numeric:true}));
    else visible.sort((a,b) => state.sort === 'za' ? b.localeCompare(a,undefined,{numeric:true}) : a.localeCompare(b,undefined,{numeric:true}));
    const items = document.createDocumentFragment();
    visible.forEach(filename => items.append(makeCard(filename)));
    gallery.replaceChildren(items);
    count.textContent = `${visible.length} of ${state.files.length} emote${state.files.length === 1 ? '' : 's'}`;
    status.textContent = '';
    empty.hidden = visible.length !== 0;
    if (state.files.length === 0) {
      emptyTitle.textContent = 'The vault is waiting for its emotes';
      emptyDescription.textContent = 'Upload Blackjack’s GIFs or images into /emotes/files/ and add their exact filenames to /emotes/emotes.json.';
    } else {
      emptyTitle.textContent = 'No matching emotes';
      emptyDescription.textContent = 'Try a different search or choose another filter.';
    }
  }
  async function load() {
    status.textContent = 'Shuffling the deck…';
    try {
      const response = await fetch(DATA_URL + '?v=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('The JSON must contain an array of filenames.');
      state.files = [...new Set(data.filter(item => typeof item === 'string' && item.length > 0 && !item.includes('/') && !item.includes('\\') && item !== '..' && VALID_EXTENSIONS.test(item)))];
      render();
    } catch (error) {
      console.error('Could not load Blackjack emotes:', error);
      state.files = [];
      render();
      emptyTitle.textContent = 'The emote list could not be loaded';
      emptyDescription.textContent = 'Check that /emotes/emotes.json exists and contains a JSON array of exact GIF/image filenames.';
      status.textContent = 'Failed to load the emote list.';
    }
  }
  search?.addEventListener('input', () => {state.search = search.value.trim(); render();});
  sort?.addEventListener('change', () => {state.sort = sort.value; render();});
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => {
      const selected = other === button; other.classList.toggle('selected',selected); other.setAttribute('aria-pressed',String(selected));
    });
    render();
  }));
  document.getElementById('clear-search')?.addEventListener('click', () => {
    state.search = ''; state.filter = 'all'; state.sort = 'az'; search.value = ''; sort.value = 'az';
    document.querySelectorAll('[data-filter]').forEach(button => {const selected = button.dataset.filter === 'all'; button.classList.toggle('selected',selected); button.setAttribute('aria-pressed',String(selected));});
    render(); search.focus();
  });
  document.getElementById('refresh-gallery')?.addEventListener('click', load);
  document.getElementById('close-preview')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  previewCopy?.addEventListener('click', () => copyText(activePreviewUrl));
  load();
})();
