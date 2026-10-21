import { useEffect, useRef } from 'react';
import { Tab, useApp } from '../state/AppContext';

const tabs: Tab[] = ['home', 'mobility', 'quakes', 'report', 'services', 'chat', 'settings'];
function route(): Tab | null {
  const name = window.location.hash.replace(/^#\/?/, '');
  return tabs.includes(name as Tab) ? name as Tab : null;
}

/** Shareable browser destinations without adding a second navigation stack to the native app. */
export function useBrowserNavigation(): void {
  const { tab, go, hydrated, onboarded, lang, t } = useApp();
  const started = useRef(false);
  const pending = useRef<Tab | null>(null);
  const currentTab = useRef(tab);
  currentTab.current = tab;

  useEffect(() => {
    const followHistory = () => {
      const next = route() ?? 'home';
      pending.current = currentTab.current === next ? null : next;
      if (!route()) window.history.replaceState(null, '', `#/${next}`);
      go(next);
    };
    window.addEventListener('popstate', followHistory);
    window.addEventListener('hashchange', followHistory);
    return () => {
      window.removeEventListener('popstate', followHistory);
      window.removeEventListener('hashchange', followHistory);
    };
  }, [go]);

  useEffect(() => {
    if (!hydrated || !onboarded) return;
    if (!started.current) {
      started.current = true;
      const initial = route();
      if (initial && initial !== tab) {
        pending.current = initial;
        go(initial);
        return;
      }
      window.history.replaceState(null, '', `#/${tab}`);
    }
    if (pending.current) {
      if (pending.current !== tab) return;
      pending.current = null;
      if (!route()) window.history.replaceState(null, '', `#/${tab}`);
    } else if (route() !== tab) {
      window.history.pushState(null, '', `#/${tab}`);
    }
  }, [tab, go, hydrated, onboarded]);

  useEffect(() => {
    const labels = {
      home: t('navHome'), mobility: t('tabMobility'), quakes: t('navQuakes'),
      report: t('tabReports'), services: t('services'), chat: t('askButton'), settings: t('settings'),
    };
    document.documentElement.lang = lang;
    document.title = `PanaPulse · ${labels[tab]}`;
  }, [tab, lang, t]);
}
