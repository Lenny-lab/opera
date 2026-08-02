from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "site" / "pages"


VIDEOS = {
    "characters/sheng.html": [
        ("《西厢记》", "https://www.bilibili.com/video/BV1prRoYCEf4/"),
        ("《群英会》", "https://tv.cctv.com/2024/10/11/VIDEjXNMHYbOE6PsMJxWi7Nn241011.shtml"),
        ("《连升三级》", "https://www.bilibili.com/video/BV1dk1PYfEUa/"),
        ("《白蛇传》", "https://haokan.baidu.com/v?pd=wisenatural&vid=7202782424267258147"),
    ],
    "characters/dan.html": [
        ("《贵妃醉酒》", "https://haokan.baidu.com/v?pd=wisenatural&vid=3791194179324698301"),
        ("《锁麟囊》", "https://haokan.baidu.com/v?pd=wisenatural&vid=5873301853656723084"),
        ("《宇宙锋》", "https://www.bilibili.com/video/BV16M3KzhECf/"),
        ("《白蛇传》", "https://www.bilibili.com/video/av349228816/"),
    ],
    "characters/jing.html": [
        ("《铡美案》", "https://haokan.baidu.com/v?pd=wisenatural&vid=12833432883254278746"),
        ("《霸王别姬》", "https://haokan.baidu.com/v?pd=wisenatural&vid=12242516189232225748"),
        ("《二进宫》", "https://haokan.baidu.com/v?pd=wisenatural&vid=10320527143261704479"),
        ("《挑滑车》", "https://www.bilibili.com/video/BV1B389zzEYY/"),
    ],
    "genres/jingju.html": [
        ("《四郎探母》", "https://www.bilibili.com/video/BV1GJAJekEZg/"),
        ("《霸王别姬》", "https://haokan.baidu.com/v?pd=wisenatural&vid=10750961531385550860"),
        ("《铡美案》", "https://haokan.baidu.com/v?pd=wisenatural&vid=9896606057069116934"),
        ("《沙家浜》", "https://www.bilibili.com/video/BV1mJq6BHEdc/"),
    ],
    "genres/yuju.html": [
        ("《花木兰》", "https://www.toutiao.com/video/7533070587954987546/?wid=1785576497345"),
        ("《朝阳沟》", "https://haokan.baidu.com/v?pd=wisenatural&vid=8022691484779706138"),
        ("《穆桂英挂帅》", "https://haokan.baidu.com/v?pd=wisenatural&vid=17389972011351361618"),
        ("《程婴救孤》", "https://www.bilibili.com/video/BV11vd7YME8c/"),
    ],
    "genres/yueju.html": [
        ("《梁山伯与祝英台》", "https://www.bilibili.com/video/BV195cUeDEHk/?p=5"),
        ("《红楼梦》", "https://www.bilibili.com/video/BV1qYvWBDE9F/"),
        ("《祥林嫂》", "https://www.bilibili.com/video/BV1fUbwzbE4Z/"),
        ("《五女拜寿》", "https://www.bilibili.com/video/BV1i1KHzXEEK/"),
    ],
    "genres/huangmei.html": [
        ("《天仙配》", "https://www.bilibili.com/video/BV1VFsyzbE88/"),
        ("《女驸马》", "https://www.bilibili.com/video/BV189ZeB4EY6/"),
        ("《牛郎织女》", "https://www.bilibili.com/video/BV1si4y1a7mj/"),
        ("《徽州女人》", "https://www.bilibili.com/video/BV1bzZvBdEnQ/"),
    ],
}


def platform(url: str) -> str:
    host = urlparse(url).netloc
    if "bilibili" in host:
        return "哔哩哔哩"
    if "cctv" in host:
        return "央视网"
    if "haokan" in host:
        return "好看视频"
    if "toutiao" in host:
        return "今日头条"
    return host


def embed_url(url: str) -> str:
    parsed = urlparse(url)
    if "bilibili.com" in parsed.netloc:
        bv = re.search(r"/(BV[0-9A-Za-z]+)", parsed.path)
        av = re.search(r"/av(\d+)", parsed.path)
        page = parse_qs(parsed.query).get("p", ["1"])[0]
        if bv:
            return f"https://player.bilibili.com/player.html?bvid={bv.group(1)}&page={page}&high_quality=1"
        if av:
            return f"https://player.bilibili.com/player.html?aid={av.group(1)}&page={page}&high_quality=1"
    return url


def section(items: list[tuple[str, str]]) -> str:
    cards = []
    for title, source in items:
        cards.append(f"""
      <article class="video-card">
        <div class="video-card-copy"><span class="video-platform">{html.escape(platform(source))} · 需联网</span><h3>{html.escape(title)}</h3><p>点击后在本页加载外部平台播放器；如平台限制嵌入，可使用原始页面入口。</p><div class="video-actions"><button class="btn btn-primary video-load" type="button" data-embed="{html.escape(embed_url(source), quote=True)}">在本页播放</button><a class="btn btn-ghost" href="{html.escape(source, quote=True)}" target="_blank" rel="noopener noreferrer">打开原始页面</a></div></div>
        <div class="video-frame" aria-live="polite"></div>
        <div class="video-fallback">视频由第三方平台提供，需要联网加载；本站不下载或重新托管视频内容。</div>
      </article>""")
    return f"""
<section class="section section-alt video-showcase-section"><div class="container video-showcase">
  <div class="section-head"><div class="section-eyebrow">选段视频</div><h2 class="section-title">走进经典舞台</h2><p class="section-desc">四个代表剧目选段均来自外部公开页面，点击后按需加载。</p></div>
  <div class="video-grid">{''.join(cards)}</div>
</div></section>
"""


def main() -> None:
    for relative, items in VIDEOS.items():
        path = PAGES / relative
        source = path.read_text(encoding="utf-8")
        source = re.sub(
            r"\n?<section class=\"section section-alt video-showcase-section\">.*?</section>\n?",
            "\n",
            source,
            flags=re.S,
        )
        source = source.replace('<footer class="footer">', section(items) + '<footer class="footer">')
        script = '<script src="../../js/video-embeds.js"></script>'
        if script not in source:
            source = source.replace('</body>', script + '\n</body>')
        path.write_text(source, encoding="utf-8", newline="\n")
        print(relative, len(items))


if __name__ == "__main__":
    main()
