const root = document.querySelector('[data-seo-type]');
if (root) {
  const type = root.dataset.seoType;
  const value = root.dataset.seoValue.toLowerCase();
  const listEl = document.getElementById('seoWords');
  const filterEl = document.getElementById('seoFilter');
  const countEl = document.getElementById('seoCount');
  const messageEl = document.getElementById('seoMessage');
  const moreEl = document.getElementById('seoShowMore');
  const lengthValue = Number(value);
  const supportsModes = type === 'length' && lengthValue >= 6 && lengthValue <= 15;
  const supportsBrowseControls = ['starts','ends','contains'].includes(type);
  const curated = Array.from(listEl?.querySelectorAll('.seo-word') || [])
    .map(el => el.textContent.trim().toLowerCase())
    .filter(w => /^[a-z]+$/.test(w));

  let all = [];
  let filtered = [];
  let shown = 120;
  let mode = supportsModes && curated.length ? 'common' : 'full';
  let browseLength = 0;
  let browseSort = 'alpha';

  const match = w => type === 'length'
    ? w.length === lengthValue
    : type === 'starts'
      ? w.startsWith(value)
      : type === 'ends'
        ? w.endsWith(value)
        : w.includes(value);

  if (supportsModes && curated.length) {
    const style = document.createElement('style');
    style.textContent = `
      .seo-dictionary-mode{margin:18px 0 4px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface-2)}
      .seo-dictionary-mode legend{padding:0 6px;font-weight:850}
      .seo-mode-options{display:flex;gap:10px;flex-wrap:wrap}
      .seo-mode-options label{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer}
      .seo-mode-note{margin:10px 0 0;color:var(--muted);font-size:.9rem}
      @media(max-width:560px){.seo-mode-options{display:grid;grid-template-columns:1fr}.seo-mode-options label{border-radius:12px}}
    `;
    document.head.appendChild(style);

    const modeField = document.createElement('fieldset');
    modeField.className = 'seo-dictionary-mode';
    modeField.innerHTML = `
      <legend>Dictionary view</legend>
      <div class="seo-mode-options">
        <label><input type="radio" name="seoDictionaryMode" value="common" checked> Common words</label>
        <label><input type="radio" name="seoDictionaryMode" value="full"> Full dictionary</label>
      </div>
      <p class="seo-mode-note">Common words shows the curated, familiar examples on this page. Full dictionary includes rare and specialist entries too.</p>
    `;
    filterEl.closest('.seo-filter-label')?.insertAdjacentElement('afterend', modeField);
    modeField.addEventListener('change', event => {
      if (event.target.name !== 'seoDictionaryMode') return;
      mode = event.target.value;
      shown = 120;
      render();
    });
  }

  if (supportsBrowseControls) {
    const style = document.createElement('style');
    style.textContent = `
      .seo-browse-controls{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 4px}
      .seo-browse-controls label{display:grid;gap:7px;font-weight:800;font-size:.88rem;color:var(--muted)}
      .seo-browse-controls select{width:100%;min-height:46px;border:1px solid var(--line);border-radius:12px;padding:0 12px;background:var(--surface);color:var(--text);font:inherit;font-weight:750}
      .seo-browse-controls select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px rgba(91,92,226,.14)}
      @media(max-width:560px){.seo-browse-controls{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const controls = document.createElement('div');
    controls.className = 'seo-browse-controls';
    controls.innerHTML = `
      <label>Word length
        <select id="seoLengthFilter">
          <option value="0">Any length</option>
          ${Array.from({length:14},(_,i)=>i+2).map(n=>`<option value="${n}">${n} letters</option>`).join('')}
        </select>
      </label>
      <label>Sort results
        <select id="seoSortFilter">
          <option value="alpha">A–Z</option>
          <option value="short">Shortest first</option>
          <option value="long">Longest first</option>
        </select>
      </label>
    `;
    filterEl.closest('.seo-filter-label')?.insertAdjacentElement('afterend', controls);
    controls.querySelector('#seoLengthFilter')?.addEventListener('change', event => {
      browseLength = Number(event.target.value) || 0;
      shown = 120;
      render();
    });
    controls.querySelector('#seoSortFilter')?.addEventListener('change', event => {
      browseSort = event.target.value;
      shown = 120;
      render();
    });
  }

  const sortBrowseResults = words => {
    if (!supportsBrowseControls || browseSort === 'alpha') return [...words].sort((a,b)=>a.localeCompare(b));
    if (browseSort === 'short') return [...words].sort((a,b)=>a.length-b.length || a.localeCompare(b));
    return [...words].sort((a,b)=>b.length-a.length || a.localeCompare(b));
  };

  const render = () => {
    const source = mode === 'common' ? curated : all;
    const q = filterEl.value.trim().toLowerCase();
    let next = q ? source.filter(w => w.includes(q)) : [...source];
    if (supportsBrowseControls && browseLength) next = next.filter(w => w.length === browseLength);
    filtered = sortBrowseResults(next);
    const visible = filtered.slice(0, shown);
    listEl.innerHTML = visible.map(w => `<li class="seo-word">${w}</li>`).join('');
    countEl.textContent = filtered.length.toLocaleString('en-US');

    if (mode === 'common') {
      messageEl.textContent = q
        ? `Showing ${visible.length.toLocaleString('en-US')} common matching words. Try Full dictionary if you need a rarer entry.`
        : `Showing ${visible.length.toLocaleString('en-US')} curated common words. Switch to Full dictionary for every matching entry.`;
    } else if (supportsBrowseControls) {
      const lengthText = browseLength ? ` with ${browseLength} letters` : '';
      messageEl.textContent = `Showing ${visible.length.toLocaleString('en-US')} of ${filtered.length.toLocaleString('en-US')} matching words${lengthText}.`;
    } else {
      messageEl.textContent = `Showing ${visible.length.toLocaleString('en-US')} of ${filtered.length.toLocaleString('en-US')} matching dictionary words.`;
    }

    if (!filtered.length && mode === 'common') {
      messageEl.textContent = 'No common words matched. Switch to Full dictionary to search rare and specialist entries.';
    } else if (!filtered.length && supportsBrowseControls) {
      messageEl.textContent = 'No words match these filters. Try another length or clear the text filter.';
    }
    moreEl.hidden = mode === 'common' || visible.length >= filtered.length;
  };

  fetch('/words.txt')
    .then(r => {
      if (!r.ok) throw new Error('Dictionary unavailable');
      return r.text();
    })
    .then(text => {
      all = text
        .split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(w => /^[a-z]+$/.test(w) && match(w));
      shown = 120;
      render();
    })
    .catch(() => {
      if (supportsModes && curated.length) {
        mode = 'common';
        document.querySelectorAll('input[name="seoDictionaryMode"]').forEach(input => {
          input.checked = input.value === 'common';
          if (input.value === 'full') input.disabled = true;
        });
        render();
        messageEl.textContent = 'The full dictionary could not load, so the curated common words are shown instead.';
      } else {
        messageEl.textContent = 'The full list could not load. The words shown below are still available.';
        moreEl.hidden = true;
      }
    });

  filterEl.addEventListener('input', () => {
    shown = 120;
    render();
  });
  moreEl.addEventListener('click', () => {
    shown += 200;
    render();
  });

  if (supportsModes && curated.length) render();
}
