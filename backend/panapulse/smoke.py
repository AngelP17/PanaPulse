"""Read-only deployed-backend checks. Never creates fictional public observations."""
import argparse
import json
import secrets
import re
from datetime import datetime
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


def check(base, zone, origin=None, require_fresh=False, require_reports=False):
    parsed = urlsplit(base)
    if parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in ('127.0.0.1', 'localhost')):
        raise ValueError('Use HTTPS outside loopback')
    base = base.rstrip('/')

    def get(path, headers=None):
        with urlopen(Request(base + path, headers=headers or {}), timeout=20) as response:
            if response.status != 200:
                raise ValueError(f'{path}: HTTP {response.status}')
            return json.load(response)

    assert get('/healthz')['status'] == 'running'
    assert get('/readyz')['status'] == 'ready'
    capabilities = get('/v0/capabilities')
    health = get('/v0/source-health')
    seismic = get('/v0/seismic')
    assert seismic['source'] == 'USGS'
    assert seismic['mode'] == ('live' if health['freshness'] == 'current' else 'snapshot')
    if require_fresh:
        assert health['freshness'] == 'current', 'USGS collector is not current'
    power = get('/v0/power-maintenance?' + urlencode({'corregimiento': zone}))
    assert power['service_state'] == 'unknown' and power['scope'] == 'scheduled_maintenance_only'
    if require_fresh:
        assert power['sources'] and all(source['freshness'] == 'current' for source in power['sources']), 'Power collector is not current'
    if require_reports:
        assert capabilities['reports'], 'Shared reports are disabled/unconfigured'
    if capabilities['reports']:
        config = get('/v0/community/config')
        assert re.fullmatch(r'[a-f0-9]{32}', config['epoch']), 'Invalid report runtime epoch'
        assert config['max_submission_age_seconds'] == 7200
        assert datetime.fromisoformat(config['server_time']).tzinfo is not None
        summary = get('/v0/community/summary?' + urlencode({'area': zone}))
        assert summary['verification'] == 'community_unverified' and summary['service_state'] == 'unknown'
        # Ephemeral installation, only GET. No user token or observation is logged/stored.
        assert get('/v0/community/mine', {'X-Installation-Token': secrets.token_hex(32)})['items'] == []
    if origin:
        request = Request(base + '/v0/community/reports', method='OPTIONS', headers={
            'Origin': origin, 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type,x-installation-token',
        })
        with urlopen(request, timeout=20) as response:
            assert response.headers.get('Access-Control-Allow-Origin') == origin, 'Web origin is not allowed'
    return {'status': 'passed', 'usgs_freshness': health['freshness'],
            'power_sources': {s['provider']: s['freshness'] for s in power['sources']},
            'capabilities': capabilities, 'mutations': 'not performed'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--zone', default='Parque Lefevre', help='Border area checks both power collectors by default')
    parser.add_argument('--web-origin')
    parser.add_argument('--require-fresh', action='store_true')
    parser.add_argument('--require-reports', action='store_true')
    args = parser.parse_args()
    print(json.dumps(check(args.url, args.zone, args.web_origin, args.require_fresh, args.require_reports), indent=2))


if __name__ == '__main__':
    main()
