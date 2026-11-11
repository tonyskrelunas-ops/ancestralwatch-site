# The editorial look — what changed, in plain words

Branch: `claude/aw-editorial`. Nothing on `main` has moved. Netlify will not show this until the branch is merged.

## What you will see

- **White, black, one blue.** Every cream, parchment, gold, amber, brown, olive and clay colour is gone from every page. The pages are white, with a quiet grey panel (#F4F4F2) where a section needs one, black ink, and dark bands (#0B0B0B) with white text. The one accent is a deep mountain-sky blue (#1E4E8C) for links, hover and focus.
- **Big, bold type.** Headlines and all the chrome (menus, buttons, labels) are set in Inter Tight, weights 500/700/800, self-hosted at `assets/fonts/inter-tight-latin.woff2` and `inter-tight-latin-ext.woff2`. Headlines go up to 7.5rem on a laptop and about 3rem on a phone, with tight tracking. Fraunces, Archivo and the other old faces are no longer used anywhere outside the lamplight room. The Google Fonts links for Fraunces and Inter were removed from the English pages; the Japanese pages keep theirs for Noto.
- **Reading in Newsreader.** Book excerpts, the sample pages, the chapter on /read/, the essays and the long book descriptions are set in Newsreader, the serif already self-hosted on the site.
- **Black buttons, arrow links.** Every primary button is solid black with white text, square corners, an arrow. Secondary actions are plain black text links with an arrow and an underline; they turn blue on hover.
- **Covers, large and crisp**, with one real soft shadow and no fake spine, sheen or glow.
- **Photographs full-bleed**, square-cornered, with no colour wash, filter or blend mode over them.
- **The nav** is a clean white bar: black wordmark (the logo drawing stays), black links, a black "Get the Book" / "Get Stone Breath" button, "Reading Room" kept. The language bar sits under it on white.
- **The footer** is a black band with white type.

## The bigger changes, page by page

- **Home.** A new editorial opening: the line "They ran so their people would live." set huge in black on white, then the Monument Valley photograph full width, then the lead and the four actions beside it, then the proof strip. Every word, link and photograph of the old hero is still there. A new black **Reading Room** band sits after the opening pages: "Five voices open the book.", the cover of The Amber and the Stone, and "Read it by lamplight →" to /lamplight/. The words are the ones already on the lamplight page.
- **The Series.** Same system; the shelf is four black-ruled columns with the covers large on a grey panel. The same Reading Room band sits after Book Two.
- **Stone Breath, The Council Fire, The Far Messengers.** The page's own footage or photograph (the creek, the New Year's Eve fire, the Pacific) is now a full-width block at the top; the cover is pulled up over its bottom edge, big, with a real shadow; the title is set huge beside it. The cream scrim and the blended particle layer over the video are gone (iPhone Safari is fragile with blend modes over video). The drawn scenes, the Council Fire film (now on a black band), the places strips and the Listen players are all kept. The three paper scenes (the breath ring, the twelve tokens, the star compass) draw on the grey panel in black ink instead of cream and gold; the real objects in the tokens scene keep their own colours.
- **The Amber and the Stone.** Big cover on the left, the title huge on the right, the five voices below.
- **Read, Tools, Stories, Author, Reader, Japanese, Lithuanian, the essays, Research, Start Here, Thanks, 404, and the 21 Compare pages** all carry the same stylesheet and the same look.
- **The lamplight room is untouched.** Not one file under /lamplight/ or its stylesheets changed (git confirms), and a screenshot of the room on main and on this branch, with the lamp's flicker paused, is pixel-identical.

## How it is built

- One stylesheet, `assets/aw-editorial.css?v=1`, loaded last on every page except the lamplight room, the old /v2/ drafts and versions/. It repoints the colour and font names that `css/tokens.css`, `assets/daylight.css`, `assets/aw2.css`, `assets/aw-home-v3.css`, `css/aw-world.css` and `css/aw-places.css` use, then restyles their components. The player files and the audio folder were not edited; the players' colours are overridden from this file only.
- Markup changed on three pages for real effect: the home hero and Reading Room band, the Reading Room band on /series/, and the version bumps on the three scene scripts.
- Three scene scripts had their colour constants changed (paper, ink, gold → grey panel, ink, grey): `js/stone-breath-practice.js`, `js/far-messengers-stars.js`, `js/council-tokens.js`, each bumped to `?v=20261111`.
- The sign-up wall `js/aw-gate.js` is untouched; its colours and type are overridden from the stylesheet so it matches.
- Every changed file was first copied to `versions/2026-11-11-before-editorial/`.

## What was checked (Playwright, Chromium, 390×844 and 1440×900)

Pages: /, /series/, the four book pages, /read/, /tools/, /stories/, /stories/the-calm-you-already-stored/, /author/, /reader/, /ja/, /lt/, /lamplight/.

- **No console errors** from the site. The one message still logged is the browser failing to reach assets.mailerlite.com, which this sandbox cannot reach; it is the same on main.
- **No horizontal scroll at 390.** The series page had 19px of sideways scroll on main; it no longer does.
- **Body text contrast AA** on every page, measured element by element against the real background (`checks.json`).
- **Lithuanian diacritics** render in Inter Tight: the latin-ext face loads, `document.fonts.check` passes for ąčęėįšųūž and the capitals, and the glyphs measure differently from the fallback face (`lithuanian-diacritics-inter-tight.png`).

Files here: `side-by-side/` (BEFORE from main on the left, AFTER on the right, every page at both sizes), `phone-film-home-and-stone-breath.mp4` (30 seconds), `checks.json`, `console-and-scroll.json`, and the scripts that ran them.
