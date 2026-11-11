# The read-along on the free readings

*11 November 2026 · branch `claude/readalong`*

On every free reading, as the voice reads, the words on the page light up in step with it. A visitor can listen and read at the same time, tap any sentence to hear it from there, and switch the lighting off if they only want to listen.

## How it works

Two new files do all of it: `js/aw-readalong.js` and `css/aw-readalong.css`. They load only on the 14 reading pages. Nothing else on the site was touched.

1. **The timeline.** Each reading already has `assets/audio/readings/<slug>.timeline.json`: every sentence of the reading with its exact start and end in the audio. When a reading page opens, the script fetches that file.
2. **Lining it up with the page.** Each page marks the text the voice reads with a `data-aw-readalong` attribute: the title and the body of the piece. The script walks that text word by word and matches the timeline's sentences to it in order. Quotes, dashes, case and punctuation are ignored. Where a name was respelled for the voice (`mahsahn` for Masan, `vee-tah-tis` for Vytautas, `wah-bee sah-bee` for wabi-sabi, and so on) the sentence is matched by letter similarity inside the gap the sure matches leave. Sure matches first, then the short and fuzzy ones in the gaps between them.
3. **Wrapping.** Every matched sentence is wrapped in a span, and every word inside it in a span. Not one character of the page changes; the test compares the page text before and after on every page. If a page could not be lined up with confidence (fewer than 80% of its words matched, or fewer than three sentences), nothing is wrapped and the player works exactly as before. No page needed that fallback.
4. **While it plays.** One `requestAnimationFrame` loop runs only while the audio plays. Each frame reads the audio's time and moves two classes: `is-current` on the sentence being read, `is-word` on the word. Word times are interpolated inside the sentence by syllable weight (a vowel-group count per word, with a little extra on words that end a clause). Nothing in the loop reads layout; the only layout read is one `getBoundingClientRect` when the sentence changes, for the scroll.
5. **The look.** The current sentence sits in a soft warm wash of the site's gold at 17%. The current word carries a slightly stronger mark of the same gold with a thin gold line beneath. Sentences already read rest at full ink; the sentences still to come sit a shade lighter (74%) so the eye can see where the voice is. The dark excerpt panel on /read/stone-breath/ gets a lighter-gold version of the same. No yellow, no blend modes, no backdrop filters.
6. **Following the voice.** When the sentence changes and it is near the top or bottom of the screen, the page glides so the sentence sits about a third of the way down. If the visitor scrolls, drags, or uses the arrow and page keys, the follow waits four seconds. With `prefers-reduced-motion`, the page jumps instead of gliding and the highlights change without transitions.
7. **Tap to jump.** Tapping any sentence moves the audio to its start and plays. Keyboard: once a reading has started, sentences can be tabbed to, and Enter or Space jumps there. Selecting text, or tapping a link inside a sentence, does not jump.
8. **Pause.** When the reading is paused the highlight stays where it is. When the reading ends, everything rests at full ink and the page returns to its plain look a moment later.
9. **The switch.** A small "Read along" switch sits beneath the Listen card (on the Lithuanian and Japanese pages it reads in that language, following the page's `lang`). It is on by default. Off clears all highlighting and the scroll follow; the choice is remembered on the device in `localStorage` under `aw.readalong`.
10. **Screen readers.** The spans carry no roles and no ARIA; the text reads exactly as before. The switch is a real `role="switch"` button.

## Which pages are aligned

Every one of the 14 readings is aligned. Three notes:

| Page | Sentences lit | Note |
|---|---|---|
| /read/ | 9 of 180 | The page shows only the opening of chapter one (the chapter continues as the PDF). The title, epigraph and the opening paragraphs light up as the voice reads them; after that the voice continues and nothing on the page is left to light. |
| /read/stone-breath/ | 7 of 180 | Same: the excerpt panel lights as it is read, then the voice carries on past the page. |
| /series/stone-breath/ | 39 of 39 | Both sample cards are read (the practice, then the chapter-two opening), so both are marked. |
| /series/the-council-fire/ | 42 of 42 | Both sample cards, as above. |
| /series/the-far-messengers/ | 20 of 20 | One of the three uneven readings. The respelled "rah-sah vite-koo-teh" matched the card's "Rasa Vaitkutė" by letter similarity. |
| /series/by-lamplight/ | 21 of 21 | Uneven: the five respelled names in the attributions (mahsahn, vee-tah-tis, hahs-teen, ohna) all matched their cites. |
| /ja/garden-as-practice/ | 34 of 34 | Uneven: wah-bee sah-bee, ho-zho and shahk-kay matched wabi-sabi, hózhó and shakkei. |
| /stories/ (3), /ja/ (the other 4), /lt/blood-and-amber/ | all | Word for word. Figure captions and the "From The Ancestral Watch" sign-off inside the article are not read and are left plain. |

If chapter one were ever placed on the /read/ pages in full, the whole 16 minutes would light up with no further work; the alignment is done against whatever text is on the page.

Word coverage of the marked text: 92% to 100% on every page (the remainder is captions, labels and sign-offs that the voice does not read).

## Test results

Run with Playwright and Chromium against the repo served locally with HTTP Range support (Chromium needs Range to seek audio; Netlify provides it).

**Alignment check, all 15 page files** (the two /read/ pages share one reading): every page aligned, page text identical before and after wrapping, no script errors.

**Behaviour test, 388 checks, 388 passed, 0 failed.** Phone 390×844 and laptop 1440×900, on /read/stone-breath/, /stories/never-only-men/, /lt/blood-and-amber/, /series/by-lamplight/ (uneven), /series/stone-breath/ and /ja/garden-as-practice/ (uneven), plus /stories/never-only-men/ on the phone with reduced motion. On each:

- the switch is beside the player and on; nothing is lit before play;
- the audio plays; at four seek points (an early sentence, the middle, the last sentence on the page, and the last tenth of a second of a sentence) the lit sentence is the one the timeline gives for the audio's current time, the word mark is inside it, earlier sentences carry the read state, and the page follows to keep the sentence in view;
- pausing keeps the highlight;
- tapping a sentence jumps to its start (within a second) and plays; Enter and Space on a focused sentence do the same;
- after the visitor scrolls, a sentence change does not move the page within four seconds;
- the switch off clears every highlight and the tab stops; on restores them;
- no roles or `aria-hidden` on the text; the switch's text contains none of the words that must not appear;
- no console errors (the only console messages are blocked requests for the external font and form scripts, which the sandbox has no network for).

**Film:** `readalong-phone.mp4` beside this note, 29 seconds, phone size, muted: play on "The far messengers were never only men", the words lighting through the first paragraph, then a tap on the pull-quote sentence and the voice going there.

## Files

- `js/aw-readalong.js`, `css/aw-readalong.css` (new, `?v=1`)
- the 14 reading pages: two tags in the head and body, and `data-aw-readalong` on the read containers
- `versions/2026-11-11-before-readalong/`: a copy of each of the 14 pages as it was before
