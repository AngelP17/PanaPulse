"""Scheduled power-maintenance adapters: ENSA and Naturgy (Edemet).

Deterministic HTML parsing only, no AI. Tables are located by their HEADER TEXT, not CSS
classes, so cosmetic site changes don't break them; a structural change raises
SourceFormatChanged instead of silently returning nothing.

Sources (public pages, checked 2026-10-12):
- ENSA:    https://ensa.com.pa/mantenimientos-programados/   columns # | FECHA | ÁREA | HORA | TAREA | AFECTADOS
           ÁREA is "DISTRITO,CORREGIMIENTO,LUGAR".
- Naturgy: https://www.naturgy.com.pa/cronogramas-mantenimiento/  weekly sections ("Semana ..."), one table per
           province with Corregimiento | Día | Hora | Zonas. The page states no year; it is inferred and
           sanity-checked against the fetch date.
- Coverage: https://www.naturgy.com.pa/hogar/distribucion-de-electricidad/zonas-de-concesion/
"""
from __future__ import annotations

import gzip
import hashlib
import json
import logging
import re
import unicodedata
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session, sessionmaker

from .models import SourceHealth, SourceSnapshot, UtilityNotice, utcnow

logger = logging.getLogger(__name__)
PANAMA = timezone(timedelta(hours=-5))
ENSA_URL = "https://ensa.com.pa/mantenimientos-programados/"
NATURGY_URL = "https://www.naturgy.com.pa/cronogramas-mantenimiento/"
ALLOWED_HOSTS = {"ensa.com.pa", "www.ensa.com.pa", "www.naturgy.com.pa", "naturgy.com.pa"}

# Official EDEMET concession list for the Panamá district (Naturgy, zonas de concesión).
EDEMET_PANAMA_DISTRICT = {
    "san felipe", "el chorrillo", "santa ana", "calidonia", "curundu", "betania",
    "bella vista", "pueblo nuevo", "san francisco", "parque lefevre", "ancon",
}
BORDER_AREAS = {"parque lefevre"}  # on the EDEMET list AND in ENSA maintenance notices

