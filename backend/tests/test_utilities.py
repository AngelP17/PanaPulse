"""ENSA / Naturgy scheduled-maintenance adapters. Fixtures mirror the live pages' columns (checked
2026-10-12). Markup details are synthetic: parsing keys off header text, so verify once against live HTML."""
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from panapulse.ask import DataTools
from panapulse.models import Base, UtilityNotice, make_session_factory
from panapulse.utilities import (ENSA_URL, NATURGY_URL, SourceFormatChanged, UtilityIngestor, parse_ensa,
                                 parse_naturgy, provider_for)

PAN = timezone(timedelta(hours=-5))
ENSA_HTML = """<html><body><h1>Mantenimientos programados</h1><table class="x">
<tr><th>#</th><th>FECHA</th><th>ÁREA</th><th>HORA</th><th>TAREA</th><th>AFECTADOS</th></tr>
<tr><td>2</td><td>12 de octubre de 2026</td><td>PANAMA,JUAN DIAZ,CIUDAD RADIAL</td><td>09:00 AM – 01:00 PM</td><td>MANTENIMIENTO A LA RED ELECTRICA.</td><td>2</td></tr>
<tr><td>7</td><td>14 de octubre de 2026</td><td>PANAMA,JUAN DIAZ,NUEVO HIPODROMO</td><td>09:00 AM – 03:00 PM</td><td>PODA PREVENTIVA.</td><td>34</td></tr>
<tr><td>9</td><td>16 de octubre de 2026</td><td>PANAMA,PARQUE LEFEVRE,PARQUE INDUSTRIAL</td><td>10:00 AM – 02:00 PM</td><td>MANTENIMIENTO A LA RED ELÉCTRICA.</td><td>2</td></tr>
</table></body></html>"""
NATURGY_HTML = """<html><body><h2>Semana 5 al 11 de octubre</h2><h3>Panamá</h3><table>
<tr><td>Corregimiento</td><td>Día</td><td>Hora</td><td>Zonas</td></tr>
<tr><td>Parque Lefevre</td><td>5 de octubre</td><td>9:30 a. m. a 3:30 p.m.</td><td>Calle República de La India, Calle 83 Este y áreas aledañas.</td></tr>
</table><h3>Panamá Oeste</h3><table>
<tr><td>Corregimiento</td><td>Día</td><td>Hora Inicio</td><td>Zonas</td></tr>
<tr><td>Lídice</td><td>5 de octubre</td><td>8:45 a. m. a 2:45 p.m.</td><td>Lídice, Caimitillo Calle Principal, sector El Bongo.</td></tr>
</table></body></html>"""
NOW = datetime(2026, 10, 12, 19, 0, tzinfo=PAN)


def test_parse_ensa_rows_times_and_area():
    rows = parse_ensa(ENSA_HTML)
    assert len(rows) == 3
    r = rows[1]
    assert (r.district, r.corregimiento, r.place, r.affected) == ("Panama", "Juan Diaz", "Nuevo Hipodromo", 34)
    assert r.starts_at == datetime(2026, 10, 14, 9, 0, tzinfo=PAN) and r.ends_at == datetime(2026, 10, 14, 15, 0, tzinfo=PAN)


def test_ensa_empty_state_vs_changed_format():
    assert parse_ensa("<p>No hay mantenimientos programados en este momento.</p>") == []
    with pytest.raises(SourceFormatChanged):
        parse_ensa("<p>Página rediseñada</p>")


def test_parse_naturgy_infers_year_and_province():
    rows = parse_naturgy(NATURGY_HTML, NOW)
    assert [r.corregimiento for r in rows] == ["Parque Lefevre", "Lídice"]
    assert rows[0].district == "Panamá" and rows[1].district == "Panamá Oeste"
    assert rows[0].starts_at == datetime(2026, 10, 5, 9, 30, tzinfo=PAN) and rows[1].ends_at.hour == 14
    jan = parse_naturgy(NATURGY_HTML.replace("octubre", "diciembre"), datetime(2027, 1, 3, tzinfo=PAN))
    assert jan[0].starts_at.year == 2026  # a December schedule read in January


