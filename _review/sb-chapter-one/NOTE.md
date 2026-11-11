# Stone Breath · Chapter One — rebuilt from the final book (11/11/2026)

## What changed
The chapter on the site was still the older text. It is now the final edited chapter, word for word
from `tools/chapters/stone-breath-chapter-one.md`: the title, all three epigraphs, the seven section
heads and every paragraph (3,416 words). The passages that were missing before are in — "Her name was
Masan", the "Rich" conversation at the fire, the lamp and the chapter-house TV, and the rest.

Both pages carry it, each in its own style:
- `/read/stone-breath/` — the book page (italic centered epigraphs and subheads, as before).
- `/lamplight/` — the lamplight room (page__epi, page__sub, as before).

The wording was checked by machine against the chapter file on both pages: identical, in order.

## The reading, in two voices
- `stone-breath-chapter-one.m4a` — the warm american voice. 20:17.
- `stone-breath-chapter-one.f.m4a` — the gentle british voice. 18:06.
Each has its own timeline file for the read-along (`.timeline.json` and `.f.timeline.json`), and
`voices-sb1.json` lists the pair (there was no voices.json yet).

Built sentence by sentence (261 sentences, 82 paragraphs counting the title, epigraphs and heads).
The pacing is the same as the previous recording: 0.3 s lead-in, 0.32 s between sentences, 1.05 s between
paragraphs and around section heads. The title is spoken as "Stone Breath. Chapter One. The Canyon Within."

Tony's spellings for the names (Tonas, Masan, Diné, Ada, Mesa, hogan, Yazzie) were applied to the text
sent to the voice only, never to the page. For the british voice the same spellings were checked again
against british phonemes: all seven match how Tony says them. "4:20" is sent as "four-twenty".

Loudness is matched to the previous file (−16.8 LUFS): the american voice measures −16.9 LUFS, the british
−16.5 LUFS; both peak around −1.3 dBFS. Same format as before: AAC in .m4a, 96 kb/s, 48 kHz, mono.

The first 20 seconds of each voice are here: `first-20s-masculine.m4a`, `first-20s-feminine.m4a`.

## The check
Every sentence of both voices was transcribed back by Whisper (small.en, CPU, int8) and compared with the
text; anything over one wrong word in ten, or cut off at the end, was rendered again other ways and the best
kept. The full log is `whisper.txt`.

- American voice: 261 of 261 sentences fine. Three were looked at twice and kept as they were
  ("canyon wren" heard as "canny and wren", "Then ten thousand." heard as "than ten thousand" — the
  listener's hearing, not the voice). "Her name was Masan" was rendered again with a breath before the
  closing quote and comes back as "Masan".
- British voice: 239 clean first time; 22 looked at again. Most of those are the listener hearing a stray
  syllable on a one- or two-word line ("Wind.", "Potters.", "The morning.") — the words are there. Three were
  actually rendered differently and are better now: "Tonas ran the program himself…", "The Land, First" and
  "I'm Diné — Navajo." (said in two breaths). "And?" was rendered without its quote mark, which the british
  voice had turned into a stray "z"; it is still a question.

One thing worth knowing: the build machine could not reach huggingface.co, so the Whisper weights came from
the sherpa-onnx GitHub release instead of faster-whisper's download. Same model, same size, same precision.

## The pages, tested
Playwright, Chromium, at 390×844 and 1440×900, with `aw.joined` set, on `npx http-server`:
- the reading plays on both pages at both widths;
- the read-along lights the right sentence at three seek points — the opening line, "Her name was Masan,"
  and "The day was already walking." — on both pages at both widths;
- the british voice's timeline lines up with both pages too (260 of 261 sentences on the book page, 259 on
  lamplight: only "Stone Breath." and "Chapter One." have no words on the page to light, as before);
- no console errors from the pages (the MailerLite sign-up script cannot load inside the test sandbox; that
  is the sandbox, not the page);
- no horizontal scroll at 390.
Screenshots are in `shots/` (page-width-point). `test-results.json` has the numbers.

Not touched: anything outside the four audio files, the two chapter blocks and player labels, and this folder.
