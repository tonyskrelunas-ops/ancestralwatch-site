#!/usr/bin/env python3
"""The free chapters in Japanese (20 Nov 2026).

Tony: "the key is to get them to the pages in their language ... so we will need an interpreted japanese reading
page of the free samples". Readers in Tokyo and Kyoto arrive from the film ランプの灯りのもとで and its ad.

Builds, in the Japanese site chrome (taken from ja/torii-in-the-desert-ja/):
  ja/read/                                the film, then the five free chapters
  ja/read/<book>/[<chapter>/]             one page per chapter, from tools/chapters/ja/<name>.ja.md
and adds hreflang ja to the English chapter pages and the six pages to sitemap.xml.
Safe to run again: it rewrites only these pages.   Usage: python3 tools/translate/build_ja_read.py
"""
import os, re, html, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://ancestralwatch.com'
CHROME = 'ja/torii-in-the-desert-ja/index.html'
FILM = '/assets/video/under-the-lamplight-ja.mp4'; POSTER = '/assets/video/under-the-lamplight-ja-poster.jpg'

BOOKS = {
 'sb': ('ストーン・ブレス', '/series/stone-breath/', '/assets/img/stone-breath-cover-1600.jpg',
        'ディネとリトアニアの血を引く男が、祖父の歌を携えて古い国へ渡り、すでに満ち足りたひとりの女性と出会う。'),
 'cf': ('ザ・カウンシル・ファイア', '/series/the-council-fire/', '/assets/img/council-fire-cover-1600.jpg',
        '道はある。それは、かつて歩かれた道だ。'),
 'fm': ('ザ・ファー・メッセンジャーズ', '/series/the-far-messengers/', '/assets/img/far-messengers-cover.jpg',
        'バルトの歌の守り手と大洋の航海者が、ひとつの問いに答える。崩れていく世界を、ひとつの民はどう渡り、民のままたどり着くのか。'),
}
CH = [  # (md name, Japanese path, English path, book, the line on the card)
 ('stone-breath-chapter-one', 'ja/read/stone-breath', 'read/stone-breath', 'sb',
  '夜明け前、セドナの赤い岩の峡谷の底へ。トナス・ヤジーが、十一人の見知らぬ人々をヘッドランプの灯りで導いていく。'),
 ('stone-breath-chapter-two', 'ja/read/stone-breath/chapter-two', 'read/stone-breath/chapter-two', 'sb', None),
 ('council-fire-first-voice-and-the-runners', 'ja/read/the-council-fire', 'read/the-council-fire', 'cf', None),
 ('council-fire-the-cascade', 'ja/read/the-council-fire/the-cascade', 'read/the-council-fire/the-cascade', 'cf',
  '十二人が打ち破ったのは、暑さではない。沈黙だ。十二人の守り手が、それぞれの声で、渡りそのものを語る。'),
 ('far-messengers-before', 'ja/read/the-far-messengers', 'read/the-far-messengers', 'fm', None),
]
LINES = json.load(open(os.path.join(ROOT, 'tools/chapters/ja/lines.json'), encoding='utf-8')) if os.path.exists(os.path.join(ROOT, 'tools/chapters/ja/lines.json')) else {}

def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s):
    os.makedirs(os.path.dirname(os.path.join(ROOT, p)), exist_ok=True); open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(s)
def esc(s): return html.escape(s, quote=True)
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    return s

def md_to_html(md):
    """The chapter markdown -> the inside of <div class="excerpt chapter">, plus the chapter's title."""
    out, title, first = [], None, True
    for block in re.split(r'\n\s*\n', md.strip()):
        b = block.strip()
        if not b: continue
        if b.startswith('### '):
            out.append(f'<h3 class="chapter__sub">{inline(b[4:].strip())}</h3>')
        elif b.startswith('# '):
            h = b[2:].strip()
            m = re.match(r"^(.*?)\s*[·・—―]+\s*(.+)$", h)
            if m and first:
                num, name = m.group(1).strip(), m.group(2).strip()
                out.append(f'<h2><span class="chapter__num">{inline(num)}</span>{inline(name)}</h2>')
                title = title or name
            else:
                out.append(f'<h2>{inline(h)}</h2>')
                title = title or h
            first = False
        elif all(l.strip().startswith('>') for l in b.splitlines()):
            for l in b.splitlines():
                t = l.strip().lstrip('>').strip()
                if t: out.append(f'<p class="chapter__epi">{inline(t)}</p>')
        elif re.fullmatch(r'[◆◇*·・\s]+', b):
            mark = '◆ ◆ ◆' if '◆' in b or '◇' in b else ('* * *' if '*' in b else '· · ·')
            out.append(f'<p class="chapter__break" aria-hidden="true">{mark}</p>')
        elif b in ('[]',):
            continue
        else:
            out.append(f'<p>{inline(" ".join(l.strip() for l in b.splitlines()))}</p>')
    return '\n          '.join(out), title

