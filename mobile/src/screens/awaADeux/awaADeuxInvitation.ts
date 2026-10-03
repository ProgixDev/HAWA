import {Platform} from 'react-native';

import {DEMO_PAIRING_CODE} from './awaADeuxDemo';
import i18n from '../../i18n';

// Texts of the invitation (DEMO): the share message, the e-mail subject and body.
// Frontend only — nothing is sent by AWA; the platform share sheet / the phone's mail
// application do the sending. The code is the demo placeholder, not a real invitation —
// never translated, always byte-identical. Every string below reads the live app
// language via i18n.t() (same non-component pattern as cycleMath.ts's averageCycle.*
// usage), so callers never need to pass a `t` function through.

export const invitationMessage = (): string =>
  i18n.t('awaADeux.invitationMessage.shareText', {code: DEMO_PAIRING_CODE});

export const emailSubject = (): string => i18n.t('awaADeux.invitationMessage.emailSubject');

/** The e-mail body, greeting the partner by the name the user entered (a neutral greeting while none is configured). */
export const buildEmailBody = (partnerName?: string | null): string => {
  const name = (partnerName ?? '').trim();
  return name
    ? i18n.t('awaADeux.invitationMessage.emailBodyWithName', {name, code: DEMO_PAIRING_CODE})
    : i18n.t('awaADeux.invitationMessage.emailBodyNeutral', {code: DEMO_PAIRING_CODE});
};

/** mailto: URL with recipient, subject and body (the existing mailto pattern of the app). */
export const buildMailtoUrl = (to: string, subject: string, body: string): string =>
  `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export type ShareTarget = 'whatsapp' | 'sms' | 'instagram' | 'gmail';

/**
 * The link that opens an app's own compose screen with the invitation, or null when the
 * app has no such link (Instagram cannot pre-fill a text: the system share sheet is used).
 * Gmail uses the standard mail link, which opens the phone's mail application.
 */
export function buildShareTargetUrl(target: ShareTarget, os: string = Platform.OS): string | null {
  switch (target) {
    case 'whatsapp':
      return `whatsapp://send?text=${encodeURIComponent(invitationMessage())}`;
    case 'sms':
      return `${os === 'ios' ? 'sms:&' : 'sms:?'}body=${encodeURIComponent(invitationMessage())}`;
    case 'gmail':
      return buildMailtoUrl('', emailSubject(), invitationMessage());
    default:
      return null;
  }
}
