import React from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { Lang } from '../i18n/strings';
import { ThemePref, useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Button, Card, LinkChip, StatusChip, Txt } from '../components/ui';
import { PressScale } from '../components/motion';
import { CORREGIMIENTOS } from '../data/services';
import { usePowerMaintenance, powerFeedState } from '../data/maintenance';
import { dayStamp } from '../data/format';
import { LIVE_MAX_AGE_MS } from '../data/glance';
import { DemoScenario } from '../data/demo';

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const { c } = useApp();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.tile, borderRadius: radius.pill, padding: 4 }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.id)}
            style={{ flex: 1, minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? c.navActive : 'transparent' }}
          >
            <Txt size={type.label} weight="semibold" style={{ color: active ? c.navActiveInk : c.ink }}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Settings() {
  const { t, lang, setLang, themePref, setThemePref, demoEnabled, setDemoEnabled, demoScenario, setDemoScenario, now, seismic, c, area, setArea, clearLocalActivity } = useApp();
  const { data: powerData, state: powerStatus } = usePowerMaintenance(area);
  const powerFeed = powerFeedState(powerData, powerStatus);
  const usgsCurrent = seismic.mode === 'live' && Math.abs(now - seismic.fetchedAt) <= LIVE_MAX_AGE_MS;
  const lastPowerCheck = powerData?.sources.map((s) => s.last_success_at).filter((s): s is string => !!s).sort().at(-1);
  const confirmClear = () => {
    const title = t('settingsClearConfirmTitle');
    const body = t('settingsClearConfirmBody');
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(title + '\n\n' + body)) clearLocalActivity();
      return;
    }
    Alert.alert(title, body, [
      { text: t('settingsClearCancel'), style: 'cancel' },
      { text: t('settingsClearProceed'), style: 'destructive', onPress: clearLocalActivity },
    ]);
  };
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" style={{ paddingHorizontal: space.xs }} accessibilityRole="header">
        {t('settings')}
      </Txt>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('where')}</Txt>
        <Txt size={type.label} tone="muted">{t('areaHelp')}</Txt>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {CORREGIMIENTOS.map((name) => {
            const active = area === name;
            return (
              <PressScale key={name} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={name}
                onPress={() => setArea(name)}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: active ? c.navActive : c.tile }}>
                <Txt size={type.label} weight="semibold" style={{ color: active ? c.navActiveInk : c.ink }}>{name}</Txt>
              </PressScale>
            );
          })}
        </View>
      </Card>
      <Card>
        <Txt size={type.body} weight="semibold">
          {t('language')}
        </Txt>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { id: 'es', label: 'Español' },
            { id: 'en', label: 'English' },
          ]}
        />
        <Txt size={type.body} weight="semibold" style={{ marginTop: space.xs }}>
          {t('appearance')}
        </Txt>
        <Segmented<ThemePref>
          value={themePref}
          onChange={setThemePref}
          options={[
            { id: 'auto', label: t('themeAuto') },
            { id: 'light', label: t('themeLight') },
            { id: 'dark', label: t('themeDark') },
          ]}
        />
      </Card>
      <Card>
        <Txt size={type.title} weight="semibold">{t('demoSettingsTitle')}</Txt>
        <Txt size={type.body} tone="muted">{t('demoSettingsDescription')}</Txt>
        <Segmented<'on' | 'off'>
          value={demoEnabled ? 'on' : 'off'}
          onChange={(value) => setDemoEnabled(value === 'on')}
          options={[{ id: 'off', label: t('demoOff') }, { id: 'on', label: t('demoOn') }]}
        />
        {demoEnabled ? (
          <>
            <Txt size={type.body} weight="semibold">{t('demoChange')}</Txt>
            <Segmented<DemoScenario>
              value={demoScenario}
              onChange={setDemoScenario}
              options={[
                { id: 'everyday', label: t('demoEveryday') },
                { id: 'disruption', label: t('demoDisruption') },
                { id: 'recovery', label: t('demoRecovery') },
              ]}
            />

          </>
        ) : null}
      </Card>
      <Card style={{ gap: space.md }}>
        <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('dataSources')}</Txt>
        <Txt size={type.label} tone="muted">{t('sourceActualOnly')}</Txt>
        <View style={{ gap: space.xs, borderRadius: radius.tile, backgroundColor: c.tile, padding: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>USGS</Txt>
            <StatusChip kind={usgsCurrent ? 'official' : 'stale'} />
          </View>
          <Txt size={type.label} tone="muted">
            {t(usgsCurrent ? 'sourceUsgsLive' : 'sourceUsgsArchive', { time: dayStamp(seismic.fetchedAt, lang) })}
          </Txt>
        </View>
        <View style={{ gap: space.xs, borderRadius: radius.tile, backgroundColor: c.tile, padding: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{t('power')} · ENSA/Naturgy</Txt>
            <StatusChip kind={powerFeed === 'scheduled' ? 'official' : powerFeed === 'stale' ? 'stale' : 'unavailable'} />
          </View>
          <Txt size={type.label} tone="muted">
            {powerFeed === 'none' ? t('sourcePowerMissing')
              : t('sourcePowerScheduledCount', { n: powerData?.notices.length ?? 0 })}
          </Txt>
          {lastPowerCheck ? (
            <Txt size={type.caption + 1} tone="muted">
              {t('sourceLastChecked', { time: dayStamp(Date.parse(lastPowerCheck), lang) })}
            </Txt>
          ) : null}
          <Txt size={type.caption + 1} tone="muted">{t('scheduledDisclaimer')}</Txt>
        </View>
        <Txt size={type.label} tone="muted">{t('sourceOtherMissing')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          <LinkChip label="USGS" url="https://earthquake.usgs.gov/earthquakes/map/" />
          <LinkChip label="IDAAN" url="https://www.idaan.gob.pa/" />
          <LinkChip label="Metro" url="https://www.elmetrodepanama.com/" />
          <LinkChip label="MiBus" url="https://www.mibus.com.pa/" />
        </View>
        <Txt size={type.caption + 1} tone="faint">{t('version')}</Txt>
      </Card>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('settingsPrivacyTitle')}</Txt>
        <Txt size={type.body} tone="muted">{t('settingsPrivacyBody')}</Txt>
        <Button label={t('settingsClearLocal')} onPress={confirmClear} />
      </Card>
    </View>
  );
}
