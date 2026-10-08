// mailto: URL builder. The "AWA à deux" invitation flow itself no longer uses this (it is
// now EMAIL + SECURE LINK, simulated entirely on the frontend — see AwaADeuxPairingScreen.tsx
// and awaADeuxDemoStore.ts) — this is kept only because PartnerProfileScreen.tsx's FAQ
// "contact us" action reuses it to open the phone's mail app.

/** mailto: URL with recipient, subject and body. */
export const buildMailtoUrl = (to: string, subject: string, body: string): string =>
  `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
