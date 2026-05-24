# How to add new content

> First time deploying the site? Read **`HOSTING.md`** first.

This site rebuilds itself automatically every time you push to GitHub.
You add content by **dropping files into the right folder** in the repo.
You never edit `content.json` by hand.

The flow:

1. Add a file in the right folder (named correctly).
2. Commit and push in GitHub Desktop.
3. About 60 seconds later, your change is live on
   `goodmorningkittymonster.com`.

That's it. The folder it goes in decides which room/grid it shows up in.

---

## Folder structure

Everything goes inside the `content/` folder at the top of the repo:

```
content/
├── letters/
│   ├── anniversary/
│   ├── things-ive-said/
│   └── things-ive-not-yet-said/
├── photos/
│   ├── portraits/
│   ├── home/
│   ├── trips/
│   │   └── <Trip-Name>/
│   └── us/
├── videos/
│   ├── portraits/
│   ├── home/
│   ├── trips/
│   │   └── <Trip-Name>/
│   └── us/
└── audio/
    ├── song/
    └── voice-memo/
```

Subcategory names must match these folder names **exactly** (lowercase,
with dashes, no spaces).

---

## Filename rules (the only rule, really)

Every content file is named:

```
YYYY-MM-DD-some-slug.ext
```

- **`YYYY-MM-DD`** — the date that shows on the card and controls the
  sort order. Newest first.
- **`some-slug`** — short kebab-case label, e.g. `quiet-hours`,
  `beach-walk`, `morning-coffee`. This becomes the on-screen title (with
  dashes turned into spaces and capitalised) unless you override it.
- **`.ext`** — the file extension. See per-type tables below.

Anything not matching this pattern is silently ignored, so you can keep
half-finished drafts (`draft.md`, `notes.txt`) sitting next to real
content without it leaking into the site.

---

## Letters

**Where:** `content/letters/<subcategory>/`
**Extension:** `.md`

A letter is a plain-text Markdown file. Minimum viable letter:

```
---
title: Quiet Hours
---

Dear N.,

Body of the letter goes here.

Blank lines split paragraphs. You can use *italics* and **bold**.

— m.
```

The `---` block at the top is "frontmatter" — optional metadata. Fields:

- **`title`** *(optional)* — what shows in the reader header. If you
  leave it out, the title is generated from the filename.
- **`note`** *(optional)* — a one-liner shown above the body, italicised.
  e.g. `Written the morning of.`
- **`lang`** *(optional)* — defaults to `en`. Only matters if you
  display lyrics in multiple languages.

Everything after the second `---` is the body. Blank lines = new paragraphs.

**Subcategories:**
- `anniversary` — yearly markers, milestone letters
- `things-ive-said` — things you've already said to her
- `things-ive-not-yet-said` — things you haven't (yet, or ever)

---

## Photos

**Where:** `content/photos/<subcategory>/` *(or `trips/<Trip-Name>/`)*
**Extensions:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

Just drop the photo in the right folder. Done.

For **trips**, make a subfolder for each trip:

```
content/photos/trips/Japan-2025/2025-06-14-shibuya-2am.jpg
content/photos/trips/Japan-2025/2025-06-11-kyoto-rain.jpg
content/photos/trips/USA-2024/2024-09-30-utah-cliffside.jpg
```

The trip filter in the Trips grid is built from those folder names.
Use whatever names you want (`Japan-2025`, `road-trip`, `paris`, etc.).

### Optional metadata

If you want a custom title, a caption, or accessibility alt-text, add a
sidecar JSON file with the same base name:

`content/photos/portraits/2025-11-09-blue-hours.json`
```json
{
  "title": "The Blue Hours",
  "note": "First week after the dye job.",
  "alt": "Portrait, blue hair, late afternoon light."
}
```

Without this file, the title is generated from the slug
(`blue-hours` → "Blue Hours") and that's usually fine.

---

## Videos

**Where:** `content/videos/<subcategory>/` *(or `trips/<Trip-Name>/`)*
**Extensions:** `.mp4`, `.mov`, `.webm`, `.m4v`

Videos surface inside the photo grids (same subcategories) with a small
play icon overlaid.

For a thumbnail, **drop a still image with the same base name** next to
the video:

```
content/videos/home/2025-03-22-morning-walk.mp4
content/videos/home/2025-03-22-morning-walk.jpg   ← auto-used as cover
```

Optional sidecar (`.json`) for title, note, duration:

```json
{
  "title": "Morning Walk",
  "note": "Your hand. The bridge. The dog we tried to pet.",
  "duration": "0:41"
}
```

---

## Audio

**Where:** `content/audio/song/` or `content/audio/voice-memo/`
**Extensions:** `.mp3`, `.m4a`, `.wav`, `.ogg`

### Voice memos

Just drop the file. Optional sidecar for a custom title/note/duration.

### Songs

Drop the file, plus optionally:

- **Cover art** — same base name with `.jpg`/`.png` extension:
  `2024-08-19-the-one-about-rain.jpg`
- **Lyrics** — same base name with `.lyrics.txt` extension:
  `2024-08-19-the-one-about-rain.lyrics.txt`
- **Sidecar JSON** for title/duration/note.

Inside `.lyrics.txt`, lines that are exactly `Verse 1.`, `Chorus.`,
`Bridge.`, `Outro.` (etc.) are auto-styled as section labels.

```
Verse 1.

You said the rain in this town
lands like it means something —

Chorus.

I'm a slow learner
but I am learning.
```

---

## Workflow in GitHub Desktop

1. In Finder, open your repo folder in Documents and drop the new
   file(s) into the right folder under `content/`.
2. Open GitHub Desktop. You'll see the new files in the left pane.
3. Bottom-left, write a summary like `Add letter: Wednesday Morning`.
4. Click **Commit to main**.
5. Top of the window, click **Push origin**.
6. Wait ~60 seconds. Refresh the site. Your change is live.

Behind the scenes: when you push, GitHub runs `build.js` for you on
their servers, which scans every file under `content/`, generates a
fresh `content.json`, and commits it back to the repo. You'll see this
extra commit appear in GitHub Desktop's history with the message
`Auto-rebuild content.json [skip-rebuild]`.

---

## Removing or editing content

- **Remove:** delete the file from the folder, commit, push.
- **Rename / re-date:** rename the file (the new date or slug becomes the
  new sort key and ID), commit, push.
- **Edit a letter:** open the `.md` file in any plain-text editor
  (TextEdit on Mac, set to **Make Plain Text** via Format menu — *not*
  rich text), make changes, save, commit, push.

---

## Common gotchas

- **Case matters.** `Portraits/` and `portraits/` are different folders
  on GitHub. Always lowercase. (Trip folder names can be capitalised —
  they're just labels.)
- **Filenames need the date prefix.** `quiet-hours.md` without the
  `2026-05-19-` prefix won't be picked up. Use this format always.
- **No spaces in filenames.** `morning walk.jpg` won't work,
  `2025-03-22-morning-walk.jpg` will.
- **Plain text only for `.md` files.** TextEdit defaults to rich text on
  Mac — switch it to plain text (`Format → Make Plain Text`) before
  saving, or your letter will have invisible junk in it.
- **If the site doesn't update**, check the **Actions** tab in your
  repo on github.com — it'll show whether the build succeeded or what
  went wrong.

---

## Advanced (optional)

If you ever want to run the build locally to preview what `content.json`
will look like before pushing, install Node.js, then run `node build.js`
inside the repo folder. It writes out `content.json` based on whatever's
in `content/`. You don't need to do this — the GitHub Action does it for
you on every push.
