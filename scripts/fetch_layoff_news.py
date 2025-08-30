import argparse
import json
import os
try:
    import regex as re  # third-party regex if available
except Exception:  # pragma: no cover
    import re  # fallback to stdlib
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import feedparser  # type: ignore
import requests  # type: ignore
from rapidfuzz import fuzz  # type: ignore


JST = timezone(timedelta(hours=9))


# Detection keywords (JP + EN). Keep specific to reduce false positives.
KEYWORDS = [
    # Japanese
    "リストラ",
    "レイオフ",
    "人員削減",
    "人員整理",
    "人員減",
    "希望退職",
    "希望退職者",
    "早期希望退職",
    "早期退職",
    "早期優遇退職",
    # English
    "layoff",
    "layoffs",
    "job cut",
    "job cuts",
    "job reduction",
    "reduce workforce",
    "restructuring",
    "restructure",
    "redundancies",
]

EVENT_MAP = {
    # JP
    "希望退職": "voluntary_retirement",
    "早期退職": "voluntary_retirement",
    "早期優遇退職": "voluntary_retirement",
    "人員削減": "layoff",
    "人員整理": "layoff",
    "リストラ": "layoff",
    "レイオフ": "layoff",
    # EN
    "layoff": "layoff",
    "layoffs": "layoff",
    "job cut": "layoff",
    "job cuts": "layoff",
    "redundancies": "layoff",
    "restructure": "restructure",
    "restructuring": "restructure",
}


def load_feeds(path: str) -> list[str]:
    feeds: list[str] = []
    if not os.path.exists(path):
        return feeds
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            feeds.append(line)
    return feeds


def to_slug(text: str) -> str:
    text = re.sub(r"\s+", "-", text.strip())
    text = re.sub(r"[^0-9A-Za-z\-\u3040-\u30ff\u4e00-\u9faf]", "", text)
    return text[:60] or "item"


def extract_date(entry) -> datetime:
    for key in ("published_parsed", "updated_parsed"):
        if getattr(entry, key, None):
            try:
                # feedparser provides time.struct_time
                t = getattr(entry, key)
                dt = datetime(*t[:6], tzinfo=timezone.utc).astimezone(JST)
                return dt
            except Exception:
                pass
    return datetime.now(JST)


def extract_company(title: str, link: str) -> str:
    # Heuristics: company name often appears before 記号 / brackets or ends with 株式会社
    m = re.search(r"([\u4e00-\u9fafA-Za-z0-9・ー]+)(?:株式会社|（株）|\(|（|\s)", title)
    if m:
        cand = m.group(1)
        if 2 <= len(cand) <= 30:
            return cand
    # fallback to domain
    domain = urlparse(link).netloc
    return domain.replace("www.", "")


def detect_event_type(text: str) -> str:
    t = text.lower()
    # Priority: voluntary retirement > layoff > restructure
    for kw in ["希望退職", "早期退職", "早期優遇退職"]:
        if kw in text:
            return "voluntary_retirement"
    for kw in ["リストラ", "レイオフ", "人員削減", "人員整理", "layoff", "layoffs", "job cut", "job cuts", "redundancies"]:
        if kw in text or kw in t:
            return "layoff"
    for kw in ["restructure", "restructuring"]:
        if kw in t:
            return "restructure"
    # fallback
    return "restructure"


def detect_headcount(text: str) -> tuple[int, float]:
    # Normalize fullwidth numbers
    fw_digits = str.maketrans("０１２３４５６７８９，,", "0123456789,,")
    norm = text.translate(fw_digits)
    m = re.search(r"(\d{2,6})\s*人", norm)
    if m:
        try:
            return int(m.group(1)), 0.9
        except Exception:
            pass
    return 0, 0.5


def build_item(entry, region_default: str = "JP") -> dict:
    title = getattr(entry, "title", "").strip()
    link = getattr(entry, "link", "").strip()
    summary = getattr(entry, "summary", "").strip() or getattr(entry, "description", "").strip()

    text = title + "\n" + summary
    # Filter by keywords (case-insensitive for English)
    low = text.lower()
    if not any((kw in text) or (kw.lower() in low) for kw in KEYWORDS):
        return {}

    dt = extract_date(entry)
    date_str = dt.strftime("%Y-%m-%d")
    company = extract_company(title, link)
    etype = detect_event_type(text)
    headcount, conf = detect_headcount(title + summary)
    domain = urlparse(link).netloc

    tags = [kw for kw in KEYWORDS if kw in title + summary]

    item = {
        "id": f"{date_str}-{to_slug(company)}-{headcount or 'n'}",
        "date": date_str,
        "company": company,
        "event_type": etype,
        "headcount_affected": headcount,
        "headcount_confidence": conf,
        "summary": (title if not summary else summary)[:120],
        "source_urls": [link] if link else [],
        "region": region_default,
        "sector": "Unknown",
        "listed_flag": any(x in link.lower() for x in ["/ir/", "/investor", "tdnet", "irbank"]),
        "tags": tags,
        "_meta": {"source_domain": domain},
    }
    return item


