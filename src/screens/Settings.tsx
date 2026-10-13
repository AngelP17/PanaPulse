import React from 'react';
import { Pressable, View } from 'react-native';
import { Lang } from '../i18n/strings';
import { ThemePref, useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Card, Txt } from '../components/ui';
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
  const { t, lang, setLang, themePref, setThemePref, demoEnabled, setDemoEnabled, demoScenario, setDemoScenario } = useApp();
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" style={{ paddingHorizontal: space.xs }} accessibilityRole="header">
        {t('settings')}
      </Txt>
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
            <Txt size={type.label} tone="muted">{t('demoBannerDetail')}</Txt>
          </>
        ) : null}
      </Card>
      <Card>
        <Txt size={type.body} weight="semibold">
          {t('dataSources')}
        </Txt>
        <Txt size={type.body} tone="muted">
          {t('dataSourcesBody')}
        </Txt>
        <Txt size={type.caption + 1} tone="faint">
          {t('version')}
        </Txt>
      </Card>
    </View>
  );
}
