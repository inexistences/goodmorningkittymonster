# How to add new content

This site is driven by **one file**: `content.json`. Every letter, photo,
video, and audio note in the site is an entry inside that file. To add
something new, you'll:

1. (For photos / video / audio only) upload the file to the right folder.
2. Open `content.json` and add a small block of text describing your entry.
3. Click **Commit changes** in GitHub — the site updates in under a minute.

You can do **all of this in your web browser, on github.com**, with no
software installed.

> First time deploying the site? Read **`HOSTING.md`** first.

---

## The four content types

| Type      | Goes in                              | Subcategories                                                |
|-----------|--------------------------------------|--------------------------------------------------------------|
| **Letter** | inside `content.json` (no file)     | `anniversary` · `things-ive-said` · `things-ive-not-yet-said` |
| **Photo**  | upload to `photos/` folder          | `portraits` · `home` · `trips` · `us`                        |
| **Video**  | upload to `videos/` folder          | `portraits` · `home` · `trips` · `us`                        |
| **Audio**  | upload to `audio/` folder           | `song` · `voice-memo`                                        |

> Subcategory names must be spelled **exactly** as shown above — lowercase,
> with dashes, no spaces. Typos = the entry won't show up in any room.

---

## The basic rhythm

Every time you add something, you'll open `content.json` in GitHub like this:

1. In your repo, click `content.json`.
2. Click the **pencil icon** (top right) to edit it.
3. Find the closing `}` of the **last entry** (near the bottom of the file).
4. Add a comma after that `}`, then paste in your new entry block.
5. Scroll to the bottom of the page, write a short note in the commit box
   like *"Add letter: Wednesday Morning"*, and click **Commit changes**.

The site rebuilds itself within ~60 seconds.

> **A safety tip:** before you commit, check the bottom of the page where
> GitHub shows green "+" and red "−" markers. If you accidentally deleted
> something, it'll be obvious. If you broke the JSON syntax, GitHub will
> still let you commit, but the site won't load — so always **open the
> site after committing** to check. If it's broken, just revert the
> commit (Commits → click your commit → "Revert").

---

## Adding a letter

Letters are pure text, no files to upload. Paste this block into
`content.json` (with a comma before it, after the last existing entry):

```json
{
  "id": "2026-06-01-the-tuesday-one",
  "type": "letter",
  "date": "2026-06-01",
  "title": "The Tuesday One",
  "subcategory": "things-ive-said",
  "note": "Optional one-liner shown above the body.",
  "lang": "en",
  "body": "First paragraph goes here.\n\nNew paragraph after a blank line.\n\nYou can use *italics* and **bold**.\n\nSign off however you like.\n\n— m."
}
```

What to change:
- **`id`** — must be unique. The format `YYYY-MM-DD-some-slug` is the
  convention; just match the date and add a short slug.
- **`date`** — `YYYY-MM-DD` only. This is what shows on the card and
  controls sort order.
- **`title`** — what the card and reader header show.
- **`subcategory`** — one of: `anniversary`, `things-ive-said`,
  `things-ive-not-yet-said`. This decides which room/grid the letter
  shows up in.
