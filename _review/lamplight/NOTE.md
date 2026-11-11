# The Lamplight Reading Room

*11 November 2026 · branch `claude/lamplight-room` · the page is `/lamplight/`*

The first of the book worlds. You arrive in a dark, warm room at night. One oil lamp gives the only light. The opening of *The Amber and the Stone* sits in the lamp's glow like a page on a table, its edges lost in shadow. Press the lamp and the voice begins; the words warm in the lamplight as they are read. When the reading ends, the lamp settles low again.

## What is in this folder

| File | What it shows |
|---|---|
| `lamplight-phone.mp4` | A 30-second film at phone size (390 × 844): arriving in the room, pressing the lamp, the words warming as the voice reads, tapping a later sentence to hear it from there, the reading ending and the lamp settling low. |
| `phone-1-arrive.png` · `laptop-1-arrive.png` | The room as you arrive: the lamp low, the page in its glow, "Press the lamp". |
| `phone-2-reading.png` · `laptop-2-reading.png` | A few seconds in: the lamp turned up, the first sentences at full ink, the sentence being read in its halo. |
| `phone-3-reading-36s.png` · `laptop-3-reading-36s.png` | At 36 seconds: "A people can lose everything…" lit, everything before it read. |
| `phone-4-ended.png` · `laptop-4-ended.png` | After the reading: all sentences at full ink, the lamp low. |
| `results.txt` | The 56 Playwright checks, all passing. |

## What was made

Three new files, and one new page:

- `lamplight/index.html` — the room. Its title and description are written from words already on the site (the book page's "Five voices open the book", "Book Two of The Ancestral Watch", and the lamp line). No noindex: it is for search, and it is in the sitemap. The sign-up wall `aw-gate.js` loads here like everywhere else.
- `css/aw-lamplight.css` — the look of the room.
- `js/aw-lamplight.js` — the breathing of the light, the lamp as the switch, and the optional room tone.

Nothing in `aw-listen.js`, `aw-readalong.js` or their stylesheets was changed. The room uses them as they are: the same Listen player markup as the book page, and the same `data-aw-readalong` marks on the text. The read-along lines up all 21 sentences of the timeline with the page.

## How the room works

1. **The light.** Three round layers of warm gradient sit behind everything, centred on the flame: a wide, faint one that reaches the walls; a middle one; and a small bright core at the glass. The script moves them every frame (about thirty frames a second) with opacity and transform only. No blend modes, no filters, no backdrop blur. The flicker is a sum of four slow sine waves that never line up, plus a small gust every few seconds that dies away with a wobble, so it never repeats and never looks mechanical. The flame itself breathes with the same curve. When the tab is hidden the loop stops and the motes freeze; when it is visible again they go on. With "reduce motion" on, the lamp holds still, lit.
2. **The page.** A warm page-coloured sheet in a fine book serif (Newsreader, the serif the home page already uses, self-hosted). Its four sides fade to nothing through a soft gradient mask, so there is no rectangle, only a lit page whose edges are lost in the room. A thin shade over the page darkens its margins and breathes with the lamp, so the page is brighter when the lamp is turned up. On a laptop the lamp stands to the left of the page, as on the cover, and stays beside it as you scroll; on a phone it stands above the page and the light falls from above as the page scrolls.
3. **Press the lamp.** The lamp is a button. Pressing it presses the Listen player's own play button, so everything the player does (one reading at a time, remembering your place, the lock-screen title) still happens. On play the wick turns up over about a second and the light grows; on pause it turns down; when the reading ends it settles low. The player itself sits quietly beneath the page in firelight colours, with the "Read along" switch and the bar for scrubbing.
4. **The words warm.** The read-along's usual gold wash and word mark are replaced on this page: while the voice reads, sentences still to come rest in shadow (a lighter brown), the sentence being read goes to full ink with a soft firelight halo around the letters, and the word being said carries a brighter halo. Sentences already read rest at full ink. No box, no yellow. Tapping a sentence plays from there, as everywhere.
5. **Room tone, off until pressed.** A small "Room tone" switch beneath the player. Pressing it makes a far wind outside and the faintest lamp hiss with Web Audio: soft brown noise through a low filter, its loudness wandering on two slow cycles, plus a thread of high noise. It sits far under the voice (about a twentieth of full level, and halved again while the voice plays, through the player's own duck call). It never starts by itself; the sign-up wall quiets it the way it quiets the book pages' sound.
6. **Out of the room.** Two quiet lines beneath the reading: *The Amber and the Stone* — Book Two of The Ancestral Watch (to the book page), and Read chapter one of *Stone Breath*, free (to /read/). Both use words already on the site.

## The two links in

- `/series/by-lamplight/`: one line under the sample's note, "Read it by lamplight →". Nothing else on the page changed.
- `/read/`: one line under "a PDF you can keep", "Read it by lamplight →". Nothing else changed.

Copies of both pages and the sitemap as they were are in `versions/2026-11-11-before-lamplight/`.

## Tested

Playwright, Chromium, at 390 × 844 and 1440 × 900, with `aw.joined` set so the sign-up wall stays out of the way. At both sizes:

- no console errors, page errors or failed requests from the room's own files (the book page's MailerLite form script cannot be fetched from the test sandbox, and is set aside);
- the read-along aligns 21 of 21 sentences; the text on the room's page is the book page's excerpt, word for word (compared by script);
- the lamp starts low and silent; the flicker is already breathing (13 to 15 distinct glow opacities in one second);
- pressing the lamp turns it up and starts the voice; the first sentence lights;
- the lit sentence has no background box, only the halo;
- seeking to 20.0 s lights "The book hasn't been burned."; seeking to 36.0 s lights "A people can lose everything…", with the 15 sentences before it at full ink;
- hiding the tab stops the flicker and pauses the motes; showing it again resumes both;
- room tone is off until pressed, on when pressed, off again when pressed again;
- pressing the lamp while it plays pauses the voice and turns the lamp down;
- at the end of the reading the lamp settles low and all 21 sentences rest at full ink;
- the links out arrive at the book page and at /read/; the links in from both pages arrive in the room;
- with reduced motion, the lamp holds still and the motes are gone;
- no horizontal scroll at 390 px.

One note for anyone testing locally: the audio only seeks on a server that answers HTTP Range requests. Python's `http.server` does not, so a scrub or a tap on a later sentence does nothing there; Netlify does, and the tests used a small Range-capable server.
