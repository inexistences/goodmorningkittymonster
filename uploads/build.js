#!/usr/bin/env node
// build.js — scans content folders and writes content.json for the site.
//
// Filename convention:    YYYY-MM-DD-slug.ext        e.g. 2026-05-19-quiet-hours.md
// Date comes from the filename prefix. Anything not matching that pattern is
// skipped (so you can drop a draft.md alongside finished pieces without it
// showing up — handy).
//
// Per-type rules:
//   poems/*.md       front-matter:  title, note?, lang?
//   letters/*.md     front-matter:  title, note?, lang?
//   photos/*.{jpg,jpeg,png,webp,svg}   metadata: optional .json sidecar with title/note/alt
//   audio/*.{mp3,m4a,wav,ogg}          metadata: optional .json sidecar with title/note/duration
//   videos/*.{mp4,mov,webm}             metadata: optional .json sidecar with title/note/duration/cover
//                                       cover = filename of a poster image in the same folder
//   albums/YYYY-MM-DD-slug/             a folder of photos = one album entry.
//                                       optional album.json inside with {title, note}.
//
// Run locally:  node build.js
// On Netlify:   set build command to "node build.js"

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'content.json');

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.([a-z0-9]+)$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw.trim() };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: m[2].trim() };
}

function readSidecar(filePath) {
  const j = filePath.replace(/\.[^.]+$/, '.json');
  if (fs.existsSync(j)) {
    try { return JSON.parse(fs.readFileSync(j, 'utf8')); } catch { return {}; }
  }
  return {};
}

function entryFromMarkdown(type, dir, file) {
  const full = path.join(dir, file);
  const m = file.match(DATE_RE);
  if (!m) return null;
  const [, date, slug] = m;
  const { meta, body } = parseFrontmatter(fs.readFileSync(full, 'utf8'));
  return {
    id: `${date}-${slug}`,
    type,
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    lang: meta.lang || 'en',
    body,
  };
}

function entryFromMedia(type, dir, file) {
  const m = file.match(DATE_RE);
  if (!m) return null;
  const [, date, slug, ext] = m;
  // Whitelist extensions per type — anything else is skipped
  if (type === 'photo' && !/^(jpe?g|png|webp|gif|svg)$/i.test(ext)) return null;
  if (type === 'audio' && !/^(mp3|m4a|aac|wav|ogg|flac)$/i.test(ext)) return null;
  const full = path.join(dir, file);
  const meta = readSidecar(full);

  // Audio: auto-detect a cover image with the same basename, or use meta.cover
  let cover;
  let lyrics, translation;
  if (type === 'audio') {
    if (meta.cover) {
      cover = meta.cover.startsWith('audio/') ? meta.cover : `audio/${meta.cover}`;
    } else {
      const baseNoExt = file.replace(/\.[^.]+$/, '');
      for (const e of ['jpg', 'jpeg', 'png', 'webp']) {
        if (fs.existsSync(path.join(dir, baseNoExt + '.' + e))) {
          cover = `audio/${baseNoExt}.${e}`;
          break;
        }
      }
    }
    // Lyrics + translation: same basename, .lyrics.txt / .translation.txt
    const baseNoExt = file.replace(/\.[^.]+$/, '');
    const lyricsPath = path.join(dir, baseNoExt + '.lyrics.txt');
    const transPath = path.join(dir, baseNoExt + '.translation.txt');
    if (fs.existsSync(lyricsPath)) lyrics = fs.readFileSync(lyricsPath, 'utf8').trim();
    if (fs.existsSync(transPath))  translation = fs.readFileSync(transPath, 'utf8').trim();
  }

  return {
    id: `${date}-${slug}`,
    type,
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    src: `${type === 'photo' ? 'photos' : 'audio'}/${file}`,
    ...(type === 'photo' ? { alt: meta.alt || meta.title || '' } : {}),
    ...(type === 'audio' && meta.duration ? { duration: meta.duration } : {}),
    ...(cover ? { cover } : {}),
    ...(lyrics ? { lyrics } : {}),
    ...(translation ? { translation } : {}),
  };
}

