# Two voices on every free reading

*11 November 2026 · branch `claude/two-voices-v2` · replaces the older `claude/two-voices` branch*

Tony asked: "where are the 2 voice audio channels? the feminine and masculine" and "you have the pronunciation guide". Both are here. Every one of the 14 free readings now has two recordings, a masculine voice and a feminine voice, and both say every name the way Tony says it on his recording (tools/voice). Every Listen player on those readings shows a small line under the bar: **Voice: Masculine · Feminine**. Masculine is the default. The choice is remembered on the device and applied on every page.

## What is in this folder

| File | What it shows |
|---|---|
| `two-voices-phone.mp4` | A 20-second film at phone size (390 × 844) on "The Calm You Already Stored": the reading plays in the masculine voice, the listener presses Feminine and the same sentence carries on in the feminine voice, then back to Masculine, then Feminine again. The words keep lighting in time through every switch. |
| `phone-*-switch-feminine.png` · `phone-*-switch-masculine.png` · `laptop-*` | The player close up on each of the three test pages, with each voice chosen. |
| `phone-*-feminine-playing.png` · `laptop-*-feminine-playing.png` | The page a moment after switching to the feminine voice while it plays: the read-along on the right sentence. |
| `phone-*-masculine-sentence.png` · `laptop-*-masculine-sentence.png` | Paused on a later sentence in the masculine voice, the sentence lit. |
| `phone-*-after-reload.png` · `laptop-*-after-reload.png` | After a reload: Feminine still chosen, the feminine file loaded, the read-along on the feminine timeline. |
| `feminine-first-15s/` | The first 15 seconds of each of the 14 feminine readings. |
| `names/` | The 17 names asked for (the 15 most heard, plus Skrelūnas and Diné), each said alone in each voice: `tonas.masculine.m4a`, `tonas.feminine.m4a` and so on. |
| `whisper.txt` | The full check log: every sentence of every reading in both voices transcribed back and compared with the text; the names alone; the phoneme check for the feminine voice; loudness and length of every file. |
| `results.txt` | The 112 Playwright checks, all passing. |

## The files on the site

In `assets/audio/readings/`, for every reading `<slug>`:

- `<slug>.m4a` and `<slug>.timeline.json` — the masculine voice, **rebuilt** with the pronunciation guide applied (the old files said some names wrong, for the reason written up in tools/voice/HOW-TO-MAKE-THE-VOICE-SAY-THEM.md).
- `<slug>.f.m4a` and `<slug>.f.timeline.json` — the feminine voice, new.
- `voices.json` — the list of readings that have both voices, with the length of each file. The players read it to know when to show the switch.

| Reading | Masculine | Feminine |
|---|---|---|
| `blood-and-amber` | 7.6 min | 6.7 min |
| `by-lamplight-opening` | 1.0 min | 0.9 min |
| `carry-without-stealing` | 2.7 min | 2.4 min |
| `council-fire-excerpt` | 2.9 min | 2.6 min |
| `far-messengers-excerpt` | 1.5 min | 1.3 min |
| `garden-as-practice` | 3.3 min | 2.9 min |
| `koi-and-the-dragon-gate` | 3.2 min | 2.8 min |
| `never-only-men` | 2.5 min | 2.2 min |
| `stone-breath-chapter-one` | 16.2 min | 14.2 min |
| `stone-breath-excerpt` | 1.9 min | 1.7 min |
| `the-arched-bridge` | 3.1 min | 2.7 min |
| `the-calm-you-already-stored` | 2.8 min | 2.5 min |
| `the-sound-of-water` | 3.0 min | 2.6 min |
| `torii-in-the-desert` | 6.8 min | 6.0 min |

The feminine voice reads a little faster, so its files are shorter; the pauses between sentences are the same in both.

## How the voices were made

- The engine is Kokoro v1.0 (kokoro-onnx), 24 kHz. Masculine: `am_michael`, speed 1.0, English (US). Feminine: `bf_emma`, speed 1.0, English (GB), the gentle British voice.
- Every sentence was synthesized on its own, with the names replaced in the text sent to the voice by the spellings in `tools/voice/say_spellings.json` (whole words, possessives included). The timeline text keeps the true spelling. Nothing in capitals was ever sent to the voice.
- Each sentence was trimmed of silence (below −45 dB, keeping 20 ms before and 40 ms after the sound) with a 10 ms fade at each end, then the sentences were joined with exactly the gaps of the old masculine timeline (and the same 0.3 s lead), so a paragraph break still sounds like a paragraph break.
- Encoded as AAC in the same form as the old files (48 kHz, mono, 96 kb/s, moov first). Both voices are levelled to the old masculine file's loudness: every file is within 0.3 LU of it (the old files had been levelled with ffmpeg's loudnorm, so the same filter was used).

## The names

