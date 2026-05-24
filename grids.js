// grids.js — Layer 3 grid pages for letters / photos / audio.
// Renders into a single .page node based on a content slice.

(function () {
  // ---- helpers ----
  const fmtDate = (s) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[+m - 1]} ${parseInt(d, 10)}, ${y}`;
  };
  const fmtShort = (s) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${y}.${m}.${d}`;
  };
  const excerpt = (body, n = 22) => {
    if (!body) return '';
    const t = body.replace(/^---[\s\S]*?---/, '').replace(/\s+/g, ' ').trim();
    const words = t.split(' ').slice(0, n).join(' ');
    return words + (t.split(' ').length > n ? '…' : '');
  };
  const md = (s = '') =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
     .replace(/\*([^*]+)\*/g, '<em>$1</em>')
     .replace(/_([^_]+)_/g, '<em>$1</em>')
     .split(/\n\s*\n/)
     .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
     .join('');

  // ---- grids ----
  const PAGE_TITLES = {
    'letters/anniversary':              { crumb: 'Letters /', title: 'Anniversary' },
    'letters/things-ive-said':          { crumb: 'Letters /', title: "Things I've said" },
    'letters/things-ive-not-yet-said':  { crumb: 'Letters /', title: "Things I've not yet said" },
    'photos/portraits':                 { crumb: 'Photos /',  title: 'Portraits' },
    'photos/home':                      { crumb: 'Photos /',  title: 'Home' },
    'photos/trips':                     { crumb: 'Photos /',  title: 'Trips' },
    'photos/us':                        { crumb: 'Photos /',  title: 'Us' },
    'audio/song':                       { crumb: 'Audio /',   title: 'Songs' },
    'audio/voice-memo':                 { crumb: 'Audio /',   title: 'Voice Memos' },
  };

  let currentSlice = null;
  let viewMode = 'all'; // 'all' | 'fav'
  let tripFilter = null;

  function placeholderImg(kind, ratio = '4/3') {
    const wrap = document.createElement('div');
    wrap.className = 'ph-img placeholder';
    wrap.style.aspectRatio = ratio.replace('/', ' / ');
    const lab = document.createElement('span');
    lab.className = 'ph-label';
    lab.textContent = kind;
    wrap.appendChild(lab);
    return wrap;
  }

  function placeholderCover() {
    const wrap = document.createElement('div');
    wrap.className = 'cover';
    const lab = document.createElement('span');
    lab.className = 'cover-label';
    lab.textContent = 'COVER';
    wrap.appendChild(lab);
    return wrap;
  }

  function dogear(entry, cardEl) {
    const d = document.createElement('div');
    d.className = 'dogear';
    d.setAttribute('role', 'button');
    d.setAttribute('aria-label', 'Mark as kept');
    d.addEventListener('click', (e) => {
      e.stopPropagation();
      window.GMK_FAV.toggle(entry.id).then((nowFav) => {
        cardEl.classList.toggle('is-fav', nowFav);
        if (viewMode === 'fav' && !nowFav) {
          // re-render to remove
          renderCurrent();
        }
      });
    });
    return d;
  }

  function letterCard(entry) {
    const card = document.createElement('article');
    card.className = 'card card-letter';
    if (window.GMK_FAV.has(entry.id)) card.classList.add('is-fav');

    const date = document.createElement('div');
    date.className = 'card-date';
    date.textContent = fmtShort(entry.date);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = entry.title;

    const ex = document.createElement('p');
    ex.className = 'card-excerpt';
    ex.textContent = excerpt(entry.body, 28);

    card.appendChild(dogear(entry, card));
    card.appendChild(date);
    card.appendChild(title);
    card.appendChild(ex);

    card.addEventListener('click', () => window.GMK.openLetter(entry));
    return card;
  }

  function photoCard(entry) {
    const card = document.createElement('article');
    card.className = 'card card-photo';
    if (window.GMK_FAV.has(entry.id)) card.classList.add('is-fav');

    // pick a ratio based on src hint (placeholder://kind/ratio)
    let ratio = '4/3';
    const m = (entry.src || '').match(/placeholder:\/\/[^/]+\/(\d+)x(\d+)/);
    if (m) ratio = `${m[1]}/${m[2]}`;
    const ph = placeholderImg(entry.subcategory || entry.type, ratio);

    if (entry.type === 'video') {
      const mark = document.createElement('div');
      mark.className = 'video-mark';
      ph.appendChild(mark);
    }

    const meta = document.createElement('div');
    meta.className = 'ph-meta';
    const t = document.createElement('div');
    t.className = 'ph-title';
    t.textContent = entry.title;
    const d = document.createElement('div');
    d.className = 'ph-date';
    d.textContent = fmtShort(entry.date);
    meta.appendChild(t);
    meta.appendChild(d);

    card.appendChild(dogear(entry, card));
    card.appendChild(ph);
    card.appendChild(meta);

    card.addEventListener('click', () => window.GMK.openLightbox(entry));
    return card;
  }

  function fmtDur(s) { return s || '0:00'; }

  // tiny static waveform svg
  function waveformSVG(seed) {
    const bars = 56;
    let s = seed || 'mem';
    // deterministic pseudo-random
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    const heights = [];
    for (let i = 0; i < bars; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const v = 0.18 + ((h >> 8) & 0xff) / 255 * 0.82;
      heights.push(v);
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${bars * 4} 22`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('wave');
    heights.forEach((v, i) => {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', i * 4);
      r.setAttribute('y', (22 - v * 18) / 2);
      r.setAttribute('width', 2);
      r.setAttribute('height', v * 18);
      r.setAttribute('fill', 'currentColor');
      r.setAttribute('opacity', 0.55 + v * 0.45);
      svg.appendChild(r);
    });
    svg.style.color = 'oklch(0.66 0.018 78)';
    return svg;
  }

  function songCard(entry) {
    const card = document.createElement('article');
    card.className = 'card card-audio song';
    if (window.GMK_FAV.has(entry.id)) card.classList.add('is-fav');

    card.appendChild(dogear(entry, card));
    card.appendChild(placeholderCover());

    const info = document.createElement('div');
    info.className = 'info';

    const meta = document.createElement('div');
    meta.className = 's-meta meta';
    meta.textContent = `${fmtShort(entry.date)}   ·   ${fmtDur(entry.duration)}`;
    info.appendChild(meta);

    const t = document.createElement('h3');
    t.className = 's-title';
    t.textContent = entry.title;
    info.appendChild(t);

    if (entry.note) {
      const n = document.createElement('p');
      n.className = 's-note';
      n.textContent = entry.note;
      info.appendChild(n);
    }

    const player = document.createElement('div');
    player.className = 'player player-bar';
    player.appendChild(makePlayBtn());
    const scrub = document.createElement('div');
    scrub.className = 'scrub';
    const fill = document.createElement('div');
    fill.className = 'scrub-fill';
    scrub.appendChild(fill);
    player.appendChild(scrub);
    const time = document.createElement('span');
    time.className = 'scrub-time';
    time.textContent = `0:00 / ${fmtDur(entry.duration)}`;
    player.appendChild(time);
    info.appendChild(player);

    card.appendChild(info);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.play-btn') || e.target.closest('.dogear')) return;
      window.GMK.openSong(entry);
    });
    return card;
  }

  function memoCard(entry) {
    const card = document.createElement('article');
    card.className = 'card card-audio memo';
    if (window.GMK_FAV.has(entry.id)) card.classList.add('is-fav');

    const date = document.createElement('div');
    date.className = 'm-date';
    date.textContent = fmtShort(entry.date);
    const title = document.createElement('div');
    title.className = 'm-title';
    title.textContent = entry.title;
    const wave = waveformSVG(entry.id);
    const dur = document.createElement('div');
    dur.className = 'm-dur';
    dur.textContent = fmtDur(entry.duration);
    const play = makePlayBtn();

    card.appendChild(dogear(entry, card));
    card.appendChild(date);
    card.appendChild(title);
    card.appendChild(wave);
    card.appendChild(dur);
    card.appendChild(play);
    return card;
  }

  function makePlayBtn() {
    const b = document.createElement('button');
    b.className = 'play-btn';
    b.setAttribute('aria-label', 'Play');
    const t = document.createElement('span');
    t.className = 'tri';
    b.appendChild(t);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.classList.toggle('is-playing');
      // Audio playback is a placeholder for prototype.
    });
    return b;
  }

  // ---- main render ----
  function renderPage(target) {
    currentSlice = target;
    viewMode = 'all';
    tripFilter = null;

    const [layer, sub] = target.split('/');
    const meta = PAGE_TITLES[target] || { crumb: '', title: target };

    const page = document.querySelector('.page');
    page.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'page-inner';

    const head = document.createElement('header');
    head.className = 'page-head';
    head.innerHTML = `
      <div>
        <div class="crumb">${meta.crumb}</div>
        <h1>${meta.title}</h1>
      </div>
      <div class="head-r">
        <div class="seg" role="tablist">
          <button data-mode="all" class="is-on">All</button>
          <button data-mode="fav">Kept</button>
        </div>
      </div>
    `;
    inner.appendChild(head);

    // Trip filter row (only for photos/trips)
    if (target === 'photos/trips') {
      const trips = new Set();
      window.GMK_CONTENT.entries
        .filter((e) => (e.type === 'photo' || e.type === 'video') && e.subcategory === 'trips' && e.trip)
        .forEach((e) => trips.add(e.trip));
      if (trips.size) {
        const row = document.createElement('div');
        row.className = 'trips';
        const all = document.createElement('button');
        all.textContent = 'All trips';
        all.classList.add('is-on');
        all.addEventListener('click', () => { tripFilter = null; renderList(); });
        row.appendChild(all);
        [...trips].sort().forEach((t) => {
          const b = document.createElement('button');
          b.textContent = t.replace('-', ' ');
          b.addEventListener('click', () => { tripFilter = t; renderList(); });
          row.appendChild(b);
        });
        inner.appendChild(row);
      }
    }

    const list = document.createElement('div');
    list.className = 'grid-list';
    inner.appendChild(list);

    page.appendChild(inner);

    head.querySelectorAll('.seg button').forEach((b) => {
      b.addEventListener('click', () => {
        viewMode = b.dataset.mode;
        head.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('is-on', x === b));
        renderList();
      });
    });

    function renderList() {
      list.innerHTML = '';
      const all = window.GMK_CONTENT.entries.slice();
      let items = all.filter(matches);
      if (viewMode === 'fav') items = items.filter((e) => window.GMK_FAV.has(e.id));
      if (target === 'photos/trips' && tripFilter) items = items.filter((e) => e.trip === tripFilter);

      // refresh trip pill highlight
      const row = inner.querySelector('.trips');
      if (row) {
        row.querySelectorAll('button').forEach((b, i) => {
          if (i === 0) b.classList.toggle('is-on', !tripFilter);
          else b.classList.toggle('is-on', b.textContent.replace(' ', '-') === tripFilter);
        });
      }

      if (!items.length) {
        const e = document.createElement('div');
        e.className = 'empty';
        e.textContent = viewMode === 'fav'
          ? 'Nothing kept here yet.'
          : 'Empty for now. Drop files in and re-build.';
        list.appendChild(e);
        return;
      }

      let cls = 'grid-letters';
      if (layer === 'photos') cls = 'grid-photos';
      else if (layer === 'audio' && sub === 'song') cls = 'grid-songs';
      else if (layer === 'audio' && sub === 'voice-memo') cls = 'grid-memos';
      list.className = cls;

      items.forEach((entry) => {
        let card;
        if (entry.type === 'letter') card = letterCard(entry);
        else if (entry.type === 'photo' || entry.type === 'video') card = photoCard(entry);
        else if (entry.type === 'audio' && entry.subcategory === 'song') card = songCard(entry);
        else if (entry.type === 'audio') card = memoCard(entry);
        if (card) list.appendChild(card);
      });
    }

    function matches(e) {
      if (target.startsWith('letters/')) return e.type === 'letter' && e.subcategory === sub;
      if (target.startsWith('photos/'))  return (e.type === 'photo' || e.type === 'video') && e.subcategory === sub;
      if (target.startsWith('audio/'))   return e.type === 'audio' && e.subcategory === sub;
      return false;
    }

    renderList();
    return page;
  }

  function renderCurrent() { if (currentSlice) renderPage(currentSlice); }

  window.GMK_GRIDS = { renderPage, fmtDate, fmtShort, md, placeholderCover };
})();
