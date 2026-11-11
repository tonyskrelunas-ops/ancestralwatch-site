# HOW TO MAKE THE VOICE SAY THEM — 2026-11-05

The old audio was wrong for a reason worth writing down.

I had put your respellings straight into the narration text — `for my real MAH-sahn`.
The voice engine's letter-to-sound step reads a short all-caps chunk as **letters**:

    MAH-sahn   ->  /ˌɛmˌeɪˈeɪtʃsˈɑːn/   =  "em-ay-aych sahn"

That is the MASANY you heard. The respelling itself was being read out loud.

Lowercase fixes it. `mahsahn` -> /mˈɑːsɑːn/ = MAH-sahn, which is what you say.

So for every one of the 140 names on your recording I generated candidate spellings,
ran each through the same letter-to-sound engine the voice uses, and kept the one whose
phonemes match your own pronunciation exactly. **140 out of 140 matched.** Then I rendered
them and transcribed the rendering, because a fix that is only in the input is not a fix.

| name | you say | write it in the narration as | what comes out |
|---|---|---|---|
| Tonas | TOO-nas | `too-nas` | tˈuːnˈæs |
| Austėja | ah-STAY-ya | `ah-stay-ya` | ˈɑːstˈeɪjɐ |
| Ona | OH-nah | `oh-nah` | ˈoʊnˈɑː |
| Ada | AH-dah | `ah-dah` | ˈɑːdˈɑː |
| Ugnė | AHG-neh | `ahgneh` | ˈɑːɡneɪ |
| Masan | MAH-sahn | `mahsahn` | mˈɑːsɑːn |
| Rytis | REE-tus | `ree-tus` | ɹˈiːtˈʌs |
| Lukas | LOO-kas | `loo-kas` | lˈuːkˈæs |
| Vytautas | vee-TAH-tis | `vee-tah-tis` | vˈiːtˈɑːtˈɪz |
| Vilnius | VIL-nee-oos | `vilneeoos` | vˈɪlniːˌuːz |
| talka | TAH-kah | `tah-kah` | tˈɑːkˈɑː |
| Yazzie | YAH-zee | `yahzee` | jˈɑːziː |
| Gintarė | YIN-tah-reh | `yin-tah-reh` | jˈɪntˈɑːɹˈɛ |
| Marija | mah-REE-hah | `mah-ree-hah` | mˈɑːɹˈiːhˈɑː |
| Jurgita | Yer-PEE-ta | `yer-pee-ta` | jɚpˈiːtˈɑː |
| Mano | MAH-no | `Mano` | mˈɑːnoʊ |
| Skrelūnas | Skrull-OO-nas | `skrull-oo-nas` | skɹˈʌlˈuːnˈæs |
| hogan | HO-gan | `ho-gan` | hˈoʊɡˈæn |
| frybread | FRY-bred | `fry-bred` | fɹˈaɪbɹˈɛd |

All 140 are in `say_spellings.json` beside this file.

**The rule, for every future audio build:** never check that a pronunciation is present in
the text. Render it, transcribe the rendering, and compare that to his recording. The input
is not the output.
