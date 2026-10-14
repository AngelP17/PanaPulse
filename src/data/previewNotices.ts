import type { DemoScenario } from './demo';

export type PreviewNoticeKind = 'electricity' | 'water';
export type PreviewNoticeKey =
  | 'noticeScheduledPower' | 'noticePowerInterrupted' | 'noticePowerRecovering'
  | 'noticeWaterEveryday' | 'noticeWaterInterrupted' | 'noticeWaterRecovering';
export interface PreviewNotice {
  id: string;
  service: PreviewNoticeKind;
  corregimiento: string;
  headline: PreviewNoticeKey;
  detail: `${PreviewNoticeKey}Detail`;
  postedAt: number;
  /** Fictional preview fixture, never an official/provider record. */
  origin: 'preview';
}

/** Stable until the scenario or area changes. No hidden fake operator status. */
export function previewServiceNotices(now: number, scenario: DemoScenario, area: string): PreviewNotice[] {
  const minute = Math.floor(now / 60000) * 60000;
  const map: Record<DemoScenario, [PreviewNoticeKey, PreviewNoticeKey]> = {
    everyday: ['noticeScheduledPower', 'noticeWaterEveryday'],
    disruption: ['noticePowerInterrupted', 'noticeWaterInterrupted'],
    recovery: ['noticePowerRecovering', 'noticeWaterRecovering'],
  };
  return (['electricity', 'water'] as const).map((service, index) => ({
    id: `preview-${scenario}-${service}-${area}`,
    service,
    corregimiento: area,
    headline: map[scenario][index],
    detail: `${map[scenario][index]}Detail` as `${PreviewNoticeKey}Detail`,
    postedAt: minute - (index + 1) * 13 * 60000,
    origin: 'preview',
  }));
}