- **`note`** — optional. Delete this line if you don't want one.
- **`body`** — your letter. Use `\n\n` (two backslash-n's) between
  paragraphs. `*one star*` for *italics*, `**two stars**` for **bold**.

---

## Adding a photo

1. **Upload the photo** to the `photos/` folder in your repo:
   - In your repo, click the `photos` folder. If it doesn't exist yet,
     click **Add file → Create new file**, type `photos/.gitkeep` in the
     name box, and commit — this creates the folder.
   - Then click **Add file → Upload files**, drag in your photo, commit.
   - **Name it like** `2026-06-01-beach-walk.jpg` (date prefix is a habit;
     anything works as long as it's unique).
2. Add this block to `content.json`:

```json
{
  "id": "2026-06-01-beach-walk",
  "type": "photo",
  "date": "2026-06-01",
  "title": "Beach Walk",
  "subcategory": "trips",
  "trip": "Portugal-2026",
  "note": "Optional caption.",
  "src": "photos/2026-06-01-beach-walk.jpg",
  "alt": "Two figures walking on wet sand."
}
```

What to change:
- **`src`** — the path to your uploaded photo, starting with `photos/`.
- **`subcategory`** — `portraits`, `home`, `trips`, or `us`.
- **`trip`** — **only for `trips`**. Used to group photos by trip in the
  Trips grid (e.g. `Portugal-2026`, `Japan-2025`). Use the same value for
  every photo from the same trip. **Delete this line for non-trip
  photos.**
- **`alt`** — short description for accessibility. Doesn't show on screen.

---

## Adding a video

1. **Upload the video file** to `videos/` (create the folder the same way
   as for photos if it doesn't exist). Name it like
   `2026-06-01-morning-walk.mp4`.
2. *(Optional but recommended)* Upload a still image for the thumbnail
   with the same base name, e.g. `2026-06-01-morning-walk.jpg`.
3. Add this block to `content.json`:

```json
{
  "id": "2026-06-01-morning-walk",
  "type": "video",
  "date": "2026-06-01",
  "title": "Morning Walk",
  "subcategory": "home",
  "note": "Optional caption.",
  "src": "videos/2026-06-01-morning-walk.mp4",
  "cover": "videos/2026-06-01-morning-walk.jpg",
  "duration": "0:41"
}
```

What to change:
- **`subcategory`** — same options as photos: `portraits`, `home`,
  `trips`, `us`. Videos appear inside the photo grids alongside photos,
  marked with a small play icon.
- **`cover`** — path to a still image. Delete the line if you don't have
  one (a placeholder will show).
- **`duration`** — `M:SS` format. Cosmetic only.
- Add a **`trip`** line if `subcategory` is `trips`, same as photos.

---

## Adding an audio note

There are two flavours: **songs** (with a cover image and lyrics) and
**voice memos** (no cover, no lyrics).

1. Upload the audio to `audio/`, e.g. `2026-06-01-the-rain-one.mp3`.
2. *(Songs only)* Upload a cover image to `audio/` too, e.g.
   `2026-06-01-the-rain-one.jpg`.
3. Add a block:

**For a song:**

```json
{
  "id": "2026-06-01-the-rain-one",
  "type": "audio",
  "date": "2026-06-01",
  "title": "The Rain One",
  "subcategory": "song",
  "note": "Optional caption.",
  "src": "audio/2026-06-01-the-rain-one.mp3",
  "cover": "audio/2026-06-01-the-rain-one.jpg",
  "duration": "3:42",
  "lyrics": "Verse 1.\n\nFirst line of the verse\nSecond line of the verse.\n\nChorus.\n\nFirst line of the chorus\nSecond line.\n\nVerse 2.\n\nMore lines."
}
```

**For a voice memo:**

```json
{
  "id": "2026-06-01-walking-home",
  "type": "audio",
  "date": "2026-06-01",
  "title": "Walking Home",
  "subcategory": "voice-memo",
  "src": "audio/2026-06-01-walking-home.m4a",
  "duration": "0:48"
}
```

Notes:
- **`subcategory`** — `song` or `voice-memo`.
- **`lyrics`** — songs only. Lines starting with `Verse 1.`, `Chorus.`,
  `Bridge.` etc. are auto-styled as section labels. Use `\n` for line
  breaks. Delete the field entirely if you don't have lyrics.
- Supported audio formats: `.mp3`, `.m4a`, `.wav`, `.ogg`.

---

## Removing or editing an entry

- **Edit:** open `content.json`, change the text inside the entry's block,
  commit.
- **Remove:** delete the entire `{ ... }` block (and the comma before it
  if it was the last entry), commit.
- **Reorder:** entries are sorted by `date` newest first on each grid —
  you don't need to reorder by hand. Just change a date.

---

## Common gotchas

- **Quotes:** every string must be in `"double quotes"`. Don't use curly
  quotes (`"` `"`) — your phone might auto-correct them. Always edit in
  GitHub or a plain text editor.
- **Commas:** every entry except the last needs a `,` after its closing
  `}`. The last one has no comma.
- **Backslashes:** inside `body` and `lyrics`, paragraph breaks are `\n\n`
  and line breaks are `\n`. Two literal characters: backslash + n.
- **Subcategories are case-sensitive:** `Anniversary` won't work,
  `anniversary` will.
- **File paths are case-sensitive:** `photos/Beach.jpg` and
  `photos/beach.jpg` are different. Match the filename exactly.

If the site stops loading after a commit, you almost certainly have a
JSON typo. Open the **Commits** tab, find your last commit, and click
**Revert** — you'll be back online while you figure out what went wrong.

---

## Advanced (optional)

If you ever want to use the original folder-and-frontmatter workflow
(drop `.md` files into a `letters/` folder, run `node build.js` to
auto-generate `content.json`), see `build.js` for how it works. It's
not necessary — editing `content.json` directly is fully supported.

## Favourites button

The little dog-ear corner on each card is the "kept" toggle. By default
it remembers favourites in the visitor's browser only (localStorage). If
you want them synced across devices, follow the Supabase setup at the
bottom of this README's old version — but for a personal site, the
browser-only default is fine.
