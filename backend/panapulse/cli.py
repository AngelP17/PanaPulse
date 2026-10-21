"""Use from cron/scheduler: python -m panapulse.cli ingest."""
import argparse
import json
import logging
import gzip
import sys

from sqlalchemy import select

from .client import USGSClient
from .config import Settings
from .ingest import USGSIngestor, mark_source_failure
from .models import Base, SourceSnapshot, make_session_factory
from .reports import purge, hide
from .budgets import AskBudgetBucket  # register the durable budget table for init-db


def main() -> None:
    parser = argparse.ArgumentParser(description="PanaPulse USGS v0")
    parser.add_argument("command", choices=["init-db", "ingest", "replay", "utilities", "purge-reports", "hide-report"])
    parser.add_argument("--report-id")
    parser.add_argument("--source", choices=["ensa", "naturgy"], help="Utility source for the utilities command")
    parser.add_argument("--snapshot-id", type=int, help="Snapshot ID for replay (required with replay)")
    parser.add_argument("--no-details", action="store_true", help="Disable OAF product lookups")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)

    settings = Settings.from_env()
    engine, sessions = make_session_factory(settings.database_url)
    if args.command == "init-db":
        Base.metadata.create_all(engine)
        print("Created or verified prototype schema")
        return
    Base.metadata.create_all(engine)
    if args.command == "purge-reports":
        purge(sessions)
        return
    if args.command == "hide-report":
        if not args.report_id:
            parser.error("hide-report requires --report-id")
        hide(sessions, args.report_id)
        return
    if args.command == "utilities":
        from .utilities import UtilityIngestor
        sources = [args.source] if args.source else ["ensa", "naturgy"]
        failed = False
        for src in sources:
            try:
                with UtilityIngestor(sessions) as collector:
                    print(json.dumps(collector.run(src)))
            except Exception:
                logging.exception("%s failed; existing notices retained", src)
                failed = True
        sys.exit(1 if failed else 0)
    if args.command == "replay":
        if args.snapshot_id is None:
            parser.error("replay requires --snapshot-id")
        with sessions() as session:
            snapshot = session.get(SourceSnapshot, args.snapshot_id)
            if snapshot is None:
                parser.error("snapshot ID not found")
            payload = json.loads(gzip.decompress(snapshot.compressed_json))
            source_url = snapshot.url
        if payload.get("type") != "FeatureCollection":
            parser.error("Only FeatureCollection snapshots are supported for replay")
        with USGSClient(settings) as client:
            result = USGSIngestor(sessions, settings, client).ingest(
                feed=payload, source_url=source_url, retrieve_details=False, mark_source_healthy=False)
    else:
        try:
            with USGSClient(settings) as client:
                result = USGSIngestor(sessions, settings, client).ingest(retrieve_details=not args.no_details)
        except Exception as exc:
            mark_source_failure(sessions, exc)
            logging.exception("USGS ingest failed; existing records retained")
            sys.exit(1)
    print(json.dumps(result.as_dict(), indent=2))
    if result.invalid or result.detail_errors:
        logging.warning("Some records or detail lookups failed; inspect diagnostics")


if __name__ == "__main__":
    main()
