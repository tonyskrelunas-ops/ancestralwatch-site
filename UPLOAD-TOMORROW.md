# Upload AncestralWatch.com — morning steps

Everything is finished and works as-is. The whole site is in one zip: **`ancestralwatch-site.zip`**
(I also sent it to you in chat). Below is the simplest path to get it live on Hostinger.

---

## Option A — Hostinger File Manager (easiest, ~5 min)

1. Log in to **Hostinger → hPanel**.
2. Open **Files → File Manager**.
3. Go into the **`public_html`** folder.
   - ⚠️ Your current live site is in here. **Don't delete it yet.** Either put the new site in a
     subfolder first to preview (e.g. `public_html/new`), or back up the old files (select all →
     Compress → download the zip) before replacing.
4. Click **Upload** (top right) and upload **`ancestralwatch-site.zip`**.
5. Right-click the uploaded zip → **Extract** → extract it **into `public_html`** (or `/new` to preview).
6. Visit **https://ancestralwatch.com** (or `/new`). Done.

The included `.htaccess` handles HTTPS and the custom 404 automatically. If files extract into a
subfolder like `ancestralwatch-site/`, move the *contents* up one level so `index.html` sits directly
in `public_html`.

## Option B — FTP (if you prefer)

Use the FTP details in hPanel (**Files → FTP Accounts**) with any FTP app (FileZilla). Upload the
**contents** of the unzipped folder into `public_html`. Same result.

---

## Turn the site fully "on" (do these when you have a minute — the site works without them)

1. **Free tools already work** — they download the PDF directly. When you want email capture instead,
   create a $0 product on Payhip for each and swap the button links (search the files for `/downloads/`).
2. **Confirm `wisdom@ancestralwatch.com` receives mail** — it's on the coaching / speaking / research /
   contact buttons.
3. **Kindle buttons** — paste the Amazon links when the Kindle editions are live (search files for
   `data-todo="amazon`). Until then they sit on `#`.
4. **Covers & author portrait** — drop real images in; placeholders currently show the title on a
   gradient (search for `TODO(Tony): ... cover` / `author portrait`).
5. **Japanese / Lithuanian pages** — have a native speaker skim before you promote them.

## Everything that's already done
13 pages · funnel + four-beat story · 4 book pages · Tools (with 3 working PDF downloads) ·
free Research page (with paid report/briefing/advisory offers) · brand manifesto · Author + retreat ·
Stories · JA + LT · all 3 real book endorsements · Payhip buy links live · honor-economy line ·
SEO (sitemap, robots, hreflang, 404, favicon) · scroll-reveal motion · optional ambient soundscape.

*The stone is warm. The fire is lit. The crossing goes on.*