- The masculine voice uses the 140 spellings already solved against espeak en-us in `say_spellings.json`.
- The feminine voice reads with the en-gb rules, so every spelling was phonemized again with espeak en-gb and compared with the en-us target, after folding the differences that are only accent (the British o, the unsounded r before a consonant, and so on). 138 of the 140 came out the same. One, Ąžuolas (in Blood and Amber), needed its own spelling for the British voice, `ah-zho-lahss`, found by hand after the automatic search. The two that still differ, Yá'át'ééh and Māori, get a linking r from the British voice between two vowels and are not read anywhere. The result is the one new file in tools/voice: `say_spellings.en-gb.json`.
- Five names the old timelines carried only as respellings (Hastiin, Ona, Rasa Vaitkutė, wabi-sabi, shakkei) are now written true in the timelines, and the voice still says them as before (Ona by the guide; the other four are not among the 140, so they keep the respelling the old build used).

## The check

- whisper small.en (the OpenAI weights, int8, on the CPU) transcribed every sentence clip of both voices: 1360 clips, mean word error 1.0%. Name words are judged by the phoneme check, not by whisper's spelling. Any sentence over 10%, or missing its last word, was re-synthesized with nudged inputs and the best take kept: 59 were, and 43 clips are still listed in whisper.txt with what whisper heard. Reading those lines, they are whisper mishearing very short sentences ("Not the heat." as "not the heater") and names outside the 140 (Laima, Dievas, sutartinės), not the voice reading the wrong words.
- faster-whisper was installed as asked, but the host it downloads its weights from (huggingface.co) is blocked by this session's network policy. The same small.en weights, in int8 ONNX form, came from the sherpa-onnx release on GitHub and ran with sherpa-onnx. The model and the quantisation are the ones asked for; only the runner differs.
- The 17 names were rendered alone in each voice (names/) and transcribed; whisper's spellings of them are in whisper.txt.

## The switch

In `js/aw-listen.js` and `css/aw-listen.css`:

- A player whose slug is in `voices.json` gets a quiet line under the bar, **Voice: Masculine · Feminine**, a radio group (arrow keys move between the two). It is drawn in currentColor with inherited type, so it is ink on the cream cards and firelight in the lamplight room, with no colours of its own.
- Masculine is the default. Choosing Feminine stores `aw.voice` = `feminine` in localStorage (in try/catch); choosing Masculine removes it. On every page the stored choice is applied before anything loads: the player's file is swapped to `<slug>.f.m4a` and the read-along fetches `<slug>.f.timeline.json`.
- Switching while the reading plays: the player reads both timelines, finds the sentence being read and how far through it the voice is, swaps the file, seeks to the same place in the other voice's sentence, and keeps playing. Switching while paused keeps the place the same way. The place remembered on the device is kept per voice (the same seconds are not the same words in the other voice).
- The player tells the read-along with an `aw-voice` event on itself. In `js/aw-readalong.js` the times of the sentences are swapped in place for the other timeline (the sentences are the same), so the highlighting carries on without re-reading the page.
- Everything the players did before is unchanged: one reading at a time, the remembered place, tap and drag on the bar, the keyboard, the lock-screen title, the "Read along" switch, the lamp in the lamplight room.

No .html page was edited. **The pages need these cache bumps when this is merged** (every page that loads them; 16 pages carry the player):

- `/js/aw-listen.js?v=1` → `/js/aw-listen.js?v=2`
- `/css/aw-listen.css?v=1` → `/css/aw-listen.css?v=2`
- `/js/aw-readalong.js?v=1` → `/js/aw-readalong.js?v=2`

`aw-readalong.css` was not changed and keeps `?v=1`. The pages are: the four book pages under /series/, the three stories under /stories/, the five /ja/ articles, /lt/blood-and-amber/, /read/, /read/stone-breath/ and /lamplight/.

## The test

Playwright, headless Chromium, at 390 × 844 and 1440 × 900, with `aw.joined` set so the sign-up wall stays down, the site served by http-server (so the audio can be seeked). On `/stories/the-calm-you-already-stored/`, `/read/stone-breath/` and `/lamplight/`:

- the switch appears, Masculine chosen, the masculine file and timeline in use;
- the reading plays; switching to Feminine while sentence 3 plays swaps to the `.f.m4a` file, keeps playing, and sentence 3 is the one lit;
- in each voice, seeking into two later sentences lights those sentences (on the chapter page, two sentences that the edited chapter carries: the chapter on that page differs a little from the recording, as before);
- after a reload Feminine is still chosen, the feminine file loaded, the read-along on the feminine timeline, `aw.voice` stored; choosing Masculine again clears it;
- no console errors from the pages (the sandbox cannot reach outside hosts such as fonts, and those blocked loads are set aside).

ALL 112 CHECKS PASS.
