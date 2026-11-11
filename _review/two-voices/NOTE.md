# Two voices on every free reading — what was done, in plain words

Tony asked where the two voice channels were. There is now a masculine and a feminine voice for every one of the
14 free readings, and a small switch on every Listen player.

## The feminine voice

- Made with Kokoro v1.0, voice `bf_emma`, speed 1.0, language `en-gb` ("Gentle British"), the approved voice.
- Every sentence of every reading was spoken on its own, from the same sentence text the masculine voice used
  (so the name spellings from `tools/voice/say_spellings.json`, Tony's own pronunciations, are in the voice input;
  the page text is untouched). Each sentence was trimmed of silence at about -45 dB (20 ms kept before, 40 ms after),
  then the sentences were joined with exactly the gaps the masculine reading has between its sentences, the same
  lead before the first sentence, and a 10 ms fade at every joint.
- Encoded like the originals: AAC-LC, mono, 48 kHz, 96 kbit/s, in `.m4a`. Loudness was matched to the masculine twin
  of each file: all 14 are within 0.3 LU of their twin (about -17 LUFS integrated), with peaks held under -0.2 dBFS.
- Files, beside the masculine ones in `assets/audio/readings/`:
  - `<slug>.f.m4a` — the feminine reading;
  - `<slug>.f.timeline.json` — the same sentences, with the feminine start and end times;
  - `voices.json` — the list of the readings that exist in both voices (all 14).
- The feminine readings run about 8–12 % shorter than the masculine ones (the same gaps, a slightly quicker reader).

## Checked by ear-proxy (whisper), `whisper.txt`

Hugging Face, where faster-whisper fetches its weights, is not reachable from this session's network, so the check
ran the same model (whisper small.en, int8, on CPU) through the sherpa-onnx build of it, downloaded from GitHub.
Every one of the 680 sentences was cut from the final feminine file by its timeline and transcribed, then compared
with the sentence text with case, punctuation and numbers normalised.

- First pass: 63 of 680 sentences over 10 % word error; no sentence cut off anywhere.
- Each flagged sentence was spoken again at speed 0.97, at 0.95, with a settling pause after it, and, for names,
  with a second respelling; the best rendering replaced the first one only when whisper clearly heard it better.
  18 sentences were rebuilt that way. Four more short sentences that kept a stray sound at the end
  ("Not the heat", "The Canyon Within", "They went on down", "Martial arts") were spoken with a dummy sentence
  after them and the dummy cut away at the silence, which gave them a clean ending.
- Second pass from the final files: 13 of the 21 rebuilt sentences now at 0–6 %; the 8 still over 10 % are names
  whisper spells its own way (Laima, Dievas, dainos, Tonas, Bushidō, koi) and British homophones, not the voice.
- Three short sentences keep a faint release at the end that no rendering removed, listed at the end of
  `whisper.txt` ("It isn't.", "He knew what it cost.", "Not amber."). Worth one listen by ear.
- Everything else flagged is whisper's spelling of a name (it writes Skrelūnas as "Skrallunas", Tonas as
  "TUNAS", Diné as "Dene"), or a British homophone (drawer/draw, patience/patients, Hold four/Hold for).

## The switch

- `js/aw-listen.js`: every Listen player whose reading is in `voices.json` gets a small line under the bar:
  **Voice: Masculine · Feminine**. Masculine is the default. The choice is kept in `localStorage['aw.voice']`
  (inside try/catch) and applied on every page, before anything loads.
- Switching swaps the audio source to `<slug>.f.m4a` (or back) and tells the read-along to use the matching
  timeline. If the reading was playing, it goes on from the start of the **same sentence** in the other voice and
  keeps playing. If it was paused, the place is carried over the same way.
- The place a listener stopped is still remembered on the device, now per voice.
- `js/aw-readalong.js`: listens for the player's `aw:voice` event and swaps in the other voice's times (same
  sentences, same wrapped words — nothing on the page is re-wrapped), so the lit sentence follows at once.
- `css/aw-listen.css`: the control is set in `currentColor`/`inherit` only, so it sits quietly on the cream card
  in daylight and in the warm dark of the lamplight room without any page-specific CSS.
- One reading at a time, the lock-screen title, the progress bar, keyboard seeking, the "Read along" switch:
  all unchanged and re-tested.
- Nothing says "AI" or "masked" anywhere, and nothing says Tony is reading.

## Version strings (for the merge)

No `.html` file was touched, so the `?v=` strings were left as they are. After merging, the pages need these bumps
so browsers pick up the new files:

- `/js/aw-listen.js?v=1` → `/js/aw-listen.js?v=2` (37 pages)
- `/css/aw-listen.css?v=1` → `/css/aw-listen.css?v=2` (37 pages)
- `/js/aw-readalong.js?v=1` → `/js/aw-readalong.js?v=2` (22 pages)

(`css/aw-readalong.css` did not change.) One command does all three from the site root:

    grep -rl 'aw-listen.js?v=1\|aw-listen.css?v=1\|aw-readalong.js?v=1' --include=*.html . | xargs sed -i 's/aw-listen\.js?v=1/aw-listen.js?v=2/g; s/aw-listen\.css?v=1/aw-listen.css?v=2/g; s/aw-readalong\.js?v=1/aw-readalong.js?v=2/g'

## Tests (Playwright, Chromium, 390×844 and 1440×900, `aw.joined` set)

On `/stories/the-calm-you-already-stored/`, `/series/stone-breath/` and `/lamplight/`, at both sizes
(`playwright-results.txt` has the full log):

- the switch appears on every player, Masculine pressed by default;
- switching while playing: the same sentence index is kept (sentence 2 → sentence 2, landing on that sentence's
  feminine start time), playback continues, Feminine shows pressed;
- the read-along lights the right sentence at two seek points in the feminine voice (around 40 % and the
  second-to-last sentence) on every page;
- after a reload the choice persists (`aw.voice = f`, Feminine pressed, the feminine file is the source) and the
  reading resumes in the feminine voice with the right sentence lit;
- console errors: none from the site. The only console error on the story and book pages is
  `assets.mailerlite.com/js/universal.js` failing to load, which is this sandbox's network policy blocking the
  MailerLite script, not the site.

Served with `npx http-server` (HTTP Range requests, which the audio seeking needs).

## In this folder

- `screenshots/` — the switch, the feminine voice playing, the read-along lit in the feminine voice, and back to
  masculine, on all three pages at both sizes;
- `switching-voices-phone.mp4` — a 21-second phone film: play, switch to Feminine mid-reading, switch back, pause;
- `samples/` — the first 15 seconds of each feminine reading;
- `whisper.txt` — the full ear-proxy log (below);
- `playwright-results.txt` — the test log.
