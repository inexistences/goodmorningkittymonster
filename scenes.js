// scenes.js — Layer 1 (Desk) + Layer 2 (Rooms) navigation.
// Hotspots are normalized 0–1 boxes against the underlying image's frame.

(function () {
  // Coordinates measured against 2544 × 1904 source images, expressed as % of frame.
  // x/y are top-left; w/h are width/height. Slightly generous per brief.
  const SCENES = {
    desk: {
      img: 'assets/desk.png',
      hotspots: [
        // letter stack — large white paper, right side
        { x: 0.605, y: 0.04, w: 0.41, h: 0.46, label: 'Letters', target: 'letters' },
        // cassette tape — center
        { x: 0.34,  y: 0.255, w: 0.24, h: 0.27, label: 'Audio',   target: 'audio'   },
        // polaroid — left-center
        { x: 0.18,  y: 0.40,  w: 0.20, h: 0.27, label: 'Photos',  target: 'photos'  },
      ],
    },
    letters: {
      img: 'assets/letters.png',
      hotspots: [
        // "Anniversary" stack (left)
        { x: 0.085, y: 0.255, w: 0.21, h: 0.34, label: 'Anniversary',          target: 'grid:letters/anniversary' },
        // "Things I've said" (middle) — paper sits in the brightest spot, push tag
        // further down so it lands on the darker desk area
        { x: 0.315, y: 0.28,  w: 0.21, h: 0.34, labelDy: 70, label: "Things I've said",     target: 'grid:letters/things-ive-said' },
        // "Things I've not yet said" (right) — shifted right so glow + tag clear
        // the bright spill from the middle paper
        { x: 0.585, y: 0.32,  w: 0.235,h: 0.31, label: "Things I've not said", target: 'grid:letters/things-ive-not-yet-said' },
      ],
    },
    photos: {
      img: 'assets/photos.png',
      hotspots: [
        // Blue-haired portrait (upper-left polaroid)
        { x: 0.170, y: 0.245, w: 0.21, h: 0.34, label: 'Portraits', target: 'grid:photos/portraits' },
        // Bedroom interior (upper-right polaroid)
        { x: 0.380, y: 0.085, w: 0.21, h: 0.345,label: 'Home',      target: 'grid:photos/home'      },
        // Landscape (bottom-left polaroid)
        { x: 0.190, y: 0.530, w: 0.21, h: 0.36, label: 'Trips',     target: 'grid:photos/trips'     },
        // Couple from behind (bottom-right polaroid)
        { x: 0.500, y: 0.420, w: 0.225,h: 0.36, label: 'Us',        target: 'grid:photos/us'        },
      ],
    },
    audio: {
      img: 'assets/audio.png',
      hotspots: [
        // CD case ('I made dis')
        { x: 0.135, y: 0.275, w: 0.385, h: 0.515, label: 'Songs',       target: 'grid:audio/song'       },
        // Microphone
        { x: 0.50,  y: 0.28,  w: 0.205, h: 0.515, label: 'Voice Memos', target: 'grid:audio/voice-memo' },
      ],
    },
  };

  function buildScene(name) {
    const def = SCENES[name];
    if (!def) return null;
    const scene = document.createElement('div');
    scene.className = 'scene';
    scene.dataset.scene = name;

    const frame = document.createElement('div');
    frame.className = 'frame';

    const img = document.createElement('img');
    img.className = 'bg';
    img.src = def.img;
    img.alt = '';
    frame.appendChild(img);

    def.hotspots.forEach((h) => {
      const btn = document.createElement('button');
      btn.className = 'hotspot';
      btn.style.left = (h.x * 100) + '%';
      btn.style.top  = (h.y * 100) + '%';
      btn.style.width = (h.w * 100) + '%';
      btn.style.height = (h.h * 100) + '%';
      btn.setAttribute('aria-label', h.label);

      const tag = document.createElement('span');
      tag.className = 'ht-tag';
      tag.textContent = h.label;
      if (h.labelDy) tag.style.setProperty('--ht-tag-dy', h.labelDy + 'px');
      btn.appendChild(tag);

      btn.addEventListener('click', (e) => {
        // Compute origin for incoming zoom — center of the hotspot in viewport coords
        const r = btn.getBoundingClientRect();
        const ox = ((r.left + r.width / 2) / window.innerWidth) * 100;
        const oy = ((r.top + r.height / 2) / window.innerHeight) * 100;
        window.GMK.navigate(h.target, { origin: `${ox}% ${oy}%` });
      });
      frame.appendChild(btn);
    });

    scene.appendChild(frame);
    return scene;
  }

  window.GMK_SCENES = { SCENES, buildScene };
})();
