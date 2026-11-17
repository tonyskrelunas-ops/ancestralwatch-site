#!/usr/bin/env python3
"""Build a Japanese or Lithuanian edition of one English Ancestral Watch article (17 Nov 2026).

Usage:  python3 tools/translate/build.py <source-dir> <ja|lt> <translation.json>
  source-dir        the English article, e.g. ja/torii-in-the-desert or stories/carry-without-stealing
  translation.json  {
    "slug":        "torii-in-the-desert-ja"   (lowercase ascii, hyphens; the page goes to <lang>/<slug>/)
    "title":       page <title> and og:title
    "description": meta description and og:description (one or two sentences)
    "eyebrow":     the small line above the headline
    "h1":          the headline
    "meta":        the line under the headline (author line)
    "body_html":   everything inside <div class="wrap article"> up to (not including) <div class="article__end">,
                   same tags, same images (src unchanged), alt text and captions translated
    "end_html":    the inside of <div class="article__end"> translated (keep the links/hrefs)
    "capture_eyebrow", "capture_h2", "capture_p": the sign-up box at the bottom
    "card_text":   a short line for the card on the language home page
  }
What it does: takes the page chrome (menus, footer, scripts) of the target language from an existing page in that
language, takes the article layout and images from the English source, drops the English Listen player and the
read-along marks, writes <lang>/<slug>/index.html with lang, canonical and hreflang set; adds a quiet
"read it in Japanese/Lithuanian" link and an hreflang to the English page; adds a card to <lang>/index.html; adds
the page to sitemap.xml; records it in tools/translate/done.json. Refuses to overwrite an existing page.
"""
import json, os, re, sys, html, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://ancestralwatch.com'
CHROME = {'ja': 'ja/torii-in-the-desert/index.html', 'lt': 'lt/blood-and-amber/index.html'}
LABEL = {'ja': ('日本語で読む', '日本語の物語と随筆。', 'トニー・スクレルーナスの物語と随筆を、日本語で。', '日本語', '読む'),
         'lt': ('Skaityk lietuviškai', 'Istorijos ir esė lietuviškai.', 'Tony Skrelūno istorijos ir esė — lietuvių kalba.', 'Lietuviškai', 'Skaityti')}
ALSO = {'ja': '日本語で読む', 'lt': 'Skaityti lietuviškai'}
MARK = '<!-- aw-translations -->'

def die(msg): print('REFUSED:', msg); sys.exit(1)
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s):
    os.makedirs(os.path.dirname(os.path.join(ROOT, p)), exist_ok=True); open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(s)
def attr(s): return html.escape(s, quote=True)
def sub1(pat, rep, s, flags=re.S):
    new, n = re.subn(pat, rep, s, count=1, flags=flags)
    if n != 1: die(f'pattern not found: {pat[:60]}')
    return new

