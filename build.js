#!/usr/bin/env node
// build.js — scans content folders and writes content.json for goodmorningkitty.com.
//
// Filename convention:    YYYY-MM-DD-slug.ext        e.g. 2026-05-19-quiet-hours.md
// Date comes from the filename prefix. Anything not matching that pattern is
// skipped (so you can drop a draft.md alongside finished pieces without it
// showing up — handy).
//
// Per-type rules:
//   letters/*.md                front-matter:  title, note?, lang?, subcategory
//   photos/*.{jpg,jpeg,png,webp,svg}   sidecar .json:  title?, note?, alt?, subcategory, trip?
//   videos/*.{mp4,mov,webm,m4v}        sidecar .json:  title?, note?, duration?, cover?, subcategory, trip?
//                                       cover = filename of a poster image in /videos/
//   audio/*.{mp3,m4a,wav,ogg}          sidecar .json:  title?, note?, duration?, cover?, subcategory
//                                       lyrics      = <basename>.lyrics.txt
//                                       translation = <basename>.translation.txt
//
// Subcategory values per type:
//   letters: anniversary | things-ive-said | things-ive-not-yet-said
//   photos:  portraits | home | trips | us
//   videos:  portraits | home | trips | us   (videos surface inside photo grids)
//   audio:   song | voice-memo
//
// Trip tag (photos/videos only, optional): "trip": "Japan-2025"
//
// Run locally:  node build.js
// On Netlify / GH Actions: same command — output is committed to repo.

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

// ---- letters ----
function entryFromLetter(dir, file) {
  const m = file.match(DATE_RE);
  if (!m || m[3].toLowerCase() !== 'md') return null;
  const [, date, slug] = m;
  const full = path.join(dir, file);
  const { meta, body } = parseFrontmatter(fs.readFileSync(full, 'utf8'));
  return {
    id: `${date}-${slug}`,
    type: 'letter',
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    lang: meta.lang || 'en',
    subcategory: meta.subcategory || '',
    body,
  };
}

// ---- photos ----
function entryFromPhoto(dir, file) {
  const m = file.match(DATE_RE);
  if (!m) return null;
  const [, date, slug, ext] = m;
  if (!/^(jpe?g|png|webp|gif|svg)$/i.test(ext)) return null;
  const full = path.join(dir, file);
  const meta = readSidecar(full);
  const e = {
    id: `${date}-${slug}`,
    type: 'photo',
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    src: `photos/${file}`,
    alt: meta.alt || meta.title || '',
    subcategory: meta.subcategory || '',
  };
  if (meta.trip) e.trip = meta.trip;
  return e;
}

// ---- videos ----
const VID_RE = /\.(mp4|m4v|mov|webm)$/i;
function entryFromVideo(dir, file) {
  if (!VID_RE.test(file)) return null;
  const m = file.match(DATE_RE);
  if (!m) return null;
  const [, date, slug] = m;
  const baseNoExt = file.replace(/\.[^.]+$/, '');
  const sidecar = path.join(dir, baseNoExt + '.json');
  let meta = {};
  if (fs.existsSync(sidecar)) {
    try { meta = JSON.parse(fs.readFileSync(sidecar, 'utf8')); } catch {}
  }
  let cover = meta.cover;
  if (!cover) {
    for (const e of ['jpg', 'jpeg', 'png', 'webp']) {
      if (fs.existsSync(path.join(dir, baseNoExt + '.' + e))) {
        cover = `videos/${baseNoExt}.${e}`;
        break;
      }
    }
  } else if (!cover.startsWith('videos/')) {
    cover = `videos/${cover}`;
  }
  const e = {
    id: `${date}-${slug}`,
    type: 'video',
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    src: `videos/${file}`,
    subcategory: meta.subcategory || '',
  };
  if (cover) e.cover = cover;
  if (meta.duration) e.duration = meta.duration;
  if (meta.trip) e.trip = meta.trip;
  return e;
}

// ---- audio ----
function entryFromAudio(dir, file) {
  const m = file.match(DATE_RE);
  if (!m) return null;
  const [, date, slug, ext] = m;
  if (!/^(mp3|m4a|aac|wav|ogg|flac)$/i.test(ext)) return null;
  const full = path.join(dir, file);
  const meta = readSidecar(full);

  let cover;
  const baseNoExt = file.replace(/\.[^.]+$/, '');
  if (meta.cover) {
    cover = meta.cover.startsWith('audio/') ? meta.cover : `audio/${meta.cover}`;
  } else {
    for (const e of ['jpg', 'jpeg', 'png', 'webp']) {
      if (fs.existsSync(path.join(dir, baseNoExt + '.' + e))) {
        cover = `audio/${baseNoExt}.${e}`;
        break;
      }
    }
  }
  let lyrics, translation;
  const lyricsPath = path.join(dir, baseNoExt + '.lyrics.txt');
  const transPath  = path.join(dir, baseNoExt + '.translation.txt');
  if (fs.existsSync(lyricsPath)) lyrics = fs.readFileSync(lyricsPath, 'utf8').trim();
  if (fs.existsSync(transPath))  translation = fs.readFileSync(transPath, 'utf8').trim();

  const e = {
    id: `${date}-${slug}`,
    type: 'audio',
    date,
    title: meta.title || slug.replace(/-/g, ' '),
    note: meta.note || '',
    src: `audio/${file}`,
    subcategory: meta.subcategory || '',
  };
  if (meta.duration) e.duration = meta.duration;
  if (cover) e.cover = cover;
  if (lyrics) e.lyrics = lyrics;
  if (translation) e.translation = translation;
  return e;
}

// ---- assemble ----
const entries = [];

for (const f of walk(path.join(ROOT, 'letters'))) { const e = entryFromLetter(path.join(ROOT, 'letters'), f); if (e) entries.push(e); }
for (const f of walk(path.join(ROOT, 'photos')))  { const e = entryFromPhoto (path.join(ROOT, 'photos'),  f); if (e) entries.push(e); }
for (const f of walk(path.join(ROOT, 'videos')))  { const e = entryFromVideo (path.join(ROOT, 'videos'),  f); if (e) entries.push(e); }
for (const f of walk(path.join(ROOT, 'audio')))   { const e = entryFromAudio (path.join(ROOT, 'audio'),   f); if (e) entries.push(e); }

// newest-first
entries.sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(OUT, JSON.stringify({ entries }, null, 2));
console.log(`✓ wrote ${entries.length} entries to content.json`);
