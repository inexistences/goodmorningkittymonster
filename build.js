#!/usr/bin/env node
// build.js — scans content/ folders and writes content.json.
//
// FOLDER STRUCTURE (the subcategory is the folder name):
//
//   content/letters/<subcategory>/YYYY-MM-DD-slug.md
//   content/photos/<subcategory>/YYYY-MM-DD-slug.{jpg,jpeg,png,webp,gif}
//   content/videos/<subcategory>/YYYY-MM-DD-slug.{mp4,m4v,mov,webm}
//   content/audio/<subcategory>/YYYY-MM-DD-slug.{mp3,m4a,wav,ogg,flac,aac}
//
// Special case — TRIPS get an extra folder layer for the trip name:
//
//   content/photos/trips/<trip-name>/YYYY-MM-DD-slug.jpg
//   content/videos/trips/<trip-name>/YYYY-MM-DD-slug.mp4
//
// Subcategory values per type:
//   letters: anniversary | things-ive-said | things-ive-not-yet-said
//   photos:  portraits | home | trips | us
//   videos:  portraits | home | trips | us   (videos appear inside photo grids)
//   audio:   song | voice-memo
//
// FILENAME CONVENTION:    YYYY-MM-DD-slug.ext        e.g. 2026-05-19-quiet-hours.md
// Date is the part before the slug. Anything not matching that pattern is
// skipped (so drafts with weird names are ignored — handy).
//
// Optional sidecars (same base name + .json) can override defaults:
//   - title, note, alt, cover, duration
//
// Optional companion files for audio:
//   <basename>.lyrics.txt     · song lyrics (auto-attached to a song)
//   <basename>.translation.txt
//
// Optional companion image for video: <basename>.jpg / .png (auto-used as cover).
//
// This script is run automatically by the GitHub Action whenever you push.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'content.json');

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.([a-z0-9]+)$/i;
const PHOTO_RE = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_RE = /\.(mp4|m4v|mov|webm)$/i;
const AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|flac)$/i;

const VALID_SUBCATS = {
  letters: ['anniversary', 'things-ive-said', 'things-ive-not-yet-said'],
  photos:  ['portraits', 'home', 'trips', 'us'],
  videos:  ['portraits', 'home', 'trips', 'us'],
  audio:   ['song', 'voice-memo'],
};

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

function listDir(dir) {
  if (!exists(dir)) return [];
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

function readSidecar(dir, baseNoExt) {
  const j = path.join(dir, baseNoExt + '.json');
  if (exists(j)) {
    try { return JSON.parse(fs.readFileSync(j, 'utf8')); } catch { return {}; }
  }
  return {};
}

// title from slug if not given: "the-blue-hours" -> "The Blue Hours"
function titleFromSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function findCompanionImage(dir, baseNoExt) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    if (exists(path.join(dir, baseNoExt + '.' + ext))) return baseNoExt + '.' + ext;
  }
  return null;
}

function readTextIfExists(p) {
  return exists(p) ? fs.readFileSync(p, 'utf8').trim() : null;
}

const entries = [];

// ---------- letters ----------
for (const subcat of VALID_SUBCATS.letters) {
  const dir = path.join(CONTENT, 'letters', subcat);
  for (const file of listDir(dir)) {
    const m = file.match(DATE_RE);
    if (!m || m[3].toLowerCase() !== 'md') continue;
    const [, date, slug] = m;
    const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    entries.push({
      id: `${date}-${slug}`,
      type: 'letter',
      date,
      title: meta.title || titleFromSlug(slug),
      subcategory: subcat,
      note: meta.note || '',
      lang: meta.lang || 'en',
      body,
    });
  }
}

// ---------- photos & videos ----------
function processMediaDir(kind, subcat, trip, dir) {
  for (const file of listDir(dir)) {
    if (kind === 'photo' && !PHOTO_RE.test(file)) continue;
    if (kind === 'video' && !VIDEO_RE.test(file)) continue;
    const m = file.match(DATE_RE);
    if (!m) continue;
    const [, date, slug] = m;
    const baseNoExt = file.replace(/\.[^.]+$/, '');
    const meta = readSidecar(dir, baseNoExt);

    // Skip files that are clearly companions (poster image for a video) — only
    // skip if a sibling video with the same base name exists.
    if (kind === 'photo' && exists(path.join(dir, baseNoExt + '.mp4'))) continue;
    if (kind === 'photo' && exists(path.join(dir, baseNoExt + '.mov'))) continue;
    if (kind === 'photo' && exists(path.join(dir, baseNoExt + '.webm'))) continue;
    if (kind === 'photo' && exists(path.join(dir, baseNoExt + '.m4v'))) continue;

    const relDir = path.relative(ROOT, dir).split(path.sep).join('/');
    const e = {
      id: `${date}-${slug}`,
      type: kind,
      date,
      title: meta.title || titleFromSlug(slug),
      subcategory: subcat,
      note: meta.note || '',
      src: `${relDir}/${file}`,
    };
    if (kind === 'photo') e.alt = meta.alt || meta.title || '';
    if (kind === 'video') {
      const cover = meta.cover || findCompanionImage(dir, baseNoExt);
      if (cover) e.cover = cover.startsWith(relDir) ? cover : `${relDir}/${cover}`;
      if (meta.duration) e.duration = meta.duration;
    }
    if (trip) e.trip = trip;
    entries.push(e);
  }
}

for (const kindKey of ['photos', 'videos']) {
  const kindSingular = kindKey === 'photos' ? 'photo' : 'video';
  for (const subcat of VALID_SUBCATS[kindKey]) {
    const dir = path.join(CONTENT, kindKey, subcat);
    if (subcat === 'trips') {
      // each subdir under trips/ is a trip name
      for (const tripFolder of listDir(dir)) {
        const tripDir = path.join(dir, tripFolder);
        if (!fs.statSync(tripDir).isDirectory()) {
          // loose file at trips/ root → keep but no trip tag
          continue;
        }
        processMediaDir(kindSingular, 'trips', tripFolder, tripDir);
      }
    } else {
      processMediaDir(kindSingular, subcat, null, dir);
    }
  }
}

// ---------- audio ----------
for (const subcat of VALID_SUBCATS.audio) {
  const dir = path.join(CONTENT, 'audio', subcat);
  for (const file of listDir(dir)) {
    if (!AUDIO_RE.test(file)) continue;
    const m = file.match(DATE_RE);
    if (!m) continue;
    const [, date, slug] = m;
    const baseNoExt = file.replace(/\.[^.]+$/, '');
    const meta = readSidecar(dir, baseNoExt);
    const relDir = path.relative(ROOT, dir).split(path.sep).join('/');

    let cover = meta.cover || findCompanionImage(dir, baseNoExt);
    if (cover && !cover.startsWith(relDir)) cover = `${relDir}/${cover}`;

    const lyrics = readTextIfExists(path.join(dir, baseNoExt + '.lyrics.txt'));
    const translation = readTextIfExists(path.join(dir, baseNoExt + '.translation.txt'));

    const e = {
      id: `${date}-${slug}`,
      type: 'audio',
      date,
      title: meta.title || titleFromSlug(slug),
      subcategory: subcat,
      note: meta.note || '',
      src: `${relDir}/${file}`,
    };
    if (meta.duration) e.duration = meta.duration;
    if (cover) e.cover = cover;
    if (lyrics) e.lyrics = lyrics;
    if (translation) e.translation = translation;
    entries.push(e);
  }
}

// newest-first
entries.sort((a, b) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(OUT, JSON.stringify({ entries }, null, 2));
console.log(`✓ wrote ${entries.length} entries to content.json`);