def main():
    if len(sys.argv) != 4: die(__doc__)
    src, lang, tj = sys.argv[1].strip('/'), sys.argv[2], sys.argv[3]
    if lang not in CHROME: die('lang must be ja or lt')
    T = json.load(open(tj, encoding='utf-8'))
    for k in ('slug', 'title', 'description', 'eyebrow', 'h1', 'meta', 'body_html', 'end_html', 'capture_eyebrow', 'capture_h2', 'capture_p', 'card_text'):
        if not str(T.get(k, '')).strip(): die(f'missing {k}')
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', T['slug']): die('slug must be lowercase ascii with hyphens')
    out = f"{lang}/{T['slug']}/index.html"
    if os.path.exists(os.path.join(ROOT, out)): die(f'{out} already exists')
    S = rd(f'{src}/index.html'); C = rd(CHROME[lang])
    if 'AI' in re.findall(r'\bAI\b', T['body_html'] + T['title'] + T['description']): die('the word AI appears')
    src_url = f'{SITE}/{src}/'; url = f"{SITE}/{lang}/{T['slug']}/"
    og_img = re.search(r'<meta property="og:image" content="([^"]*)"', S)
    if og_img: og_img = og_img.group(1)
    else:
        first = re.search(r'<div class="wrap article".*?<img src="([^"]+)"', S, re.S)
        og_img = SITE + first.group(1) if first and first.group(1).startswith('/') else f'{SITE}/assets/img/stone-breath-cover-1600.jpg'

    # --- main: the English layout, translated, without the English audio or read-along ---
    M = re.search(r'<main id="main">.*?</main>', S, re.S).group(0)
    M = re.sub(r'\s*<div class="aw-listen".*?</audio>\s*</div>', '', M, count=1, flags=re.S)
    M = re.sub(r'\s*data-aw-readalong="[^"]*"', '', M)
    M = sub1(r'(<section class="page-hero article-hero">.*?<p class="eyebrow">).*?(</p>)', lambda m: m.group(1) + T['eyebrow'] + m.group(2), M)
    M = sub1(r'(<h1[^>]*>).*?(</h1>)', lambda m: m.group(1) + T['h1'] + m.group(2), M)
    M = sub1(r'(<p class="article-meta">).*?(</p>)', lambda m: m.group(1) + T['meta'] + '</p>\n        <p class="aw-also" style="margin-top:.6rem;font-size:.92rem"><a href="' + src.join(['/', '/']) + '" hreflang="en" lang="en">Read it in English →</a></p>', M)
    M = sub1(r'(<div class="wrap article"[^>]*>).*?(<div class="article__end">).*?(</div>\s*</div>\s*</section>)',
             lambda m: m.group(1) + '\n' + T['body_html'].strip() + '\n\n        ' + m.group(2) + '\n' + T['end_html'].strip() + '\n        ' + m.group(3), M)
    M = sub1(r'(<section class="section capture">\s*<div class="wrap">\s*<p class="eyebrow">).*?(</p>\s*<h2>).*?(</h2>\s*<p>).*?(</p>)',
             lambda m: m.group(1) + T['capture_eyebrow'] + m.group(2) + T['capture_h2'] + m.group(3) + T['capture_p'] + m.group(4), M)

    # --- page: the target language's chrome with the new head and main ---
    P = C
    P = sub1(r'<html lang="[^"]*">', f'<html lang="{lang}">', P)
    P = sub1(r'<title>.*?</title>', f"<title>{html.escape(T['title'])} | Ancestral Watch — Tony Skrelūnas</title>", P)
    P = sub1(r'<meta name="description" content="[^"]*"\s*/?>', f'<meta name="description" content="{attr(T["description"])}" />', P)
    for prop, val in (('og:type', 'article'), ('og:title', T['title']), ('og:description', T['description']), ('og:url', url), ('og:image', og_img)):
        tag = f'<meta property="{prop}" content="{attr(val)}" />'
        P, n = re.subn(r'<meta property="' + prop + r'" content="[^"]*"\s*/?>', lambda m: tag, P, count=1)
        if n == 0: P = sub1(r'(<meta name="description" content="[^"]*"\s*/?>)', lambda m: m.group(1) + '\n  ' + tag, P)
    P = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*/?>', '', P)
    P = sub1(r'<link rel="canonical" href="[^"]*"\s*/?>', f'<link rel="canonical" href="{url}" />\n  <link rel="alternate" hreflang="en" href="{src_url}" />\n  <link rel="alternate" hreflang="{lang}" href="{url}" />\n  <link rel="alternate" hreflang="x-default" href="{src_url}" />', P)
    P = sub1(r'<main id="main">.*?</main>', lambda m: M, P)
    if re.search(r'aw-listen__btn|data-aw-readalong', P): die('English audio left on the page')
    wr(out, P)

    # --- the English page: an hreflang and a quiet link to this edition ---
    E = S
    if f'hreflang="{lang}" href="{url}"' not in E:
        E = sub1(r'(<link rel="canonical" href="[^"]*"\s*/?>)', lambda m: m.group(1) + f'\n  <link rel="alternate" hreflang="{lang}" href="{url}" />', E)
    if f'href="/{lang}/{T["slug"]}/"' not in E:
        E = sub1(r'(<p class="article-meta">.*?</p>)', lambda m: m.group(1) + f'\n        <p class="aw-also" style="margin-top:.6rem;font-size:.92rem"><a href="/{lang}/{T["slug"]}/" hreflang="{lang}" lang="{lang}">{ALSO[lang]} →</a></p>', E)
    wr(f'{src}/index.html', E)

    # --- the language home page: a card in the "read in Japanese/Lithuanian" list ---
    eb, h2, intro, kick, go = LABEL[lang]; H = rd(f'{lang}/index.html')
    if MARK not in H:
        block = (f'<section class="sec" id="translations">\n  <div class="wrap">\n    <div class="sec__intro rv">\n      <div>\n        <p class="eyebrow">{eb}</p>\n'
                 f'        <h2 class="head">{h2}</h2>\n      </div>\n      <p>{intro}</p>\n    </div>\n    <div class="grid3 rv">\n{MARK}\n    </div>\n  </div>\n</section>\n\n')
        H = sub1(r'(<section class="hasglyph sec" id="essays">)', lambda m: block + m.group(1), H)
    card = (f'      <a class="jc" href="/{lang}/{T["slug"]}/">\n        <span class="jc__img"><img src="{og_img.replace(SITE, "")}" alt="" loading="lazy"></span>\n'
            f'        <p class="jc__kick">{kick}</p>\n        <h3>{html.escape(T["title"])}</h3>\n        <p class="muted">{html.escape(T["card_text"])}</p>\n'
            f'        <span class="jc__go">{go} <span aria-hidden="true">&#8594;</span></span>\n      </a>\n')
    H = H.replace(MARK, card + MARK, 1); wr(f'{lang}/index.html', H)

    # --- sitemap and record ---
    sm = rd('sitemap.xml')
    if url not in sm: wr('sitemap.xml', sm.replace('</urlset>', f'  <url><loc>{url}</loc></url>\n</urlset>', 1))
    dpath = 'tools/translate/done.json'; done = json.loads(rd(dpath)) if os.path.exists(os.path.join(ROOT, dpath)) else []
    done.append({'source': src, 'lang': lang, 'path': f"{lang}/{T['slug']}", 'title': T['title'], 'date': datetime.date.today().isoformat()})
    wr(dpath, json.dumps(done, ensure_ascii=False, indent=1) + '\n')
    print('built', out)

if __name__ == '__main__':
    main()
