(() => {
  'use strict';
  const form = document.getElementById('filters-form');
  if (!form) return;

  const search = document.getElementById('filter');
  const locationFilter = document.getElementById('location-filter');
  const genreFilter = document.getElementById('genre-filter');
  const bridgeOnly = document.getElementById('only-bridge');
  const sort = document.getElementById('sort');
  const grid = document.getElementById('label-cards');
  const cards = Array.from(grid?.querySelectorAll('[data-card]') || []);
  const result = document.getElementById('result-count');
  const empty = document.getElementById('empty-results');
  const clear = document.getElementById('reset-filters');
  const emptyClear = document.getElementById('empty-reset');
  const params = new URLSearchParams(location.search);

  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (search) search.value = params.get('q') || '';
  if (locationFilter) locationFilter.value = params.get('location') || '';
  if (genreFilter) genreFilter.value = params.get('genre') || '';
  if (bridgeOnly) bridgeOnly.checked = params.get('onBridge') === '1';
  if (sort && ['recommended','az','za','bridge'].includes(params.get('sort'))) sort.value = params.get('sort');

  function syncQuery() {
    const next = new URLSearchParams();
    if (search?.value.trim()) next.set('q', search.value.trim());
    if (locationFilter?.value) next.set('location', locationFilter.value);
    if (genreFilter?.value) next.set('genre', genreFilter.value);
    if (bridgeOnly?.checked) next.set('onBridge', '1');
    if (sort?.value && sort.value !== 'recommended') next.set('sort', sort.value);
    try { history.replaceState(null, '', location.pathname + (next.size ? '?' + next.toString() : '') + location.hash); }
    catch (_) { /* file previews or restricted browsers may not allow history updates. */ }
  }

  function update(shouldSync = false) {
    const query = normalize(search?.value);
    const city = normalize(locationFilter?.value);
    const genre = normalize(genreFilter?.value);
    const bridge = !!bridgeOnly?.checked;
    const chosenSort = sort?.value || 'recommended';
    let shown = 0;
    for (const card of cards) {
      const matches = normalize(card.dataset.search).includes(query)
        && (!city || normalize(card.dataset.location) === city)
        && (!genre || normalize(card.dataset.genre) === genre)
        && (!bridge || card.dataset.bridge === 'true');
      card.hidden = !matches;
      if (matches) shown++;
    }
    const decorated = cards.map((card, index) => ({card, index}));
    if (chosenSort !== 'recommended') {
      decorated.sort((a, b) => {
        const A = a.card.dataset.title || '';
        const B = b.card.dataset.title || '';
        if (chosenSort === 'az') return A.localeCompare(B);
        if (chosenSort === 'za') return B.localeCompare(A);
        if (chosenSort === 'bridge') {
          const difference = Number(b.card.dataset.bridge === 'true') - Number(a.card.dataset.bridge === 'true');
          return difference || a.index - b.index;
        }
        return a.index - b.index;
      });
    }
    for (const {card} of decorated) grid?.appendChild(card);
    if (result) result.textContent = shown + ' label' + (shown === 1 ? '' : 's') + ' found';
    if (empty) empty.hidden = shown !== 0;
    if (shouldSync) syncQuery();
  }
  const reset = () => {
    if (search) search.value = '';
    if (locationFilter) locationFilter.value = '';
    if (genreFilter) genreFilter.value = '';
    if (bridgeOnly) bridgeOnly.checked = false;
    if (sort) sort.value = 'recommended';
    update(true);
    search?.focus();
  };
  form.addEventListener('submit', event => { event.preventDefault(); update(true); });
  for (const node of [search, locationFilter, genreFilter, bridgeOnly, sort]) {
    if (!node) continue;
    node.addEventListener(node === search ? 'input' : 'change', () => update(true));
  }
  clear?.addEventListener('click', reset);
  emptyClear?.addEventListener('click', reset);
  update();
})();