def test_provider_map_from_official_concession_list():
    assert provider_for("Pueblo Nuevo")["provider"] == "naturgy"
    assert provider_for("Calidonia")["basis"] == "official Edemet concession list"
    assert provider_for("Parque Lefevre")["provider"] == "border"
    assert provider_for("Juan Díaz")["basis"].startswith("inferred")


@pytest.fixture
def sessions(tmp_path):
    engine, s = make_session_factory(f"sqlite:///{tmp_path / 'u.db'}")
    Base.metadata.create_all(engine)
    yield s
    engine.dispose()


def mock(pages):
    return httpx.MockTransport(lambda req: httpx.Response(200, text=pages[str(req.url)]) if str(req.url) in pages else httpx.Response(404))


def test_ingest_dedupes_and_failed_fetch_keeps_data(sessions):
    ing = UtilityIngestor(sessions, transport=mock({ENSA_URL: ENSA_HTML}))
    assert ing.run("ensa", NOW) == {"source": "ensa", "parsed": 3, "new": 3}
    assert ing.run("ensa", NOW)["new"] == 0
    broken = UtilityIngestor(sessions, transport=mock({}))
    with pytest.raises(httpx.HTTPStatusError):
        broken.run("ensa", NOW)
    with sessions() as s:
        assert s.query(UtilityNotice).count() == 3


def test_chat_tool_reports_provider_and_upcoming_cuts(sessions):
    UtilityIngestor(sessions, transport=mock({ENSA_URL: ENSA_HTML})).run("ensa", NOW)
    tools = DataTools(sessions, now=lambda: NOW)
    jd = tools.run("get_service_status", {"service": "electricity", "corregimiento": "Juan Díaz"})
    assert jd["provider"] == "ENSA" and jd["provider_basis"].startswith("inferred")
    assert [c["place"] for c in jd["scheduled_cuts"]] == ["Nuevo Hipodromo"]  # the 12 Oct cut already ended
    pn = tools.run("get_service_status", {"service": "electricity", "corregimiento": "Pueblo Nuevo"})
    assert pn["provider"] == "Naturgy (Edemet)" and pn["scheduled_cuts"] == []


def test_ensa_actual_empty_state():
    assert parse_ensa("<p>En estos momentos no tenemos planificado realizar ninguna interrupción.</p>") == []


def test_unknown_source_is_refused(sessions):
    with pytest.raises(ValueError, match="Unsupported"):
        UtilityIngestor(sessions).run("bogus", NOW)


def test_power_endpoint_unavailable_is_not_all_clear(sessions):
    from fastapi.testclient import TestClient
    from panapulse.api import create_app
    res = TestClient(create_app(sessions)).get("/v0/power-maintenance", params={"corregimiento": "Pueblo Nuevo"})
    assert res.status_code == 200
    data = res.json()
    assert data["service_state"] == "unknown"
    assert data["notices"] == []
    assert data["scope"] == "scheduled_maintenance_only"
    assert data["sources"][0]["freshness"] == "stale_or_unavailable"


def test_power_endpoint_respects_original_zone_and_source(sessions):
    from fastapi.testclient import TestClient
    from panapulse.api import create_app
    now = datetime.now(timezone.utc).astimezone(PAN) + timedelta(days=1)
    month = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][now.month - 1]
    html = ENSA_HTML.replace("12 de octubre de 2026", f"{now.day} de {month} de {now.year}")
    UtilityIngestor(sessions, transport=mock({ENSA_URL: html})).run("ensa")
    data = TestClient(create_app(sessions)).get("/v0/power-maintenance", params={"corregimiento":"Juan Díaz"}).json()
    assert data["service_state"] == "unknown"
    assert any(x["place"] == "Ciudad Radial" for x in data["notices"])
    assert all(x["verification"] == "official_scheduled" and x["source_url"] == ENSA_URL for x in data["notices"])
