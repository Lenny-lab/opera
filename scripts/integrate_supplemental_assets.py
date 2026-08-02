from __future__ import annotations

import shutil
import zipfile
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUPPLEMENT = ROOT / "网站素材补充"
SITE_ASSETS = ROOT / "site" / "assets"


AUDIO_MAP = {
    "A1霸王别姬.mp3": "workshop-bawang-bieji.mp3",
    "A2花木兰.mp3": "workshop-hua-mulan.mp3",
    "A3越剧《红楼梦》.mp3": "workshop-hong-lou-meng.mp3",
    "A4沙家浜.mp3": "workshop-sha-jia-bang.mp3",
    "B1祥符调《香囊记》.mp3": "kids-xiangfu-xiang-nang-ji.mp3",
    "B2豫西调《三哭殿》.mp3": "kids-yuxi-san-ku-dian.mp3",
    "B3豫东调《诸葛亮吊孝》.mp3": "kids-yudong-zhuge-liang-diao-xiao.mp3",
    "B4沙河调《黄鹤楼》.mp3": "kids-shahe-huang-he-lou.mp3",
    "C1《霸王别姬》.mp3": "elderly-bawang-bieji.mp3",
    "C2豫剧《花木兰》.mp3": "elderly-hua-mulan.mp3",
    "C3越剧《孟丽君》.mp3": "elderly-meng-li-jun.mp3",
    "C4黄梅戏《天仙配》.mp3": "elderly-tian-xian-pei.mp3",
    "D1《沙家浜》.mp3": "red-sha-jia-bang.mp3",
    "D2豫剧《朝阳沟》.mp3": "red-chao-yang-gou.mp3",
}

CHARACTER_MAP = {
    "生.png": "sheng.png",
    "旦.png": "dan.png",
    "净.png": "jing.png",
    "丑.png": "chou.png",
}

CASE_MAP = {
    "案例一": "yuhua-jinhua",
    "案例二": "yadong-community",
    "案例三": "yongmei-community",
    "案例四": "tanzhuang-village",
}


def copy_named(source_dir: Path, mapping: dict[str, str], target_dir: Path) -> None:
    target_dir.mkdir(parents=True, exist_ok=True)
    for source_name, target_name in mapping.items():
        source = source_dir / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        shutil.copy2(source, target_dir / target_name)


def copy_case_covers() -> None:
    source_dir = SUPPLEMENT / "线下融合专区图片素材"
    target_dir = SITE_ASSETS / "images" / "cases"
    target_dir.mkdir(parents=True, exist_ok=True)
    for prefix, slug in CASE_MAP.items():
        matches = list(source_dir.glob(f"{prefix}*封面图.jpg"))
        if len(matches) != 1:
            raise RuntimeError(f"Expected one cover for {prefix}, found {matches}")
        shutil.copy2(matches[0], target_dir / f"{slug}-cover.jpg")


def extract_case_photos() -> None:
    source_dir = SUPPLEMENT / "线下融合 专区详细页面"
    target_root = SITE_ASSETS / "images" / "cases"
    for prefix, slug in CASE_MAP.items():
        matches = list(source_dir.glob(f"{prefix}*.docx"))
        if len(matches) != 1:
            raise RuntimeError(f"Expected one DOCX for {prefix}, found {matches}")
        target_dir = target_root / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(matches[0]) as archive:
            media = sorted(
                [
                    name
                    for name in archive.namelist()
                    if name.startswith("word/media/image") and not name.endswith("/")
                ],
                key=lambda name: int(re.search(r"image(\d+)", name).group(1)),
            )
            for index, archive_name in enumerate(media, start=1):
                suffix = Path(archive_name).suffix.lower() or ".jpg"
                (target_dir / f"photo-{index:02d}{suffix}").write_bytes(archive.read(archive_name))


def main() -> None:
    copy_named(SUPPLEMENT / "音频", AUDIO_MAP, SITE_ASSETS / "audio")
    character_source = SUPPLEMENT / "项目IP"
    if not character_source.exists():
        character_source = SUPPLEMENT / "儿童专区生旦净丑图片素材"
    copy_named(
        character_source,
        CHARACTER_MAP,
        SITE_ASSETS / "images" / "home-characters",
    )
    copy_case_covers()
    extract_case_photos()
    print(f"Copied {len(AUDIO_MAP)} audio files, {len(CHARACTER_MAP)} characters, and four case sets.")


if __name__ == "__main__":
    main()
