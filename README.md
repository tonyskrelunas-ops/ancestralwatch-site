# AncestralWatch.com

The rebuilt home of **The Ancestral Watch Series** by Tony Skrelūnas.
A fast static site — plain HTML + CSS + a little JS. No build step, no framework.

---

## See it locally

From this folder, run a tiny web server and open the address it gives you:

```bash
cd ~/Documents/AncestralWatch
python3 -m http.server 8137
```

Then open **http://localhost:8137/** in your browser. Stop the server with `Ctrl+C`.
(Opening the `.html` files directly also mostly works, but the server makes the clean URLs like `/tools/` behave exactly like the live site.)

---

## What's where

```
AncestralWatch/
├─ index.html                     Home (the sales funnel)
├─ series/
│  ├─ index.html                  The Series hub + the star-path
│  ├─ stone-breath/               Book 1 (for sale)
│  ├─ the-council-fire/           Book 3 (for sale)
│  ├─ by-lamplight/               Book 2 (coming — "notify me")
│  └─ the-far-messengers/         Book 4 (coming — "notify me")
├─ tools/index.html               The Tools (Stone Breath free + 8 gated)
├─ far-messengers/index.html      The brand/manifesto page
├─ author/index.html              The Author + Work with Tony + retreat
├─ stories/index.html             Excerpts, essays, ideas
├─ ja/index.html                  日本語 (full page)
├─ lt/index.html                  Lietuvių (full page)
├─ css/tokens.css                 Colors, fonts, spacing (the "design tokens")
├─ css/style.css                  All the styling
├─ js/main.js                     Mobile menu only
├─ 404.html · robots.txt · sitemap.xml · .htaccess · favicon.svg
```

## Two things every page shares
- **The header/footer are copied into each page** (there's no include system in plain HTML).
  If you change a nav link, change it in each file — or ask Claude to do it across all pages at once.
- **All the colors/fonts live in `css/tokens.css`.** Change a value there and it updates everywhere.

---

## Common edits

- **Add a Story:** open `stories/index.html`, copy the `TEMPLATE CARD` comment block, fill it in.
- **Change a book's buy link:** search the file for `payhip.com` and swap the URL.
- **Find everything that still needs you:** search the whole project for `TODO(Tony):`.

---

## Still to do before launch
- **Email provider** for the sign-up forms (see the `TODO(Tony): email/form provider` notes).
- Real content where marked `TODO(Tony):` — Stone Breath steps, book excerpts, the five voices,
  Tool 09's name + its two stories, endorsements.
- Images: covers, author portrait, hero art (compress + add `alt` text).
- Native-speaker review of the **/ja/** and **/lt/** pages.
- The **redirect map** from the old site (needs the old URL list) — add to `.htaccess`.

## Deploy (Hostinger)
Upload the whole folder's contents to `public_html`. The `.htaccess` handles HTTPS and the 404.
Keep the current site up until this one is complete, then swap.
