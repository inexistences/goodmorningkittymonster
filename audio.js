// audio.js — one shared <audio> for the whole site.
//
// Every .play-btn and .scrub on the page subscribes to the same singleton so
// that only one track plays at a time, all buttons reflect playing-state, and
// the scrubs/time-displays stay in sync wherever the same entry is shown
// (grid card + open song view).
//
// API:
//   GMK_AUDIO.toggle(entry)        play if paused / pause if playing / switch
//   GMK_AUDIO.pause()              pause whatever is playing
//   GMK_AUDIO.isPlaying(id)        bool — is this id the current and not paused
//   GMK_AUDIO.getProgress(id)      { current, duration } in seconds
//   GMK_AUDIO.seekRatio(id, r)     seek current track to 0..1 of duration
//   GMK_AUDIO.subscribe(id, h)     h = { onState({playing}), onProgress({current,duration}) }
//                                  returns an unsubscribe fn

(function () {
  const audio = new Audio();
  audio.preload = 'metadata';

  let currentId = null;
  const subs = new Map(); // id -> Set<handlers>

  function notify(id, key, payload) {
    const set = subs.get(id);
    if (!set) return;
    set.forEach((h) => { try { h[key] && h[key](payload); } catch (e) { console.warn(e); } });
  }

  function progressPayload() {
    return {
      current: audio.currentTime || 0,
      duration: isFinite(audio.duration) ? audio.duration : 0,
    };
  }

  audio.addEventListener('play',  () => notify(currentId, 'onState', { playing: true }));
  audio.addEventListener('pause', () => notify(currentId, 'onState', { playing: false }));
  audio.addEventListener('ended', () => {
    notify(currentId, 'onState', { playing: false });
    audio.currentTime = 0;
    notify(currentId, 'onProgress', progressPayload());
  });
  audio.addEventListener('timeupdate',     () => notify(currentId, 'onProgress', progressPayload()));
  audio.addEventListener('loadedmetadata', () => notify(currentId, 'onProgress', progressPayload()));

  function toggle(entry) {
    if (!entry || !entry.src) return;

    // same track → toggle play/pause
    if (currentId === entry.id) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }

    // switching tracks — tell old subs we stopped, then load new src
    if (currentId) {
      notify(currentId, 'onState', { playing: false });
      notify(currentId, 'onProgress', { current: 0, duration: 0 });
    }
    currentId = entry.id;
    audio.src = entry.src;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // autoplay errors are not fatal — keep state coherent
      console.warn('audio play failed:', err);
      notify(currentId, 'onState', { playing: false });
    });
  }

  function pause() { if (!audio.paused) audio.pause(); }
  function isPlaying(id) { return currentId === id && !audio.paused; }
  function getProgress(id) {
    if (currentId !== id) return { current: 0, duration: 0 };
    return progressPayload();
  }
  function seekRatio(id, r) {
    if (currentId !== id) return;
    if (!isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(1, r)) * audio.duration;
    notify(currentId, 'onProgress', progressPayload());
  }
  function subscribe(id, handlers) {
    if (!subs.has(id)) subs.set(id, new Set());
    subs.get(id).add(handlers);
    // immediately push current state so the UI doesn't flash wrong
    handlers.onState && handlers.onState({ playing: isPlaying(id) });
    handlers.onProgress && handlers.onProgress(getProgress(id));
    return () => {
      const set = subs.get(id);
      if (set) set.delete(handlers);
    };
  }

  window.GMK_AUDIO = { toggle, pause, isPlaying, getProgress, seekRatio, subscribe };
})();