def is_near_date(d1: str, d2: str, days: int = 3) -> bool:
    try:
        a = datetime.strptime(d1, "%Y-%m-%d")
        b = datetime.strptime(d2, "%Y-%m-%d")
        return abs((a - b).days) <= days
    except Exception:
        return False


def dedupe(items: list[dict]) -> list[dict]:
    out: list[dict] = []
    for it in items:
        if not it:
            continue
        dup = False
        for ex in out:
            if not is_near_date(it["date"], ex["date"], 3):
                continue
            s1 = f"{it.get('company','')}-{it.get('event_type','')}-{it.get('date','')}-{it.get('summary','')}"
            s2 = f"{ex.get('company','')}-{ex.get('event_type','')}-{ex.get('date','')}-{ex.get('summary','')}"
            if fuzz.token_set_ratio(s1, s2) >= 90:
                dup = True
                break
        if not dup:
            out.append(it)
    return out


def load_existing(path: str) -> list[dict]:
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            return []
    return []


def save_json(path: str, data: list[dict]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def log_event(log_path: str, level: str, message: str, **kwargs) -> None:
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    rec = {
        "ts": datetime.now(JST).isoformat(),
        "level": level,
        "message": message,
    }
    if kwargs:
        rec.update(kwargs)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def send_slack(webhook: str, text: str) -> None:
    try:
        requests.post(webhook, json={"text": text}, timeout=10)
    except Exception:
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch layoff/retirement news to JSON")
    parser.add_argument("--feeds", default="scripts/layoff_feeds.txt", help="Path to feeds list")
    parser.add_argument("--output", default="data/layoff_news.json", help="Output JSON path")
    parser.add_argument("--max-items", type=int, default=100, help="Max items to keep")
    parser.add_argument("--log-dir", default="logs", help="Directory for jsonl logs")
    parser.add_argument("--region", default="JP", help="Default region code")
    args = parser.parse_args()

    feeds = load_feeds(args.feeds)
    today = datetime.now(JST).strftime("%Y%m%d")
    log_path = os.path.join(args.log_dir, f"fetch_{today}.jsonl")
    log_event(log_path, "info", "job_start", feeds=len(feeds))

    all_items: list[dict] = []

    if not feeds:
        log_event(log_path, "warn", "no_feeds_configured")

    for url in feeds:
        try:
            log_event(log_path, "info", "fetch_feed", url=url)
            fp = feedparser.parse(url)
            if getattr(fp, "bozo", 0):
                log_event(log_path, "warn", "feed_parse_issue", url=url, error=str(getattr(fp, "bozo_exception", "")))
            for entry in getattr(fp, "entries", [])[:50]:
                item = build_item(entry, region_default=args.region)
                if item:
                    all_items.append(item)
                else:
                    # filtered out
                    pass
        except Exception as e:
            log_event(log_path, "error", "feed_error", url=url, error=str(e))

    # Merge with existing and dedupe
    existing = load_existing(args.output)
    merged = existing + all_items
    merged = dedupe(merged)
    merged.sort(key=lambda x: x.get("date", ""), reverse=True)
    if len(merged) > args.max_items:
        merged = merged[: args.max_items]

    save_json(args.output, merged)
    log_event(log_path, "info", "written", path=args.output, count=len(merged))

    # Slack notifications for high-impact events
    webhook = os.getenv("SLACK_WEBHOOK_URL", "")
    highs = [x for x in all_items if x.get("headcount_affected", 0) >= 1000]
    for it in highs:
        text = (
            f"[High] {it.get('date')} {it.get('company')} {it.get('event_type')} "
            f"影響人数={it.get('headcount_affected')}\n{(it.get('source_urls') or [''])[0]}"
        )
        if webhook:
            send_slack(webhook, text)
        log_event(log_path, "info", "alert_high", company=it.get("company"), headcount=it.get("headcount_affected"))

    log_event(log_path, "info", "job_end")
    return 0


if __name__ == "__main__":
    sys.exit(main())
