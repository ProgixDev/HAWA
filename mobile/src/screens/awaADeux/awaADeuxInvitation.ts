import {Platform} from 'react-native';

import {DEMO_PAIRING_CODE} from './awaADeuxDemo';

// Texts of the invitation (DEMO): the share message, the e-mail subject and body.
// Frontend only — nothing is sent by AWA; the platform share sheet / the phone's mail
// application do the sending. The code is the demo placeholder, not a real invitation.

export const INVITATION_MESSAGE = `Rejoins-moi sur AWA à deux 💜\n\nUtilise ce code : ${DEMO_PAIRING_CODE}\npour te connecter et m’accompagner.\n\nTélécharge l’application AWA !`;

export const EMAIL_SUBJECT = 'Rejoins-moi sur AWA à deux 💜';

/** The e-mail body, greeting the partner by the name the user entered (a plain "Bonjour !" while none is configured). */
export const buildEmailBody = (partnerName?: string | null): string => {
  const name = (partnerName ?? '').trim();
  return `${name ? `Bonjour ${name} !` : 'Bonjour !'}\n\nJe t’invite à me rejoindre sur AWA à deux.\nUtilise ce code : ${DEMO_PAIRING_CODE}\npour te connecter et m’accompagner.\n\nTélécharge l’application AWA ! 💜`;
};

export const EMAIL_BODY = buildEmailBody();

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
      return `whatsapp://send?text=${encodeURIComponent(INVITATION_MESSAGE)}`;
    case 'sms':
      return `${os === 'ios' ? 'sms:&' : 'sms:?'}body=${encodeURIComponent(INVITATION_MESSAGE)}`;
    case 'gmail':
      return buildMailtoUrl('', EMAIL_SUBJECT, INVITATION_MESSAGE);
    default:
      return null;
  }
}
