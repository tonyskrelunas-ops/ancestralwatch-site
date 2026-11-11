#!/usr/bin/env python3
"""Find the spelling that makes Kokoro SAY each name the way Tony says it.

The old approach wrote his respellings into the text. Kokoro's g2p spells short
all-caps chunks out as letters: MAH-sahn -> /ˌɛmˌAˈAʧsˈɑn/ -> "em-ay-aych sahn".
That is the "MASANY" he heard.

So: build the target phoneme string from his respelling in a form the g2p can
actually read, try a handful of candidate spellings for the real name, phonemize
all of them, and keep the one whose phonemes match.
"""
import json, re, sys, unicodedata, urllib.request, time

from g2p import phon as _phon
STRESS = str.maketrans('', '', 'ˈˌːˈˌ')

def phonemize(items, retry=3):
    return _phon(items)

def bare(p):
    return p.translate(STRESS).replace(' ', '')

def lev(a, b):
    if a == b: return 0
    prev = list(range(len(b)+1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j]+1, cur[j-1]+1, prev[j-1]+(ca != cb)))
        prev = cur
    return prev[-1]

def deaccent(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')

def candidates(name, say):
    segs = [s for s in re.split(r'[-\s]+', say) if s]
    low  = [s.lower() for s in segs]
    c = [
        name,                                   # as written
        deaccent(name),                         # no diacritics
        ''.join(low),                           # mahsahn
        ' '.join(low),                          # mah sahn
        '-'.join(low),                          # mah-sahn
        ''.join(low).capitalize(),              # Mahsahn
        ' '.join(low).capitalize(),
    ]
    # one more: double a lone vowel segment that espeak might shorten
    seen, out = set(), []
    for x in c:
        if x and x not in seen:
            seen.add(x); out.append(x)
    return out

def main():
    SAY = json.load(open('say_from_tony.json', encoding='utf-8'))
    names = list(SAY)
    # ---- targets: his respelling, lowercased, hyphens as spaces (g2p-safe)
    targets = phonemize([' '.join(s.lower() for s in re.split(r'[-\s]+', SAY[n]) if s)
                         for n in names])
    tgt = {n: bare(t) for n, t in zip(names, targets)}
    # ---- candidates
    flat, idx = [], {}
    for n in names:
        cs = candidates(n, SAY[n])
        idx[n] = (len(flat), len(cs)); flat += cs
    print(f'phonemizing {len(flat)} candidate spellings for {len(names)} names...', flush=True)
    phons = phonemize(flat)
    result, report = {}, []
    for n in names:
        a, k = idx[n]
        cs, ps = flat[a:a+k], phons[a:a+k]
        scored = []
        for c, p in zip(cs, ps):
            d = lev(bare(p), tgt[n])
            scored.append((d, c.count(' '), cs.index(c), c, p))
        scored.sort()
        d, _, _, best, bp = scored[0]
        result[n] = best
        report.append((n, SAY[n], best, bp, d, tgt[n],
                       [(c, bare(p), lev(bare(p), tgt[n])) for _, _, _, c, p in scored]))
    json.dump(result, open('say_spellings.json','w',encoding='utf-8'),
              ensure_ascii=False, indent=1)
    json.dump([{'name':r[0],'tony':r[1],'spell':r[2],'phonemes':r[3],'dist':r[4],
                'target':r[5]} for r in report],
              open('say_report.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
    exact = sum(1 for r in report if r[4] == 0)
    same  = sum(1 for r in report if r[2] == r[0])
    print(f'\n{exact}/{len(names)} exact phoneme match; '
          f'{same} need no respelling at all (the plain name was already right)\n')
    print(f'{"NAME":16} {"TONY SAYS":16} {"WRITE IT AS":16} {"KOKORO SAYS":22} d')
    for r in sorted(report, key=lambda x:-x[4])[:40]:
        print(f'{r[0][:15]:16} {r[1][:15]:16} {r[2][:15]:16} {r[3][:21]:22} {r[4]}')

main()
