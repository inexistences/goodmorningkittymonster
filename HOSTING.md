# How to put this site online

A start-to-finish guide written for someone who has **never deployed a site
before**. You only need a web browser, a free GitHub account (you already have
one), and your domain `goodmorningkittymonster.com`.

You will do this **once**. After it's set up, updating the site is just
"upload a file in GitHub" — see `README.md` for that.

There is no command line. No Node, no terminal, no build step.

---

## Step 1 — Download the project as a zip

1. In this editor, click the **three-dot menu** (top right) and choose
   **Download project**, or use whatever "download all" option you see.
2. You'll get a `.zip` file. **Unzip it** somewhere on your computer
   (Desktop is fine). You should now see a folder containing `index.html`,
   `content.json`, an `assets` folder, etc.

> Tip: do **not** rename any of these files or folders.

---

## Step 2 — Create a new GitHub repository

1. Go to [github.com](https://github.com) and sign in.
2. Click the **+** in the top right → **New repository**.
3. Fill in:
   - **Repository name:** `goodmorningkittymonster.com`
     *(any name works, but using your domain keeps things tidy)*
   - **Public** (Pages needs this on the free plan)
   - Leave everything else unchecked — **do not** add a README, license, or
     `.gitignore`. We already have what we need.
4. Click **Create repository**.

You'll land on a page that says "Quick setup". Leave that tab open.

---

## Step 3 — Upload all your files

1. On that same GitHub page, click the link that says
   **"uploading an existing file"** (it's in the middle of the page).
2. Open the folder you unzipped in Step 1.
3. **Select everything inside it** (Cmd-A on Mac, Ctrl-A on Windows) and
   drag it all onto the GitHub upload area.
   - Make sure you're uploading the **contents** of the folder, not the
     folder itself. You should see `index.html`, `content.json`,
     `styles.css`, the `assets` folder, etc. in the upload list.
4. Scroll down. In the **Commit changes** box, leave the default message.
5. Click **Commit changes**.

Wait for the upload to finish. You'll be returned to your repo page, now
showing all the files.

---

## Step 4 — Turn on GitHub Pages

1. In your repo, click the **Settings** tab (top right of the file list).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`  /  `/ (root)`
   - Click **Save**.
4. Wait about a minute, then refresh the page. You'll see a green box that
   says **"Your site is live at https://YOURUSERNAME.github.io/goodmorningkittymonster.com/"**.
5. Click that link — the site should load. 🎉

If it doesn't load yet, give it 2–3 more minutes and refresh.

---

## Step 5 — Point your domain at GitHub

The site already has a file called `CNAME` containing your domain, so
GitHub knows to expect it. You just need to tell your domain (over at
whoever you bought it from — Namecheap, Google Domains / Squarespace,
GoDaddy, Cloudflare, etc.) to point at GitHub.

### 5a. In your domain registrar's DNS settings

Find the **DNS** / **DNS Records** / **Manage DNS** section for
`goodmorningkittymonster.com`. **Delete** any existing `A` or `CNAME`
records for the root (`@`) and for `www`, then add these:

**Four `A` records** for the root domain (`@` or leave the name blank):

| Type | Name | Value           |
|------|------|-----------------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

**One `CNAME` record** for `www`:

| Type  | Name | Value                       |
|-------|------|-----------------------------|
| CNAME | www  | YOURUSERNAME.github.io      |

> Replace `YOURUSERNAME` with your actual GitHub username. **Important:**
> the value ends in `.github.io` — *not* the full path to your repo.

Save your DNS changes.

### 5b. Back in GitHub

1. Repo → **Settings** → **Pages**.
2. Under **Custom domain**, type `goodmorningkittymonster.com` and click
   **Save**.
3. GitHub now checks your DNS. This can take anywhere from a few minutes
   to a few hours, depending on your registrar.
4. Once it passes the check, **tick the "Enforce HTTPS" checkbox**. (If
   it's greyed out, wait — GitHub is still issuing the SSL certificate.
   Come back in an hour.)

When it's all done, `https://goodmorningkittymonster.com` will load your
site.

---

## You're done.

From here on, anything you do in the GitHub web interface — uploading a new
photo, editing `content.json`, etc. — is **live within about a minute** of
you clicking "Commit changes".

For adding new letters, photos, audio, and videos, read **`README.md`**.
