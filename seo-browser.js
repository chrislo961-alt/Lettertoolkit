const root = document.querySelector('[data-seo-type]');
if (root) {
  const type = root.dataset.seoType;
  const value = root.dataset.seoValue.toLowerCase();
  const listEl = document.getElementById('seoWords');
  const filterEl = document.getElementById('seoFilter');
  const countEl = document.getElementById('seoCount');
  const messageEl = document.getElementById('seoMessage');
  const moreEl = document.getElementById('seoShowMore');
  let all = [], filtered = [], shown = 120;
  const match = w => type === 'length' ? w.length === Number(value) : type === 'starts' ? w.startsWith(value) : type === 'ends' ? w.endsWith(value) : w.includes(value);
  const render = () => {
    const q = filterEl.value.trim().toLowerCase();
    filtered = q ? all.filter(w => w.includes(q)) : all;
    const visible = filtered.slice(0, shown);
    listEl.innerHTML = visible.map(w => `<li class="seo-word">${w}</li>`).join('');
    countEl.textContent = filtered.length.toLocaleString('en-US');
    messageEl.textContent = `Showing ${visible.length.toLocaleString('en-US')} of ${filtered.length.toLocaleString('en-US')} matching words.`;
    moreEl.hidden = visible.length >= filtered.length;
  };
  fetch('/words.txt').then(r => { if(!r.ok) throw new Error('Dictionary unavailable'); return r.text(); }).then(text => {
    all = text.split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]+$/.test(w) && match(w)).sort();
    shown = 120; render();
  }).catch(() => { messageEl.textContent = 'The full list could not load. The words shown below are still available.'; moreEl.hidden = true; });
  filterEl.addEventListener('input', () => { shown = 120; render(); });
  moreEl.addEventListener('click', () => { shown += 200; render(); });
}
