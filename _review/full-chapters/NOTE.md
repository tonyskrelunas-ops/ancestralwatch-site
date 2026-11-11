# Three full chapters on ancestralwatch.com — what was made, and the four link lines still to add

Branch `claude/full-chapters`. Nothing already on the site was edited except sitemap.xml (three lines added).

## The pages

| page | what it holds | reading |
|---|---|---|
| /read/stone-breath/chapter-two/ | Stone Breath, Chapter 2 "The Box He Carried", whole | 22:27 masculine · 20:57 feminine |
| /read/the-council-fire/ | The Council Fire, "first voice" and "Prologue I · The Runners", whole | 18:48 masculine · 16:22 feminine |
| /read/the-far-messengers/ | The Far Messengers, "Before" (Rasa's and Nalu's chapter ones), whole | 26:07 masculine · 23:07 feminine |

Each page is built from read/stone-breath/index.html: the same head, the same CSS and JS files in the same order
(tokens, style, daylight, aw-listen, aw-readalong; main.js, aw-listen.js, aw-readalong.js, the sign-up wall aw-gate.js),
the same header, nav (with Reading Room), language bar, "Stay with it" form and footer. The chapter text is the text in
tools/chapters/, word for word: epigraphs as block quotes, italics and bold kept, the section breaks (◆ ◆ ◆ and * * *),
the chapter and section headings. The only thing not carried over is a stray "[]" on the last line of
far-messengers-before.md, which is not a word.

At the end of each page: one quiet line "About the book →" to the book's own page, then "Get the book →" with the same
Payhip link that book's page uses (AhH6r, GB2eg, GQ9iA). Title, description, canonical and Open Graph tags are set from
words already on the book pages. No noindex. The three pages are in sitemap.xml.

## The audio, both voices

- Masculine: Kokoro v1.0 am_michael, speed 1.0, en-us. `<slug>.m4a` and `<slug>.timeline.json`. This is the voice the
  page's Listen player uses.
- Feminine ("Gentle british"): bf_emma, speed 1.0, en-gb. `<slug>.f.m4a` and `<slug>.f.timeline.json`, the same sentence
  structure (same p and s numbering), so the other job's voice switch can swap them in.
- `assets/audio/readings/voices-chapters.json` lists the three slugs with both files, timelines and durations for each.
- Slugs: stone-breath-chapter-two, council-fire-opening, far-messengers-before.

Built sentence by sentence, each clip trimmed of silence, then laid out with the gaps measured from
stone-breath-chapter-one.timeline.json: 0.30 s before the first word, 0.32 s between sentences, 1.05 s between
paragraphs. Chapter one has no section breaks to measure, so a section break gets twice the paragraph gap, 2.10 s.
Encoded like the existing readings (AAC LC, 48 kHz, mono, 96 kb/s). Loudness, against chapter one's -16.8 LUFS:
-17.4 / -17.0 (Stone Breath m/f), -17.4 / -17.0 (Council Fire), -17.4 / -17.0 (Far Messengers), all within 1 LU;
peaks held to -1.0 dBFS or lower, like the existing files.

### The names

Tony's spellings from tools/voice/say_spellings.json were put into the text sent to the voice only (27 names in Stone
Breath, 8 in The Far Messengers, none in The Council Fire). Every spelling was checked with espeak en-gb phonemes for the
feminine voice as solve_say.py does; all of them already matched, nothing needed adjusting. Names not on the recording
got a plain lowercase respelling of their standard pronunciation, never all caps:
Rasa Vaitkutė "rah-sah vait-koo-teh", Nalu Kealoha-Nakamura "nah-loo keh-ah-loh-hah nah-kah-moo-rah",
Hawaiʻi "hah-vai-ee", Aotearoa "ah-oh-teh-ah-roh-ah", hālau "hah-lau", Rub' al Khali "roob al kah-lee",
Hitotsubashi "hee-toh-tsoo-bah-shee", Tama "tah-mah", Zarasai "zah-rah-sigh", Antalieptė "an-tal-yap-teh" (after his
"an-tal-yap-tis" for Antalieptės), Šventoji "schven-toh-yee" (espeak spells "shv" out as letters, "schv" says it),
Hastiin "hah-steen", Kee "kee", Musashi "moo-sah-shee", Miyamoto "mee-yah-moh-toh", Urs "oorrs".
The full list per chapter, with the phonemes, is in the build logs; the sentences where the voice text differs from the
page are listed there too.

### Lithuanian not on the recording — left unvoiced, left unhighlighted