MONTHS = {"enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
          "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12}


class SourceFormatChanged(ValueError):
    """The page no longer has the structure the parser expects. Alert, don't guess."""


def key(text: str) -> str:
    t = unicodedata.normalize("NFD", text or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", t).strip().lower()


def corregimiento_key(text: str) -> str:
    """Only normalize a known published alternate name, never fuzzy-match districts."""
    value = key(text)
    return "calidonia" if value == "la exposicion o calidonia" else value


def provider_for(corregimiento: str) -> dict:
    k = corregimiento_key(corregimiento)
    if k in BORDER_AREAS:
        return {"provider": "border", "name": "Naturgy (Edemet) or ENSA", "basis": "border area"}
    if k in EDEMET_PANAMA_DISTRICT:
        return {"provider": "naturgy", "name": "Naturgy (Edemet)", "basis": "official Edemet concession list"}
    return {"provider": "ensa", "name": "ENSA", "basis": "inferred: not on the official Edemet concession list"}


@dataclass
class Notice:
    provider: str
    district: str | None
    corregimiento: str
    place: str
    starts_at: datetime
    ends_at: datetime
    task: str | None
    affected: int | None
    source_url: str

    @property
    def uid(self) -> str:
        raw = f"{self.provider}|{key(self.corregimiento)}|{key(self.place)}|{self.starts_at.isoformat()}|{self.ends_at.isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _clock(text: str) -> tuple[int, int]:
    """'09:00 AM', '9:30 a. m.', '3:30 p.m.' -> (hour, minute) 24h."""
    text = re.sub(r"^\s*de\s+", "", text, flags=re.I)
    # Naturgy publishes noon as "12:00 m." (meridiano), distinct from midnight.
    if re.fullmatch(r"\s*12:00\s*m\.?\s*", text, re.I):
        return 12, 0
    m = re.fullmatch(r"\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?\s*", text, re.I)
    if not m:
        raise SourceFormatChanged(f"Unrecognized time: {text!r}")
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).lower()
    if not 1 <= h <= 12 or not 0 <= mi <= 59:
        raise SourceFormatChanged(f"Invalid clock time: {text!r}")
    return (h % 12) + (12 if ap == "p" else 0), mi


def _range(text: str) -> tuple[tuple[int, int], tuple[int, int]]:
    # Separator is a dash or the word "a"/"to" followed by the second time ("9:30 a. m. a 3:30 p.m.").
    parts = re.split(r"\s*(?:–|—|-)\s*|\s+(?:a|to)\s+(?=\d)", text, maxsplit=1)
    if len(parts) != 2:
        raise SourceFormatChanged(f"Unrecognized time range: {text!r}")
    return _clock(parts[0]), _clock(parts[1])


def _find_table(soup: BeautifulSoup, required: set[str]):
    for table in soup.find_all("table"):
        first = table.find("tr")
        if not first:
            continue
        headers = [key(c.get_text(" ")) for c in first.find_all(["th", "td"])]
        if required.issubset(set(headers)):
            return table, headers
    return None, None


def parse_ensa(html: str, source_url: str = ENSA_URL) -> list[Notice]:
    soup = BeautifulSoup(html, "html.parser")
    table, headers = _find_table(soup, {"fecha", "area", "hora"})
    if table is None:
        # An explicit "no scheduled maintenance" page is a valid empty state, not a failure.
        text = key(soup.get_text(" "))
        if (re.search(r"no (hay|existen) (mantenimientos|interrupciones)", text)
                or "no tenemos planificado realizar ninguna interrupcion" in text):
            return []
        raise SourceFormatChanged("ENSA maintenance table not found")
    idx = {h: i for i, h in enumerate(headers)}
    out: list[Notice] = []
    for tr in table.find_all("tr")[1:]:
        cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
        if not any(cells):
            continue
        if len(cells) < len(headers):
            raise SourceFormatChanged("Incomplete ENSA maintenance row")
        m = re.match(r"(\d{1,2}) de (\w+) de (\d{4})", key(cells[idx["fecha"]]))
        if not m or m.group(2) not in MONTHS:
            raise SourceFormatChanged(f"Unrecognized ENSA date: {cells[idx['fecha']]!r}")
        day = datetime(int(m.group(3)), MONTHS[m.group(2)], int(m.group(1)), tzinfo=PANAMA)
        (h1, m1), (h2, m2) = _range(cells[idx["hora"]])
        area = [p.strip() for p in cells[idx["area"]].split(",", 2)]
        district, corr, place = (area + ["", "", ""])[:3] if len(area) >= 2 else (None, area[0], area[0])
        affected = None
        if "afectados" in idx:
            digits = re.sub(r"\D", "", cells[idx["afectados"]])
            affected = int(digits) if digits else None
        out.append(Notice(
            provider="ENSA", district=(district or "").title() or None, corregimiento=corr.title(),
            place=(place or corr).title(), starts_at=day.replace(hour=h1, minute=m1),
            ends_at=day.replace(hour=h2, minute=m2) + (timedelta(days=1) if (h2, m2) < (h1, m1) else timedelta(0)),
            task=cells[idx["tarea"]].rstrip(".").capitalize() if "tarea" in idx else None,
            affected=affected, source_url=source_url,
        ))
    return out


def parse_naturgy(html: str, fetched_at: datetime, source_url: str = NATURGY_URL, *, upcoming_only: bool = False) -> list[Notice]:
    """Province comes from the nearest preceding heading; the year is inferred from fetched_at."""
    soup = BeautifulSoup(html, "html.parser")
    tables = [t for t in soup.find_all("table")
              if {"corregimiento", "dia"}.issubset({key(c.get_text(" ")) for c in (t.find("tr") or soup.new_tag("tr")).find_all(["th", "td"])})]
    if not tables:
        raise SourceFormatChanged("Naturgy schedule tables not found")
    out: list[Notice] = []
    for table in tables:
        heading = table.find_previous(["h2", "h3", "h4", "h5", "strong"])
        province = heading.get_text(" ", strip=True) if heading else None
        # Live Naturgy pages label the province on the enclosing accordion, not a heading.
        section = table.find_parent(class_="elementor-accordion-item")
        title = section.find(class_="elementor-accordion-title") if section else None
        if title:
            province = title.get_text(" ", strip=True)
        rows = table.find_all("tr")
        headers = [key(c.get_text(" ")) for c in rows[0].find_all(["th", "td"])]
        idx = {h: i for i, h in enumerate(headers)}
        hora_col = idx.get("hora", idx.get("hora inicio", idx.get("horario")))
        if hora_col is None:
            raise SourceFormatChanged("Naturgy table has no Hora column")
        for tr in rows[1:]:
            cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
            if not any(cells):
                continue
            if len(cells) < len(headers):
                raise SourceFormatChanged("Incomplete Naturgy maintenance row")
            date_text = key(cells[idx["dia"]])
            m = re.fullmatch(r"(?:(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+)?"
                             r"(\d{1,2})(?:\s+y\s+(\d{1,2}))? de (\w+)\.?", date_text)
            month_names = {**MONTHS, **{name[:3]: number for name, number in MONTHS.items()}}
            if not m or m.group(3) not in month_names:
                raise SourceFormatChanged("Unrecognized Naturgy date")
            month = month_names[m.group(3)]
            for day_number in (m.group(1), m.group(2)):
                if day_number is None:
                    continue
                year = fetched_at.astimezone(PANAMA).year
                day = datetime(year, month, int(day_number), tzinfo=PANAMA)
                if day - fetched_at > timedelta(days=200):  # a December page read in January
                    day = day.replace(year=year - 1)
                elif fetched_at - day > timedelta(days=200):  # January schedule published in December
                    day = day.replace(year=year + 1)
                # Ignore archived rows before interpreting their old clock formats.
                if upcoming_only and not -2 <= (day.date() - fetched_at.astimezone(PANAMA).date()).days <= 45:
                    continue
                (h1, m1), (h2, m2) = _range(cells[hora_col])
                zonas = cells[idx["zonas"]] if "zonas" in idx else ""
                out.append(Notice(
                    provider="Naturgy", district=province, corregimiento=cells[idx["corregimiento"]].strip().title(),
                    place=zonas.rstrip("."), starts_at=day.replace(hour=h1, minute=m1),
                    ends_at=day.replace(hour=h2, minute=m2) + (timedelta(days=1) if (h2, m2) < (h1, m1) else timedelta(0)), task=None, affected=None, source_url=source_url,
                ))
    return out


class UtilityIngestor:
    """Fetch, snapshot (content-deduped), parse, upsert. A failed fetch never deletes known notices."""

    def __init__(self, sessions: sessionmaker[Session], transport: httpx.BaseTransport | None = None):
        self.sessions = sessions
        self.http = httpx.Client(timeout=20, follow_redirects=False, transport=transport,
                                 headers={"User-Agent": "PanaPulse/0.3 (civic info app; contact via repo)"})

    def _get(self, url: str) -> str:
        if urlsplit(url).hostname not in ALLOWED_HOSTS:
            raise ValueError("Refusing non-allowlisted host")
        r = self.http.get(url)
        r.raise_for_status()
        return r.text

    def close(self) -> None:
        self.http.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()

    def run(self, source: str, now: datetime | None = None) -> dict:
        now = now or datetime.now(timezone.utc)
        if source not in ("ensa", "naturgy"):
            raise ValueError(f"Unsupported power-maintenance source: {source}")
        url = ENSA_URL if source == "ensa" else NATURGY_URL
        with self.sessions.begin() as s:
            health = s.get(SourceHealth, source) or SourceHealth(source=source)
            s.add(health)
            health.last_attempt_at = utcnow()
        try:
            html = self._get(url)
            notices = parse_ensa(html) if source == "ensa" else parse_naturgy(html, now, upcoming_only=True)
        except Exception as e:
            with self.sessions.begin() as s:
                s.get(SourceHealth, source).last_error = f"{type(e).__name__}: {e}"[:500]
            logger.warning("%s ingest failed: %s", source, e)
            raise
        created = 0
        captured = utcnow()
        with self.sessions.begin() as s:
            digest = hashlib.sha256(html.encode()).hexdigest()
            last = s.query(SourceSnapshot).filter(SourceSnapshot.url == url).order_by(SourceSnapshot.id.desc()).first()
            if last is None or last.sha256 != digest:
                s.add(SourceSnapshot(url=url, sha256=digest, compressed_json=gzip.compress(json.dumps({"html": html}).encode())))
            for n in notices:
                row = s.get(UtilityNotice, n.uid)
                if row is None:
                    fields = asdict(n)
                    # SQLite drops tzinfo; store all maintenance windows in UTC.
                    fields["starts_at"] = n.starts_at.astimezone(timezone.utc)
                    fields["ends_at"] = n.ends_at.astimezone(timezone.utc)
                    row = UtilityNotice(id=n.uid, **fields)
                    s.add(row)
                    created += 1
                else:
                    row.starts_at = n.starts_at.astimezone(timezone.utc)
                    row.ends_at = n.ends_at.astimezone(timezone.utc)
                row.district = n.district
                row.corregimiento = n.corregimiento
                row.place = n.place
                row.task = n.task
                row.affected = n.affected
                row.last_seen_at = captured
            h = s.get(SourceHealth, source)
            h.last_success_at = captured
            h.last_error = None
            h.last_event_count = len(notices)
        return {"source": source, "parsed": len(notices), "new": created}
