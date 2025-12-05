#!/usr/bin/env python3
"""
Fetch recent LinkedIn job ads for Marwen Slimen's profile and export structured data.
The script scrapes the public jobs guest endpoint which does not require authentication.
We keep the request volume intentionally low and insert sleeps to avoid rate limiting.
"""

from __future__ import annotations

import html
import json
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

BASE_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "jobs.json"

SEARCH_QUERIES: Tuple[str, ...] = (
    "digital marketing visa sponsorship",
    "content creator visa sponsorship",
    "social media visa sponsorship",
    "video editor visa sponsorship",
    "videographer visa sponsorship",
    "wordpress content manager visa sponsorship",
    "marketing relocation assistance",
    "content creator relocation package",
    "social media relocation support",
    "video producer relocation assistance",
)

LOCATIONS: Tuple[Tuple[str, str], ...] = (
    ("United Kingdom", "UK"),
    ("Netherlands", "Netherlands"),
    ("Belgium", "Belgium"),
    ("Ireland", "Ireland"),
    ("Italy", "Italy"),
)

POSITIVE_PATTERNS: Tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"visa sponsorship (available|provided|offered|possible)",
        r"work visa[s]? (sponsorship|support)",
        r"sponsorship for (a )?visa",
        r"relocation (support|assistance|package|provided)",
        r"work permit (support|provided|assistance)",
    )
)

NEGATIVE_PATTERNS: Tuple[re.Pattern[str], ...] = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"unable to provide visa sponsorship",
        r"no visa sponsorship",
        r"cannot (provide|sponsor) (a )?visa",
        r"without (the )?need for visa sponsorship",
        r"visa sponsorship is not available",
        r"visa sponsorship (?:is )?not (available|provided|offered)",
        r"(does|do) not (offer|provide) visa sponsorship",
        r"cannot (offer|arrange) visa sponsorship",
        r"not possible to provide visa sponsorship",
        r"will not (pursue|provide) visa sponsorship",
        r"role does not offer visa sponsorship",
        r"must have the legal right to work .* without (the )?need for visa sponsorship",
        r"does not come with relocation assistance",
        r"no relocation (assistance|support)",
        r"relocation assistance is not available",
    )
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; JobAgentBot/1.0; +https://example.com/bot)",
    "Accept-Language": "en-GB,en;q=0.9",
}

TITLE_PATTERNS: Tuple[Tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(
            r"social media (manager|lead|specialist|coordinator|executive|strategist)",
            re.IGNORECASE,
        ),
        "Social Media Manager",
    ),
    (
        re.compile(
            r"(video|videograph|filmmak)(?=.*(editor|producer|content|manager|lead|specialist|creator|production|artist))",
            re.IGNORECASE,
        ),
        "Videographer / Video Editor",
    ),
    (
        re.compile(
            r"wordpress",
            re.IGNORECASE,
        ),
        "WordPress Content Manager",
    ),
    (
        re.compile(
            r"(content|digital content) (creator|specialist|manager|producer|strategist|lead|editor|officer|designer)",
            re.IGNORECASE,
        ),
        "Content Creator / Content Specialist",
    ),
    (
        re.compile(
            r"(digital )?marketing (assistant|executive|specialist|coordinator|associate|manager|lead)",
            re.IGNORECASE,
        ),
        "Marketing Assistant / Digital Marketing Executive",
    ),
    (
        re.compile(
            r"digital marketing",
            re.IGNORECASE,
        ),
        "Marketing Assistant / Digital Marketing Executive",
    ),
    (
        re.compile(
            r"creative (assistant|producer|associate|lead)",
            re.IGNORECASE,
        ),
        "Creative Assistant",
    ),
)


@dataclass
class JobRecord:
    title: str
    company: str
    country: str
    location: str
    visa_status: str
    visa_snippet: Optional[str]
    job_type: str
    reason: str
    link: str
    source: str = "LinkedIn"

    def to_dict(self) -> dict:
        data = asdict(self)
        return {k: v for k, v in data.items() if v is not None}


def fetch_url(url: str, delay: float = 0.0) -> Optional[str]:
    if delay:
        time.sleep(delay)
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=20) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset, errors="ignore")
    except HTTPError as err:
        if err.code == 404:
            return None
        print(f"[warn] HTTP error {err.code} for {url}")
        return None
    except URLError as err:
        print(f"[warn] URL error {err} for {url}")
        return None


def extract_links(html_text: str) -> List[str]:
    matches = re.findall(r'href=\"(https://[^\\\"]+linkedin.com/jobs/view[^\\\"]+)\"', html_text)
    unique: List[str] = []
    seen = set()
    for match in matches:
        link = html.unescape(match)
        if link not in seen:
            seen.add(link)
            unique.append(link)
    return unique