def page(chrome, *, title, desc, url, en_url, image, main):
    P = chrome
    P = re.sub(r'<title>.*?</title>', lambda m: f'<title>{esc(title)} | アンセストラル・ウォッチ — トニー・スクレルーナス</title>', P, count=1, flags=re.S)
    P = re.sub(r'<meta name="description" content="[^"]*"\s*/?>', lambda m: f'<meta name="description" content="{esc(desc)}" />', P, count=1)
    for prop, val in (('og:type', 'article'), ('og:title', title), ('og:description', desc), ('og:url', url), ('og:image', SITE + image)):
        P = re.sub(r'<meta property="' + prop + r'" content="[^"]*"\s*/?>', lambda m: f'<meta property="{prop}" content="{esc(val)}" />', P, count=1)
    P = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*/?>', '', P)
    alt = (f'<link rel="canonical" href="{url}" />\n  <link rel="alternate" hreflang="ja" href="{url}" />'
           + (f'\n  <link rel="alternate" hreflang="en" href="{en_url}" />\n  <link rel="alternate" hreflang="x-default" href="{en_url}" />' if en_url else ''))
    P = re.sub(r'<link rel="canonical" href="[^"]*"\s*/?>', lambda m: alt, P, count=1)
    if 'aw-chapter-ja.css' not in P:
        P = P.replace('</head>', '<link rel="stylesheet" href="/css/aw-chapter.css?v=3">\n<link rel="stylesheet" href="/css/aw-chapter-ja.css?v=2">\n'
                      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600&display=swap">\n</head>', 1)
    P = re.sub(r'<main id="main">.*?</main>', lambda m: '<main id="main">\n' + main + '\n  </main>', P, count=1, flags=re.S)
    assert 'aw-listen__btn' not in P and 'data-aw-readalong' not in P
    return P

def capture(chrome):
    m = re.search(r'<div class="ml-embedded" data-form="[^"]*"></div>', chrome)
    form = m.group(0) if m else ''
    return ('    <section class="section capture">\n      <div class="wrap">\n        <p class="eyebrow">アンセストラル・ウォッチ</p>\n'
            '        <h2>新しい章が届いたら、お知らせします。</h2>\n        <p>登録は無料です。メールはときどき一通だけ、雑音はありません。</p>\n'
            f'        {form}\n      </div>\n    </section>')

def main():
    chrome = rd(CHROME)
    built = []
    for i, (name, path, en, bk, line) in enumerate(CH):
        md = rd(f'tools/chapters/ja/{name}.ja.md')
        body, ch_title = md_to_html(md)
        book_ja, series, cover, book_line = BOOKS[bk]
        ch_title = LINES.get('titles', {}).get(name) or ch_title
        CH[i] = (name, path, en, bk, line or LINES.get('lines', {}).get(name) or book_line)
        built.append((name, path, en, bk, ch_title))
    for i, (name, path, en, bk, ch_title) in enumerate(built):
        book_ja, series, cover, book_line = BOOKS[bk]
        md = rd(f'tools/chapters/ja/{name}.ja.md'); body, _ = md_to_html(md)
        url, en_url = f'{SITE}/{path}/', f'{SITE}/{en}/'
        nxt = built[i + 1] if i + 1 < len(built) else None
        nav = '        <nav class="jr-nav" aria-label="章の移動">\n          <a href="/ja/read/">← 五つの章の一覧へ</a>\n'
        if nxt: nav += f'          <a href="/{nxt[1]}/">次へ：『{BOOKS[nxt[3]][0]}』「{esc(nxt[4])}」 →</a>\n'
        nav += '        </nav>'
        main_html = (
            '    <section class="page-hero article-hero">\n      <div class="wrap wrap--narrow">\n'
            f'        <img class="chapter-cover" src="{cover}" alt="『{book_ja}』の表紙" loading="eager" />\n'
            f'        <p class="eyebrow">『{book_ja}』 · 無料で読む</p>\n'
            f'        <h1>{esc(ch_title)}</h1>\n'
            '        <p class="article-meta">トニー・スクレルーナス 作　／　日本語訳</p>\n'
            f'        <p class="aw-also" style="margin-top:.6rem;font-size:.92rem"><a href="/{en}/" hreflang="en" lang="en">Read it in English →</a></p>\n'
            '      </div>\n    </section>\n\n'
            '    <section class="section section--tight">\n      <div class="wrap wrap--narrow">\n'
            f'        <div class="excerpt chapter">\n          {body}\n        </div>\n'
            f'{nav}\n'
            f'        <div class="jr-get"><p>物語の続きは、本で。『{book_ja}』は英語で刊行されています。</p>\n'
            f'          <p><a class="btn btn--primary" href="{series}">本について（英語） <span aria-hidden="true">&#8594;</span></a></p></div>\n'
            '      </div>\n    </section>\n\n' + capture(chrome))
        desc = f'『{book_ja}』（トニー・スクレルーナス）の「{ch_title}」を、日本語で無料で読む。{book_line}'
        wr(f'{path}/index.html', page(chrome, title=f'「{ch_title}」 — 『{book_ja}』を日本語で読む', desc=desc, url=url, en_url=en_url, image=cover, main=main_html))
        # the English chapter page: an hreflang to this edition
        E = rd(f'{en}/index.html')
        if f'hreflang="ja" href="{url}"' not in E:
            E = re.sub(r'(<link rel="canonical" href="[^"]*"\s*/?>)', lambda m: m.group(1) + f'\n  <link rel="alternate" hreflang="ja" href="{url}" />', E, count=1)
            wr(f'{en}/index.html', E)

    # the reading list, with the film
    items = ''
    for (name, path, en, bk, line), (_, _, _, _, ch_title) in zip(CH, built):
        book_ja, series, cover, _ = BOOKS[bk]
        items += (f'          <li><a class="jr-item" href="/{path}/"><img src="{cover}" alt="『{book_ja}』の表紙" loading="lazy" />'
                  f'<span><p class="k">『{book_ja}』</p><h3>「{esc(ch_title)}」</h3><p>{esc(line)}</p><span class="go">読む →</span></span></a></li>\n')
    main_html = (
        '    <section class="page-hero article-hero">\n      <div class="wrap wrap--narrow">\n'
        '        <p class="eyebrow">アンセストラル・ウォッチ · 無料で読む</p>\n'
        '        <h1 class="jr-h1"><span>ランプの</span><span>灯りのもとで</span></h1>\n'
        '        <p class="article-meta">高地砂漠の、電気の通っていない円い家。石油ランプの小さな灯りのもとで、ひとりのディネ（ナバホ）の少年が、郵便で届いた日本の本を読んだ。'
        'その少年がのちに書いた三冊の小説から、五つの章を日本語で、無料でお読みいただけます。</p>\n'
        '      </div>\n    </section>\n\n'
        '    <section class="section section--tight">\n      <div class="wrap">\n'
        f'        <figure class="jr-film"><video controls playsinline preload="none" poster="{POSTER}" src="{FILM}"></video>'
        '<figcaption>映画『ランプの灯りのもとで』　4分19秒</figcaption></figure>\n'
        '      </div>\n    </section>\n\n'
        '    <section class="section">\n      <div class="wrap">\n'
        '        <h2 style="text-align:center;margin-bottom:1.6rem">五つの章を、無料で。</h2>\n'
        f'        <ul class="jr-list">\n{items}        </ul>\n'
        '        <p class="jr-note">日本語訳は、原文の一文一文を大切に訳したものです。本は英語で刊行されています。'
        '<br><a href="/read/" hreflang="en" lang="en">Read the free chapters in English →</a></p>\n'
        '      </div>\n    </section>\n\n' + capture(chrome))
    wr('ja/read/index.html', page(chrome, title='ランプの灯りのもとで — 五つの章を日本語で無料で読む',
       desc='トニー・スクレルーナスの小説『ストーン・ブレス』『ザ・カウンシル・ファイア』『ザ・ファー・メッセンジャーズ』から五つの章を、日本語で無料で。映画『ランプの灯りのもとで』とともに。',
       url=f'{SITE}/ja/read/', en_url=f'{SITE}/read/', image=POSTER, main=main_html))

    sm = rd('sitemap.xml'); add = ''
    for p in ['ja/read'] + [c[1] for c in CH]:
        u = f'{SITE}/{p}/'
        if u not in sm: add += f'  <url><loc>{u}</loc></url>\n'
    if add: wr('sitemap.xml', sm.replace('</urlset>', add + '</urlset>', 1))
    print('built ja/read and', len(CH), 'chapters')

if __name__ == '__main__':
    main()