const entries = [];

for (const file of walk(path.join(ROOT, 'poems')))   { const e = entryFromMarkdown('poem',   path.join(ROOT, 'poems'),   file); if (e) entries.push(e); }
for (const file of walk(path.join(ROOT, 'letters'))) { const e = entryFromMarkdown('letter', path.join(ROOT, 'letters'), file); if (e) entries.push(e); }
for (const file of walk(path.join(ROOT, 'photos')))  { const e = entryFromMedia('photo',     path.join(ROOT, 'photos'),  file); if (e) entries.push(e); }
for (const file of walk(path.join(ROOT, 'audio')))   { const e = entryFromMedia('audio',     path.join(ROOT, 'audio'),   file); if (e) entries.push(e); }

// videos/ — each .mp4/.mov/.webm is one entry. Optional .jpg/.png cover with the same base name, optional .json sidecar.
const VID_RE = /\.(mp4|m4v|mov|webm)$/i;
const VID_DIR = path.join(ROOT, 'videos');
if (fs.existsSync(VID_DIR)) {
  for (const file of walk(VID_DIR)) {
    if (!VID_RE.test(file)) continue;
    const m = file.match(DATE_RE);
    if (!m) continue;
    const [, date, slug] = m;
    const baseNoExt = file.replace(/\.[^.]+$/, '');
    const sidecar = path.join(VID_DIR, baseNoExt + '.json');
    let meta = {};
    if (fs.existsSync(sidecar)) {
      try { meta = JSON.parse(fs.readFileSync(sidecar, 'utf8')); } catch {}
    }
    // Auto-detect a poster image with the same basename
    let cover = meta.cover;
    if (!cover) {
      for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
        if (fs.existsSync(path.join(VID_DIR, baseNoExt + '.' + ext))) {
          cover = `videos/${baseNoExt}.${ext}`;
          break;
        }
      }
    } else if (!cover.startsWith('videos/')) {
      cover = `videos/${cover}`;
    }
    entries.push({
      id: `${date}-${slug}`,
      type: 'video',
      date,
      title: meta.title || slug.replace(/-/g, ' '),
      note: meta.note || '',
      src: `videos/${file}`,
      ...(cover ? { cover } : {}),
      ...(meta.duration ? { duration: meta.duration } : {}),
    });
  }
}

// albums/ — each subfolder is one album
const ALBUMS_DIR = path.join(ROOT, 'albums');
if (fs.existsSync(ALBUMS_DIR)) {
  for (const sub of walk(ALBUMS_DIR)) {
    const subPath = path.join(ALBUMS_DIR, sub);
    if (!fs.statSync(subPath).isDirectory()) continue;
    const m = sub.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    if (!m) continue;
    const [, date, slug] = m;
    const meta = (() => {
      const j = path.join(subPath, 'album.json');
      if (fs.existsSync(j)) { try { return JSON.parse(fs.readFileSync(j, 'utf8')); } catch { return {}; } }
      return {};
    })();
    const IMG = /\.(jpe?g|png|webp|gif|svg)$/i;
    const files = walk(subPath).filter((f) => IMG.test(f)).sort();
    if (files.length === 0) continue;
    const photos = files.map((f) => {
      const sidecar = path.join(subPath, f.replace(/\.[^.]+$/, '.json'));
      let alt = '';
      if (fs.existsSync(sidecar)) {
        try { alt = (JSON.parse(fs.readFileSync(sidecar, 'utf8')).alt) || ''; } catch {}
      }
      return { src: `albums/${sub}/${f}`, alt };
    });
    entries.push({
      id: `${date}-${slug}`,
      type: 'album',
      date,
      title: meta.title || slug.replace(/-/g, ' '),
      note: meta.note || '',
      photos,
    });
  }
}

entries.sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(OUT, JSON.stringify({ entries }, null, 2));
console.log(`✓ wrote ${entries.length} entries to content.json`);