- The epigraph "Kas išeina…": the voice reads the English that follows ("One who leaves never fully leaves.") and
  "Lithuanian proverb". The Lithuanian line stays on the page and never lights up.
- "dainos" (a small, worn book of Lithuanian dainos): not voiced. The sentence lights up in two pieces around it.
- "Antalieptės Krašto Paveldas" on the sign: "Antalieptės" is on the recording and is voiced; "Krašto Paveldas" is not
  voiced and does not light up.
- "sodyba — a guest farmstead": the voice reads the gloss, "a guest farmstead"; the word sodyba does not light up.
If Tony records "dainos", "sodyba", "Krašto Paveldas" and the proverb, they can be added to say_spellings.json and the
four sentences re-synthesized.

Three more things the voice says differently from how the page prints them, so it reads naturally: "MASAN Put the
phone down." is read "Masan. Put the phone down."; "T he ones who taught him" (a split word in the book file) is read
"The ones who taught him"; "Chapter 2" and "Prologue I" are read "Chapter Two" and "Prologue One". The page text is
untouched in all three.

## The checks

- whisper.txt beside this note: every clip transcribed with whisper small.en (int8, CPU) and compared with its
  sentence. huggingface.co is closed to this session, so faster-whisper could not download the model; the same
  small.en weights were taken from the sherpa-onnx GitHub release and run with sherpa-onnx. Mean word error against the
  page, names excused: 1.0–1.9% per reading (names excused because whisper writes "2 NAS" for too-nas). 5–10 clips
  per reading went over 10% on the first pass and were re-synthesized with the dashes read as commas, then split at the
  dash; what still shows as BAD in the log is, line by line, the names and the one- or two-word clips ("Warm." heard as
  "worms"), not misreadings.
- Seek points, both voices (end of whisper.txt): at two seek points per reading, the audio between the timeline start
  and end of that sentence, decoded from the published .m4a, transcribes as exactly that sentence. 12 of 12 line up.
- Playwright, Google Chrome (the bundled Chromium cannot decode AAC), at 390×844 and 1440×900, localStorage aw.joined
  set, on `npx http-server` (Range requests): on every page the read-along lines up all sentences (440/440, 189/189,
  278/278; coverage 99.7–100%, the missing 0.3% being the unvoiced Lithuanian), the masculine reading plays, the right
  sentence is lit at both seek points, no horizontal scroll at 390. One console error on each page: MailerLite's
  universal.js cannot load through this sandbox's proxy; the existing chapter-one page shows the same single error under
  the same harness. The two "failed" audio requests per page are the browser cancelling a fetch when it seeks.
- Screenshots: phone-*/laptop-* for each page on arrival, while playing, and at the two seek points.
- The first 20 seconds of each reading in each voice: `<slug>.first-20s.m4a` and `<slug>.f.first-20s.m4a`.

## The four one-line link changes still to make (on pages another job is editing)

"Keep reading — the full chapter →" next to each excerpt. One line each, inserted just above the existing Payhip
"Keep reading — get …" button inside `<div class="sample-cta" data-reveal>`:

series/stone-breath/index.html, above line 347 (the `Keep reading — get <em>Stone Breath</em> →` button):
```
          <p style="margin:0 0 var(--space-3);"><a href="/read/stone-breath/chapter-two/">Keep reading — the full chapter →</a></p>
```
series/the-council-fire/index.html, above line 508 (the `Keep reading — get <em>The Council Fire</em> →` button):
```
          <p style="margin:0 0 var(--space-3);"><a href="/read/the-council-fire/">Keep reading — the full chapter →</a></p>
```
series/the-far-messengers/index.html, above line 377 (the `Keep reading — get <em>The Far Messengers</em> →` button):
```
          <p style="margin:0 0 var(--space-3);"><a href="/read/the-far-messengers/">Keep reading — the full chapter →</a></p>
```
read/index.html, after line 281 (the `<p class="chapterpage__more">…the chapter continues →…</p>` block), where the
chapter-one notes sit:
```
  <p class="chapterpage__note"><a href="/read/stone-breath/chapter-two/">Keep reading — the full chapter →</a> · Chapter Two, "The Box He Carried"</p>
```
(On read/index.html the openings of The Council Fire and The Far Messengers are not excerpted, so a line for each would
be new content rather than a link next to an excerpt; the three series pages carry those.)

Worth knowing: the read-along's own CSS and JS (aw-readalong.css/js) and aw-listen.css/js were not touched; the pages
use whatever those files become, and the timelines follow the structure aw-readalong.js reads today.