def extract_field(pattern: str, text: str, default: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return default
    value = html.unescape(match.group(1)).strip()
    return re.sub(r"\s+", " ", value)


def derive_company_from_title(title: str, current: str) -> str:
    if current != "Unknown company":
        return current
    patterns = [
        r"^(.*?) hiring ",
        r"^(.*?) is hiring ",
        r"^(.*?) sta assumendo ",
        r"^(.*?) zoekt",
        r"^(.*?) recruiting ",
    ]
    for pattern in patterns:
        match = re.match(pattern, title, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip(" -–")
            if candidate:
                return candidate
    # Fallback: use first two words
    tokens = title.split()
    if tokens:
        return tokens[0]
    return current


def detect_visa_status(
    full_text: str, lower_text: str
) -> Tuple[str, Optional[str]]:
    for neg in NEGATIVE_PATTERNS:
        if neg.search(lower_text):
            snippet = snippet_for_pattern(full_text, lower_text, neg)
            return ("Not available", snippet)

    for pos in POSITIVE_PATTERNS:
        match = pos.search(lower_text)
        if match:
            snippet = snippet_for_pattern(full_text, lower_text, pos)
            snippet_lower = snippet.lower() if snippet else ""
            if re.search(r"\b(no|not|without|unable|cannot|unavailable)\b", snippet_lower):
                continue
            return ("Mentioned", snippet)

    return ("Not mentioned", None)


def snippet_for_pattern(
    full_text: str, lower_text: str, pattern: re.Pattern[str]
) -> Optional[str]:
    match = pattern.search(lower_text)
    if not match:
        return None
    start = max(0, match.start() - 120)
    end = min(len(lower_text), match.end() + 120)
    chunk_full = full_text[start:end]
    chunk = normalise_whitespace(chunk_full)
    return chunk or None


def classify_job_type(title: str) -> Optional[str]:
    for pattern, job_type in TITLE_PATTERNS:
        if pattern.search(title):
            return job_type
    return None


def build_reason(title: str, job_type: str) -> str:
    lowered = title.lower()
    reasons: List[str] = []
    if "social" in lowered:
        reasons.append("leverages your social media management experience")
    if "video" in lowered or "film" in lowered:
        reasons.append("requires hands-on video production and editing skills")
    if "content" in lowered or "copy" in lowered:
        reasons.append("focuses on content creation aligned with your portfolio")
    if "wordpress" in lowered:
        reasons.append("needs WordPress publishing know-how you already have")
    if "seo" in lowered or "search" in lowered:
        reasons.append("mentions SEO fundamentals that match your skill set")
    if not reasons:
        if job_type == "Creative Assistant":
            reasons.append("draws on your multi-disciplinary creative background")
        elif job_type == "Videographer / Video Editor":
            reasons.append("relies on your videography and editing portfolio")
        elif job_type == "WordPress Content Manager":
            reasons.append("benefits from your WordPress build-and-publish experience")
        else:
            reasons.append("matches your broad digital marketing toolkit")
    if len(reasons) > 1:
        return "; ".join(reasons[:-1]) + "; and " + reasons[-1]
    return reasons[0]


def normalise_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def scrape_jobs() -> List[JobRecord]:
    collected: List[JobRecord] = []
    seen_links: set[str] = set()

    for location, country in LOCATIONS:
        for query in SEARCH_QUERIES:
            query_url = (
                "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/"
                f"search?keywords={quote(query)}&location={quote(location)}&f_TPR=r2592000"
            )
            search_html = fetch_url(query_url, delay=1.0)
            if not search_html:
                continue
            links = extract_links(search_html)
            for link in links:
                canonical_link = link.split("?", 1)[0]
                if canonical_link in seen_links:
                    continue
                seen_links.add(canonical_link)
                job_html = fetch_url(link, delay=1.2)
                if not job_html:
                    continue
                plain_text = html.unescape(re.sub(r"<[^>]+>", " ", job_html))
                lower = plain_text.lower()
                title = extract_field(r"<title>(.*?)\| LinkedIn", job_html, "Unknown role")
                job_type = classify_job_type(title)
                if not job_type:
                    continue
                company = extract_field(r'data-company-name=\"([^\"]+)\"', job_html, "Unknown company")
                if company == "Unknown company":
                    company = extract_field(r'"hiringCompany":\{"name":"([^"]+)"', job_html, "Unknown company")
                company = derive_company_from_title(title, company)
                location_text = extract_field(
                    r'class=\"topcard__flavor topcard__flavor--bullet\">([^<]+)</span>', job_html, location
                )
                location_text = normalise_whitespace(location_text)
                visa_status, snippet = detect_visa_status(plain_text, lower)
                if visa_status == "Not available":
                    continue
                reason = build_reason(title, job_type)
                record = JobRecord(
                    title=normalise_whitespace(title),
                    company=company,
                    country=country,
                    location=location_text,
                    visa_status=visa_status,
                    visa_snippet=snippet,
                    job_type=job_type,
                    reason=reason,
                    link=canonical_link,
                )
                collected.append(record)

    return collected


def main() -> None:
    jobs = scrape_jobs()
    jobs.sort(key=lambda job: (job.country, job.job_type, job.company, job.title))
    BASE_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with BASE_OUTPUT.open("w", encoding="utf-8") as fh:
        json.dump([job.to_dict() for job in jobs], fh, indent=2, ensure_ascii=False)
    print(f"Wrote {len(jobs)} jobs to {BASE_OUTPUT}")


if __name__ == "__main__":
    main()
