// app.js — orchestrates layers, navigation, reader, lightbox, song view.

(function () {
  let CONTENT = { entries: [] };
  let currentScene = 'desk';
  let history = []; // back stack of {kind: 'scene'|'page', value}

  const stage = document.querySelector('.stage');
  const pageEl = document.querySelector('.page');
  const readerEl = document.querySelector('.reader');
  const lightboxEl = document.querySelector('.lightbox');
  const songViewEl = document.querySelector('.song-view');
  const veil = document.querySelector('.veil');
  const welcome = document.querySelector('.welcome');

  // Build scene elements
  const scenes = {};
  for (const name of Object.keys(window.GMK_SCENES.SCENES)) {
    const node = window.GMK_SCENES.buildScene(name);
    stage.appendChild(node);
    scenes[name] = node;
  }

  function showScene(name, opts = {}) {
    const incoming = scenes[name];
    const outgoing = stage.querySelector('.scene.is-active');
    if (outgoing === incoming) return;

    // transform-origin lets outgoing zoom into the clicked object
    if (outgoing) outgoing.style.setProperty('--origin', opts.origin || '50% 50%');
    incoming.style.setProperty('--origin', '50% 50%');

    if (outgoing) {
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
    }
    incoming.classList.remove('is-leaving');
    // retrigger entry animation by toggling
    incoming.classList.remove('is-active');
    // force reflow
    void incoming.offsetWidth;
    incoming.classList.add('is-active');

    currentScene = name;
    updateBack();
  }

  function showPage(target, opts = {}) {
    window.GMK_GRIDS.renderPage(target);
    pageEl.scrollTop = 0;
    const outgoing = stage.querySelector('.scene.is-active');
    if (outgoing) {
      outgoing.style.setProperty('--origin', opts.origin || '50% 50%');
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
    }
    pageEl.classList.add('is-active');
    updateBack();
  }

  function hidePage() {
    pageEl.classList.remove('is-active');
    const scene = scenes[currentScene];
    if (scene) {
      scene.style.setProperty('--origin', '50% 50%');
      scene.classList.remove('is-leaving');
      // retrigger entry
      scene.classList.remove('is-active');
      void scene.offsetWidth;
      scene.classList.add('is-active');
    }
  }

  function openReader(entry) {
    readerEl.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'reader-inner';
    inner.innerHTML = `
      <div class="reader-meta">
        <div class="r-date">${window.GMK_GRIDS.fmtDate(entry.date)}</div>
        <h1 class="r-title">${escapeHtml(entry.title)}</h1>
        ${entry.note ? `<div class="r-note">${escapeHtml(entry.note)}</div>` : ''}
      </div>
      <div class="reader-body">${window.GMK_GRIDS.md(entry.body || '')}</div>
    `;
    const close = makeClose(() => closeReader());
    readerEl.appendChild(close);
    readerEl.appendChild(inner);
    readerEl.classList.add('is-active');
    readerEl.scrollTop = 0;
    updateBack();
  }

  function closeReader() { readerEl.classList.remove('is-active'); updateBack(); }

  function openLightbox(entry) {
    lightboxEl.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    // placeholder image
    const m = (entry.src || '').match(/placeholder:\/\/[^/]+\/(\d+)x(\d+)/);
    const ratio = m ? `${m[1]}/${m[2]}` : '4/3';

    const ph = document.createElement('div');
    ph.className = 'lightbox-img placeholder ph-img placeholder';
    ph.style.aspectRatio = ratio.replace('/', ' / ');
    ph.style.width = 'min(86vw, 1000px)';
    ph.style.maxHeight = '70vh';
    const lab = document.createElement('span');
    lab.className = 'ph-label';
    lab.textContent = entry.alt || entry.subcategory || entry.type;
    ph.appendChild(lab);

    if (entry.type === 'video') {
      const mark = document.createElement('div');
      mark.className = 'video-mark';
      mark.style.left = '50%'; mark.style.top = '50%';
      mark.style.width = '64px'; mark.style.height = '64px';
      mark.style.transform = 'translate(-50%, -50%)';
      ph.appendChild(mark);
    }

    const meta = document.createElement('div');
    meta.className = 'lightbox-meta';
    meta.innerHTML = `
      <div class="lb-title">${escapeHtml(entry.title)}${entry.note ? ` — <em>${escapeHtml(entry.note)}</em>` : ''}</div>
      <div>${window.GMK_GRIDS.fmtShort(entry.date)}${entry.trip ? ' · ' + entry.trip.replace('-', ' ') : ''}</div>
    `;

    inner.appendChild(ph);
    inner.appendChild(meta);

    const close = makeClose(() => closeLightbox());
    lightboxEl.appendChild(close);
    lightboxEl.appendChild(inner);
    lightboxEl.classList.add('is-active');
    updateBack();
  }
  function closeLightbox() { lightboxEl.classList.remove('is-active'); updateBack(); }

  function openSong(entry) {
    songViewEl.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'song-view-inner';

    const left = document.createElement('div');
    left.className = 'song-view-cover';
    const cover = window.GMK_GRIDS.placeholderCover();
    cover.style.width = '380px'; cover.style.height = '380px';
    left.appendChild(cover);
    const sm = document.createElement('div');
    sm.className = 'sv-meta';
    sm.textContent = `${window.GMK_GRIDS.fmtShort(entry.date)}   ·   ${entry.duration || ''}`;
    left.appendChild(sm);
    const h = document.createElement('h2');
    h.textContent = entry.title;
    left.appendChild(h);
    if (entry.note) {
      const n = document.createElement('p');
      n.className = 'sv-note';
      n.textContent = entry.note;
      left.appendChild(n);
    }
    // player — wired to the shared audio singleton (audio.js)
    const player = document.createElement('div');
    player.className = 'player player-bar';
    player.appendChild(window.GMK_GRIDS.makePlayBtn(entry));
    const { scrub, time } = window.GMK_GRIDS.makeScrub(entry);
    player.appendChild(scrub);
    player.appendChild(time);
    left.appendChild(player);
    inner.appendChild(left);

    const right = document.createElement('div');
    right.className = 'lyrics';
    if (entry.lyrics) {
      // A line that's just `[intro]`, `[verse]`, `[chorus]`, `[bridge]`,
      // `[outro]` (or anything in brackets, really) becomes a section label.
      const lines = entry.lyrics.split('\n');
      let html = '';
      lines.forEach((ln) => {
        const t = ln.trim();
        const m = t.match(/^\[([^\]]+)\]$/);
        if (m) {
          html += `<span class="stanza-label">${escapeHtml(m[1])}</span>`;
        } else {
          html += escapeHtml(ln) + '\n';
        }
      });
      right.innerHTML = html;
    } else {
      right.innerHTML = '<span class="stanza-label">No lyrics</span>';
    }
    inner.appendChild(right);

    const close = makeClose(() => closeSong());
    songViewEl.appendChild(close);
    songViewEl.appendChild(inner);
    songViewEl.classList.add('is-active');
    songViewEl.scrollTop = 0;
    updateBack();
  }
  function closeSong() { songViewEl.classList.remove('is-active'); updateBack(); }

  function makeClose(handler) {
    const b = document.createElement('button');
    b.className = 'close-btn';
    b.innerHTML = '<span class="x"></span><span>Close</span>';
    b.addEventListener('click', handler);
    return b;
  }

  // back arrow ------------------------------------------
  const backEl = document.querySelector('.backlink');
  function updateBack() {
    const isPage = pageEl.classList.contains('is-active');
    const isDesk = currentScene === 'desk' && !isPage;
    const modalOpen =
      readerEl.classList.contains('is-active') ||
      lightboxEl.classList.contains('is-active') ||
      songViewEl.classList.contains('is-active');
    // hide back while a modal is open — user must close with X first
    const hide = isDesk || modalOpen;
    backEl.style.opacity = hide ? 0 : 0.9;
    backEl.style.pointerEvents = hide ? 'none' : 'auto';
  }
  backEl.addEventListener('click', () => {
    if (pageEl.classList.contains('is-active')) {
      hidePage();
      updateBack();
      return;
    }
    if (currentScene !== 'desk') showScene('desk');
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (lightboxEl.classList.contains('is-active')) return closeLightbox();
    if (readerEl.classList.contains('is-active')) return closeReader();
    if (songViewEl.classList.contains('is-active')) return closeSong();
    backEl.click();
  });

  // unified nav router  -------------------------------
  window.GMK = {
    navigate(target, opts = {}) {
      if (target === 'desk' || target === 'letters' || target === 'photos' || target === 'audio') {
        // hide any page first
        if (pageEl.classList.contains('is-active')) hidePage();
        showScene(target, opts);
        return;
      }
      if (target.startsWith('grid:')) {
        showPage(target.slice(5), opts);
        return;
      }
    },
    openLetter: openReader,
    openLightbox,
    openSong,
  };

  // load content & boot ---------------------------------
  function escapeHtml(s='') { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function boot() {
    try {
      const r = await fetch('content.json', { cache: 'no-store' });
      CONTENT = await r.json();
    } catch (e) {
      console.warn('content.json failed to load', e);
    }
    window.GMK_CONTENT = CONTENT;
    await window.GMK_FAV.load();

    // first scene
    showScene('desk');
    updateBack();

    // intro veil + welcome
    requestAnimationFrame(() => veil.classList.add('gone'));
    setTimeout(() => welcome.classList.add('show'), 900);
    setTimeout(() => welcome.classList.add('faded'), 4200);
  }

  boot();
})();
