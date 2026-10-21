"""Verified source-only SQLite snapshots for the single-instance beta.

Community observations, identity hashes, budgets and audit events are deliberately
excluded. A restore cannot resurrect withdrawn observations. The full consistent
snapshot exists in memory while filtering, so provision RAM above database size.
"""
import argparse
from contextlib import closing
import os
from pathlib import Path
import sqlite3
import tempfile
from datetime import datetime, timedelta, timezone

COMMUNITY_TABLES = {"community_reports", "report_rate_buckets", "report_audit", "report_runtime"}
REQUIRED_TABLES = COMMUNITY_TABLES | {
    "source_health", "earthquakes", "earthquake_revisions", "aftershock_forecasts",
    "utility_notices", "source_snapshots", "ask_budget_buckets",
}


def _open_readonly(path):
    path = Path(path).resolve(strict=True)
    return sqlite3.connect(f"{path.as_uri()}?mode=ro", uri=True, timeout=30)


def verify(connection, *, source_only=False):
    if connection.execute("PRAGMA quick_check").fetchall() != [("ok",)]:
        raise ValueError("SQLite integrity check failed")
    if connection.execute("PRAGMA foreign_key_check").fetchone():
        raise ValueError("SQLite foreign key check failed")
    tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if not REQUIRED_TABLES.issubset(tables):
        raise ValueError("Incomplete PanaPulse schema; run init-db before backup")
    if source_only and any(connection.execute(f'SELECT 1 FROM "{table}" LIMIT 1').fetchone()
                           for table in COMMUNITY_TABLES):
        raise ValueError("Backup contains community data")
    if source_only and connection.execute("SELECT 1 FROM ask_budget_buckets WHERE id != 'recovery' LIMIT 1").fetchone():
        raise ValueError("Backup contains private model budget data")


def snapshot(source, destination, *, recovery=False):
    """Online consistent copy, with community data removed before touching disk."""
    target = Path(destination).resolve()
    if target.exists():
        raise FileExistsError(f"Refusing to overwrite {target}")
    target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with closing(_open_readonly(source)) as original, closing(sqlite3.connect(":memory:")) as clean:
        original.backup(clean, pages=256, sleep=0.05)
        verify(clean)
        for table in COMMUNITY_TABLES:
            clean.execute(f'DELETE FROM "{table}"')
        clean.execute('DELETE FROM ask_budget_buckets')
        if recovery:
            tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            clean.execute("INSERT INTO ask_budget_buckets(id,count,expires_at) VALUES ('recovery',0,?)",
                          (tomorrow.replace(tzinfo=None).isoformat(sep=' '),))
        clean.commit()
        clean.execute("VACUUM")  # remove deleted bytes before writing the snapshot
        verify(clean, source_only=True)
        fd, temp_name = tempfile.mkstemp(prefix=".panapulse-source-", suffix=".tmp", dir=target.parent)
        os.close(fd)  # mkstemp creates owner-only 0600 files
        try:
            with closing(sqlite3.connect(temp_name)) as output:
                clean.backup(output)
                verify(output, source_only=True)
            with open(temp_name, "rb") as handle:
                os.fsync(handle.fileno())
            # Atomic no-clobber publication. Both paths are on the same filesystem.
            os.link(temp_name, target)
            directory_fd = os.open(target.parent, os.O_RDONLY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        finally:
            os.unlink(temp_name)
    return target


def restore(backup, destination):
    """Restore only to a new path; never replace a database an API may be using."""
    with closing(_open_readonly(backup)) as source:
        verify(source, source_only=True)
    return snapshot(backup, destination, recovery=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("backup", "restore", "verify"))
    parser.add_argument("--source", required=True)
    parser.add_argument("--destination")
    args = parser.parse_args()
    if args.command == "verify":
        with closing(_open_readonly(args.source)) as source:
            verify(source, source_only=True)
        print("Verified source-only PanaPulse SQLite snapshot")
    else:
        if not args.destination:
            parser.error("--destination is required for backup/restore")
        operation = snapshot if args.command == "backup" else restore
        print(operation(args.source, args.destination))


if __name__ == "__main__":
    main()
