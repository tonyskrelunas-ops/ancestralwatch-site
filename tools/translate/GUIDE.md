# Carrying Ancestral Watch into Japanese and Lithuanian

The daily routine reads this. Tony asked for it on 11/15–17/2026: keep Ancestral Watch articles coming in other languages, so a reader who clicks 日本語 or Lietuvių finds his writing in their language.

## Each day
- Carry ONE English piece into both languages: Japanese (ja) and Lithuanian (lt).
- Take the first entry in `queue.json` that does not yet have both languages in `done.json`.
- When the queue is finished, look for English article pages under `stories/`, `ja/` and `lt/` that are in neither file. Article pages have `<html lang="en">` and a `<div class="wrap article">`. Carry the oldest one.
- If there is nothing left, do nothing.
- Never translate the book chapters under `read/`, or anything else from the books. Those stay as Tony wrote them.

## How to translate
- This is interpretation, not machine translation.
  - Keep his first person, his long accumulating sentences (one English sentence stays one sentence), his paragraph breaks, his concrete images, his named people and his real numbers.
  - Never add or drop a claim.
  - Never write "AI".
- Keep the same HTML tags as the English body: the same `<figure>`, `<img src>`, `<h2>`, `<em>` and so on. Translate only the alt text and the captions.
- Words in other languages stay as they are, italic as in the English, for example *hózhó*, *gaman*, *močiutė*, *shimásání*, *torii*. Gloss one only where the English glosses it.
- **Japanese.** Write as a skilled Japanese editor would publish it: literary but plain, like NHK documentary narration. Use the です/ます style only if the piece speaks directly to the reader; otherwise use だ/である.
  - Diné: ディネ（ナバホ） at first mention, then ディネ.
  - Book titles: 『ストーン・ブレス』, 『ザ・カウンシル・ファイア』, 『ザ・ファー・メッセンジャーズ』. The series: アンセストラル・ウォッチ. The author: トニー・スクレルーナス.
  - "far messenger": ファー・メッセンジャー（遠くへ運ぶ使者） at first use, then ファー・メッセンジャー.
- **Lithuanian.** Write natural standard Lithuanian with correct cases.
  - Use real letters only: ą č ę ė į š ų ū ž. Never use combining marks or look-alikes such as ȧ or i̇.
  - Tony Skrelūnas declines normally (Tony Skrelūno, Tony Skrelūnui).
  - Book titles stay in English, in italics.
  - "far messenger": „tolimieji pasiuntiniai" (angl. *far messengers*) at first use.
  - Diné stays Diné.

## Checks before you commit
- Read your Japanese once more from start to end, looking only for wrong kanji: same-sound or look-alike characters, such as 混沈 for 混沌, 侣寂 for 侘寂, or 鋼 for 鯉. Fix every one.
- Run `grep -P "[\x{0307}\x{0227}]"` on the Lithuanian page. It must find nothing.
- The built page must:
  - exist;
  - have `<html lang>` set to its language;
  - have its canonical set to itself;
  - carry an hreflang to the English page;
  - contain no English paragraphs from the original;
  - have no Listen player.

## Building
- Write one JSON file per language; `build.py` lists the fields. Run `python3 tools/translate/build.py <source-dir> <lang> <file.json>`.
- Slugs are lowercase ASCII:
  - for Japanese, the English slug plus `-ja` (e.g. `torii-in-the-desert-ja`);
  - for Lithuanian, a natural Lithuanian slug without diacritics (e.g. `toris-aukstikalnes-dykumoje`).
- Keep temp files out of the repository. Never put an email address in the repository.
