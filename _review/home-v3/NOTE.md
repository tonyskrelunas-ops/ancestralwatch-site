# The home page, v3 — a note in plain words

Date: 11 November 2026. Branch: `claude/aw-home-v3`. Nothing here is on the live site until it is merged to `main`.

Tony's words: "make it totally unique and make sure the home page doesn't look so claude created in colors."

So the cream, the gold and the ink serif are gone from the home page. Every colour now comes from his own photographs. The type is big and sure of itself. The page is laid out like a magazine, not like a template.

## The palette, and where each colour came from

Every hex below is measured from the photographs in `assets/look/src/` (the k-means list in `palette-from-tonys-photos.txt`, plus a few pixels sampled straight from the sea-rock sunset).

| Name | Hex | From | Used for |
|---|---|---|---|
| Snow | `#f0ede1` | the deep-snow morning | the page itself |
| Snow in the sun | `#f7f5ee` | lightened from the snow | the raised panels every other section sits on |
| Snow in shadow | `#e6e2d3` | darkened from the snow | the ground behind a photo before it loads |
| Pale stone | `#cbc3b1` | the flagstone patio | hairlines, rules, frames |
| Stone | `#a2a19f` | the patio and the rock wall | the small section numbers |
| Granite | `#84827a` | the rock wall | the three tradition drawings, captions on dark |
| Olive | `#717155` | the lawn at evening | second-rank text, labels, captions |
| Moss | `#535a45` | the junipers in shade | book subtitles |
| Forest | `#3d4231` | the spruce and junipers | body text |
| Juniper | `#282b1f` | the darkest juniper | headlines, buttons, the footer |
| Lichen | `#acaf62` | lichen on the wall stones | the one bright accent: the underline under a single word, the "Out now" tag, the square bullets, the line under the email |
| Sky | `#3979b7` | the mountain sky over the snow | every link and arrow |
| Deep sky | `#1b406e` | the snow at dusk | links when hovered |
| Firelight | `#dfb171` | the sun on the water, sea-rock sunset | only on dark ground: the footer tagline, the underline in the night pull-quote |
| Pale firelight | `#f4d998` | the sun itself | footer links when hovered |

Land, garden, stone, snow, sky, fire. Light and alive, as the 10/3 ruling asked. The only dark blocks are the one night photograph with the pull-quote on it, and the footer.

All the tokens live at the top of `assets/aw-home-v3.css` in `:root`, so the book pages can pick them up later without touching the home page again.

## The type

- **Headlines: Archivo, expanded width, extra-bold.** A wide, planted grotesque. It has shoulders. Nothing spineless. Set tight, with a small lichen underline where the old page had one gold italic word.
- **Body: Archivo at normal width.** 17px, forest green, generous line height.
- **Prose: Newsreader.** A real text serif, used only where his own words are read as prose: the opening of Stone Breath, the praise, the subtitles, the kicker above the headline, the italic lines. It is never paired with gold, and it is never the headline face.

The fonts are self-hosted in `assets/fonts/` and cut down to only the weights and widths the page uses (about 24 KB per Archivo file, 23 to 41 KB per Newsreader file). Latin-extended files load only for the Lithuanian letters. No Google Fonts request on the home page any more.

## What changed on the page

Every word, every link, the menu, the three language links, the Ancestral Peaks tie and the sign-up wall script are exactly as before. The Ancestral Peaks tie now sits where its name says: directly above the footer. Only the look changed.

- **The masthead.** Brand left, menu right, "Get Stone Breath" in a juniper button. Under it, one thin line: Read in English, 日本語, Lietuvių, and the address at the far right.
- **The hero.** No photo behind text, no scrim. The headline runs the full width in huge expanded type. Below it, the lead and the four calls to action on the left and the poppies-along-the-wall photograph on the right. On the phone the photograph comes straight after the headline.
- **The figures.** One line of big numerals under a heavy rule, not five tiles.
- **The section slug.** Every section opens with a heavy rule, a small label on the left and its number on the right. This is the signature of the page; nothing else on the web has it in these colours.
- **Stone Breath.** Cover on a snow panel, the body beside it, the specs as a plain ruled line, the three praise quotes in Newsreader across the bottom.
- **The opening pages.** The stream photograph beside the excerpt in big Newsreader, with a drop cap.
- **The pull-quote.** "You can win the whole race..." sits on the string-lights-at-night photograph in snow-white type with a firelight underline.
- **The premise.** Three columns: the statement, the lead and the punch line, the rock wall.
- **The Council Fire.** The photograph of the book on the sea rocks at sunset is the art; the cover sits in its corner, still a link to the book page.
- **The Far Messengers.** Cover right, text left, so the two books do not mirror each other.
- **The series.** The morning path as a wide band, then a ledger: Book I to IV in big numerals, titles, one line each, a tag at the end.
- **The Reader, the Stone Breath tool, the author.** Text beside a block. The 4-4-6-4 count is a row of giant numerals. The patio-and-waterfall photograph sits with the Stone Breath.
- **The three traditions.** Three ruled text columns, no boxes. The line drawings are small and granite-coloured.
- **Stories.** A ruled list with the barrel of flowers beside it.
- **Start with chapter one.** A snow panel next to the deep-snow photograph.
- **Write to me.** The address as a headline in sky blue, the table on the lawn beside it.
- **Footer.** Juniper, snow text, the tagline in firelight.

## Motion

Sections rise fourteen pixels and fade in, once. Photographs settle from a 3% zoom when they come into view. Arrows nudge right on hover. That is all. No parallax, no mix-blend-mode, no backdrop-filter, no animated filters. Everything is honoured under "reduce motion".

## Photographs

Shipped at 900 and 1600 wide (portraits at 900 and their full 1200 or 1073) as progressive JPEGs with `srcset`, in `assets/look/`. The originals stay in `assets/look/src/`. Only the hero photograph loads eagerly; every other one is lazy. Captions describe the scene only.

## Tests

- Served the repo root locally and ran Playwright at 390×844 (iPhone), 1440×900 and 1280×800 with `localStorage['aw.joined']` set to pass the wall.
- No console errors, no failed requests, no horizontal scroll at any size.
- The phone menu opens and closes; the sign-up wall script arms its 60-second timer on a fresh visit.
- Full-page screenshots and the 20-second phone scroll film are in this folder.

## Files

- `index.html` — the home page, rebuilt on the new look.
- `assets/aw-home-v3.css?v=1` — the new look, with the colour tokens at the top.
- `assets/fonts/` — Archivo and Newsreader, self-hosted.
- `assets/look/` — his photographs at web sizes; `assets/look/src/` the originals and the measured palette.
- `versions/index-before-home-v3-2026-11-11.html` — the page as it was this morning.
